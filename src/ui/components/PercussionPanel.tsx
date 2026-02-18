import { PERC_MODELS } from '../constants';

interface PercussionPanelProps {
  percModel: number;
  onPercModelChange: (v: number) => void;
  percTone: number;
  onPercToneChange: (v: number) => void;
  percBite: number;
  onPercBiteChange: (v: number) => void;
  percussiveNoisy: number;
  onPercussiveNoisyChange: (v: number) => void;
}

export function PercussionPanel({
  percModel,
  onPercModelChange,
  percTone,
  onPercToneChange,
  percBite,
  onPercBiteChange,
  percussiveNoisy,
  onPercussiveNoisyChange,
}: PercussionPanelProps) {
  return (
    <section className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark p-4 rounded shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 mb-4">Percussion</h3>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase opacity-60">Model</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-36 justify-between">
            <button type="button" className="material-symbols-outlined text-xs cursor-pointer opacity-40 hover:opacity-100" onClick={() => onPercModelChange(Math.max(0, percModel - 1))}>
              {'chevron_left'}
            </button>
            <span className="text-[10px] font-bold truncate">{PERC_MODELS[percModel]}</span>
            <button type="button" className="material-symbols-outlined text-xs cursor-pointer opacity-40 hover:opacity-100" onClick={() => onPercModelChange(Math.min(PERC_MODELS.length - 1, percModel + 1))}>
              {'chevron_right'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          <div className="flex flex-col items-center">
            <span className="text-[8px] uppercase opacity-40 mb-2">Tone</span>
            <div className="relative w-10 h-10 rounded-full border border-border-light dark:border-border-dark flex items-center justify-center bg-panel-light dark:bg-panel-dark">
              <div className="absolute w-1 h-3 bg-primary -top-1 rounded-full origin-bottom" style={{ transform: `rotate(${-90 + percTone * 270}deg)` }} />
              <span className="text-[9px] font-bold font-mono">{Math.round(percTone * 100)}</span>
            </div>
            <input type="range" className="w-full mt-1 h-1 bg-slate-200 dark:bg-slate-800 rounded appearance-none accent-primary" min={0} max={1} step={0.01} value={percTone} onChange={(e) => onPercToneChange(Number(e.target.value))} />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[8px] uppercase opacity-40 mb-2">Bite</span>
            <div className="relative w-10 h-10 rounded-full border border-border-light dark:border-border-dark flex items-center justify-center bg-panel-light dark:bg-panel-dark opacity-90">
              <div className="absolute w-1 h-3 bg-primary -top-1 rounded-full origin-bottom" style={{ transform: `rotate(${-45 + percBite * 135}deg)` }} />
              <span className="text-[9px] font-bold font-mono">{Math.round(percBite * 100)}</span>
            </div>
            <input type="range" className="w-full mt-1 h-1 bg-slate-200 dark:bg-slate-800 rounded appearance-none accent-primary" min={0} max={1} step={0.01} value={percBite} onChange={(e) => onPercBiteChange(Number(e.target.value))} />
          </div>
        </div>
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-[9px] uppercase font-bold opacity-60">
            <span>Perc</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 mx-2" />
            <span>Noisy</span>
          </div>
          <input type="range" className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded appearance-none accent-primary" min={0} max={1} step={0.01} value={percussiveNoisy} onChange={(e) => onPercussiveNoisyChange(Number(e.target.value))} />
        </div>
      </div>
    </section>
  );
}
