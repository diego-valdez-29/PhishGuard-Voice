import React from 'react';
import { Search, Bell, Radio, Plus, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  collapsed: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isConnected: boolean;
  networkLatency: number | null;
  threatAlertsCount: number;
  onQuickAction: () => void;
  isRecording: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isDark,
  collapsed,
  searchQuery,
  setSearchQuery,
  isConnected,
  networkLatency,
  threatAlertsCount,
  onQuickAction,
  isRecording,
}) => {
  return (
    <header className={`sticky top-0 z-20 h-20 transition-all duration-300 border-b flex items-center justify-between px-6 ${
      isDark ? 'bg-[#0F172A]/90 border-slate-800 backdrop-blur-md' : 'bg-white/90 border-slate-200 backdrop-blur-md'
    } ${collapsed ? 'ml-20' : 'ml-64'}`}>
      
      {/* Search Input matching UX mockup */}
      <div className="flex items-center gap-3 w-96">
        <div className={`relative flex items-center w-full rounded-xl border px-3.5 py-2.5 transition-all ${
          isDark 
            ? 'bg-slate-900 border-slate-700 text-slate-200 focus-within:border-emerald-500' 
            : 'bg-slate-50 border-slate-200 text-slate-700 focus-within:border-emerald-500 shadow-sm'
        }`}>
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
          <input
            type="text"
            placeholder="Buscar por Hash SHA-256 o Muestra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      {/* Right Controls: Telemetry, Notification, Profile, CTA */}
      <div className="flex items-center gap-4">
        {/* Network & WS indicator */}
        <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
          isConnected
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
        }`}>
          <Radio className={`w-3.5 h-3.5 ${isConnected ? 'animate-pulse' : ''}`} />
          <span>{isConnected ? 'Stream Conectado' : 'Conectando...'}</span>
          {networkLatency && (
            <span className="font-mono text-[11px] opacity-80 border-l border-emerald-500/30 pl-2">
              {networkLatency} ms
            </span>
          )}
        </div>

        {/* Notifications Bell with Threat Badge */}
        <div className="relative">
          <button 
            className={`p-2.5 rounded-xl border transition-colors relative ${
              isDark ? 'bg-slate-900 border-slate-700 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
            title="Alertas de Seguridad"
          >
            <Bell className="w-4 h-4 text-slate-400" />
            {threatAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
                {threatAlertsCount}
              </span>
            )}
          </button>
        </div>

        {/* User profile card matching UX mockup */}
        <div className={`flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-xl border ${
          isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-xs text-slate-950 shadow-sm">
            DV
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-inherit leading-none">Diego Valdez</span>
            <span className="text-[10px] text-slate-400 font-medium">SecOps Analyst L2</span>
          </div>
        </div>

        {/* Primary CTA button matching 'Add widget' / '+ Iniciar Monitoreo' */}
        <button
          onClick={onQuickAction}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
            isRecording
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20 animate-pulse'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
          }`}
        >
          {isRecording ? (
            <>
              <ShieldAlert className="w-4 h-4" />
              <span>Detener Monitoreo</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Iniciar Monitoreo</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
