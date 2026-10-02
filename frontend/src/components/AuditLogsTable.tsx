import React, { useState } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  Copy, 
  Check, 
  Download, 
  Filter, 
  ExternalLink,
  Search
} from 'lucide-react';
import { AuditLogItem } from '../types';
import { truncateHash, copyToClipboard } from '../utils/audioHelpers';

interface AuditLogsTableProps {
  logs: AuditLogItem[];
  isDark: boolean;
  isCompact?: boolean;
}

export const AuditLogsTable: React.FC<AuditLogsTableProps> = ({ logs, isDark, isCompact = false }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'organic' | 'synthetic'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleCopy = (id: string, text: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'organic' && log.is_synthetic) return false;
    if (filterType === 'synthetic' && !log.is_synthetic) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchHash = log.forensic_hash.toLowerCase().includes(term);
      const matchSource = (log.sample_name || log.source).toLowerCase().includes(term);
      return matchHash || matchSource;
    }
    return true;
  });

  const exportAsJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `phishguard_audit_trail_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (isCompact) {
    // Transaction history compact list on the right column of the dashboard (matching diseño ux.png)
    return (
      <div className={`p-5 rounded-3xl border transition-all ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-inherit">Historial Forense</h3>
            <p className="text-[11px] text-slate-400">Últimos bloques de audio analizados</p>
          </div>
          <button
            onClick={exportAsJSON}
            className="p-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-800/40 transition-colors"
            title="Exportar Registro JSON"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 mb-3 bg-slate-800/20 p-1 rounded-xl">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
              filterType === 'all' 
                ? (isDark ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-900') 
                : 'text-slate-400'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType('synthetic')}
            className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
              filterType === 'synthetic' 
                ? 'bg-rose-500 text-white shadow-sm' 
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            Amenazas
          </button>
          <button
            onClick={() => setFilterType('organic')}
            className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
              filterType === 'organic' 
                ? 'bg-emerald-500 text-white shadow-sm' 
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            Orgánicos
          </button>
        </div>

        {/* List items matching the transaction history style */}
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">
              No hay registros en esta categoría.
            </div>
          ) : (
            filteredLogs.slice(0, 10).map((log) => {
              const isSynthetic = log.is_synthetic;
              const formattedTime = log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '00:00';

              return (
                <div
                  key={log.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 group ${
                    isDark 
                      ? 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700' 
                      : 'bg-slate-50/80 border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  {/* Left Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSynthetic ? 'bg-rose-500/15 text-rose-500' : 'bg-emerald-500/15 text-emerald-500'
                  }`}>
                    {isSynthetic ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  </div>

                  {/* Middle Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-inherit truncate">
                        {log.sample_name || log.source}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>{formattedTime}</span>
                      <span>•</span>
                      <button
                        onClick={() => handleCopy(log.id, log.forensic_hash)}
                        className="hover:text-emerald-500 flex items-center gap-1 transition-colors"
                        title="Copiar Hash"
                      >
                        <span>{truncateHash(log.forensic_hash, 4, 4)}</span>
                        {copiedId === log.id ? (
                          <Check className="w-2.5 h-2.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 opacity-60" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Right Status & Confidence */}
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-black font-mono block ${
                      isSynthetic ? 'text-rose-500' : 'text-emerald-500'
                    }`}>
                      {isSynthetic ? '+' : ''}{(log.confidence * 100).toFixed(0)}%
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider block ${
                      isSynthetic ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {isSynthetic ? 'Sintético' : 'Orgánico'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Full-width Audit Log View (for the dedicated Forensic Tab)
  return (
    <div className={`p-6 rounded-3xl border transition-all ${
      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-extrabold text-inherit flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            Libro de Auditoría Criptográfica Forense
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cada inferencia genera un Hash SHA-256 inmutable de la señal PCM para garantizar no-repudio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filtrar por hash o fuente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-9 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:border-emerald-500 font-medium ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>

          <button
            onClick={exportAsJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar JSON
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-2xl border border-inherit">
        <table className="w-full text-left text-xs">
          <thead className={`border-b font-mono uppercase text-[10px] text-slate-400 ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <tr>
              <th className="py-3 px-4">Estado / Veredicto</th>
              <th className="py-3 px-4">Muestra / Origen</th>
              <th className="py-3 px-4">Hash Criptográfico SHA-256</th>
              <th className="py-3 px-4">Confianza</th>
              <th className="py-3 px-4">Latencia</th>
              <th className="py-3 px-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-inherit font-medium">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                  No se encontraron registros coincidentes.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const isSynthetic = log.is_synthetic;
                return (
                  <tr 
                    key={log.id} 
                    className={`transition-colors ${
                      isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isSynthetic 
                          ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30' 
                          : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                      }`}>
                        {isSynthetic ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                        {isSynthetic ? 'Sintético' : 'Orgánico'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-inherit">
                      {log.sample_name || log.source}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[220px]" title={log.forensic_hash}>
                          {log.forensic_hash}
                        </span>
                        <button
                          onClick={() => handleCopy(log.id, log.forensic_hash)}
                          className="p-1 rounded hover:bg-slate-700/30 text-slate-400 hover:text-emerald-500 transition-colors"
                          title="Copiar Hash SHA-256 Completo"
                        >
                          {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={isSynthetic ? 'text-rose-500' : 'text-emerald-500'}>
                        {(log.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {log.latency_ms} ms
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
