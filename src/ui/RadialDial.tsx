import { useRef, useCallback, useEffect, useState } from 'react';
import './RadialDial.css';

export interface RadialDialProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  bipolar?: boolean;
  step?: number;
}

function angleToValue(angleRad: number, bipolar: boolean): number {
  if (bipolar) {
    const t = (angleRad + Math.PI / 2) / (2 * Math.PI);
    const u = t - Math.floor(t);
    return Math.max(-1, Math.min(1, u * 2 - 1));
  }
  const t = (angleRad + Math.PI) / (2 * Math.PI);
  const u = t - Math.floor(t);
  return Math.max(0, Math.min(1, u));
}

const DRAG_THRESHOLD_PX = 4;

export function RadialDial({
  value,
  onChange,
  label,
  bipolar = false,
  step = 0.01,
}: RadialDialProps) {
  const ringRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<boolean>(false);
  const dragStartedRef = useRef<boolean>(false);
  const rafRef = useRef<number | null>(null);
  const valueAtDownRef = useRef<number>(0);
  const angleAtDownRef = useRef<number>(0);
  const downXYRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const [showValue, setShowValue] = useState(false);

  const getAngle = useCallback((clientX: number, clientY: number) => {
    const el = ringRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx);
  }, []);

  const applyDelta = useCallback(
    (clientX: number, clientY: number, shiftKey: boolean) => {
      const angleNow = getAngle(clientX, clientY);
      let deltaAngle = angleNow - angleAtDownRef.current;
      while (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
      while (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;
      const range = bipolar ? 2 : 1;
      const angleRange = 2 * Math.PI;
      let deltaValue = (deltaAngle / angleRange) * range;
      if (bipolar) deltaValue *= 0.5;
      let v = valueAtDownRef.current + deltaValue;
      if (shiftKey) {
        const stepScale = step * 20;
        v = Math.round(v / stepScale) * stepScale;
      }
      v = Math.max(bipolar ? -1 : 0, Math.min(1, v));
      onChange(v);
    },
    [getAngle, bipolar, step, onChange]
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      const down = downXYRef.current;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      if (!dragStartedRef.current) {
        if (dx * dx + dy * dy >= DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
          dragStartedRef.current = true;
        } else return;
      }
      e.preventDefault();
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        applyDelta(e.clientX, e.clientY, e.shiftKey);
      });
    };
    const onUp = () => {
      dragRef.current = false;
      dragStartedRef.current = false;
      setActive(false);
      setShowValue(false);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [applyDelta]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const el = ringRef.current;
      if (!el) return;
      el.setPointerCapture(e.pointerId);
      valueAtDownRef.current = value;
      angleAtDownRef.current = getAngle(e.clientX, e.clientY);
      downXYRef.current = { x: e.clientX, y: e.clientY };
      dragRef.current = true;
      dragStartedRef.current = false;
      setActive(true);
      setShowValue(true);
    },
    [value, getAngle]
  );

  const displayValue = bipolar ? value.toFixed(2) : (value * 100).toFixed(0) + '%';
  const arcDeg = bipolar ? ((value + 1) / 2) * 360 : value * 360;

  return (
    <div
      className={`radial-dial ${active ? 'radial-dial--active' : ''} ${showValue ? 'radial-dial--show-value' : ''}`}
      title={label}
    >
      <div
        ref={ringRef}
        className="radial-dial__ring"
        onPointerDown={onPointerDown}
        role="slider"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={bipolar ? -1 : 0}
        aria-valuemax={1}
        tabIndex={0}
        onKeyDown={(e) => {
          const k = e.key;
          const fine = e.shiftKey ? step : step * 10;
          if (k === 'ArrowUp' || k === 'ArrowRight') {
            e.preventDefault();
            onChange(Math.min(1, value + fine));
            setShowValue(true);
          } else if (k === 'ArrowDown' || k === 'ArrowLeft') {
            e.preventDefault();
            onChange(Math.max(bipolar ? -1 : 0, value - fine));
            setShowValue(true);
          }
        }}
      >
        <div
          className="radial-dial__arc"
          style={{ '--arc-deg': `${arcDeg}deg` } as React.CSSProperties}
        />
        <div className="radial-dial__hint">drag arc</div>
      </div>
      <div className="radial-dial__label">{label}</div>
      {showValue && <div className="radial-dial__value">{displayValue}</div>}
    </div>
  );
}
