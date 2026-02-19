import { useRef, useEffect, useState } from 'react';

/** UI-only meter: value 0..1 (expects pre-smoothed from usePeakMeter), LED look, peak hold, clip. pointer-events: none. */
interface ChannelMeterProps {
  value: number;
  height: number;
  className?: string;
  clipThreshold?: number;
}

export function ChannelMeter({ value, height, className = '', clipThreshold = 0.98 }: ChannelMeterProps) {
  const [peakHold, setPeakHold] = useState(0);
  const peakRef = useRef(0);
  const peakTimeRef = useRef(0);

  useEffect(() => {
    if (value > peakRef.current) {
      peakRef.current = value;
      peakTimeRef.current = Date.now();
    }
    setPeakHold(peakRef.current);
  }, [value]);

  useEffect(() => {
    const t = setInterval(() => {
      if (Date.now() - peakTimeRef.current > 400) {
        peakRef.current *= 0.85;
        if (peakRef.current < 0.01) peakRef.current = 0;
        setPeakHold(peakRef.current);
      }
    }, 80);
    return () => clearInterval(t);
  }, []);

  const clip = value >= clipThreshold;

  return (
    <div
      className={`relative rounded overflow-hidden ${className}`}
      style={{ width: 6, height, pointerEvents: 'none' }}
      aria-hidden
    >
      {/* LED fill: bottom to top */}
      <div className="absolute inset-0 bg-slate-700/50 dark:bg-slate-800 rounded" />
      <div
        className="absolute bottom-0 left-0 right-0 bg-emerald-500 rounded transition-all duration-75"
        style={{ height: `${Math.min(1, value) * 100}%` }}
      />
      {/* Peak hold line */}
      {peakHold > 0.02 && (
        <div
          className="absolute left-0 right-0 h-0.5 bg-amber-400 rounded-full"
          style={{ bottom: `${peakHold * 100}%`, transform: 'translateY(50%)' }}
        />
      )}
      {/* Clip indicator at top */}
      {clip && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 rounded-b animate-pulse" />
      )}
    </div>
  );
}
