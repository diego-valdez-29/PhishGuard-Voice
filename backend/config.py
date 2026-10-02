import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "PhishGuard Voice"
    VERSION: str = "1.1.0"
    API_PREFIX: str = "/api/v1"
    
    # Audio Parameters
    TARGET_SAMPLE_RATE: int = 16000
    CHUNK_DURATION_SEC: float = 1.5
    WINDOW_DURATION_SEC: float = 3.0
    CHUNK_SAMPLES: int = int(16000 * 1.5)  # 24,000 samples
    WINDOW_SAMPLES: int = int(16000 * 3.0)  # 48,000 samples
    
    # Model parameters
    MODEL_NAME: str = "microsoft/wavlm-base"
    CONFIDENCE_THRESHOLD: float = 0.75
    DEVICE: str = "cpu"
    
    # Storage & Uploads
    MAX_FILE_SIZE_BYTES: int = 20 * 1024 * 1024  # 20 MB
    ALLOWED_EXTENSIONS: list[str] = [".wav", ".mp3", ".ogg", ".flac", ".webm"]
    
    # Performance & Forensic
    MAX_AUDIT_LOGS_MEMORY: int = 500

settings = Settings()
