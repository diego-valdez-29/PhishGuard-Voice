from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class AcousticFeatures(BaseModel):
    mfcc_mean: List[float] = Field(default_factory=list, description="13 MFCC coefficient means")
    zcr: float = Field(0.0, description="Zero Crossing Rate")
    spectral_centroid: float = Field(0.0, description="Spectral Centroid in Hz")
    spectral_rolloff: float = Field(0.0, description="Spectral Rolloff 85% in Hz")
    phase_consistency: float = Field(0.0, description="Phase coherence across STFT frames (0.0 to 1.0)")
    neural_vocoder_artifact_score: float = Field(0.0, description="High-frequency anomaly index (12-16kHz)")

class DetectionResult(BaseModel):
    is_synthetic: bool
    confidence: float
    forensic_hash: str
    latency_ms: float
    timestamp: str
    verdict: str
    threat_level: str  # SAFE, WARNING, CRITICAL
    source: str = "live_stream"
    features: Optional[AcousticFeatures] = None
    details: Optional[Dict[str, Any]] = None

class AuditLogEntry(BaseModel):
    id: str
    timestamp: str
    forensic_hash: str
    source: str
    sample_name: Optional[str] = "Mic Stream"
    verdict: str
    is_synthetic: bool
    confidence: float
    latency_ms: float
    duration_sec: Optional[float] = 1.5

class AuditLogsResponse(BaseModel):
    total: int
    logs: List[AuditLogEntry]

class FileAnalysisResponse(BaseModel):
    filename: str
    duration_sec: float
    forensic_hash: str
    overall_synthetic: bool
    overall_confidence: float
    windows_analyzed: int
    sliding_window_results: List[Dict[str, Any]]
    verdict: str
    latency_ms: float
    features_summary: Optional[AcousticFeatures] = None

class SystemStatsResponse(BaseModel):
    total_analyzed: int
    organic_count: int
    synthetic_count: int
    avg_latency_ms: float
    engine_status: str
    model: str
    uptime_sec: float
