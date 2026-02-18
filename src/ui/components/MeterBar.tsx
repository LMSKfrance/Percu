/** Vertical meter fill 0..1. Segment-style via CSS. pointer-events: none so it never blocks. */
interface MeterBarProps {
  value: number; /** 0..1 */
  height: number | string;
  className?: string;
}

export function MeterBar({ value, height, className = '' }: MeterBarProps) {
  const pct = Math.min(1, Math.max(0, value)) * 100;
  return (
    <div
      className={`mixerMeterBar ${className}`.trim()}
      style={{ height, width: 6 }}
      aria-hidden
    >
      <div
        className="mixerMeterBarFill"
        style={{ height: `${pct}%` }}
      />
    </div>
  );
}
