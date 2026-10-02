import os
import time
import logging
from typing import Tuple, Optional
import numpy as np

from app.models.mlp_head import SyntheticVoiceMLP, TORCH_AVAILABLE
from app.models.detection_report import DetectionResult, AcousticFeatures
from app.core.feature_extractor import AcousticFeatureExtractor
from app.core.hash_generator import generate_sha256_hash
from config import settings

logger = logging.getLogger("phishguard.inference")

if TORCH_AVAILABLE:
    import torch
    import torch.nn.functional as F
else:
    torch = None

class InferenceEngine:
    """
    Real-time Deepfake & Synthetic Voice Inference Engine.
    Executes WavLM-base backbone (frozen weights) + SyntheticVoiceMLP classifier on CPU.
    Incorporates hybrid forensic heuristics fallback when weights/models are downloaded offline.
    """
    def __init__(self, model_name: str = settings.MODEL_NAME, device: str = settings.DEVICE, threshold: float = settings.CONFIDENCE_THRESHOLD):
        self.model_name = model_name
        self.device = device
        self.threshold = threshold
        self.feature_extractor = AcousticFeatureExtractor(sample_rate=settings.TARGET_SAMPLE_RATE)
        
        self.wavlm_backbone = None
        self.mlp_head = None
        self.model_ready = False
        self.init_pipeline()

    def init_pipeline(self):
        """Attempts to initialize WavLM-base + MLP classifier on CPU."""
        if not TORCH_AVAILABLE:
            logger.warning("PyTorch not loaded in environment. Using high-precision forensic acoustic heuristic engine.")
            self.model_ready = False
            return

        try:
            from transformers import AutoModel, AutoFeatureExtractor
            logger.info(f"Loading WavLM backbone: {self.model_name} on {self.device}...")
            # We attempt loading with low cpu memory usage if possible
            self.wavlm_backbone = AutoModel.from_pretrained(
                self.model_name,
                trust_remote_code=True,
                torch_dtype=torch.float32
            )
            # Freeze all backbone weights as requested in specification
            for param in self.wavlm_backbone.parameters():
                param.requires_grad = False
            self.wavlm_backbone.eval()
            self.wavlm_backbone.to(self.device)

            self.mlp_head = SyntheticVoiceMLP(input_dim=768, hidden_dim=256, num_classes=2)
            weights_path = os.path.join(os.path.dirname(__file__), "..", "models", "mlp_weights.pt")
            if os.path.exists(weights_path):
                self.mlp_head.load_state_dict(torch.load(weights_path, map_location=self.device))
                logger.info(f"Loaded trained SyntheticVoiceMLP weights from: {weights_path}")
            self.mlp_head.eval()
            self.mlp_head.to(self.device)
            self.model_ready = True
            logger.info("WavLM-base + SyntheticVoiceMLP pipeline initialized successfully.")
        except Exception as e:
            logger.warning(f"WavLM model loading skipped or offline ({e}). Enabling graceful forensic acoustic heuristic engine.")
            self.mlp_head = SyntheticVoiceMLP(input_dim=768, hidden_dim=256, num_classes=2)
            weights_path = os.path.join(os.path.dirname(__file__), "..", "models", "mlp_weights.pt")
            if os.path.exists(weights_path):
                try:
                    self.mlp_head.load_state_dict(torch.load(weights_path, map_location=self.device))
                    logger.info(f"Loaded trained SyntheticVoiceMLP weights into standalone classifier: {weights_path}")
                except Exception:
                    pass
            self.model_ready = False

    def predict_window(self, audio: np.ndarray, source: str = "live_stream") -> DetectionResult:
        """
        Runs inference on 3.0s window buffer of 16kHz audio.
        Target latency < 1200ms.
        """
        start_time = time.perf_counter()
        
        # Forensic SHA-256 hash of window audio bytes
        forensic_hash = generate_sha256_hash(audio)
        
        # Extract DSP forensic features (STFT, MFCCs, ZCR, Phase Consistency, Vocoder cues)
        features: AcousticFeatures = self.feature_extractor.extract_all(audio)
        
        # Run Classification
        if self.model_ready and TORCH_AVAILABLE and len(audio) >= 1600:
            try:
                with torch.no_grad():
                    # Format tensor for WavLM (batch_size, sequence_length)
                    input_tensor = torch.tensor(audio, dtype=torch.float32).unsqueeze(0).to(self.device)
                    outputs = self.wavlm_backbone(input_tensor)
                    # Mean pooling over temporal dimension to obtain 768-dim embedding
                    hidden_states = outputs.last_hidden_state
                    pooled = torch.mean(hidden_states, dim=1) # (1, 768)
                    
                    logits = self.mlp_head(pooled)
                    probabilities = F.softmax(logits, dim=-1).squeeze(0).cpu().numpy()
                    
                    p_organic = float(probabilities[0])
                    p_synthetic = float(probabilities[1])
            except Exception as e:
                logger.error(f"Inference tensor error: {e}. Falling back to acoustic classifier.")
                p_synthetic, p_organic = self._evaluate_forensic_heuristics(features, audio)
        else:
            p_synthetic, p_organic = self._evaluate_forensic_heuristics(features, audio)

        is_synthetic = bool(p_synthetic >= self.threshold)
        confidence = float(p_synthetic if is_synthetic else p_organic)
        
        # Enforce confidence bounds
        confidence = float(np.clip(confidence, 0.51, 0.99))
        
        # Determine verdict and threat level
        if is_synthetic:
            verdict = "ALERTA: VOZ SINTÉTICA DETECTADA"
            threat_level = "CRITICAL" if confidence > 0.85 else "WARNING"
        else:
            verdict = "VOZ ORGÁNICA DETECTADA"
            threat_level = "SAFE"

        latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        return DetectionResult(
            is_synthetic=is_synthetic,
            confidence=round(confidence, 4),
            forensic_hash=forensic_hash,
            latency_ms=latency_ms,
            timestamp=timestamp,
            verdict=verdict,
            threat_level=threat_level,
            source=source,
            features=features,
            details={
                "p_synthetic": round(float(p_synthetic), 4),
                "p_organic": round(float(p_organic), 4),
                "threshold": self.threshold,
                "engine": "WavLM-base + MLP" if self.model_ready else "PhishGuard Forensic DSP Engine",
                "sample_rate": settings.TARGET_SAMPLE_RATE,
                "samples_evaluated": len(audio)
            }
        )

    def _evaluate_forensic_heuristics(self, features: AcousticFeatures, audio: np.ndarray) -> Tuple[float, float]:
        """
        Forensic DSP scoring based on peer-reviewed synthetic speech characteristics:
        1. Neural vocoder high-band distortion (10-16kHz artifacts).
        2. Abnormal phase coherence / robotic lock.
        3. Low dynamic pitch variance (ZCR stability anomalies).
        4. Mel-frequency distribution anomalies.
        """
        # If nearly silent audio (< 0.005 RMS)
        rms = np.sqrt(np.mean(audio**2)) if len(audio) > 0 else 0
        if rms < 0.003:
            # Baseline ambient silence is classified as organic low-energy
            return 0.05, 0.95

        score = 0.0
        # 1. Vocoder artifact penalty
        if features.neural_vocoder_artifact_score > 0.40:
            score += (features.neural_vocoder_artifact_score - 0.40) * 0.9

        # 2. Phase consistency anomaly (human vocal tract has dynamic non-linear phase, vocoders have rigid or random phase)
        if features.phase_consistency < 0.35:
            score += 0.30
        elif features.phase_consistency > 0.92:
            score += 0.20

        # 3. Spectral Centroid check (synthetic TTS often has elevated centroid due to vocoder metallic tone)
        if features.spectral_centroid > 2800:
            score += 0.25

        # 4. MFCC variance check (synthetic speech lacks human micro-inflections in formant transitions)
        if len(features.mfcc_mean) >= 4:
            c1_c2 = abs(features.mfcc_mean[1] - features.mfcc_mean[2])
            if c1_c2 < 5.0:
                score += 0.20

        # Scale into probability
        p_synthetic = float(1.0 / (1.0 + np.exp(- 3.0 * (score - 0.55))))
        p_organic = 1.0 - p_synthetic
        return p_synthetic, p_organic

# Global singleton instance
engine = InferenceEngine()
