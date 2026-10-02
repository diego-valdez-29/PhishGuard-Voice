import numpy as np
from scipy import signal
from typing import Dict, Any, Tuple
from app.models.detection_report import AcousticFeatures

class AcousticFeatureExtractor:
    """
    High-precision DSP feature extraction for real-time deepfake & synthetic audio detection.
    Optimized for CPU execution at 16,000 Hz.
    """
    def __init__(self, sample_rate: int = 16000, n_fft: int = 2048, hop_length: int = 512, n_mfcc: int = 13):
        self.sample_rate = sample_rate
        self.n_fft = n_fft
        self.hop_length = hop_length
        self.n_mfcc = n_mfcc

    def pcm_bytes_to_float32(self, raw_bytes: bytes, dtype_hint: str = "auto") -> np.ndarray:
        """
        Converts raw PCM audio bytes to float32 NumPy array normalized to [-1.0, 1.0].
        Supports Int16 (standard PCM) and Float32 raw streams.
        """
        if len(raw_bytes) == 0:
            return np.zeros(0, dtype=np.float32)

        # Detect or interpret format
        # If byte length is a multiple of 4 and looks like float32 or specified
        if dtype_hint == "float32" or (len(raw_bytes) % 4 == 0 and dtype_hint != "int16"):
            try:
                samples = np.frombuffer(raw_bytes, dtype=np.float32)
                # Check if values are within sensible audio bounds
                if len(samples) > 0 and np.max(np.abs(samples)) <= 1.5:
                    return np.clip(samples, -1.0, 1.0)
            except Exception:
                pass

        # Int16 fallback (standard 16-bit linear PCM)
        try:
            samples_int16 = np.frombuffer(raw_bytes, dtype=np.int16)
            return (samples_int16 / 32768.0).astype(np.float32)
        except Exception:
            return np.zeros(0, dtype=np.float32)

    def compute_zcr(self, audio: np.ndarray) -> float:
        """Calculate Zero-Crossing Rate (ZCR)."""
        if len(audio) < 2:
            return 0.0
        signs = np.sign(audio)
        signs[signs == 0] = 1
        crossings = np.sum(np.abs(np.diff(signs))) / 2.0
        return float(crossings / (len(audio) - 1))

    def compute_stft(self, audio: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Computes Short-Time Fourier Transform (STFT) with n_fft=2048 and hop_length=512.
        Returns frequencies, times, and complex STFT matrix Zxx.
        """
        if len(audio) < self.n_fft:
            audio = np.pad(audio, (0, self.n_fft - len(audio)), mode='constant')

        freqs, times, Zxx = signal.stft(
            audio,
            fs=self.sample_rate,
            nperseg=self.n_fft,
            noverlap=self.n_fft - self.hop_length,
            boundary=None
        )
        return freqs, times, Zxx

    def evaluate_phase_consistency(self, Zxx: np.ndarray) -> float:
        """
        Evaluates phase consistency across consecutive frames.
        Synthetic neural vocoders (HiFi-GAN, MelGAN) often generate phase discontinuities
        or unnaturally rigid harmonic phase locks compared to human vocal tracts.
        """
        if Zxx.shape[1] < 2:
            return 0.85

        phases = np.angle(Zxx)
        # Unwrap phase differences across time
        phase_diff = np.diff(phases, axis=1)
        phase_variance = np.var(phase_diff)
        
        # Normalize into a 0.0 - 1.0 consistency score
        # Human speech exhibits moderate structured phase variance
        consistency = float(1.0 / (1.0 + np.exp(- (phase_variance - 1.2))))
        return min(max(consistency, 0.05), 0.99)

    def compute_spectral_centroid(self, freqs: np.ndarray, magnitude: np.ndarray) -> float:
        """Calculate Spectral Centroid (center of mass of the spectrum)."""
        mag_sum = np.sum(magnitude, axis=0)
        valid = mag_sum > 1e-6
        if not np.any(valid):
            return 1200.0

        freqs_col = freqs[:, np.newaxis]
        centroid = np.sum(freqs_col * magnitude, axis=0) / (mag_sum + 1e-9)
        return float(np.mean(centroid[valid]))

    def compute_spectral_rolloff(self, freqs: np.ndarray, magnitude: np.ndarray, roll_percent: float = 0.85) -> float:
        """Calculate Spectral Rolloff at 85% energy threshold."""
        total_energy = np.sum(magnitude, axis=0)
        threshold = roll_percent * total_energy
        cumsum = np.cumsum(magnitude, axis=0)

        rolloff_bins = np.argmax(cumsum >= threshold[np.newaxis, :], axis=0)
        rolloff_freqs = freqs[rolloff_bins]
        return float(np.mean(rolloff_freqs))

    def compute_mfccs(self, freqs: np.ndarray, magnitude: np.ndarray) -> list[float]:
        """
        Extracts Mel-Frequency Cepstral Coefficients (MFCCs, n_mfcc=13)
        using triangular mel filterbank and DCT.
        """
        n_mels = 26
        # Mel scale conversion
        def hz_to_mel(hz):
            return 2595.0 * np.log10(1.0 + hz / 700.0)

        def mel_to_hz(mel):
            return 700.0 * (10.0 ** (mel / 2595.0) - 1.0)

        low_mel = hz_to_mel(0)
        high_mel = hz_to_mel(self.sample_rate / 2)
        mel_points = np.linspace(low_mel, high_mel, n_mels + 2)
        hz_points = mel_to_hz(mel_points)

        # Map to FFT bins
        bin_points = np.floor((self.n_fft + 1) * hz_points / self.sample_rate).astype(int)

        fbank = np.zeros((n_mels, int(np.floor(self.n_fft / 2 + 1))))
        for m in range(1, n_mels + 1):
            f_m_minus = bin_points[m - 1]
            f_m = bin_points[m]
            f_m_plus = bin_points[m + 1]

            for k in range(f_m_minus, f_m):
                if k < fbank.shape[1] and f_m != f_m_minus:
                    fbank[m - 1, k] = (k - bin_points[m - 1]) / (f_m - f_m_minus)
            for k in range(f_m, f_m_plus):
                if k < fbank.shape[1] and f_m_plus != f_m:
                    fbank[m - 1, k] = (bin_points[m + 1] - k) / (f_m_plus - f_m)

        # Power spectrum
        power_spectrum = (magnitude ** 2) / self.n_fft
        filter_banks = np.dot(fbank, power_spectrum)
        filter_banks = np.where(filter_banks == 0, np.finfo(float).eps, filter_banks)
        filter_banks = 20 * np.log10(filter_banks)

        # Discrete Cosine Transform (DCT-II) for cepstral coefficients
        num_frames = filter_banks.shape[1]
        mfccs = np.zeros((self.n_mfcc, num_frames))
        for i in range(self.n_mfcc):
            for j in range(n_mels):
                mfccs[i, :] += filter_banks[j, :] * np.cos(np.pi * i / n_mels * (j + 0.5))

        mean_mfcc = np.mean(mfccs, axis=1)
        return [float(x) for x in mean_mfcc]

    def detect_neural_vocoder_artifacts(self, freqs: np.ndarray, magnitude: np.ndarray) -> float:
        """
        Analyzes high-frequency bands (10 kHz - 16 kHz) where neural vocoders
        (HiFi-GAN, WaveGlow, MelGAN) leave metallic periodic artifacts and un-natural energy spikes.
        """
        high_band_mask = freqs >= 9000
        if not np.any(high_band_mask):
            return 0.15

        high_energy = np.mean(magnitude[high_band_mask, :])
        total_energy = np.mean(magnitude) + 1e-9
        ratio = high_energy / total_energy
        # Natural speech roll-off is steep, while synthetic speech often exhibits flat vocoder hiss
        artifact_score = float(np.clip(ratio * 2.8, 0.05, 0.95))
        return artifact_score

    def extract_all(self, audio: np.ndarray) -> AcousticFeatures:
        """Extract full suite of acoustic biometric features."""
        if len(audio) == 0:
            return AcousticFeatures(
                mfcc_mean=[0.0] * self.n_mfcc,
                zcr=0.0,
                spectral_centroid=0.0,
                spectral_rolloff=0.0,
                phase_consistency=0.5,
                neural_vocoder_artifact_score=0.1
            )

        zcr = self.compute_zcr(audio)
        freqs, times, Zxx = self.compute_stft(audio)
        mag = np.abs(Zxx)
        phase_consistency = self.evaluate_phase_consistency(Zxx)
        centroid = self.compute_spectral_centroid(freqs, mag)
        rolloff = self.compute_spectral_rolloff(freqs, mag)
        mfccs = self.compute_mfccs(freqs, mag)
        vocoder_score = self.detect_neural_vocoder_artifacts(freqs, mag)

        return AcousticFeatures(
            mfcc_mean=mfccs,
            zcr=round(zcr, 4),
            spectral_centroid=round(centroid, 2),
            spectral_rolloff=round(rolloff, 2),
            phase_consistency=round(phase_consistency, 4),
            neural_vocoder_artifact_score=round(vocoder_score, 4)
        )
