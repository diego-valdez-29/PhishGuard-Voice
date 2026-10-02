import React from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Radio, 
  Cpu, 
  Hash, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  Zap,
  Activity
} from 'lucide-react';
import { SpectrogramVisualizer } from './SpectrogramVisualizer';
import { AlertBanner } from './AlertBanner';
import { PredictionPayload } from '../types';

interface LiveMonitoringPanelProps {
  isRecording: boolean;
  volumeLevel: number;
  analyserNode: AnalyserNode | null;
  prediction: PredictionPayload | null;
  isDark: boolean;
  onToggleRecording: () => void;
  onSimulateSample: (type: 'synthetic' | 'organic') => void;
  error: string | null;
}

export const LiveMonitoringPanel: React.FC<LiveMonitoringPanelProps> = ({
  isRecording,
  volumeLevel,
  analyserNode,
  prediction,
  isDark,
  onToggleRecording,
  onSimulateSample,
  error,
}) => {
  const isSynthetic = prediction?.is_synthetic ?? false;

  return (
    <div className="space-y-6">
      {/* Main Alert & Forensic Banner */}
      <AlertBanner
        prediction={prediction}
        isRecording={isRecording}
        isDark={isDark}
      />

      {/* Main Real-time Audio Visualizer Card */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-inherit flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              Espectrograma y Forma de Onda en Tiempo Real (CU1)
            </h3>
            <p className="text-xs text-slate-400">
              Captura a 16,000 Hz con ventanas de inferencia de 3.0s y evaluación de artefactos vocoder.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Volume Meter */}
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <div className="w-24 h-2 bg-slate-700/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    volumeLevel > 70 ? 'bg-rose-500' : volumeLevel > 40 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${volumeLevel}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-slate-400 w-8 text-right">{volumeLevel}%</span>
            </div>

            {/* Quick Record Button */}
            <button
              onClick={onToggleRecording}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                isRecording
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20 animate-pulse'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isRecording ? 'Detener Monitoreo' : 'Iniciar Monitoreo'}</span>
            </button>
          </div>
        </div>

        {/* Visualizer Canvas */}
        <SpectrogramVisualizer
          analyserNode={analyserNode}
          isRecording={isRecording}
          isSynthetic={isSynthetic}
          isDark={isDark}
          height={200}
        />

        {/* Demo Quick Simulations */}
        <div className="mt-4 pt-4 border-t border-inherit flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-medium">Inyectores de Prueba Rápida (Demostración de Detección):</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSimulateSample('synthetic')}
              className="px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold flex items-center gap-1.5 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Simular Deepfake Sintético
            </button>
            <button
              onClick={() => onSimulateSample('organic')}
              className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-bold flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Simular Voz Humana Orgánica
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
