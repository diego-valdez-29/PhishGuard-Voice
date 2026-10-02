import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AlertBanner } from './components/AlertBanner';
import { SpectrogramVisualizer } from './components/SpectrogramVisualizer';
import { ForensicShieldCard } from './components/ForensicShieldCard';
import { 
  MetricsRow, 
  RiskThresholdCard, 
  ForensicInsightsCard, 
  AcousticFeatureCard, 
  AuthenticityGauge, 
  ThreatTrackerCard 
} from './components/MetricsCards';
import { AuditLogsTable } from './components/AuditLogsTable';
import { LiveMonitoringPanel } from './components/LiveMonitoringPanel';
import { SampleUploadPanel } from './components/SampleUploadPanel';
import { ArchitectureView } from './components/ArchitectureView';

import { useAudioStream } from './hooks/useAudioStream';
import { useWebSocketStream } from './hooks/useWebSocketStream';
import { fetchAuditLogs, fetchSystemStats, simulateAudioSample } from './services/api';
import { PredictionPayload, AuditLogItem, SystemStats } from './types';

export function App() {
  // Theme & Navigation State
  const [isDark, setIsDark] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'live' | 'upload' | 'audit' | 'architecture'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [threshold, setThreshold] = useState(0.75);

  // Data & Telemetry State
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [threatCount, setThreatCount] = useState(0);

  // Synchronize dark mode class to HTML element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // WebSocket Prediction Stream
  const handleIncomingPrediction = useCallback((pred: PredictionPayload) => {
    if (pred.is_synthetic) {
      setThreatCount((prev) => prev + 1);
    }
    // Prepend to audit log feed
    const newEntry: AuditLogItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: pred.timestamp,
      forensic_hash: pred.forensic_hash,
      source: pred.source || 'live_stream',
      sample_name: (pred.source === 'live_stream' || !pred.source) ? 'Flujo de Micrófono' : 'Simulación',
      verdict: pred.verdict,
      is_synthetic: pred.is_synthetic,
      confidence: pred.confidence,
      latency_ms: pred.latency_ms,
      duration_sec: 1.5,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  }, []);

  const {
    isConnected,
    isBuffering,
    lastPrediction,
    networkLatency,
    sendAudioChunk,
  } = useWebSocketStream({
    onPrediction: handleIncomingPrediction,
  });

  // Microphone Audio Capture Hook
  const {
    isRecording,
    volumeLevel,
    error: audioError,
    startStream,
    stopStream,
    analyserNode,
  } = useAudioStream({
    onChunkReady: sendAudioChunk,
    targetSampleRate: 16000,
    chunkDurationSec: 1.5,
  });

  const toggleRecording = () => {
    if (isRecording) {
      stopStream();
    } else {
      startStream();
    }
  };

  // Poll system stats and logs periodically
  const refreshData = useCallback(async () => {
    try {
      const [statsData, logsData] = await Promise.all([
        fetchSystemStats(),
        fetchAuditLogs(50),
      ]);
      setStats(statsData);
      setAuditLogs(logsData.logs);
      setThreatCount(statsData.synthetic_count);
    } catch {
      // Backend may be booting up
    }
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Simulation handler for quick demo verification
  const handleSimulate = async (type: 'synthetic' | 'organic') => {
    try {
      const resp = await simulateAudioSample(type);
      handleIncomingPrediction(resp.result);
    } catch (err) {
      console.error('Simulation error:', err);
    }
  };

  const isThreatActive = lastPrediction?.is_synthetic && isRecording;
  const authenticityScore = lastPrediction
    ? lastPrediction.is_synthetic
      ? Math.round((1 - lastPrediction.confidence) * 100)
      : Math.round(lastPrediction.confidence * 100)
    : 92;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-[#0B1120] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'
    }`}>
      {/* Left Sidebar matching UX layout */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isDark={isDark}
        toggleTheme={() => setIsDark(!isDark)}
        isThreatDetected={isThreatActive}
      />

      {/* Main Content Area */}
      <div className="flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          isDark={isDark}
          collapsed={collapsed}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isConnected={isConnected}
          networkLatency={networkLatency}
          threatAlertsCount={threatCount}
          onQuickAction={toggleRecording}
          isRecording={isRecording}
        />

        {/* Dynamic View Body */}
        <main className={`flex-1 p-6 transition-all duration-300 ${
          collapsed ? 'ml-20' : 'ml-64'
        }`}>
          <div className="max-w-[1600px] mx-auto space-y-6">

            {/* TAB: DASHBOARD (Mirroring the layout of diseño ux.png) */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                
                {/* Real-time Threat Alert Banner */}
                <AlertBanner
                  prediction={lastPrediction}
                  isRecording={isRecording}
                  isDark={isDark}
                />

                {/* Main 2-Column Grid (Center Hero + Right Column) */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  
                  {/* LEFT & CENTER HERO (Takes 2 columns on XL screens) */}
                  <div className="xl:col-span-2 space-y-6">
                    
                    {/* Big Hero Card: Audio Spectrum & Voice Classifier Timeline */}
                    <div className={`p-6 rounded-3xl border transition-all ${
                      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-extrabold text-inherit">
                              Monitor Espectrográfico en Tiempo Real
                            </h3>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                              16 kHz Mono
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Visualización de armónicos, densidad de formantes y firmas vocoder.
                          </p>
                        </div>

                        {/* Visualizer controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSimulate('synthetic')}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
                            title="Simular ataque deepfake"
                          >
                            Simular Deepfake
                          </button>
                          <button
                            onClick={() => handleSimulate('organic')}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                            title="Simular voz humana"
                          >
                            Simular Humana
                          </button>
                        </div>
                      </div>

                      {/* Spectrum visualizer canvas */}
                      <SpectrogramVisualizer
                        analyserNode={analyserNode}
                        isRecording={isRecording}
                        isSynthetic={lastPrediction?.is_synthetic ?? false}
                        isDark={isDark}
                        height={190}
                      />
                    </div>

                    {/* Middle Row: Risk Threshold & AI Insights (matching UX middle row) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <RiskThresholdCard
                        threshold={threshold}
                        setThreshold={setThreshold}
                        confidence={lastPrediction?.confidence ?? 0.75}
                        isDark={isDark}
                      />
                      <ForensicInsightsCard isDark={isDark} />
                    </div>

                    {/* Bottom Row of Hero: 3 Cards (Acoustic Breakdown, Authenticity Gauge, Threat Matrix) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <AcousticFeatureCard
                        features={lastPrediction?.features}
                        isDark={isDark}
                      />
                      <AuthenticityGauge
                        authenticityScore={authenticityScore}
                        isDark={isDark}
                      />
                      <ThreatTrackerCard isDark={isDark} />
                    </div>

                  </div>

                  {/* RIGHT COLUMN: Cyber Shield Card + Live Forensic Transaction History */}
                  <div className="space-y-6">
                    {/* Cyber Credential Card (styled like VISA card in UX design) */}
                    <ForensicShieldCard
                      prediction={lastPrediction}
                      isRecording={isRecording}
                      onToggleRecording={toggleRecording}
                      onSimulateAttack={() => handleSimulate('synthetic')}
                      onResetBuffer={() => handleIncomingPrediction({
                        is_synthetic: false,
                        confidence: 0.95,
                        forensic_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                        latency_ms: 12.0,
                        timestamp: new Date().toISOString(),
                        verdict: 'VOZ ORGÁNICA DETECTADA',
                        threat_level: 'SAFE',
                      })}
                      isDark={isDark}
                    />

                    {/* Compact Transaction History Feed matching diseño ux.png */}
                    <AuditLogsTable
                      logs={auditLogs}
                      isDark={isDark}
                      isCompact={true}
                    />
                  </div>

                </div>

                {/* Telemetry Metrics Row at bottom */}
                <MetricsRow
                  stats={stats}
                  prediction={lastPrediction}
                  isDark={isDark}
                />

              </div>
            )}

            {/* TAB: LIVE MONITORING (CU1 Dedicated View) */}
            {activeTab === 'live' && (
              <LiveMonitoringPanel
                isRecording={isRecording}
                volumeLevel={volumeLevel}
                analyserNode={analyserNode}
                prediction={lastPrediction}
                isDark={isDark}
                onToggleRecording={toggleRecording}
                onSimulateSample={handleSimulate}
                error={audioError}
              />
            )}

            {/* TAB: FILE ANALYSIS (CU2 / CU7 Forensic Upload Lab) */}
            {activeTab === 'upload' && (
              <SampleUploadPanel
                isDark={isDark}
                onAnalysisComplete={(res) => {
                  refreshData();
                }}
              />
            )}

            {/* TAB: AUDIT LOGS (Full Ledger View with SHA-256 Search & Export) */}
            {activeTab === 'audit' && (
              <AuditLogsTable
                logs={auditLogs}
                isDark={isDark}
                isCompact={false}
              />
            )}

            {/* TAB: AI ARCHITECTURE (WavLM Backbone & MLP Classifier Spec) */}
            {activeTab === 'architecture' && (
              <ArchitectureView isDark={isDark} />
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
