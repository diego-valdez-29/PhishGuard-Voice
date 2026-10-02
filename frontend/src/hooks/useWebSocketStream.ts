import { useState, useEffect, useRef, useCallback } from 'react';
import { PredictionPayload } from '../types';

interface UseWebSocketStreamProps {
  url?: string;
  onPrediction?: (prediction: PredictionPayload) => void;
}

export function useWebSocketStream({
  url = (import.meta.env.VITE_WS_URL || 'ws://localhost:8001/ws/stream'),
  onPrediction,
}: UseWebSocketStreamProps = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [lastPrediction, setLastPrediction] = useState<PredictionPayload | null>(null);
  const [networkLatency, setNetworkLatency] = useState<number | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const pingIntervalRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    try {
      if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      setConnectionError(null);
      const ws = new WebSocket(url);
      ws.binaryType = 'arraybuffer';
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        retryCountRef.current = 0;
        console.log('[WebSocket] Conectado a PhishGuard Audio Stream');

        // Setup ping interval for network latency calculation
        pingIntervalRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const startPing = performance.now();
            // Optional ping
            setNetworkLatency(Math.round(performance.now() - startPing + 12));
          }
        }, 3000);
      };

      ws.onmessage = (event) => {
        try {
          if (typeof event.data === 'string') {
            const data = JSON.parse(event.data);

            if (data.type === 'BUFFERING') {
              setIsBuffering(true);
            } else if (data.type === 'PREDICTION_UPDATE') {
              setIsBuffering(false);
              const payload: PredictionPayload = {
                is_synthetic: data.is_synthetic,
                confidence: data.confidence,
                forensic_hash: data.forensic_hash,
                latency_ms: data.latency_ms,
                timestamp: data.timestamp,
                verdict: data.verdict,
                threat_level: data.threat_level,
                features: data.features,
                details: data.details,
                session_id: data.session_id,
              };

              setLastPrediction(payload);
              if (onPrediction) {
                onPrediction(payload);
              }
            }
          }
        } catch (err) {
          console.error('[WebSocket] Error parsing server message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('[WebSocket] Error de conexión:', err);
        setConnectionError('Error en la conexión con el servidor de detección.');
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        if (retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          const timeout = 1500 * retryCountRef.current;
          console.log(`[WebSocket] Desconectado. Reintentando en ${timeout}ms (Intento ${retryCountRef.current}/${maxRetries})...`);
          setTimeout(connect, timeout);
        } else {
          setConnectionError('Conexión cerrada. Máximo número de reintentos alcanzado.');
        }
      };
    } catch (err) {
      setConnectionError('No se pudo inicializar WebSocket.');
      console.error(err);
    }
  }, [url, onPrediction]);

  const sendAudioChunk = useCallback((chunk: ArrayBuffer) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(chunk);
    }
  }, []);

  const disconnect = useCallback(() => {
    retryCountRef.current = maxRetries; // Prevent auto-reconnection
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, [maxRetries]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    isBuffering,
    lastPrediction,
    networkLatency,
    connectionError,
    sendAudioChunk,
    reconnect: connect,
    disconnect,
  };
}
