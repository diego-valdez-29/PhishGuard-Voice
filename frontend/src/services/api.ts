import { FileAnalysisResponse, AuditLogsResponse, SystemStats, PredictionPayload } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export async function uploadAndAnalyzeAudioFile(file: File): Promise<FileAnalysisResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/v1/analyze-file`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = 'Error en el análisis del archivo.';
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function fetchAuditLogs(limit: number = 50, filterSynthetic?: boolean): Promise<AuditLogsResponse> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (filterSynthetic !== undefined) {
    params.append('filter_synthetic', filterSynthetic.toString());
  }

  const response = await fetch(`${API_BASE}/api/v1/audit-logs?${params.toString()}`);
  if (!response.ok) {
    throw new Error('No se pudieron obtener los registros de auditoría.');
  }
  return response.json();
}

export async function fetchSystemStats(): Promise<SystemStats> {
  const response = await fetch(`${API_BASE}/api/v1/stats`);
  if (!response.ok) {
    throw new Error('No se pudieron obtener las estadísticas del sistema.');
  }
  return response.json();
}

export async function simulateAudioSample(sampleType: 'synthetic' | 'organic'): Promise<{ sample_type: string; result: PredictionPayload }> {
  const response = await fetch(`${API_BASE}/api/v1/simulate-sample?sample_type=${sampleType}`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Error al simular muestra de audio.');
  }
  return response.json();
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET', signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}
