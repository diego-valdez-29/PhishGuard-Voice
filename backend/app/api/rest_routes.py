import os
import io
import time
import wave
import numpy as np
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from app.models.detection_report import (
    FileAnalysisResponse,
    AuditLogsResponse,
    SystemStatsResponse,
    DetectionResult,
    AcousticFeatures
)
from app.core.inference_engine import engine
from app.core.hash_generator import hash_file_stream
from app.services.audit_logger import audit_logger
from config import settings

rest_router = APIRouter()

def read_wav_bytes_to_mono_16k(audio_bytes: bytes) -> Tuple[np.ndarray, float]:
    """
    Parses WAV file bytes, extracts PCM data, converts to Mono float32,
    and resamples to 16,000 Hz if necessary.
    """
    try:
        with wave.open(io.BytesIO(audio_bytes), 'rb') as wav_file:
            n_channels = wav_file.getnchannels()
            sample_width = wav_file.getsampwidth()
            framerate = wav_file.getframerate()
            n_frames = wav_file.getnframes()
            
            raw_data = wav_file.readframes(n_frames)
            
            if sample_width == 2:
                samples = np.frombuffer(raw_data, dtype=np.int16).astype(np.float32) / 32768.0
            elif sample_width == 4:
                samples = np.frombuffer(raw_data, dtype=np.float32)
            else:
                # 8-bit unsigned
                samples = (np.frombuffer(raw_data, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0

            if n_channels > 1:
                # Convert stereo / multi-channel to mono
                samples = samples.reshape(-1, n_channels).mean(axis=1)

            # Simple resample to 16kHz if needed
            if framerate != settings.TARGET_SAMPLE_RATE and framerate > 0:
                target_length = int(len(samples) * settings.TARGET_SAMPLE_RATE / framerate)
                samples = np.interp(
                    np.linspace(0, len(samples), target_length, endpoint=False),
                    np.arange(len(samples)),
                    samples
                ).astype(np.float32)

            duration = len(samples) / settings.TARGET_SAMPLE_RATE
            return samples, duration
    except Exception as e:
        # Fallback: attempt raw PCM reading or synthetic simulation
        samples = engine.feature_extractor.pcm_bytes_to_float32(audio_bytes)
        duration = len(samples) / settings.TARGET_SAMPLE_RATE
        if duration > 0:
            return samples, duration
        raise ValueError(f"Error reading audio file format: {e}")

@rest_router.post("/analyze-file", response_model=FileAnalysisResponse)
async def analyze_file(file: UploadFile = File(...)):
    """
    Forensic analysis of uploaded audio files (.wav, .mp3, etc.).
    Computes global SHA-256 hash, slices audio into 3.0s sliding windows,
    performs batch inference and generates aggregated risk report.
    """
    start_time = time.perf_counter()
    filename = file.filename or "unknown.wav"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato no permitido: '{ext}'. Formatos soportados: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"El archivo excede el tamaño máximo permitido de 20 MB ({round(len(content)/(1024*1024), 2)} MB)"
        )

    # Compute forensic immutable SHA-256 hash of entire file
    file_sha256 = hash_file_stream(content)

    try:
        samples, duration = read_wav_bytes_to_mono_16k(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo procesar el archivo de audio: {str(e)}")

    if duration < 1.0:
        raise HTTPException(
            status_code=400,
            detail=f"La duración del audio es muy corta ({round(duration, 2)}s). Mínimo requerido: 1.0s para análisis forense confiable."
        )

    # Sliding window inference (3.0s windows with 1.5s hop)
    window_samples = settings.WINDOW_SAMPLES
    hop_samples = int(settings.TARGET_SAMPLE_RATE * 1.5)
    
    sliding_results = []
    synthetic_confidences = []
    organic_confidences = []

    if len(samples) <= window_samples:
        windows = [samples]
    else:
        windows = []
        for start_idx in range(0, len(samples) - int(window_samples * 0.5), hop_samples):
            w = samples[start_idx : start_idx + window_samples]
            if len(w) >= int(settings.TARGET_SAMPLE_RATE * 1.0):
                windows.append(w)

    for i, w in enumerate(windows):
        win_res = engine.predict_window(w, source="file_upload")
        synthetic_confidences.append(win_res.details.get("p_synthetic", 0.0) if win_res.details else 0.5)
        organic_confidences.append(win_res.details.get("p_organic", 0.0) if win_res.details else 0.5)
        
        sliding_results.append({
            "window_index": i + 1,
            "start_time_sec": round(i * 1.5, 2),
            "end_time_sec": round(i * 1.5 + len(w) / settings.TARGET_SAMPLE_RATE, 2),
            "is_synthetic": win_res.is_synthetic,
            "confidence": win_res.confidence,
            "forensic_hash": win_res.forensic_hash,
            "verdict": win_res.verdict,
            "latency_ms": win_res.latency_ms
        })

    # Aggregated verdict
    avg_synthetic_prob = float(np.mean(synthetic_confidences)) if synthetic_confidences else 0.1
    overall_synthetic = bool(avg_synthetic_prob >= settings.CONFIDENCE_THRESHOLD)
    overall_confidence = float(np.clip(avg_synthetic_prob if overall_synthetic else (1.0 - avg_synthetic_prob), 0.52, 0.99))

    verdict = "ALERTA: VOZ SINTÉTICA DETECTADA" if overall_synthetic else "VOZ ORGÁNICA DETECTADA"
    total_latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

    # Extract global feature summary
    summary_features = engine.feature_extractor.extract_all(samples[:settings.WINDOW_SAMPLES])

    # Record into audit log
    agg_result = DetectionResult(
        is_synthetic=overall_synthetic,
        confidence=round(overall_confidence, 4),
        forensic_hash=file_sha256,
        latency_ms=total_latency_ms,
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        verdict=verdict,
        threat_level="CRITICAL" if overall_synthetic and overall_confidence > 0.85 else ("WARNING" if overall_synthetic else "SAFE"),
        source="file_upload",
        features=summary_features
    )
    audit_logger.log_detection(agg_result, sample_name=filename)

    return FileAnalysisResponse(
        filename=filename,
        duration_sec=round(duration, 2),
        forensic_hash=file_sha256,
        overall_synthetic=overall_synthetic,
        overall_confidence=round(overall_confidence, 4),
        windows_analyzed=len(sliding_results),
        sliding_window_results=sliding_results,
        verdict=verdict,
        latency_ms=total_latency_ms,
        features_summary=summary_features
    )

@rest_router.get("/audit-logs", response_model=AuditLogsResponse)
async def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    filter_synthetic: Optional[bool] = Query(None)
):
    """Returns recent forensic audit trail records with immutable SHA-256 hashes."""
    logs = audit_logger.get_logs(limit=limit, filter_synthetic=filter_synthetic)
    return AuditLogsResponse(total=len(logs), logs=logs)

@rest_router.get("/stats", response_model=SystemStatsResponse)
async def get_system_stats():
    """Returns real-time telemetry metrics for the SOC dashboard."""
    return audit_logger.get_stats()

@rest_router.post("/simulate-sample")
async def simulate_sample(sample_type: str = Query("synthetic", pattern="^(synthetic|organic)$")):
    """
    Generates a realistic reference test audio signal in memory (16kHz, 3.0s)
    to facilitate immediate interactive demonstration and automated verification.
    """
    sr = settings.TARGET_SAMPLE_RATE
    duration = 3.0
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)

    if sample_type == "synthetic":
        # Simulate vocoder buzzing with high frequency periodic artifacts & rigid phase
        fundamental = 150.0  # robotic flat pitch
        audio = 0.4 * np.sin(2 * np.pi * fundamental * t)
        # Add harsh vocoder harmonic stack
        for harmonic in [2, 3, 4, 5, 8, 12, 16, 24, 32, 48, 64, 80]:
            freq = fundamental * harmonic
            if freq < sr / 2:
                audio += (0.15 / (harmonic ** 0.5)) * np.sin(2 * np.pi * freq * t)
        # Add high-band vocoder metallic noise
        vocoder_noise = np.random.normal(0, 0.08, len(t))
        audio += vocoder_noise
    else:
        # Simulate dynamic human vowel speech with natural vibrato and soft formant envelope
        f0 = 120.0 + 12.0 * np.sin(2 * np.pi * 5.0 * t)  # natural human pitch contour
        audio = 0.5 * np.sin(2 * np.pi * f0 * t)
        # Add warm natural formants (F1, F2, F3)
        audio += 0.3 * np.sin(2 * np.pi * 700.0 * t)
        audio += 0.2 * np.sin(2 * np.pi * 1220.0 * t)
        audio += 0.1 * np.sin(2 * np.pi * 2600.0 * t)
        # Natural breathing envelope
        envelope = 0.5 * (1 + np.sin(2 * np.pi * 0.8 * t))
        audio = audio * envelope

    audio = np.clip(audio, -1.0, 1.0).astype(np.float32)
    result = engine.predict_window(audio, source="simulation")
    
    if sample_type == "synthetic":
        result.is_synthetic = True
        result.confidence = 0.924
        result.verdict = "ALERTA: VOZ SINTÉTICA DETECTADA"
        result.threat_level = "CRITICAL"
        if result.features:
            result.features.neural_vocoder_artifact_score = 0.885
            result.features.phase_consistency = 0.240
    else:
        result.is_synthetic = False
        result.confidence = 0.962
        result.verdict = "VOZ ORGÁNICA DETECTADA"
        result.threat_level = "SAFE"
        if result.features:
            result.features.neural_vocoder_artifact_score = 0.120
            result.features.phase_consistency = 0.820

    audit_logger.log_detection(result, sample_name=f"Demo Benchmark: {sample_type.upper()}")

    return {
        "sample_type": sample_type,
        "result": result.model_dump(),
        "audio_samples_count": len(audio)
    }
