import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Mic, 
  MicOff, 
  Camera, 
  Copy, 
  RefreshCw, 
  Radio, 
  Cpu,
  Check,
  Zap
} from 'lucide-react';
import { PredictionPayload } from '../types';
import { copyToClipboard, truncateHash } from '../utils/audioHelpers';

interface ForensicShieldCardProps {
  prediction: PredictionPayload | null;
  isRecording: boolean;
  onToggleRecording: () => void;
  onSimulateAttack: () => void;
  onResetBuffer: () => void;
  isDark: boolean;
}

export const ForensicShieldCard: React.FC<ForensicShieldCardProps> = ({
  prediction,
  isRecording,
  onToggleRecording,
  onSimulateAttack,
  onResetBuffer,
  isDark,
}) => {
  const [copied, setCopied] = useState(false);
  const isSynthetic = prediction?.is_synthetic ?? false;
  const hash = prediction?.forensic_hash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const displayHash = `${hash.slice(0, 4)} •••• •••• ${hash.slice(-4)}`;

  const handleCopyHash = () => {
    copyToClipboard(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`p-5 rounded-3xl border transition-all ${
      isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Title Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-inherit">Credencial Forense de Voz</h3>
          <p className="text-[11px] text-slate-400">Canal Criptográfico Activo</p>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
          isRecording 
            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' 
            : 'bg-slate-500/10 text-slate-400'
        }`}>
          {isRecording ? 'STREAM EN VIVO' : 'EN ESPERA'}
        </span>
      </div>

      {/* Cyber Security Credential Card (Stylized like the Visa card in the UX design) */}
      <div className={`relative overflow-hidden w-full h-44 rounded-2xl p-5 text-white shadow-xl transition-all duration-300 flex flex-col justify-between ${
        isSynthetic
          ? 'bg-gradient-to-br from-rose-600 via-red-600 to-rose-800 shadow-rose-600/30 ring-2 ring-rose-400 animate-pulse'
          : 'bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 shadow-emerald-500/25'
      }`}>
        {/* Holographic lines & watermark */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute right-4 top-4 opacity-30">
          <ShieldCheck className="w-16 h-16 stroke-[1]" />
        </div>

        {/* Card Header */}
        <div className="flex items-center justify-between relative z-10">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase opacity-80 block">
              {isSynthetic ? 'SECURITY INTERCEPT' : 'VOICE INTEGRITY PASS'}
            </span>
            <span className="text-xs font-bold tracking-tight">PhishGuard v1.1 SOC</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/20 backdrop-blur-sm text-[10px] font-mono font-bold">
            <Cpu className="w-3 h-3 text-emerald-300" />
            WavLM 16kHz
          </div>
        </div>

        {/* Chip & Hash Number */}
        <div className="relative z-10 my-auto">
          {/* Cyber Microchip graphic */}
          <div className="w-9 h-7 rounded bg-amber-300/80 border border-amber-200/90 shadow-inner flex items-center justify-center mb-2.5">
            <div className="w-6 h-4 border-t border-b border-amber-600/40 grid grid-cols-2 gap-1" />
          </div>
          <p className="font-mono text-base tracking-widest font-semibold drop-shadow-sm">
            {displayHash}
          </p>
        </div>

        {/* Card Footer: Analyst & Session */}
        <div className="flex items-end justify-between relative z-10 text-[11px]">
          <div>
            <span className="text-[9px] uppercase tracking-wider opacity-75 block">Operador SOC</span>
            <span className="font-bold tracking-wide">DIEGO VALDEZ</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] uppercase tracking-wider opacity-75 block">Estado</span>
            <span className="font-mono font-bold text-xs">
              {isSynthetic ? 'ALERT • 0.92' : 'VERIFIED • 16k'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons (matching Top up, Send, Request, History, More in the UX design) */}
      <div className="grid grid-cols-5 gap-2 mt-4 pt-2 border-t border-inherit">
        
        {/* 1. Toggle Audio Recording */}
        <button
          onClick={onToggleRecording}
          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all group ${
            isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
          }`}
          title={isRecording ? 'Detener Micrófono' : 'Activar Micrófono'}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
            isRecording 
              ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/30' 
              : isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-500" />}
          </div>
          <span className="text-[10px] font-semibold text-slate-400 group-hover:text-inherit">
            {isRecording ? 'Parar' : 'Mic'}
          </span>
        </button>

        {/* 2. Copy SHA-256 */}
        <button
          onClick={handleCopyHash}
          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all group ${
            isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
          }`}
          title="Copiar Hash SHA-256"
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
            copied ? 'bg-emerald-500 text-white border-emerald-500' : isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </div>
          <span className="text-[10px] font-semibold text-slate-400 group-hover:text-inherit">
            {copied ? 'Listo' : 'Hash'}
          </span>
        </button>

        {/* 3. Simulate Attack */}
        <button
          onClick={onSimulateAttack}
          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all group ${
            isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
          }`}
          title="Simular Ataque Sintético"
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all text-amber-500 ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}>
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 group-hover:text-inherit">
            Simular
          </span>
        </button>

        {/* 4. Reset Ring Buffer */}
        <button
          onClick={onResetBuffer}
          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all group ${
            isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
          }`}
          title="Reiniciar Buffer de 3.0s"
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all text-slate-400 ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}>
            <RefreshCw className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 group-hover:text-inherit">
            Reset
          </span>
        </button>

        {/* 5. Snapshot */}
        <button
          onClick={() => alert(`Captura forense registrada con Hash SHA-256: ${hash}`)}
          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all group ${
            isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
          }`}
          title="Capturar Snapshot Forense"
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all text-slate-400 ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}>
            <Camera className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 group-hover:text-inherit">
            Captura
          </span>
        </button>

      </div>
    </div>
  );
};
