# PhishGuard Voice v1.1 🛡️🎙️
> **Real-time Web System for AI Synthetic Voice & Deepfake Detection**

PhishGuard Voice es una plataforma web de ciberseguridad diseñada para centros de operaciones de seguridad (SOC) y prevención de fraudes (Vishing, impersonación de ejecutivos y ataques de ingeniería social por voz). Combina procesamiento digital de señales acústicas (DSP), un backbone neural **WavLM-base** (16 kHz) con pesos congelados y un clasificador **SyntheticVoiceMLP**, garantizando auditoría forense inmutable mediante resúmenes criptográficos **SHA-256**.

---

## 🚀 Arquitectura y Componentes Clave

```
PhishGuard Voice
├── Frontend (React 18 + TypeScript + Tailwind CSS + Web Audio API)
│   ├── Cyber SOC Dashboard & Credencial Forense
│   ├── Monitor Espectrográfico y Forma de Onda en Tiempo Real (CU1)
│   ├── Laboratorio de Análisis de Archivos Multi-Ventana (CU2 / CU7)
│   └── Registro de Auditoría SHA-256 y Exportación Forense
└── Backend (Python + FastAPI + PyTorch + WebSockets)
    ├── Extractor Acústico (STFT, MFCC-13, ZCR, Coherencia de Fase, Vocoder 12-16kHz)
    ├── Motor de Inferencia (WavLM-base + SyntheticVoiceMLP Head en CPU)
    ├── Transmisión WebSocket Binaria PCM (/ws/stream)
    └── Endpoints REST de Análisis y Auditoría (/api/v1/analyze-file, /api/v1/audit-logs)
```

### Características Técnicas
- **Latencia de Inferencia**: < 1.2 segundos (promedio < 50ms en CPU optimizado).
- **Tiempo de Respuesta Visual UI**: < 200 ms al recibir payload WebSocket.
- **Frecuencia de Muestreo**: 16,000 Hz Mono Float32 / Int16 PCM.
- **Ventana de Inferencia**: Bloques de 3.0s con paso de 1.5s.
- **Inmutabilidad Forense**: Hashing SHA-256 en cada ventana analizada.

---

## 🛠️ Instalación y Ejecución Local

### Prerrequisitos
- Node.js 18+ y npm
- Python 3.10+ (compatible hasta 3.14 con PyTorch CPU)

### 1. Backend (FastAPI + PyTorch)
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*El backend estará disponible en `http://localhost:8000` con documentación interactiva en `http://localhost:8000/docs`.*

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*El frontend estará disponible en `http://localhost:5173`.*

### 3. Ejecución con Docker Compose
```bash
docker-compose up --build
```

---

## 🧪 Pruebas Automatizadas

```bash
cd backend
python -m tests.test_audio_pipeline
python -m tests.test_inference
```

---

## 📋 Endpoints de la API

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/health` | Chequeo de salud del servicio |
| `WS` | `/ws/stream` | Canal WebSocket binario de audio PCM (16kHz) |
| `POST` | `/api/v1/analyze-file` | Análisis forense de archivos (.wav, .mp3) |
| `GET` | `/api/v1/audit-logs` | Historial forense con hashes SHA-256 |
| `GET` | `/api/v1/stats` | Métricas y telemetría en tiempo real |
| `POST` | `/api/v1/simulate-sample` | Generador de señales de prueba sintética y humana |
