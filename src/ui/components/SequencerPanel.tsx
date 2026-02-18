import { Pattern } from '../../groove/generator';
import { WIP_LANES } from '../constants';

interface SequencerPanelProps {
  pattern: Pattern;
  currentStep: number;
  isPlaying: boolean;
  selectedLane: string | null;
  onLaneSelect: (name: string) => void;
  laneToggles: Map<string, boolean>;
  onLaneToggle: (name: string, enabled: boolean) => void;
  laneOffsets: Map<string, number>;
  onLaneOffsetChange: (name: string, delta: number) => void;
}

const CW = 32;
const CH = 28;
const GAP = 2;
const LBL = 56;
const OFS = 28;
const MS = 28;
const GUT = 4;
const GL = OFS + MS + LBL + GUT;

export function SequencerPanel({
  pattern, currentStep, isPlaying, selectedLane, onLaneSelect,
  laneToggles, onLaneToggle, laneOffsets, onLaneOffsetChange,
}: SequencerPanelProps) {
  const headerH = 20;

  return (
    <div className="panel" style={{ overflow: 'auto' }}>
      <div className="panelHeader">SEQUENCER</div>
      <div className="panelBody" style={{ position: 'relative', gap: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', height: headerH, flexShrink: 0 }}>
          <div style={{ width: GL, flexShrink: 0 }} />
          <div style={{ display: 'flex', gap: GAP }}>
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} className={`stepNum${i === currentStep && isPlaying ? ' active' : ''}`}
                style={{ width: CW }}>{i + 1}</div>
            ))}
          </div>
        </div>

        {isPlaying && (
          <div className="playheadLine" style={{
            left: GL + currentStep * (CW + GAP) + CW / 2,
            top: headerH,
            bottom: 0,
          }} />
        )}

        {pattern.tracks.map((track, ti) => {
          const en = laneToggles.get(track.name) ?? true;
          const sel = selectedLane === track.name;
          const offset = laneOffsets.get(track.name) ?? 0;
          return (
            <div key={ti} className="laneRow" style={{ marginBottom: GAP, opacity: en ? 1 : .35 }}>
              <div className="offsetGrp" style={{ width: OFS }}>
                <button className="offsetBtn" onClick={() => onLaneOffsetChange(track.name, -1)} title={`Offset: ${offset}`}>‹</button>
                <button className="offsetBtn" onClick={() => onLaneOffsetChange(track.name, 1)} title={`Offset: ${offset}`}>›</button>
              </div>
              <div className="msGrp" style={{ width: MS }}>
                <button className={`msBtn${!en ? ' active' : ''}`} onClick={() => onLaneToggle(track.name, !en)}>M</button>
                <button className="msBtn">S</button>
              </div>
              <div className={`laneLabel${sel ? ' selected' : ''}`} style={{ width: LBL }} onClick={() => onLaneSelect(track.name)}>
                {track.name.toUpperCase()}
                {WIP_LANES.has(track.name) && <span className="engineWipBadge">ENGINE WIP</span>}
              </div>
              <div style={{ width: GUT, flexShrink: 0 }} />
              <div style={{ display: 'flex', gap: GAP }}>
                {Array.from({ length: 16 }, (_, si) => {
                  const srcIdx = (si + offset) % 16;
                  const step = track.steps[srcIdx];
                  const isHead = si === currentStep && isPlaying;
                  return (
                    <div key={si}
                      className={`seqCell${step.on ? ' on' : ''}${isHead ? ' playhead' : ''}`}
                      style={{ width: CW, height: CH }}
                      title={`Step ${si + 1} vel:${step.vel.toFixed(2)}`}>
                      {step.on && <div className="velBar" style={{ height: `${step.vel * 100}%` }} />}
                      {step.on && step.ratchet > 0 && <span className="ratchetBadge">×{step.ratchet + 1}</span>}
                    </div>
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
