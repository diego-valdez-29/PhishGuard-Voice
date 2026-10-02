import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileAudio, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Pause, 
  Copy, 
  Check, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  Clock, 
  Hash, 
  Loader2 
} from 'lucide-react';
import { uploadAndAnalyzeAudioFile } from '../services/api';
import { FileAnalysisResponse } from '../types';
import { truncateHash, copyToClipboard } from '../utils/audioHelpers';

interface SampleUploadPanelProps {
  isDark: boolean;
  onAnalysisComplete?: (res: FileAnalysisResponse) => void;
}

export const SampleUploadPanel: React.FC<SampleUploadPanelProps> = ({ isDark, onAnalysisComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FileAnalysisResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const handleFileChange = (file: File) => {
    if (!file) return;

    // Check size < 20MB
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('El archivo excede el tamaño máximo permitido de 20 MB.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setAnalysisResult(null);

    // Create object URL for local player
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteAnalysis = async () => {
    if (!selectedFile) return;

    try {
      setIsAnalyzing(true);
      setErrorMessage(null);
      const result = await uploadAndAnalyzeAudioFile(selectedFile);
      setAnalysisResult(result);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el archivo.';
      setErrorMessage(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyHash = (hash: string) => {
    copyToClipboard(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Upload Drop Zone Card */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-inherit flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-500" />
              Laboratorio Forense de Archivos (CU2 / CU7)
            </h3>
            <p className="text-xs text-slate-400">
              Cargue muestras de audio (.wav, .mp3, .ogg) para análisis en ventanas deslizantes de 3.0 segundos.
            </p>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold">
            Máx 20 MB • 16 kHz
          </span>
        </div>

        {/* Drag and Drop Container */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDark 
              ? 'border-slate-700 hover:border-emerald-500/80 bg-slate-950/40 hover:bg-slate-900/60' 
              : 'border-slate-300 hover:border-emerald-500/80 bg-slate-50 hover:bg-emerald-50/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".wav,.mp3,.ogg,.flac,.webm"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
          />
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
            <FileAudio className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-inherit mb-1">
            {selectedFile ? selectedFile.name : 'Arrastre su archivo de audio o haga clic para examinar'}
          </p>
          <p className="text-xs text-slate-400">
            {selectedFile 
              ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Listo para evaluación` 
              : 'Soporta archivos WAV, MP3, OGG de llamadas interceptadas, grabaciones o notas de voz'}
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Selected file actions & Audio Player */}
        {selectedFile && (
          <div className="mt-5 pt-5 border-t border-inherit flex flex-col md:flex-row md:items-center justify-between gap-4">
            {audioUrl && (
              <div className="flex-1">
                <audio ref={audioPlayerRef} controls src={audioUrl} className="w-full h-10 rounded-xl" />
              </div>
            )}
            <button
              onClick={handleExecuteAnalysis}
              disabled={isAnalyzing}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white transition-all shadow-md shadow-emerald-500/20 shrink-0"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando Ventanas Deslizantes...</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  <span>Ejecutar Análisis Forense</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Analysis Results View */}
      {analysisResult && (
        <div className={`p-6 rounded-3xl border transition-all space-y-6 ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          {/* Top Verdict Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                analysisResult.overall_synthetic 
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
                  : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
              }`}>
                {analysisResult.overall_synthetic ? (
                  <ShieldAlert className="w-8 h-8" />
                ) : (
                  <ShieldCheck className="w-8 h-8" />
                )}
              </div>
              <div>
                <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${
                  analysisResult.overall_synthetic 
                    ? 'bg-rose-500/20 text-rose-500 font-extrabold' 
                    : 'bg-emerald-500/20 text-emerald-500 font-bold'
                }`}>
                  {analysisResult.overall_synthetic ? 'ALERTA FORENSE CRÍTICA' : 'MUESTRA ORGÁNICA AUTÉNTICA'}
                </span>
                <h3 className={`text-xl font-extrabold mt-1 ${
                  analysisResult.overall_synthetic ? 'text-rose-500' : 'text-emerald-500'
                }`}>
                  {analysisResult.verdict}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block font-medium">Probabilidad Agregada</span>
                <span className={`text-2xl font-black font-mono ${
                  analysisResult.overall_synthetic ? 'text-rose-500' : 'text-emerald-500'
                }`}>
                  {(analysisResult.overall_confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className={`p-2.5 rounded-xl border text-center ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] text-slate-400 block font-medium">Tiempo de Análisis</span>
                <span className="text-xs font-mono font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {analysisResult.latency_ms} ms
                </span>
              </div>
            </div>
          </div>

          {/* Forensic Hash */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
            isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-2 overflow-hidden">
              <Hash className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-slate-400 font-sans font-semibold">Hash Global SHA-256:</span>
              <span className="truncate">{analysisResult.forensic_hash}</span>
            </div>
            <button
              onClick={() => copyHash(analysisResult.forensic_hash)}
              className="px-2.5 py-1 rounded-md text-[11px] font-sans font-bold bg-slate-800 hover:bg-slate-700 text-white shrink-0 ml-2"
            >
              {copiedHash ? 'Copiado ✓' : 'Copiar'}
            </button>
          </div>

          {/* Sliding Windows Breakdown Timeline */}
          <div>
            <h4 className="text-sm font-extrabold text-inherit mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              Desglose de Ventanas Temporales Deslizantes ({analysisResult.windows_analyzed} ventanas de 3.0s)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {analysisResult.sliding_window_results.map((win) => {
                const isSynth = win.is_synthetic;
                return (
                  <div
                    key={win.window_index}
                    className={`p-3 rounded-xl border transition-all ${
                      isSynth 
                        ? 'bg-rose-500/10 border-rose-500/30' 
                        : isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-inherit">Ventana #{win.window_index}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {win.start_time_sec}s - {win.end_time_sec}s
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isSynth ? 'bg-rose-500 text-white' : 'bg-emerald-500/20 text-emerald-500'
                      }`}>
                        {isSynth ? 'Sintético' : 'Orgánico'}
                      </span>
                      <span className={`font-mono text-xs font-bold ${
                        isSynth ? 'text-rose-500' : 'text-emerald-500'
                      }`}>
                        {(win.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="mt-2 text-[10px] font-mono text-slate-400 truncate" title={win.forensic_hash}>
                      SHA: {truncateHash(win.forensic_hash, 4, 4)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
