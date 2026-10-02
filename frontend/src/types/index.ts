export type VerdictType = 'SAFE' | 'WARNING' | 'CRITICAL';

export interface AcousticFeatures {
  mfcc_mean: number[];
  zcr: number;
  spectral_centroid: number;
  spectral_rolloff: number;
  phase_consistency: number;
  neural_vocoder_artifact_score: number;
}

export interface PredictionPayload {
  type?: string;
  is_synthetic: boolean;
  confidence: number;
  forensic_hash: string;
  latency_ms: number;
  timestamp: string;
  verdict: string;
  threat_level: VerdictType;
  source?: string;
  features?: AcousticFeatures;
  details?: {
    p_synthetic: number;
    p_organic: number;
    threshold: number;
    engine: string;
    sample_rate: number;
    samples_evaluated: number;
  };
  session_id?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  forensic_hash: string;
  source: string;
  sample_name?: string;
  verdict: string;
  is_synthetic: boolean;
  confidence: number;
  latency_ms: number;
  duration_sec?: number;
}

export interface AuditLogsResponse {
  total: number;
  logs: AuditLogItem[];
}

export interface SlidingWindowResult {
  window_index: number;
  start_time_sec: number;
  end_time_sec: number;
  is_synthetic: boolean;
  confidence: number;
  forensic_hash: string;
  verdict: string;
  latency_ms: number;
}

export interface FileAnalysisResponse {
  filename: string;
  duration_sec: number;
  forensic_hash: string;
  overall_synthetic: boolean;
  overall_confidence: number;
  windows_analyzed: number;
  sliding_window_results: SlidingWindowResult[];
  verdict: string;
  latency_ms: number;
  features_summary?: AcousticFeatures;
}

export interface SystemStats {
  total_analyzed: number;
  organic_count: number;
  synthetic_count: number;
  avg_latency_ms: number;
  engine_status: string;
  model: string;
  uptime_sec: number;
}
