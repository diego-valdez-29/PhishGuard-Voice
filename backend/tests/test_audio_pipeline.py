import numpy as np
from app.core.feature_extractor import AcousticFeatureExtractor
from app.core.hash_generator import generate_sha256_hash

def test_feature_extractor_zcr():
    extractor = AcousticFeatureExtractor(sample_rate=16000)
    # Sine wave of 1000 Hz, 1 second
    t = np.linspace(0, 1, 16000, endpoint=False)
    sine = np.sin(2 * np.pi * 1000 * t).astype(np.float32)
    zcr = extractor.compute_zcr(sine)
    assert 0.11 < zcr < 0.14, f"Unexpected ZCR for 1000Hz tone: {zcr}"

def test_forensic_sha256():
    data = b"phishguard_audio_chunk_test"
    hash1 = generate_sha256_hash(data)
    hash2 = generate_sha256_hash(data)
    assert hash1 == hash2
    assert len(hash1) == 64

def test_pcm_conversion():
    extractor = AcousticFeatureExtractor(sample_rate=16000)
    int16_data = np.array([0, 16384, -16384, 32767], dtype=np.int16).tobytes()
    floats = extractor.pcm_bytes_to_float32(int16_data, dtype_hint="int16")
    assert len(floats) == 4
    assert np.isclose(floats[0], 0.0, atol=1e-3)
    assert np.isclose(floats[1], 0.5, atol=1e-3)
    assert np.isclose(floats[2], -0.5, atol=1e-3)

if __name__ == "__main__":
    test_feature_extractor_zcr()
    test_forensic_sha256()
    test_pcm_conversion()
    print("All audio pipeline tests passed!")
