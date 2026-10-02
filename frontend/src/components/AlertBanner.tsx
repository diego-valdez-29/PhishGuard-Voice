import React from 'react';
import { ShieldCheck, AlertTriangle, Hash, Clock, Volume2, ShieldAlert } from 'lucide-react';
import { PredictionPayload } from '../types';
import { truncateHash, copyToClipboard } from '../utils/audioHelpers';

interface AlertBannerProps {
  prediction: PredictionPayload | null;
  isRecording: boolean;
  isDark: boolean;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  prediction,
  isRecording,
  isDark,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (hash: string) => {
    copyToClipboard(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isRecording && !prediction) {
    return (
      <div className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${
        isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-400">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-inherit">Sistema de Monitoreo en Espera</h4>
            <p className="text-xs text-slate-400">Presione "Iniciar Monitoreo" para analizar la entrada del micrófono en tiempo real.</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-500/10 text-slate-400 font-semibold">
            Modo Pasivo (Ready)
          </span>
        </div>
      </div>
    );
  }

  const isSynthetic = prediction?.is_synthetic ?? false;
  const confidencePct = prediction ? Math.round(prediction.confidence * 100) : 0;

  return (
    <div className={`relative overflow-hidden p-5 rounded-2xl border transition-all duration-200 shadow-lg ${
      isSynthetic
        ? 'bg-rose-500/15 border-rose-500/50 shadow-rose-500/10 animate-siren ring-1 ring-rose-500/30'
        : 'bg-emerald-500/10 border-emerald-500/40 shadow-emerald-500/5'
    }`}>
      {/* Top Banner Alert Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Verdict Badge & Icon */}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${
            isSynthetic 
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 scale-105' 
              : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
          }`}>
            {isSynthetic ? (
              <ShieldAlert className="w-8 h-8 animate-bounce" />
            ) : (
              <ShieldCheck className="w-8 h-8" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${
                isSynthetic 
                  ? 'bg-rose-500 text-white font-extrabold' 
                  : 'bg-emerald-500/20 text-emerald-500 font-bold'
              }`}>
                {isSynthetic ? 'AMENAZA DETECTADA' : 'TRANSMISIÓN SEGURA'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {prediction?.timestamp ? new Date(prediction.timestamp).toLocaleTimeString() : 'En directo'}
              </span>
            </div>

            <h3 className={`text-xl font-extrabold tracking-tight ${
              isSynthetic ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'
            }`}>
              {prediction?.verdict || (isRecording ? 'ANALIZANDO FLUJO ACÚSTICO...' : 'SISTEMA LISTO')}
            </h3>
          </div>
        </div>

        {/* Confidence Gauge & Metrics */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-medium text-slate-400">Nivel de Confianza</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black font-mono ${
                isSynthetic ? 'text-rose-500' : 'text-emerald-500'
              }`}>
                {confidencePct}%
              </span>
              <span className="text-xs text-slate-400">según WavLM</span>
            </div>
            {/* Confidence Mini Bar */}
            <div className="w-28 h-1.5 bg-slate-700/30 rounded-full overflow-hidden mt-1">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  isSynthetic ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
          </div>

          {/* Latency badge */}
          <div className={`p-2.5 rounded-xl border text-center ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <span className="text-[10px] text-slate-400 block font-medium">Latencia Total</span>
            <span className="text-xs font-mono font-bold text-inherit flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {prediction?.latency_ms ?? 0} ms
            </span>
          </div>
        </div>
      </div>

      {/* Forensic SHA-256 Hash Display Bar */}
      {prediction?.forensic_hash && (
        <div className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between text-xs font-mono gap-2 ${
          isSynthetic ? 'border-rose-500/20 text-rose-300' : 'border-emerald-500/20 text-emerald-300'
        }`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <Hash className="w-3.5 h-3.5 opacity-70 shrink-0" />
            <span className="text-slate-400 text-[11px] font-sans font-semibold">Hash Forense SHA-256:</span>
            <span className="truncate text-inherit font-bold" title={prediction.forensic_hash}>
              {prediction.forensic_hash}
            </span>
          </div>
          <button
            onClick={() => handleCopy(prediction.forensic_hash)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-sans font-bold transition-colors ${
              copied 
                ? 'bg-emerald-500 text-white' 
                : 'bg-slate-800/40 hover:bg-slate-800/80 text-inherit border border-inherit'
            }`}
          >
            {copied ? 'Copiado ✓' : 'Copiar Hash'}
          </button>
        </div>
      )}
    </div>
  );
};
