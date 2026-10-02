import { useState, useRef, useCallback } from 'react';
import { convertFloat32ToInt16PCM, downsampleBuffer, calculateRMSVolume } from '../utils/audioHelpers';

interface UseAudioStreamProps {
  onChunkReady: (pcmBuffer: ArrayBuffer) => void;
  targetSampleRate?: number;
  chunkDurationSec?: number;
}

export function useAudioStream({
  onChunkReady,
  targetSampleRate = 16000,
  chunkDurationSec = 1.5,
}: UseAudioStreamProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const accumulatedSamplesRef = useRef<Float32Array>(new Float32Array(0));

  const targetChunkSamples = Math.round(targetSampleRate * chunkDurationSec);

  const startStream = useCallback(async () => {
    try {
      setError(null);
      accumulatedSamplesRef.current = new Float32Array(0);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: false, // Keep full frequency fidelity for forensic inspection
          autoGainControl: false,
        },
      });
      mediaStreamRef.current = stream;

      // AudioContext initialization
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const sourceNode = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Buffer size 4096 gives smooth processing without audio dropouts
      const bufferSize = 4096;
      const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate volume for UI level meter
        const vol = calculateRMSVolume(inputData);
        setVolumeLevel(vol);

        // Downsample to 16,000 Hz if hardware uses 44.1k / 48k
        const downsampled = downsampleBuffer(inputData, ctx.sampleRate, targetSampleRate);

        // Append to accumulation buffer
        const prev = accumulatedSamplesRef.current;
        const merged = new Float32Array(prev.length + downsampled.length);
        merged.set(prev, 0);
        merged.set(downsampled, prev.length);
        accumulatedSamplesRef.current = merged;

        // When we accumulate 1.5s (24,000 samples)
        if (accumulatedSamplesRef.current.length >= targetChunkSamples) {
          const chunkToEmit = accumulatedSamplesRef.current.slice(0, targetChunkSamples);
          accumulatedSamplesRef.current = accumulatedSamplesRef.current.slice(targetChunkSamples);

          // Convert to 16-bit PCM binary ArrayBuffer
          const pcmBinary = convertFloat32ToInt16PCM(chunkToEmit);
          onChunkReady(pcmBinary);
        }
      };

      sourceNode.connect(analyser);
      analyser.connect(processor);
      processor.connect(ctx.destination);

      setIsRecording(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al acceder al micrófono';
      console.error('Audio capture error:', err);
      setError(msg);
      setIsRecording(false);
    }
  }, [onChunkReady, targetChunkSamples, targetSampleRate]);

  const stopStream = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    accumulatedSamplesRef.current = new Float32Array(0);
    setIsRecording(false);
    setVolumeLevel(0);
  }, []);

  return {
    isRecording,
    volumeLevel,
    error,
    startStream,
    stopStream,
    analyserNode: analyserRef.current,
  };
}
