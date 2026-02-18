import { useStore } from '../store/context';
import { LANE_IDS } from '../audio/types';
import { SequencerGrid } from './SequencerGrid';

export function SequencerFull() {
  const { state, api } = useStore();
  const { currentStep } = state;
  const cellSizePx = 28;
  const labelWidthPx = 80;
  const playheadLeftPx = labelWidthPx + currentStep * cellSizePx + cellSizePx / 2 - 1;
  return (
    <div className="tpg-sequencer-wrap" title="Click step: select. Double-click: create/delete. Hold + drag: Y = velocity, X = ratchet (x2/x3).">
      <div
        className="tpg-seq-playhead-line"
        style={{ left: playheadLeftPx }}
        aria-hidden
      />
      <div className="tpg-seq-header">
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
      <div className="tpg-seq-lanes">
        {LANE_IDS.map((lane) => (
          <div key={lane} className={`tpg-seq-lane ${state.laneEnabled[lane] === false ? 'is-muted' : ''}`}>
            <div className="tpg-seq-lane-label">
              {lane}
              <span className="tpg-lane-btns">
                <button type="button" onClick={() => api.setStartOffsetSteps(((state.startOffsetSteps - 1) + 16) % 16)} title="Start earlier">‹</button>
                <button type="button" onClick={() => api.setStartOffsetSteps((state.startOffsetSteps + 1) % 16)} title="Start later">›</button>
              </span>
            </div>
            <div className="tpg-seq-cells su-seq-cells">
              <SequencerGrid laneOnly={lane} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
