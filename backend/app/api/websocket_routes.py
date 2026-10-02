import logging
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.inference_engine import engine
from app.services.audit_logger import audit_logger
from config import settings

logger = logging.getLogger("phishguard.websocket")
ws_router = APIRouter()

class ConnectionSessionBuffer:
    """
    Session buffer that maintains a sliding ring buffer of 3.0s (48,000 samples at 16kHz)
    for each connected WebSocket client.
    """
    def __init__(self, target_samples: int = settings.WINDOW_SAMPLES):
        self.target_samples = target_samples
        self.buffer = np.zeros(0, dtype=np.float32)

    def append_chunk(self, chunk_samples: np.ndarray) -> np.ndarray:
        if len(chunk_samples) == 0:
            return self.buffer

        # Append new audio chunk
        self.buffer = np.concatenate([self.buffer, chunk_samples])
        
        # Keep only the latest window (up to 3.0s)
        if len(self.buffer) > self.target_samples:
            self.buffer = self.buffer[-self.target_samples:]

        return self.buffer

@ws_router.websocket("/ws/stream")
async def websocket_audio_stream_endpoint(websocket: WebSocket):
    await websocket.accept()
    session_buffer = ConnectionSessionBuffer()
    session_id = f"Stream-{id(websocket) % 10000}"
    logger.info(f"WebSocket client connected: {session_id}")

    try:
        # Send initial handshake confirmation
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "message": "PhishGuard Voice Real-time Stream Ready",
            "sample_rate": settings.TARGET_SAMPLE_RATE,
            "window_duration_sec": settings.WINDOW_DURATION_SEC,
            "session_id": session_id
        })

        while True:
            # Receive binary audio chunk or JSON control message
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                logger.info(f"WebSocket client disconnected cleanly: {session_id}")
                break
            
            if "bytes" in message and message["bytes"]:
                raw_bytes = message["bytes"]
                
                # 1. Convert raw binary PCM bytes into normalized float32
                chunk_samples = engine.feature_extractor.pcm_bytes_to_float32(raw_bytes)
                if len(chunk_samples) == 0:
                    continue

                # 2. Append to session ring buffer (up to 3.0s)
                window_audio = session_buffer.append_chunk(chunk_samples)
                
                # We need at least 1.0s to run solid forensic evaluation
                if len(window_audio) < int(settings.TARGET_SAMPLE_RATE * 1.0):
                    # Notify buffering status
                    await websocket.send_json({
                        "type": "BUFFERING",
                        "current_seconds": round(len(window_audio) / settings.TARGET_SAMPLE_RATE, 2),
                        "required_seconds": settings.WINDOW_DURATION_SEC
                    })
                    continue

                # 3 & 4. Run inference, compute SHA-256 hash and acoustic features
                result = engine.predict_window(window_audio, source="live_stream")

                # 5. Log to forensic audit ledger
                audit_logger.log_detection(result, sample_name=f"Session {session_id}")

                # 6. Return JSON prediction payload to frontend
                response_payload = {
                    "type": "PREDICTION_UPDATE",
                    "is_synthetic": result.is_synthetic,
                    "confidence": result.confidence,
                    "forensic_hash": result.forensic_hash,
                    "latency_ms": result.latency_ms,
                    "timestamp": result.timestamp,
                    "verdict": result.verdict,
                    "threat_level": result.threat_level,
                    "features": result.features.model_dump() if result.features else None,
                    "details": result.details,
                    "session_id": session_id
                }
                await websocket.send_json(response_payload)

            elif "text" in message and message["text"]:
                # Handle control commands like PING or RESET
                import json
                try:
                    data = json.loads(message["text"])
                    if data.get("action") == "PING":
                        await websocket.send_json({"type": "PONG", "timestamp": time.time()})
                    elif data.get("action") == "RESET_BUFFER":
                        session_buffer = ConnectionSessionBuffer()
                        await websocket.send_json({"type": "BUFFER_RESET_OK"})
                except Exception:
                    pass

    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket exception in stream {session_id}: {e}")
        try:
            await websocket.close()
        except Exception:
            pass
