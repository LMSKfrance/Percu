import { useRef, useCallback } from 'react';
import { Pattern, Step } from '../../groove/generator';

const SWING_TYPES = ['8th', '16th'] as const;
const ACCENT_TRACK_ID = 'Accent';

/** Primary blue at 30% darker for velocity fill (same hue, darker). */
const VELOCITY_FILL_STYLE = { background: 'rgba(30, 64, 175, 0.95)' }; // blue-900-ish, same as primary but 30% darker

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
  onStepToggle: (trackName: string, displayStepIndex: number) => void;
  onStepVelocityChange: (trackName: string, displayStepIndex: number, vel: number) => void;
  swingType: '8th' | '16th';
  onSwingTypeChange: (v: '8th' | '16th') => void;
  swingPercent: number;
  onSwingPercentChange: (v: number) => void;
  accentSteps: Step[];
  onAccentStepToggle: (displayStepIndex: number) => void;
  onAccentStepVelocityChange: (displayStepIndex: number, vel: number) => void;
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
  onStepToggle,
  onStepVelocityChange,
  swingType,
  onSwingTypeChange,
  swingPercent,
  onSwingPercentChange,
  accentSteps,
  onAccentStepToggle,
  onAccentStepVelocityChange,
}: SequencerPanelProps) {
  const dragRef = useRef<{ trackName: string; stepIndex: number; startY: number; startX: number; startVel: number } | null>(null);

  const handleStepDoubleClick = useCallback(
    (trackName: string, displayStepIndex: number) => {
      onStepToggle(trackName, displayStepIndex);
    },
    [onStepToggle]
  );

  const handleStepPointerDown = useCallback(
    (e: React.PointerEvent, trackName: string, displayStepIndex: number, stepOn: boolean, currentVel: number) => {
      if (!stepOn) return;
      e.preventDefault();
      dragRef.current = {
        trackName,
        stepIndex: displayStepIndex,
        startY: e.clientY,
        startX: e.clientX,
        startVel: currentVel,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    []
  );

  const handleStepPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const deltaY = d.startY - e.clientY;
      const deltaX = e.clientX - d.startX;
      const sensitivity = 0.012;
      const delta = (deltaY + deltaX) * sensitivity;
      const next = Math.min(1, Math.max(0, d.startVel + delta));
      if (d.trackName === ACCENT_TRACK_ID) {
        onAccentStepVelocityChange(d.stepIndex, next);
      } else {
        onStepVelocityChange(d.trackName, d.stepIndex, next);
      }
    },
    [onStepVelocityChange, onAccentStepVelocityChange]
  );

  const handleStepPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  return (
    <section className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark p-4 rounded shadow-sm h-full flex flex-col min-h-0">
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 mb-3">Sequencer</h3>
      {/* Step numbers row: same grid as steps so each number is centered above its column */}
      <div className="flex items-center gap-3 mb-1.5">
        <div className="w-24 flex-shrink-0" aria-hidden />
        <div className="step-grid flex-1 min-w-0">
          {Array.from({ length: 16 }, (_, i) => (
            <div key={i} className="aspect-square flex items-center justify-center">
              <span
                className={`text-[10px] font-mono opacity-60 ${i === currentStep && isPlaying ? 'text-primary font-semibold opacity-100' : ''}`}
              >
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-1.5 flex-1 min-h-0 overflow-auto">
        {pattern.tracks.map((track) => {
          const en = laneToggles.get(track.name) ?? true;
          const offset = laneOffsets.get(track.name) ?? 0;
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
                      role="button"
                      tabIndex={0}
                      className={`aspect-square border rounded-sm cursor-pointer select-none flex items-end justify-center relative overflow-hidden touch-none ${
                        step.on
                          ? 'bg-primary border-primary shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                          : 'border-border-light dark:border-border-dark bg-slate-100/80 dark:bg-slate-900/60'
                      } ${isHead ? 'ring-1 ring-primary ring-inset' : ''}`}
                      title={`Step ${si + 1} vel:${step.vel.toFixed(2)}${step.on ? ' – drag to change velocity' : ' – double-click to add'}`}
                      onDoubleClick={() => handleStepDoubleClick(track.name, si)}
                      onPointerDown={(e) => handleStepPointerDown(e, track.name, si, step.on, step.vel)}
                      onPointerMove={handleStepPointerMove}
                      onPointerUp={handleStepPointerUp}
                      onPointerLeave={handleStepPointerUp}
                      onPointerCancel={handleStepPointerUp}
                    >
                      {step.on && (
                        <div
                          className="absolute bottom-0 left-0 right-0 rounded-b-sm transition-[height] duration-75"
                          style={{
                            height: `${step.vel * 100}%`,
                            ...VELOCITY_FILL_STYLE,
                          }}
                        />
                      )}
                      {step.on && step.ratchet > 0 && (
                        <span className="absolute top-0.5 right-0.5 text-[7px] font-mono text-white drop-shadow">×{step.ratchet + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {/* Swing control row — same font/weight/color as ACCENT for unified footer */}
        <div className="flex items-center gap-3 mt-3">
          <span className="w-24 flex-shrink-0 text-[9px] font-bold uppercase tracking-tight opacity-60">Swing</span>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-28 justify-between">
              <button type="button" className="material-symbols-outlined text-[10px] opacity-40 hover:opacity-100" onClick={() => onSwingTypeChange(swingType === '8th' ? '16th' : '8th')}>
                {'chevron_left'}
              </button>
              <select
                className="flex-1 min-w-0 bg-transparent border-none outline-none text-[10px] font-bold cursor-pointer"
                value={swingType}
                onChange={(e) => onSwingTypeChange(e.target.value as '8th' | '16th')}
              >
                {SWING_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button type="button" className="material-symbols-outlined text-[10px] opacity-40 hover:opacity-100" onClick={() => onSwingTypeChange(swingType === '16th' ? '8th' : '16th')}>
                {'chevron_right'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                className="w-20 h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none accent-primary"
                min={0}
                max={100}
                value={swingPercent}
                onChange={(e) => onSwingPercentChange(Number(e.target.value))}
              />
              <span className="text-[10px] font-mono opacity-60 w-8">{swingPercent}%</span>
            </div>
          </div>
        </div>
        {/* ACCENT track — full opacity, same layout and interaction as instrument tracks; state is 16 steps for modulation */}
        <div className="flex items-center gap-3 mt-2">
          <div className="w-24 flex items-center justify-between text-[10px] font-bold flex-shrink-0">
            <div className="flex gap-0.5 opacity-40" aria-hidden>
              <span className="w-5 h-4" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-tight opacity-60">ACCENT</span>
            <div className="flex gap-0.5 opacity-40" aria-hidden>
              <span className="w-4 h-4" />
              <span className="w-4 h-4" />
            </div>
          </div>
          <div className="step-grid flex-1 min-w-0">
            {accentSteps.map((step, si) => {
              const isHead = si === currentStep && isPlaying;
              return (
                <div
                  key={si}
                  role="button"
                  tabIndex={0}
                  className={`aspect-square border rounded-sm cursor-pointer select-none flex items-end justify-center relative overflow-hidden touch-none ${
                    step.on
                      ? 'bg-primary border-primary shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                      : 'border-border-light dark:border-border-dark bg-slate-100/80 dark:bg-slate-900/60'
                  } ${isHead ? 'ring-1 ring-primary ring-inset' : ''}`}
                  title={`Accent step ${si + 1}${step.on ? ` vel:${step.vel.toFixed(2)} – drag to change` : ' – double-click to add'}`}
                  onDoubleClick={() => onAccentStepToggle(si)}
                  onPointerDown={(e) => {
                    if (!step.on) return;
                    e.preventDefault();
                    dragRef.current = {
                      trackName: ACCENT_TRACK_ID,
                      stepIndex: si,
                      startY: e.clientY,
                      startX: e.clientX,
                      startVel: step.vel,
                    };
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={handleStepPointerMove}
                  onPointerUp={handleStepPointerUp}
                  onPointerLeave={handleStepPointerUp}
                  onPointerCancel={handleStepPointerUp}
                >
                  {step.on && (
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-b-sm transition-[height] duration-75"
                      style={{
                        height: `${step.vel * 100}%`,
                        ...VELOCITY_FILL_STYLE,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
