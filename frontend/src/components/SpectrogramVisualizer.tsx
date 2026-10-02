import React, { useEffect, useRef } from 'react';

interface SpectrogramVisualizerProps {
  analyserNode: AnalyserNode | null;
  isRecording: boolean;
  isSynthetic: boolean;
  isDark: boolean;
  height?: number;
}

export const SpectrogramVisualizer: React.FC<SpectrogramVisualizerProps> = ({
  analyserNode,
  isRecording,
  isSynthetic,
  isDark,
  height = 180,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bufferLength = 128;
    let dataArray = new Uint8Array(bufferLength);

    if (analyserNode) {
      bufferLength = analyserNode.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    }

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, width, h);

      // Draw subtle background grid
      ctx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.25)' : 'rgba(226, 232, 240, 0.8)';
      ctx.lineWidth = 1;
      const gridStep = 30;
      for (let x = 0; x < width; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (isRecording && analyserNode) {
        analyserNode.getByteFrequencyData(dataArray);

        // Draw dynamic spectral bars
        const barWidth = (width / (bufferLength * 0.45));
        let x = 0;

        for (let i = 0; i < bufferLength * 0.45; i++) {
          const barHeight = (dataArray[i] / 255) * h * 0.85;

          // Gradient color: Emerald for Organic, Red for Synthetic
          const gradient = ctx.createLinearGradient(0, h, 0, h - barHeight);
          if (isSynthetic) {
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
            gradient.addColorStop(0.6, '#EF4444');
            gradient.addColorStop(1, '#F87171');
          } else {
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
            gradient.addColorStop(0.6, '#10B981');
            gradient.addColorStop(1, '#34D399');
          }

          ctx.fillStyle = gradient;
          // Rounded top bar
          ctx.beginPath();
          ctx.roundRect(x, h - barHeight, Math.max(2, barWidth - 2), barHeight, [4, 4, 0, 0]);
          ctx.fill();

          x += barWidth;
        }

        // Draw smooth overlay waveform curve
        const timeData = new Uint8Array(bufferLength);
        analyserNode.getByteTimeDomainData(timeData);

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isSynthetic ? '#FCA5A5' : '#6EE7B7';
        ctx.beginPath();
        const sliceWidth = width / bufferLength;
        let waveX = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * h) / 2;

          if (i === 0) {
            ctx.moveTo(waveX, y);
          } else {
            ctx.lineTo(waveX, y);
          }
          waveX += sliceWidth;
        }
        ctx.stroke();

      } else {
        // Ambient idle standby wave animation
        phase += 0.04;
        ctx.lineWidth = 2;
        ctx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.8)' : 'rgba(203, 213, 225, 0.9)';
        ctx.beginPath();

        for (let i = 0; i < width; i++) {
          const y = h / 2 + Math.sin(i * 0.02 + phase) * (isRecording ? 15 : 6);
          if (i === 0) {
            ctx.moveTo(i, y);
          } else {
            ctx.lineTo(i, y);
          }
        }
        ctx.stroke();

        // Standby text
        ctx.fillStyle = isDark ? '#64748B' : '#94A3B8';
        ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          isRecording ? 'Capturando flujo de audio a 16 kHz...' : 'Haga clic en "Iniciar Monitoreo" para capturar espectro en tiempo real',
          width / 2,
          h / 2 - 20
        );
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [analyserNode, isRecording, isSynthetic, isDark]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-inherit">
      <canvas
        ref={canvasRef}
        width={900}
        height={height}
        className="w-full block bg-transparent"
      />
      {/* Frequency axis labels */}
      <div className="absolute bottom-1 left-3 right-3 flex justify-between text-[9px] font-mono text-slate-400 select-none pointer-events-none">
        <span>0 Hz</span>
        <span>2 kHz</span>
        <span>4 kHz</span>
        <span>8 kHz</span>
        <span>12 kHz (Vocoder Band)</span>
        <span>16 kHz</span>
      </div>
    </div>
  );
};
