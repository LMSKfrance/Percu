import type { LaneId } from '../audio/types';
import { useStore } from '../store/context';
import { LANE_IDS } from '../audio/types';
import { StepCell } from './StepCell';

export interface SequencerGridProps {
  /** When set, render only this lane's row of 16 cells (for use inside per-lane layout). */
  laneOnly?: LaneId;
}

export function SequencerGrid({ laneOnly }: SequencerGridProps = {}) {
  const { state, api } = useStore();
  const { pattern, currentStep, selectedCell } = state;

  if (laneOnly) {
    const lane = laneOnly;
    const steps = pattern[lane] ?? [];
    return (
      <div className="su-seq-cells">
        {Array.from({ length: 16 }, (_, i) => {
          const step = steps[i] ?? { on: false, vel: 0.8, ratchet: 0, micro: 0 };
          const isPlayhead = i === currentStep;
          const isSelected = selectedCell?.lane === lane && selectedCell?.stepIndex === i;
          return (
            <StepCell
              key={i}
              lane={lane}
              stepIndex={i}
              step={step}
              isSelected={isSelected}
              isPlayhead={isPlayhead}
              onSelect={() => api.selectCell(lane, i)}
              onCreate={() => api.createStep(lane, i)}
              onDelete={() => api.deleteStep(lane, i)}
              onStepChange={(s) => api.setStep(lane, i, s)}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="su-seq-grid">
      <div className="su-seq-lanes">
        {LANE_IDS.map((lane) => {
          const steps = pattern[lane] ?? [];
          return (
            <div key={lane} className="su-seq-lane">
              <div className="su-seq-lane-label" title={lane}>
                {lane}
              </div>
              <div className="su-seq-cells">
                {Array.from({ length: 16 }, (_, i) => {
                  const step = steps[i] ?? { on: false, vel: 0.8, ratchet: 0, micro: 0 };
                  const isPlayhead = i === currentStep;
                  const isSelected =
                    selectedCell?.lane === lane && selectedCell?.stepIndex === i;
                  return (
                    <StepCell
                      key={i}
                      lane={lane}
                      stepIndex={i}
                      step={step}
                      isSelected={isSelected}
                      isPlayhead={isPlayhead}
                      onSelect={() => api.selectCell(lane, i)}
                      onCreate={() => api.createStep(lane, i)}
                      onDelete={() => api.deleteStep(lane, i)}
                      onStepChange={(s) => api.setStep(lane, i, s)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
