/** Vertical segmented LED peak meter; height is driven by value 0..1. */
interface SegmentedPeakMeterProps {
  value: number;
  height: number;
  segments?: number;
  className?: string;
}

export function SegmentedPeakMeter({
  value,
  height,
  segments = 10,
  className = '',
}: SegmentedPeakMeterProps) {
  const lit = Math.min(segments, Math.max(0, Math.ceil(value * segments)));
  const gap = 2;
  const segmentHeight = (height - (segments - 1) * gap) / segments;

  return (
    <div
      className={`segmentedPeakMeter ${className}`.trim()}
      style={{ height }}
      aria-hidden
    >
      <div className="segmentedPeakMeterTrack" style={{ height }}>
        {Array.from({ length: segments }, (_, i) => {
          const litSegment = i < lit;
          return (
            <div
              key={i}
              className={`segmentedPeakMeterSegment${litSegment ? ' lit' : ''}`}
              style={{
                height: segmentHeight,
                marginBottom: i < segments - 1 ? gap : 0,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
