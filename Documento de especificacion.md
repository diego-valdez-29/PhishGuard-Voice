# MASTER PROJECT SPECIFICATION & PROMPT FOR ANTIGRAVITY / CURSOR / DEVIN
# Project: PhishGuard Voice v1.1
# Description: Real-time Web System for AI Synthetic Voice & Deepfake Detection

---

## 1. PROJECT OVERVIEW & ARCHITECTURE VISION

**PhishGuard Voice** is a high-performance, real-time web application engineered to detect and mitigate voice cloning, deepfake audio, and synthetic speech (Text-to-Speech / Neural Vocoder artifacts) during live audio transmissions and file uploads.

### Key Architectural Constraints & Requirements
- **Frontend Stack**: React 18+, TypeScript, Web Audio API, WebSockets, Tailwind CSS (Cyber SOC Dark Mode theme: Charcoal background `#0F172A`, Emerald Green `#10B981` for organic voice, Red Alert `#EF4444` for synthetic voice).
- **Backend Stack**: Python 3.10+, FastAPI, PyTorch, `torchaudio`, `librosa`, HuggingFace `transformers` (`microsoft/wavlm-base`), WebSockets.
- **AI Core**: Pre-trained **WavLM-base** (16 kHz) backbone with frozen weights, coupled to a trained **MLP Classifier Head** in PyTorch.
- **Compute Target**: Optimized for **CPU execution** without mandatory GPU dependencies.
- **Performance Thresholds**:
  - End-to-end processing & inference latency < **1.2 seconds**.
  - UI visual alert state transition < **200 ms** upon receiving prediction payload.
- **Forensic Auditability**: Every analyzed audio block/window must generate an immutable **SHA-256 cryptographic hash** stored alongside prediction metadata.

---

## 2. MONOREPO STRUCTURE TO GENERATE

Please construct the project adhering to the following directory layout:

```
phishguard-voice/
├── README.md
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   ├── config.py
│   ├── app/
│   │   ├── __init__.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── websocket_routes.py
│   │   │   └── rest_routes.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── feature_extractor.py
│   │   │   ├── inference_engine.py
│   │   │   └── hash_generator.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── mlp_head.py
│   │   │   └── detection_report.py
│   │   └── services/
│   │       ├── __init__.py
│   │       └── audit_logger.py
│   └── tests/
│       ├── test_audio_pipeline.py
│       └── test_inference.py
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── components/
        │   ├── Header.tsx
        │   ├── LiveMonitoringPanel.tsx
        │   ├── SampleUploadPanel.tsx
        │   ├── SpectrogramVisualizer.tsx
        │   ├── AlertBanner.tsx
        │   └── AuditLogsTable.tsx
        ├── hooks/
        │   ├── useAudioStream.ts
        │   └── useWebSocketStream.ts
        ├── services/
        │   └── api.ts
        ├── types/
        │   └── index.ts
        └── utils/
            └── audioHelpers.ts
```

---

## 3. COMPONENT SPECIFICATIONS (UML 2.0 ALIGNED)

### 3.1. Backend Module Specifications

#### A. `AcousticFeatureExtractor` (`backend/app/core/feature_extractor.py`)
- **Target Sample Rate**: 16,000 Hz (Mono, 16-bit PCM / Float32).
- **Responsibilities**:
  - Convert raw bytes to Float32 PyTorch tensor or NumPy array.
  - Extract Mel-Frequency Cepstral Coefficients (MFCCs, `n_mfcc=13`).
  - Calculate Zero-Crossing Rate (ZCR).
  - Compute Spectrogram using Short-Time Fourier Transform (STFT, `n_fft=2048`, `hop_length=512`).
  - Evaluate phase consistency across consecutive frames.

#### B. `InferenceEngine` (`backend/app/core/inference_engine.py`)
- **Backbone**: `microsoft/wavlm-base` via HuggingFace `AutoModel` (freeze all backbone weights).
- **Classifier Head**: PyTorch `MLP` (Linear(768, 256) -> ReLU -> Dropout(0.3) -> Linear(256, 2) -> Softmax).
- **Inference Window**: 3.0 to 4.0 seconds aggregation buffer (resampled to 16 kHz).
- **Device**: CPU (`torch.device('cpu')`).
- **Confidence Threshold**: 0.75 for flagging `is_synthetic = True`.

#### C. `FastAPIServer` & WebSocket Endpoints (`backend/app/api/websocket_routes.py`)
- **Endpoint**: `/ws/stream`
- **Protocol**: Binary WebSocket stream for audio chunks, JSON for output predictions.
- **Processing Loop**:
  1. Receive 1.5s binary PCM chunk from client.
  2. Append chunk to connection session ring buffer (up to 3.0s window).
  3. Extract features & embeddings via `AcousticFeatureExtractor` and `InferenceEngine`.
  4. Compute SHA-256 hash of window bytes.
  5. Return JSON payload:
     ```json
     {
       "is_synthetic": true,
       "confidence": 0.92,
       "forensic_hash": "a3f8901b2c...",
       "latency_ms": 145.2,
       "timestamp": "2026-10-01T21:00:00Z"
     }
     ```

#### D. REST Endpoints (`backend/app/api/rest_routes.py`)
- **POST `/api/v1/analyze-file`**:
  - Accept `Multipart/Form-Data` with file (`.wav` or `.mp3`, max 20 MB).
  - Validate file extension and audio duration (>= 1.0 s).
  - Calculate SHA-256 hash of entire file.
  - Slice audio into 3s sliding windows, run batch inference, and return aggregated probability report.
- **GET `/api/v1/audit-logs`**:
  - Return recent detection reports for the forensic audit table.

---

### 3.2. Frontend Module Specifications

#### A. `AudioStreamCapture` (`frontend/src/hooks/useAudioStream.ts`)
- Access Microphone via `navigator.mediaDevices.getUserMedia({ audio: true })`.
- Instantiate `AudioContext` with `sampleRate: 16000`.
- Process incoming audio using `ScriptProcessorNode` / `AudioWorklet` to emit 16 kHz Mono PCM Float32/Int16 chunks every 1.5 seconds.

#### B. `WebSocketClientManager` (`frontend/src/hooks/useWebSocketStream.ts`)
- Connect to `ws://localhost:8000/ws/stream`.
- Manage automatic reconnection (up to 3 retries) if socket drops.
- Stream binary PCM chunks to backend.
- Parse incoming prediction JSON payloads and update UI state immediately (< 200 ms).

#### C. Cyber SOC Dashboard UI (`frontend/src/App.tsx`)
- **Theme**: Dark Mode SOC (Charcoal `#0F172A`, Slate `#1E293B`, Borders `#334155`).
- **Header**: System Title, Network Latency Indicator, Connection Status Badge.
- **Live Monitoring Tab (CU1)**:
  - "Iniciar Monitoreo" / "Detener Monitoreo" control button.
  - Real-time Audio Waveform Canvas / Spectrogram visualizer.
  - **Status Indicator**:
    - **Safe**: Emerald Green `#10B981` ("VOZ ORGÁNICA DETECTADA").
    - **Threat**: Flashing Red `#EF4444` with visual siren overlay ("ALERTA: VOZ SINTÉTICA DETECTADA").
  - Live Confidence Meter & SHA-256 Hash display.
- **Assisted File Analysis Tab (CU2 / CU7)**:
  - Drag-and-drop file uploader for `.wav` / `.mp3` (up to 20MB).
  - Audio Player & File Spectrogram display.
  - Instant analysis results card with risk score breakdown.
- **Audit Logs Panel**:
  - Table displaying timestamp, forensic hash, file/stream source, prediction verdict, and confidence score.

---

## 4. DETAILED IMPLEMENTATION STEPS FOR ANTIGRAVITY

### Step 1: Dependencies & Environment Setup
Generate `backend/requirements.txt`:
```txt
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
torch>=2.2.0
torchaudio>=2.2.0
transformers>=4.37.0
librosa>=0.10.1
numpy>=1.26.0
python-multipart>=0.0.6
pydantic>=2.6.0
scipy>=1.12.0
```

Generate `frontend/package.json`:
```json
{
  "name": "phishguard-voice-frontend",
  "private": true,
  "version": "1.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.322.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.0"
  }
}
```

### Step 2: Implement MLP Classifier & Synthetic Model Pipeline
In `backend/app/models/mlp_head.py`, define:
```python
import torch
import torch.nn as nn

class SyntheticVoiceMLP(nn.Module):
    def __init__(self, input_dim=768, hidden_dim=256, num_classes=2):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, num_classes)
        )

    def forward(self, x):
        return self.net(x)
```

In `backend/app/core/inference_engine.py`, initialize `transformers.AutoModel.from_pretrained("microsoft/wavlm-base")`, freeze parameters (`param.requires_grad = False`), and attach `SyntheticVoiceMLP`. If pre-trained weights file is absent, fallback gracefully to synthetic mock probabilities or heuristic feature analysis for prototype testing.

### Step 3: Implement WebSockets Streaming in FastAPI
Ensure `websocket_routes.py` manages binary PCM byte streams, buffers up to 3 seconds of audio data, calculates SHA-256 hashes, passes data to `InferenceEngine`, and returns JSON results in real time with latency measurement.

### Step 4: Build Frontend Hooks & Web Audio API Integration
Ensure `useAudioStream.ts` converts Web Audio API float samples to 16 kHz 16-bit PCM binary blobs or Float32 arrays, and handles browser media permission requests (`getUserMedia`).

### Step 5: Implement Cyber SOC UI
Style the frontend with Tailwind CSS to match a high-tech Security Operations Center (SOC) dashboard with clean dark aesthetics, glowing status lights, real-time waveform canvas, and red alert sirens.

---

## 5. EXECUTION & VERIFICATION INSTRUCTIONS

To run the entire system locally:

1. **Backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate # or venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Verification Checklist**:
   - Access `http://localhost:5173` in browser.
   - Click "Iniciar Monitoreo" -> Confirm microphone permission.
   - Speak into microphone -> Observe green status indicator and live SHA-256 log entries.
   - Test offline upload tab -> Upload a sample `.wav` file -> Verify full analysis report generation.

---
*Generated directly from PhishGuard Voice v1.1 Official ERS & UML Specifications.*
