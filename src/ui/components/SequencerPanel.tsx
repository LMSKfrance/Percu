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
  swingPercent?: number;
  onSwingChange?: (v: number) => void;
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
  swingPercent = 50,
  onSwingChange,
}: SequencerPanelProps) {
  return (
    <section className="panel-container bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark h-full flex flex-col min-h-0">
      <div className="panelHeader flex justify-between items-center mb-0">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--panel-title)' }}>Sequencer</h3>
        <div className="flex gap-1 text-[10px] font-mono opacity-40">
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} className={i === currentStep && isPlaying ? 'text-primary font-semibold opacity-100' : ''}>
              {i + 1}
            </span>
          ))}
        </div>
      </div>
      {/* Groove Bar: under title, ~40px */}
      <div className="flex items-center gap-4 py-2 px-0 flex-shrink-0" style={{ minHeight: '40px' }}>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--label)', width: '52px' }}>Groove</label>
          <select className="bg-slate-100 dark:bg-slate-800 border border-border-light dark:border-border-dark text-[11px] font-medium rounded px-2 py-1.5 h-8" style={{ width: '220px' }}>
            <option value="straight">Straight</option>
            <option value="8th">8th</option>
            <option value="16th">16th</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--label)' }}>Amount</label>
          <input type="range" className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none accent-primary" min={0} max={100} value={swingPercent} onChange={(e) => onSwingChange?.(Number(e.target.value))} />
          <span className="text-[11px] font-mono w-8 tabular-nums" style={{ color: 'var(--label)' }}>{swingPercent}%</span>
        </div>
      </div>
      <div className="space-y-1.5 flex-1 min-h-0 overflow-auto">
        {pattern.tracks.map((track) => {
          const en = laneToggles.get(track.name) ?? true;
          const offset = laneOffsets.get(track.name) ?? 0;
          const isMuted = !en;
          const isSelected = selectedLane === track.name;
          return (
            <div key={track.name} className={`flex items-center gap-3 ${isMuted ? 'opacity-35' : ''}`}>
              <div className="flex items-center gap-2 flex-shrink-0 w-52">
                <div className="flex gap-1">
                  <button type="button" className="btn-min min-w-[28px] min-h-[24px] flex items-center justify-center rounded border border-border-light dark:border-border-dark bg-slate-100/80 dark:bg-slate-800/80 hover:bg-primary/20 hover:border-primary/50 text-[10px] font-bold transition-colors" onClick={() => onLaneOffsetChange(track.name, -1)} aria-label="Offset left">◀</button>
                  <button type="button" className="btn-min min-w-[28px] min-h-[24px] flex items-center justify-center rounded border border-border-light dark:border-border-dark bg-slate-100/80 dark:bg-slate-800/80 hover:bg-primary/20 hover:border-primary/50 text-[10px] font-bold transition-colors" onClick={() => onLaneOffsetChange(track.name, 1)} aria-label="Offset right">▶</button>
                </div>
                <button type="button" className={`btn-min min-w-[28px] min-h-[24px] flex items-center justify-center rounded-full text-[9px] font-bold transition-colors ${isMuted ? 'bg-primary text-white border-primary' : 'border border-border-light dark:border-border-dark bg-slate-100/80 dark:bg-slate-800/80 hover:bg-primary/20'}`} onClick={() => onLaneToggle(track.name, !en)} aria-pressed={isMuted}>M</button>
                <button type="button" className="btn-min min-w-[28px] min-h-[24px] flex items-center justify-center rounded-full border border-border-light dark:border-border-dark bg-slate-100/80 dark:bg-slate-800/80 hover:bg-yellow-500/20 text-[9px] font-bold transition-colors" aria-pressed={false}>S</button>
                <span className={`flex-1 text-[14px] font-bold uppercase tracking-tight cursor-pointer truncate ${isSelected ? 'text-primary' : ''}`} style={!isSelected ? { color: 'var(--label)' } : undefined} onClick={() => onLaneSelect(track.name)} title={track.name}>{track.name}</span>
                {WIP_LANES.has(track.name) && <span className="text-[8px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">WIP</span>}
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
