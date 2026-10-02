import React from 'react';
import { Cpu, ShieldCheck, Layers, GitBranch, Terminal, CheckCircle2 } from 'lucide-react';

export const ArchitectureView: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-3xl border transition-all ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-inherit">
              Arquitectura del Sistema de Detección WavLM + MLP
            </h3>
            <p className="text-xs text-slate-400">
              PhishGuard Voice v1.1 • Especificación Oficial de Ingeniería
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider block mb-1">
              1. Extractor Acústico
            </span>
            <h4 className="text-sm font-bold text-inherit mb-2">DSP & STFT Multi-Banda</h4>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Muestreo objetivo a 16,000 Hz Mono</li>
              <li>STFT (n_fft=2048, hop=512)</li>
              <li>13 Coeficientes MFCCs + ZCR</li>
              <li>Inspección de artefactos en 12-16kHz</li>
            </ul>
          </div>

          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[11px] font-bold text-cyan-500 uppercase tracking-wider block mb-1">
              2. Backbone Neural
            </span>
            <h4 className="text-sm font-bold text-inherit mb-2">microsoft/wavlm-base</h4>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Pesos congelados (requires_grad = False)</li>
              <li>Embedding latente de 768 dimensiones</li>
              <li>Optimizado para inferencia en CPU</li>
              <li>Ventana de inferencia de 3.0s a 4.0s</li>
            </ul>
          </div>

          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[11px] font-bold text-purple-500 uppercase tracking-wider block mb-1">
              3. Clasificador MLP
            </span>
            <h4 className="text-sm font-bold text-inherit mb-2">SyntheticVoiceMLP Head</h4>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Linear(768, 256) + BatchNorm1d</li>
              <li>Activación ReLU + Dropout(0.3)</li>
              <li>Linear(256, 2) + Softmax</li>
              <li>Umbral de corte configurable (Default: 0.75)</li>
            </ul>
          </div>
        </div>

        {/* Forensic Auditability Callout */}
        <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-slate-300 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-emerald-400 mb-1">Inmutabilidad Forense SHA-256</h5>
            <p className="text-slate-400 leading-relaxed">
              Cada ventana procesada tanto en el stream en tiempo real como en la subida de archivos genera un resumen criptográfico SHA-256 único de los bytes PCM. Esto permite a equipos de SOC y peritos forenses auditar y verificar con certeza matemática la integridad de la evidencia analizada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
