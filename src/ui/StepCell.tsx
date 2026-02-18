import { memo, useCallback, useRef, useState } from 'react';
import type { LaneId, Step } from '../audio/types';

const DBL_CLICK_MS = 250;
const MOVE_THRESHOLD_PX = 4;
const VEL_SENSITIVITY = 0.015;
const RATCHET_SENSITIVITY = 0.08;

export interface StepCellProps {
  lane: LaneId;
  stepIndex: number;
  step: Step;
  isSelected: boolean;
  isPlayhead: boolean;
  onSelect: () => void;
  onCreate: () => void;
  onDelete: () => void;
  onStepChange: (step: Step) => void;
}

function StepCellInner({
  lane,
  stepIndex,
  step,
  isSelected,
  isPlayhead,
  onSelect,
  onCreate,
  onDelete,
  onStepChange,
}: StepCellProps) {
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const pointerDownRef = useRef<{ x: number; y: number; step: Step; lastX: number; lastY: number } | null>(null);
  const dragStartedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [dragTooltip, setDragTooltip] = useState<{ vel: number; ratchet: number } | null>(null);
  const [hoverAxis, setHoverAxis] = useState<'v' | 'h' | null>(null);

  const isDoubleTap = useCallback((clientX: number, clientY: number): boolean => {
    const now = Date.now();
    const last = lastTapRef.current;
    if (!last) {
      lastTapRef.current = { time: now, x: clientX, y: clientY };
      return false;
    }
    const dt = now - last.time;
    const dx = clientX - last.x;
    const dy = clientY - last.y;
    if (dt <= DBL_CLICK_MS && dx * dx + dy * dy < MOVE_THRESHOLD_PX * MOVE_THRESHOLD_PX) {
      lastTapRef.current = null;
      return true;
    }
    lastTapRef.current = { time: now, x: clientX, y: clientY };
    return false;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);
      pointerDownRef.current = {
        x: e.clientX,
        y: e.clientY,
        step: { ...step },
        lastX: e.clientX,
        lastY: e.clientY,
      };
      dragStartedRef.current = false;
      setDragTooltip(null);
    },
    [step]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const down = pointerDownRef.current;
      if (!down) return;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      const distSq = dx * dx + dy * dy;
      if (!dragStartedRef.current) {
        if (distSq >= MOVE_THRESHOLD_PX * MOVE_THRESHOLD_PX) {
          dragStartedRef.current = true;
        } else return;
      }
      e.preventDefault();
      down.lastX = e.clientX;
      down.lastY = e.clientY;
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const totalDx = down.lastX - down.x;
        const totalDy = down.lastY - down.y;
        const fine = e.shiftKey ? 0.5 : 1;
        const coarse = e.altKey ? 2 : 1;
        const sens = fine * coarse;
        let vel = down.step.vel - totalDy * VEL_SENSITIVITY * sens;
        vel = Math.max(0, Math.min(1, vel));
        let ratchet = down.step.ratchet + totalDx * RATCHET_SENSITIVITY * sens;
        ratchet = Math.max(0, Math.min(2, Math.round(ratchet * 2) / 2));
        const micro = down.step.micro ?? 0;
        onStepChange({ ...down.step, vel, ratchet, micro });
        setDragTooltip({ vel, ratchet });
      });
    },
    [step, onStepChange]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const down = pointerDownRef.current;
      const hadDrag = dragStartedRef.current;
      pointerDownRef.current = null;
      setDragTooltip(null);
      if (hadDrag) return;
      const clientX = e.clientX;
      const clientY = e.clientY;
      if (isDoubleTap(clientX, clientY)) {
        if (step.on) {
          onDelete();
        } else {
          onCreate();
        }
        return;
      }
      onSelect();
    },
    [step.on, isDoubleTap, onSelect, onCreate, onDelete]
  );

  const handlePointerEnter = useCallback(() => {
    setHoverAxis('v');
  }, []);

  const handlePointerLeave = useCallback(() => {
    setHoverAxis(null);
    if (!pointerDownRef.current) setDragTooltip(null);
  }, []);

  return (
    <div
      className={`su-cell-wrap ${step.on ? 'is-on' : ''} ${isSelected ? 'is-selected' : ''} ${isPlayhead ? 'is-playhead' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={handlePointerEnter}
      role="button"
      tabIndex={0}
      aria-pressed={step.on}
      aria-label={`${lane} step ${stepIndex + 1}`}
      title={dragTooltip ? `vel ${(dragTooltip.vel * 100).toFixed(0)}% ratchet ${dragTooltip.ratchet}` : undefined}
    >
      <div className="su-cell">
        {step.on && (
          <>
            <span
              className="su-vel"
              style={{ height: `${Math.max(10, step.vel * 100)}%` }}
            />
            {(step.ratchet === 1 || step.ratchet === 2) && (
              <span className="su-cell-ratchet">x{step.ratchet === 2 ? 3 : 2}</span>
            )}
          </>
        )}
        {hoverAxis && (
          <span className="su-cell-axes">
            {hoverAxis === 'v' && <span className="su-cell-y" />}
            <span className="su-cell-x" />
          </span>
        )}
        {dragTooltip && (
          <span className="su-cell-tooltip">
            v{(dragTooltip.vel * 100).toFixed(0)} r{dragTooltip.ratchet}
          </span>
        )}
      </div>
    </div>
  );
}

export const StepCell = memo(StepCellInner);
