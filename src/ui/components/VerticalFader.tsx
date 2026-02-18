import { useRef, useCallback } from 'react';

interface VerticalFaderProps {
  value: number;
  onChange: (value: number) => void;
  height: number;
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
      className="verticalFaderTrack"
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
      <div className="verticalFaderFill" style={{ height: `${pct}%` }} />
      <div
        className="verticalFaderHandle"
        style={{ bottom: `calc(${pct}% - 7px)` }}
      />
    </div>
  );
}
