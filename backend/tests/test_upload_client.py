import urllib.request
import wave
import io
import json
import numpy as np

def run_test():
    sr = 16000
    t = np.linspace(0, 4.0, int(sr * 4.0))
    audio = (np.sin(2 * np.pi * 440 * t) * 32767).astype(np.int16)
    
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(audio.tobytes())
    
    wav_bytes = buf.getvalue()
    boundary = '----PhishGuardBoundary'
    body = (
        b'--' + boundary.encode() + b'\r\n'
        b'Content-Disposition: form-data; name="file"; filename="test_call.wav"\r\n'
        b'Content-Type: audio/wav\r\n\r\n'
        + wav_bytes
        + b'\r\n--' + boundary.encode() + b'--\r\n'
    )
    
    req = urllib.request.Request(
        'http://127.0.0.1:8001/api/v1/analyze-file',
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
    )
    
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode())
        print("Analysis File Verdict:", res['verdict'])
        print("Windows Analyzed:", res['windows_analyzed'])
        print("Global SHA-256 Hash:", res['forensic_hash'])
        print("Duration (s):", res['duration_sec'])
        print("Latency (ms):", res['latency_ms'])
        assert res['windows_analyzed'] >= 1
        assert len(res['forensic_hash']) == 64

if __name__ == '__main__':
    run_test()
