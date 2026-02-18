import { useState } from 'react';

const MACROS = ['Depth', 'Motion', 'Decay', 'Color', 'Shift'];

interface LaneInspectorPanelProps {
  selectedLane: string | null;
  lanes: string[];
  wavBars: 8 | 16;
  onWavBarsChange: (v: 8 | 16) => void;
  wavFormat: 'float32' | 'pcm16';
  onWavFormatChange: (v: 'float32' | 'pcm16') => void;
  onDownloadWav: () => void;
  isRendering: boolean;
  hasPattern: boolean;
  onSeedRandom: () => void;
}

export function LaneInspectorPanel({
  selectedLane,
  lanes,
  wavBars,
  onWavBarsChange,
  wavFormat,
  onWavFormatChange,
  onDownloadWav,
  isRendering,
  hasPattern,
  onSeedRandom,
}: LaneInspectorPanelProps) {
  const [vals, setVals] = useState<Record<string, number>>({});
  const lane = selectedLane ?? lanes[0] ?? '';
  const setMacro = (key: string, v: number) => setVals((prev) => ({ ...prev, [key]: v }));

  return (
    <section className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark p-4 rounded shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 mb-2">Lane Inspector</h3>
        <div className="mb-4 text-[10px]">
          <span className="opacity-60 uppercase font-bold">Selected:</span>{' '}
          <span className="text-primary font-bold uppercase">{lane || '—'}</span>
        </div>
        <div className="grid grid-cols-5 gap-1 mb-6">
          {MACROS.map((k) => (
            <div key={k} className="flex flex-col items-center gap-2">
              <span className="text-[7px] uppercase opacity-40 truncate w-full text-center">{k}</span>
              <div className="w-1 h-8 bg-slate-200 dark:bg-slate-800 rounded-full relative">
                <input
                  type="range"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize"
                  min={0}
                  max={1}
                  step={0.01}
                  value={vals[k] ?? 0.5}
                  onChange={(e) => setMacro(k, Number(e.target.value))}
                  style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                />
                <div className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-primary rounded-full border-2 border-panel-light dark:border-panel-dark pointer-events-none" style={{ bottom: `${(vals[k] ?? 0.5) * 100}%`, transform: 'translate(-50%, 50%)' }} />
              </div>
              <span className="text-[7px] font-mono opacity-40">{Math.round((vals[k] ?? 0.5) * 100)}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button type="button" className="border border-border-light dark:border-border-dark text-[10px] py-1.5 rounded font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase" onClick={onSeedRandom}>
            New Seed
          </button>
          <button type="button" className="border border-border-light dark:border-border-dark text-[10px] py-1.5 rounded font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase" onClick={onSeedRandom}>
            Pattern
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-6">
          <select className="bg-slate-100 dark:bg-slate-800 border-none text-[10px] font-bold rounded py-1 pl-2 pr-6 font-mono" value={wavBars} onChange={(e) => onWavBarsChange(Number(e.target.value) as 8 | 16)}>
            <option value={8}>8 bars</option>
            <option value={16}>16 bars</option>
          </select>
          <select className="bg-slate-100 dark:bg-slate-800 border-none text-[10px] font-bold rounded py-1 pl-2 pr-6 font-mono" value={wavFormat} onChange={(e) => onWavFormatChange(e.target.value as 'float32' | 'pcm16')}>
            <option value="pcm16">16-bit</option>
            <option value="float32">Float32</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <button type="button" className="w-full bg-primary text-white text-[10px] font-bold uppercase py-2.5 rounded shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" onClick={onDownloadWav} disabled={isRendering || !hasPattern}>
          {isRendering ? 'Rendering…' : 'Export WAV'}
        </button>
      </div>
    </section>
  );
}
