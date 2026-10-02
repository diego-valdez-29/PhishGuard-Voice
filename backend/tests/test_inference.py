import numpy as np
from app.core.inference_engine import engine

def test_inference_runs_within_latency_budget():
    # 3.0s window of audio at 16kHz = 48000 samples
    samples = np.random.normal(0, 0.05, 48000).astype(np.float32)
    result = engine.predict_window(samples, source="test_suite")
    
    assert result is not None
    assert isinstance(result.is_synthetic, bool)
    assert 0.0 <= result.confidence <= 1.0
    assert len(result.forensic_hash) == 64
    assert result.latency_ms < 1200.0, f"Latency {result.latency_ms}ms exceeded 1.2s budget!"
    assert result.features is not None
    print(f"Inference latency: {result.latency_ms} ms. Verdict: {result.verdict}")

if __name__ == "__main__":
    test_inference_runs_within_latency_budget()
    print("Inference test passed!")
