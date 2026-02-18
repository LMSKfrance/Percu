import { useState, useEffect, useRef } from 'react';

/**
 * Drives a peak meter value (0..1) for display. When isPlaying and enabled,
 * simulates activity based on baseLevel and optional noise; otherwise decays.
 * Can be wired to Web Audio API AnalyserNode later for real levels.
 */
export function usePeakMeter(options: {
  isPlaying: boolean;
  enabled: boolean;
  baseLevel: number; // 0..1, e.g. gain * velocity factor
  decayMs?: number;
  attackMs?: number;
  /** Optional: pass an AnalyserNode to use real levels (future) */
  analyser?: AnalyserNode | null;
}): number {
  const {
    isPlaying,
    enabled,
    baseLevel,
    decayMs = 120,
    attackMs = 20,
    analyser,
  } = options;

  const [peak, setPeak] = useState(0);
  const peakRef = useRef(0);
  const lastUpdateRef = useRef(0);
  const baseLevelRef = useRef(baseLevel);
  baseLevelRef.current = baseLevel;

  useEffect(() => {
    if (!isPlaying || !enabled) {
      setPeak(0);
      peakRef.current = 0;
      return;
    }

    let rafId: number;
    const decayPerMs = 1 / decayMs;
    const attackPerMs = 1 / attackMs;

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastUpdateRef.current) / 1000);
      lastUpdateRef.current = now;

      let target = baseLevelRef.current;
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const rms = Math.sqrt(
          data.reduce((s, v) => s + v * v, 0) / data.length
        ) / 255;
        target = Math.max(target, rms);
      } else {
        target = Math.min(1, target + (Math.random() * 0.12));
      }

      let next = peakRef.current;
      if (target > next) {
        next = Math.min(1, next + attackPerMs * dt * 1000);
      } else {
        next = Math.max(0, next - decayPerMs * dt * 1000);
      }
      next = Math.max(next, target * 0.25);
      peakRef.current = next;
      setPeak(next);
      rafId = requestAnimationFrame(tick);
    };

    lastUpdateRef.current = performance.now();
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, enabled, decayMs, attackMs, analyser]);

  if (!isPlaying || !enabled) return 0;
  return peak;
}
