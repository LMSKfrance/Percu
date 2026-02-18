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
  pattern,
  currentStep,
  isPlaying,
  selectedLane,
  onLaneSelect,
  laneToggles,
  onLaneToggle,
  laneOffsets,
  onLaneOffsetChange,
}: SequencerPanelProps) {
  return (
    <section className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark p-4 rounded shadow-sm h-full flex flex-col min-h-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] opacity-60">Sequencer</h3>
        <div className="flex gap-1 text-[10px] font-mono opacity-40">
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} className={i === currentStep && isPlaying ? 'text-primary font-semibold opacity-100' : ''}>
              {i + 1}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-1.5 flex-1 min-h-0 overflow-auto">
        {pattern.tracks.map((track) => {
          const en = laneToggles.get(track.name) ?? true;
          const offset = laneOffsets.get(track.name) ?? 0;
          const isWip = WIP_LANES.has(track.name);
          return (
            <div
              key={track.name}
              className={`flex items-center gap-3 ${!en ? 'opacity-35' : ''}`}
            >
              <div className="w-24 flex items-center justify-between text-[10px] font-bold flex-shrink-0">
                <div className="flex gap-0.5 opacity-40">
                  <button type="button" className="material-symbols-outlined text-[12px] cursor-pointer hover:opacity-100" onClick={() => onLaneOffsetChange(track.name, -1)}>
                    {'chevron_left'}
                  </button>
                  <button type="button" className="material-symbols-outlined text-[12px] cursor-pointer hover:opacity-100" onClick={() => onLaneOffsetChange(track.name, 1)}>
                    {'chevron_right'}
                  </button>
                </div>
                <span
                  className={`uppercase tracking-tight cursor-pointer ${selectedLane === track.name ? 'text-primary' : ''}`}
                  onClick={() => onLaneSelect(track.name)}
                >
                  {track.name}
                </span>
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    className={`w-4 h-4 flex items-center justify-center rounded-sm text-[8px] cursor-pointer transition-colors ${
                      !en ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-800 hover:bg-primary hover:text-white'
                    }`}
                    onClick={() => onLaneToggle(track.name, !en)}
                  >
                    M
                  </button>
                  <button type="button" className="w-4 h-4 bg-slate-200 dark:bg-slate-800 flex items-center justify-center rounded-sm text-[8px] cursor-pointer hover:bg-primary hover:text-white transition-colors">
                    S
                  </button>
                </div>
              </div>
              <div className="step-grid flex-1 min-w-0">
                {Array.from({ length: 16 }, (_, si) => {
                  const srcIdx = (si + offset) % 16;
                  const step = track.steps[srcIdx];
                  const isHead = si === currentStep && isPlaying;
                  return (
                    <div
                      key={si}
                      className={`aspect-square border rounded-sm cursor-pointer hover:border-primary/50 transition-colors flex items-end justify-center relative overflow-hidden ${
                        step.on
                          ? 'bg-primary border-primary shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                          : 'border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-900/50'
                      } ${isHead ? 'ring-1 ring-primary ring-inset' : ''}`}
                      title={`Step ${si + 1} vel:${step.vel.toFixed(2)}`}
                    >
                      {step.on && (
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-primary/80 rounded-b-sm"
                          style={{ height: `${step.vel * 100}%` }}
                        />
                      )}
                      {step.on && step.ratchet > 0 && (
                        <span className="absolute top-0.5 right-0.5 text-[7px] font-mono text-white">×{step.ratchet + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {/* Chord WIP row */}
        <div className="flex items-center gap-3 opacity-30 mt-4">
          <div className="w-24 text-[10px] font-bold uppercase tracking-tight flex-shrink-0">
            Chord <span className="text-[8px] bg-slate-200 dark:bg-slate-800 px-1 rounded ml-1">WIP</span>
          </div>
          <div className="step-grid flex-1">
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} className="aspect-square border border-dashed border-border-light dark:border-border-dark rounded-sm" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
