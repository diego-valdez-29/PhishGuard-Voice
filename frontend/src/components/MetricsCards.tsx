import React from 'react';
import { 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Sliders, 
  Lightbulb, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Cpu,
  Layers
} from 'lucide-react';
import { SystemStats, AcousticFeatures, PredictionPayload } from '../types';

interface MetricsRowProps {
  stats: SystemStats | null;
  prediction: PredictionPayload | null;
  isDark: boolean;
}

export const MetricsRow: React.FC<MetricsRowProps> = ({ stats, prediction, isDark }) => {
  const totalAnalyzed = stats?.total_analyzed ?? 142;
  const threats = stats?.synthetic_count ?? 12;
  const organic = stats?.organic_count ?? 130;
  const authenticityRate = totalAnalyzed > 0 ? ((organic / totalAnalyzed) * 100).toFixed(1) : '98.5';
  const latency = prediction?.latency_ms ?? (stats?.avg_latency_ms ?? 34.2);

  const cardClass = `p-4 rounded-2xl border transition-all ${
    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
  }`;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Audio Windows */}
      <div className={cardClass}>
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
          <span>Bloques Analizados</span>
          <Activity className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="text-2xl font-black font-mono tracking-tight text-inherit">
          {totalAnalyzed.toLocaleString()} <span className="text-xs font-sans text-slate-400 font-medium">ventanas</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 mt-2">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>+12.4% vs sesión anterior</span>
        </div>
      </div>

      {/* 2. Threats Intercepted */}
      <div className={cardClass}>
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
          <span>Deepfakes Interceptados</span>
          <ShieldAlert className="w-4 h-4 text-rose-500" />
        </div>
        <div className="text-2xl font-black font-mono tracking-tight text-rose-500">
          {threats} <span className="text-xs font-sans text-slate-400 font-medium">amenazas</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-500 mt-2">
          <ArrowDownRight className="w-3.5 h-3.5" />
          <span>Confianza promedio 91.2%</span>
        </div>
      </div>

      {/* 3. Authenticity Rate */}
      <div className={cardClass}>
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
          <span>Tasa de Autenticidad</span>
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="text-2xl font-black font-mono tracking-tight text-emerald-500">
          {authenticityRate}%
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 mt-2">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Voz orgánica certificada</span>
        </div>
      </div>

      {/* 4. Inference Latency */}
      <div className={cardClass}>
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
          <span>Latencia de Inferencia</span>
          <Clock className="w-4 h-4 text-cyan-500" />
        </div>
        <div className="text-2xl font-black font-mono tracking-tight text-cyan-500">
          {latency} <span className="text-xs font-sans text-slate-400 font-medium">ms</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mt-2">
          <Cpu className="w-3.5 h-3.5 text-cyan-500" />
          <span>Meta SLA: &lt; 1,200 ms</span>
        </div>
      </div>
    </div>
  );
};

interface RiskThresholdCardProps {
  threshold: number;
  setThreshold: (val: number) => void;
  confidence: number;
  isDark: boolean;
}

export const RiskThresholdCard: React.FC<RiskThresholdCardProps> = ({
  threshold,
  setThreshold,
  confidence,
  isDark,
}) => {
  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-sm font-extrabold text-inherit">Umbral de Alerta Sintética</h4>
          <p className="text-[11px] text-slate-400">Punto de corte para disparo de alarma</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-mono font-bold">
          <Sliders className="w-3.5 h-3.5" />
          {(threshold * 100).toFixed(0)}%
        </div>
      </div>

      {/* Slider / Progress Bar */}
      <div className="space-y-2 mt-4">
        <input
          type="range"
          min="50"
          max="95"
          step="5"
          value={threshold * 100}
          onChange={(e) => setThreshold(Number(e.target.value) / 100)}
          className="w-full h-2 bg-slate-700/30 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between text-[11px] font-mono text-slate-400">
          <span>Modo Sensible (50%)</span>
          <span className="font-bold text-inherit">Recomendado (75%)</span>
          <span>Modo Estricto (95%)</span>
        </div>
      </div>
    </div>
  );
};

export const ForensicInsightsCard: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" />
            Criterios Forenses IA
          </span>
          <h4 className="text-sm font-extrabold text-inherit">Detección de Artefactos de Vocoder</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Las síntesis de voz (HiFi-GAN, ElevenLabs) generan patrones periódicos antinaturales en la banda de 12-16kHz y coherencia de fase excesivamente rígida.
          </p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-inherit flex items-center justify-between text-xs font-bold text-emerald-500 hover:text-emerald-400 cursor-pointer group">
        <span>Explorar guía forense</span>
        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  );
};

export const AcousticFeatureCard: React.FC<{ features?: AcousticFeatures; isDark: boolean }> = ({ features, isDark }) => {
  const f = features || {
    mfcc_mean: [-12.4, 24.1, 15.2],
    zcr: 0.084,
    spectral_centroid: 1650.0,
    spectral_rolloff: 3200.0,
    phase_consistency: 0.74,
    neural_vocoder_artifact_score: 0.18,
  };

  const items = [
    { name: 'Varianza de Formantes (MFCCs)', value: '13 Coeficientes', pct: 68, color: 'bg-emerald-500' },
    { name: 'Coherencia de Fase STFT', value: `${(f.phase_consistency * 100).toFixed(0)}%`, pct: Math.round(f.phase_consistency * 100), color: 'bg-teal-500' },
    { name: 'Tasa de Cruce por Cero (ZCR)', value: f.zcr.toFixed(3), pct: Math.min(100, Math.round(f.zcr * 400)), color: 'bg-cyan-500' },
    { name: 'Centroide Espectral', value: `${Math.round(f.spectral_centroid)} Hz`, pct: Math.min(100, Math.round((f.spectral_centroid / 4000) * 100)), color: 'bg-blue-500' },
    { name: 'Riesgo Artefacto Vocoder (12-16k)', value: `${(f.neural_vocoder_artifact_score * 100).toFixed(0)}%`, pct: Math.round(f.neural_vocoder_artifact_score * 100), color: f.neural_vocoder_artifact_score > 0.4 ? 'bg-rose-500' : 'bg-emerald-400' },
  ];

  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-extrabold text-inherit">Análisis Biométrico Acústico</h4>
          <p className="text-[11px] text-slate-400">Extracción de características DSP</p>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-500/10 text-slate-400">
          16 kHz STFT
        </span>
      </div>

      {/* Multi-segmented visual bar */}
      <div className="w-full h-3 rounded-full flex overflow-hidden gap-1 mb-4 bg-slate-700/20">
        <div className="h-full bg-emerald-500 w-[25%]" title="MFCC" />
        <div className="h-full bg-teal-500 w-[20%]" title="Fase" />
        <div className="h-full bg-cyan-500 w-[20%]" title="ZCR" />
        <div className="h-full bg-blue-500 w-[20%]" title="Centroide" />
        <div className="h-full bg-rose-500 w-[15%]" title="Vocoder" />
      </div>

      {/* Items list */}
      <div className="space-y-2.5">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
              <span className="text-slate-400 font-medium">{item.name}</span>
            </div>
            <span className="font-mono font-bold text-inherit">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AuthenticityGauge: React.FC<{ authenticityScore: number; isDark: boolean }> = ({ authenticityScore, isDark }) => {
  // Score 0 to 100
  const score = Math.max(0, Math.min(100, authenticityScore));
  const isHealthy = score >= 75;
  const isWarning = score >= 50 && score < 75;

  return (
    <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-sm font-extrabold text-inherit">Índice de Integridad de Voz</h4>
          <p className="text-[11px] text-slate-400">Estado biométrico actual</p>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
          En directo
        </span>
      </div>

      {/* Curved Gauge Mockup matching Financial Health 75% in UX mockup */}
      <div className="relative flex flex-col items-center justify-center my-4">
        <svg className="w-44 h-24 overflow-visible" viewBox="0 0 100 50">
          {/* Background Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={isDark ? '#334155' : '#E2E8F0'}
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Active Colored Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={isHealthy ? '#10B981' : isWarning ? '#F59E0B' : '#EF4444'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="125.6"
            strokeDashoffset={125.6 - (125.6 * (score / 100))}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        <div className="absolute bottom-0 flex flex-col items-center">
          <span className={`text-3xl font-black font-mono leading-none ${
            isHealthy ? 'text-emerald-500' : isWarning ? 'text-amber-500' : 'text-rose-500'
          }`}>
            {score}%
          </span>
          <span className="text-[10px] text-slate-400 font-semibold mt-1">
            {isHealthy ? 'Voz Humana Genuina' : isWarning ? 'Voz con Sospechas' : 'Sintética Confirmada'}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 text-center leading-relaxed">
        Basado en el análisis de 768 características convolucionales y atencionales de WavLM.
      </p>
    </div>
  );
};

export const ThreatTrackerCard: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const threats = [
    { title: 'Vocoder Neural (HiFi-GAN)', current: 4, target: 10, pct: 40, color: 'bg-emerald-500' },
    { title: 'Clonación de Voz (VITS/TTS)', current: 8, target: 15, pct: 53, color: 'bg-amber-500' },
    { title: 'Ataques de Repetición (Replay)', current: 2, target: 5, pct: 40, color: 'bg-cyan-500' },
    { title: 'Voz Orgánica Verificada', current: 130, target: 130, pct: 100, color: 'bg-teal-500' },
  ];

  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-extrabold text-inherit">Monitoreo de Vectores</h4>
          <p className="text-[11px] text-slate-400">Clasificación por tipo de amenaza</p>
        </div>
        <span className="text-xs text-slate-400 font-semibold cursor-pointer hover:text-emerald-500">
          + Ver detalles
        </span>
      </div>

      <div className="space-y-3 mt-3">
        {threats.map((t, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-400">{t.title}</span>
              <span className="font-mono text-inherit">{t.current} / {t.target}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700/20 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${t.color}`} 
                style={{ width: `${t.pct}%` }} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
