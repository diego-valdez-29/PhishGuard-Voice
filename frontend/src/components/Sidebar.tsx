import React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Mic, 
  FileAudio, 
  FileText, 
  Cpu, 
  ChevronLeft, 
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  Zap
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'dashboard' | 'live' | 'upload' | 'audit' | 'architecture';
  setActiveTab: (tab: 'dashboard' | 'live' | 'upload' | 'audit' | 'architecture') => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isDark: boolean;
  toggleTheme: () => void;
  isThreatDetected?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  isDark,
  toggleTheme,
  isThreatDetected = false,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity, badge: undefined },
    { id: 'live', label: 'Monitoreo en Vivo', icon: Mic, badge: isThreatDetected ? 'ALERTA' : '16 kHz' },
    { id: 'upload', label: 'Análisis de Archivo', icon: FileAudio, badge: 'Max 20MB' },
    { id: 'audit', label: 'Registro Forense', icon: FileText, badge: 'SHA-256' },
    { id: 'architecture', label: 'Arquitectura IA', icon: Cpu, badge: 'WavLM' },
  ] as const;

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen transition-all duration-300 z-30 flex flex-col justify-between border-r ${
        isDark 
          ? 'bg-[#0F172A] border-slate-800 text-slate-200' 
          : 'bg-white border-slate-200 text-slate-700 shadow-sm'
      } ${collapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Top Header Logo */}
      <div>
        <div className="flex items-center justify-between px-5 h-20 border-b border-inherit">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isThreatDetected 
                ? 'bg-rose-500/20 text-rose-500 animate-pulse' 
                : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight leading-tight flex items-center gap-1.5">
                  PhishGuard <span className="text-emerald-500 text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10">v1.1</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Voice AI Defense SOC</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? isDark
                      ? 'bg-slate-800/90 text-white shadow-inner border border-slate-700'
                      : 'bg-slate-100 text-slate-900 font-bold shadow-sm'
                    : isDark
                      ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? (item.id === 'live' && isThreatDetected ? 'text-rose-500' : 'text-emerald-500') : 'text-slate-400'
                }`} />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1 overflow-hidden">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        item.badge === 'ALERTA'
                          ? 'bg-rose-500 text-white animate-pulse'
                          : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Engine status card and Collapser */}
      <div className="p-3 space-y-3">
        {!collapsed && (
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark 
              ? 'bg-slate-850/80 bg-slate-900 border-slate-800 text-slate-300' 
              : 'bg-emerald-50/70 border-emerald-100 text-slate-700'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Motor Activo
              </span>
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs font-semibold text-inherit mb-1">WavLM-base + MLP</p>
            <p className="text-[11px] text-slate-400 mb-3">Latencia &lt; 1.2s en CPU. Hash SHA-256 inmutable.</p>
            <button
              onClick={() => setActiveTab('architecture')}
              className="w-full py-1.5 px-2.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              Ver Pipeline IA
            </button>
          </div>
        )}

        {/* Theme and Collapse Controls */}
        <div className="flex items-center justify-between px-2 pt-2 border-t border-inherit">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-slate-100 text-slate-600'
            }`}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro SOC'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-2 rounded-xl text-slate-400 transition-colors ${
              isDark ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
            title={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
