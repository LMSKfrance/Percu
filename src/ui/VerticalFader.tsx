import { useState, useRef, useCallback } from 'react';

export interface VerticalFaderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Double-click resets to this (e.g. 0.75 unity) */
  defaultValue?: number;
  title?: string;
  className?: string;
}

export function VerticalFader({
  value,
  onChange,
  min = 0,
  max = 1,
  defaultValue = 0.75,
  title = 'Level',
  className = '',
}: VerticalFaderProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipValue, setTooltipValue] = useState(value);
  const draggingRef = useRef(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      onChange(v);
      if (draggingRef.current) setTooltipValue(v);
    },
    [onChange]
  );

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    draggingRef.current = true;
    setShowTooltip(true);
    setTooltipValue(value);
  }, [value]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    draggingRef.current = false;
    setShowTooltip(false);
  }, []);

  const handleDoubleClick = useCallback(() => {
    onChange(defaultValue);
  }, [onChange, defaultValue]);

  return (
    <div
      className={`ui-fader-v-wrap ${className}`}
      title={`${title} (double-click reset)`}
    >
      {showTooltip && (
        <div className="ui-fader-tooltip" role="tooltip">
          {(tooltipValue * 100).toFixed(0)}%
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={0.01}
        value={value}
        onChange={handleChange}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        className="ui-fader-v"
        aria-label={title}
      />
    </div>
  );
}
