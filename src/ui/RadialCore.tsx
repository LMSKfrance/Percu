import { useRef, useCallback } from 'react';
import { RadialDial } from './RadialDial';

export interface RadialCoreProps {
  axis: number;
  onAxisChange: (v: number) => void;
  structure: number;
  onStructureChange: (v: number) => void;
  texture: number;
  onTextureChange: (v: number) => void;
  statusText?: string;
  onGenerateNew: () => void;
  onMutatePattern: () => void;
  onMutateSound: () => void;
  laneEnabled?: Record<string, boolean>;
  onLaneToggle?: (lane: string) => void;
}

const HOLD_MS = 350;
const DEFAULT_LANES = ['Kick', 'Sub', 'Hat'];

export function RadialCore({
  axis,
  onAxisChange,
  structure,
  onStructureChange,
  texture,
  onTextureChange,
  statusText = 'LIVE',
  onGenerateNew,
  onMutatePattern,
  onMutateSound,
  laneEnabled = {},
  onLaneToggle,
}: RadialCoreProps) {
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClickRef = useRef<number>(0);

  const clearHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const onCenterPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      clearHold();
      holdTimerRef.current = setTimeout(() => {
        holdTimerRef.current = null;
        onMutatePattern();
      }, HOLD_MS);
    },
    [clearHold, onMutatePattern]
  );

  const onCenterPointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
        onGenerateNew();
      } else {
        const dt = now - lastClickRef.current;
        if (dt < 400 && dt > 0) {
          onMutateSound();
          lastClickRef.current = 0;
          return;
        }
        lastClickRef.current = now;
      }
    },
    [onGenerateNew, onMutateSound]
  );

  const onCenterPointerLeave = useCallback(() => {
    clearHold();
  }, [clearHold]);

  return (
    <div className="su-radialBox">
      <div className="su-radialStage">
        <div className="su-sat axis">
          <RadialDial label="AXIS" value={axis} onChange={onAxisChange} bipolar />
        </div>
        <div className="su-sat structure">
          <RadialDial
            label="STRUCTURE"
            value={structure}
            onChange={onStructureChange}
          />
        </div>
        <div className="su-sat texture">
          <RadialDial
            label="TEXTURE"
            value={texture}
            onChange={onTextureChange}
          />
        </div>
        <div
          className="su-core"
          onPointerDown={onCenterPointerDown}
          onPointerUp={onCenterPointerUp}
          onPointerLeave={onCenterPointerLeave}
          onPointerCancel={onCenterPointerLeave}
        >
          <div>
            <div className="t1">GROOVE CORE</div>
            <div className="t2">{statusText}</div>
            <div className="t2">CLICK: GENERATE</div>
          </div>
        </div>
      </div>
      <div className="su-lanes">
        {DEFAULT_LANES.map((name) => (
          <div
            key={name}
            className="su-lane"
            role="button"
            tabIndex={0}
            onClick={() => onLaneToggle?.(name)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onLaneToggle?.(name);
              }
            }}
          >
            <span
              className={`su-dot ${laneEnabled[name] !== false ? 'is-on' : ''}`}
            />
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}
