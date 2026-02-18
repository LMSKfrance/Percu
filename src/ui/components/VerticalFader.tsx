import { useRef, useCallback } from 'react';

interface VerticalFaderProps {
  value: number;
  onChange: (value: number) => void;
  height: number | string;
  disabled?: boolean;
  stopPropagation?: boolean;
}

export function VerticalFader({ value, onChange, height, disabled, stopPropagation }: VerticalFaderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<{ y: number; v: number } | null>(null);

  const clamp = (v: number) => Math.min(1, Math.max(0, v));

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || !trackRef.current) return;
      if (stopPropagation) e.stopPropagation();
      trackRef.current.setPointerCapture(e.pointerId);
      const rect = trackRef.current.getBoundingClientRect();
      const y = rect.bottom - e.clientY;
      const v = clamp(y / rect.height);
      startRef.current = { y: e.clientY, v };
      onChange(v);
    },
    [disabled, onChange, stopPropagation]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const dy = startRef.current.y - e.clientY;
      const dv = dy / rect.height;
      const next = clamp(startRef.current.v + dv);
      startRef.current = { y: e.clientY, v: next };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          if (startRef.current) onChange(startRef.current.v);
        });
      }
    },
    [onChange]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      trackRef.current?.releasePointerCapture(e.pointerId);
      startRef.current = null;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    },
    []
  );

  const pct = clamp(value) * 100;

  return (
    <div
      ref={trackRef}
      className="w-2.5 min-w-2.5 rounded bg-slate-200/80 dark:bg-slate-800/80 relative cursor-pointer touch-none select-none"
      style={{ height }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-disabled={disabled}
    >
      <div className="absolute bottom-0 left-0 w-full bg-primary rounded pointer-events-none transition-[height]" style={{ height: `${pct}%` }} />
      <div
        className="absolute left-1/2 w-3 h-3.5 -translate-x-1/2 rounded bg-white dark:bg-slate-300 border border-slate-300 dark:border-slate-500 shadow pointer-events-none transition-[bottom]"
        style={{ bottom: `calc(${pct}% - 7px)` }}
      />
    </div>
  );
}
