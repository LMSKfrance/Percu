import React from 'react';
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

export function SequencerPanel({
  pattern, currentStep, isPlaying, selectedLane, onLaneSelect,
  laneToggles, onLaneToggle, laneOffsets, onLaneOffsetChange,
}: SequencerPanelProps) {
  const playheadPct = ((currentStep + 0.5) / 16) * 100;

  return (
    <div className="panel sequencerPanel">
      <div className="panelHeader">SEQUENCER</div>
      <div className="panelBody sequencerBody">
        <div className="sequencerHeader">
          <div className="sequencerHeaderLeft" />
          <div className="sequencerHeaderSteps">
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} className={`stepNum${i === currentStep && isPlaying ? ' active' : ''}`}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        <div className="sequencerLanes" style={{ ['--playhead-pct' as string]: `${playheadPct}%` }}>
          {isPlaying && <div className="playheadLine sequencerPlayhead" />}
          <div className="sequencerGrid">
            {pattern.tracks.map((track, ti) => {
              const en = laneToggles.get(track.name) ?? true;
              const sel = selectedLane === track.name;
              const offset = laneOffsets.get(track.name) ?? 0;
              return (
                <React.Fragment key={ti}>
                  <div className="offsetGrp" style={{ opacity: en ? 1 : 0.35 }}>
                    <button className="offsetBtn" onClick={() => onLaneOffsetChange(track.name, -1)} title={`Offset: ${offset}`}>‹</button>
                    <button className="offsetBtn" onClick={() => onLaneOffsetChange(track.name, 1)} title={`Offset: ${offset}`}>›</button>
                  </div>
                  <div className="msGrp" style={{ opacity: en ? 1 : 0.35 }}>
                    <button className={`msBtn${!en ? ' active' : ''}`} onClick={() => onLaneToggle(track.name, !en)}>M</button>
                    <button className="msBtn">S</button>
                  </div>
                  <div
                    className={`laneLabel${sel ? ' selected' : ''}`}
                    style={{ opacity: en ? 1 : 0.35 }}
                    onClick={() => onLaneSelect(track.name)}
                  >
                    {track.name.toUpperCase()}
                    {WIP_LANES.has(track.name) && <span className="engineWipBadge">ENGINE WIP</span>}
                  </div>
                  <div className="sequencerGutter" />
                  {Array.from({ length: 16 }, (_, si) => {
                    const srcIdx = (si + offset) % 16;
                    const step = track.steps[srcIdx];
                    const isHead = si === currentStep && isPlaying;
                    return (
                      <div
                        key={si}
                        className={`seqCell${step.on ? ' on' : ''}${isHead ? ' playhead' : ''}`}
                        style={{ opacity: en ? 1 : 0.35 }}
                        title={`Step ${si + 1} vel:${step.vel.toFixed(2)}`}
                      >
                        {step.on && <div className="velBar" style={{ height: `${step.vel * 100}%` }} />}
                        {step.on && step.ratchet > 0 && <span className="ratchetBadge">×{step.ratchet + 1}</span>}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

