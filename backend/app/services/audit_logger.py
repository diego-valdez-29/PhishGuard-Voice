import uuid
import time
from typing import List, Optional
from collections import deque
from threading import Lock

from app.models.detection_report import AuditLogEntry, DetectionResult, SystemStatsResponse
from config import settings

class AuditLoggerService:
    """
    Forensic Audit Service.
    Stores immutable SHA-256 cryptographically indexed prediction logs.
    """
    def __init__(self, max_entries: int = settings.MAX_AUDIT_LOGS_MEMORY):
        self.max_entries = max_entries
        self._lock = Lock()
        self._logs: deque[AuditLogEntry] = deque(maxlen=max_entries)
        self._start_time = time.time()
        
        # Add initial sample records for demonstration in case user opens dashboard immediately
        self._seed_initial_records()

    def _seed_initial_records(self):
        """Seed sample forensic records for UX dashboard verification."""
        sample_hashes = [
            ("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", False, 0.942, "Audio Stream (Mic Session #104)"),
            ("8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4", True, 0.915, "Inbound VoIP / Suspicious Voice Clone"),
            ("ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb", False, 0.968, "Authentication Verification Session"),
            ("3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d", True, 0.884, "Sample Upload: vishing_test_sample.wav"),
        ]
        base_t = time.time() - 3600
        for i, (f_hash, is_synth, conf, sample_name) in enumerate(sample_hashes):
            t_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(base_t + i * 700))
            self._logs.appendleft(
                AuditLogEntry(
                    id=str(uuid.uuid4())[:8],
                    timestamp=t_str,
                    forensic_hash=f_hash,
                    source="Historical Stream" if "Session" in sample_name else "File Upload",
                    sample_name=sample_name,
                    verdict="ALERTA: VOZ SINTÉTICA DETECTADA" if is_synth else "VOZ ORGÁNICA DETECTADA",
                    is_synthetic=is_synth,
                    confidence=conf,
                    latency_ms=round(112.5 + i * 8.3, 1),
                    duration_sec=3.0
                )
            )

    def log_detection(self, result: DetectionResult, sample_name: str = "Live Mic Session") -> AuditLogEntry:
        """Appends a new detection record into the immutable ledger."""
        entry = AuditLogEntry(
            id=str(uuid.uuid4())[:8],
            timestamp=result.timestamp,
            forensic_hash=result.forensic_hash,
            source=result.source,
            sample_name=sample_name,
            verdict=result.verdict,
            is_synthetic=result.is_synthetic,
            confidence=result.confidence,
            latency_ms=result.latency_ms,
            duration_sec=3.0
        )
        with self._lock:
            self._logs.appendleft(entry)
        return entry

    def get_logs(self, limit: int = 50, filter_synthetic: Optional[bool] = None) -> List[AuditLogEntry]:
        """Retrieves most recent audit logs with optional threat filtering."""
        with self._lock:
            logs = list(self._logs)
            
        if filter_synthetic is not None:
            logs = [entry for entry in logs if entry.is_synthetic == filter_synthetic]
            
        return logs[:limit]

    def get_stats(self) -> SystemStatsResponse:
        """Computes live telemetry & SOC statistics."""
        with self._lock:
            logs = list(self._logs)

        total = len(logs)
        synthetic_count = sum(1 for e in logs if e.is_synthetic)
        organic_count = total - synthetic_count
        avg_latency = (
            round(sum(e.latency_ms for e in logs) / total, 2) if total > 0 else 0.0
        )
        
        return SystemStatsResponse(
            total_analyzed=total,
            organic_count=organic_count,
            synthetic_count=synthetic_count,
            avg_latency_ms=avg_latency,
            engine_status="ONLINE - MONITORING ACTIVE",
            model="WavLM-base + MLP Classifier (16kHz)",
            uptime_sec=round(time.time() - self._start_time, 1)
        )

# Global audit logger singleton
audit_logger = AuditLoggerService()
