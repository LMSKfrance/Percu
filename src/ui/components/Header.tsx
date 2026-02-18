import { useState, useEffect } from 'react';
import type { CityMode } from '../constants';

const CITIES: { value: CityMode; label: string }[] = [
  { value: 'detroit', label: 'Detroit' },
  { value: 'tbilisi', label: 'Tbilisi' },
  { value: 'berlin', label: 'Berlin' },
];

interface HeaderProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPanic: () => void;
  bpm: number;
  onBPMChange: (v: number) => void;
  seed: string;
  onSeedChange: (v: string) => void;
  seedHistory: string[];
  seedIdx: number;
  onSeedPrev: () => void;
  onSeedNext: () => void;
  onSeedRandom: () => void;
  cityMode: CityMode;
  onCityModeChange: (m: CityMode) => void;
  density: number;
  onDensityChange: (v: number) => void;
}

export function Header({
  isPlaying,
  onPlay,
  onPanic,
  bpm,
  onBPMChange,
  seed,
  onSeedChange,
  seedHistory,
  seedIdx,
  onSeedPrev,
  onSeedNext,
  onSeedRandom,
  cityMode,
  onCityModeChange,
  density,
  onDensityChange,
}: HeaderProps) {
  const [dn, setDn] = useState(density);
  const [dark, setDark] = useState(true);
  useEffect(() => setDn(density), [density]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <header className="h-14 border-b border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark flex items-center justify-between px-4 z-50 relative">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-[0.2em] text-lg font-mono text-slate-800 dark:text-slate-200">
            PERCU PRO <span className="text-[10px] font-normal opacity-50">V1.0</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`px-6 py-1.5 rounded flex items-center gap-2 transition-colors text-xs font-bold uppercase tracking-wider ${
              isPlaying
                ? 'border border-border-light dark:border-border-dark hover:bg-slate-100 dark:hover:bg-slate-800'
                : 'bg-primary hover:bg-blue-600 text-white'
            }`}
            onClick={onPlay}
          >
            <span className="material-symbols-outlined text-sm">
              {isPlaying ? 'stop' : 'play_arrow'}
            </span>
            <span>{isPlaying ? 'Stop' : 'Play'}</span>
          </button>
          <button
            type="button"
            className="border border-border-light dark:border-border-dark hover:bg-slate-100 dark:hover:bg-slate-800 px-6 py-1.5 rounded flex items-center gap-2 transition-colors text-xs font-bold uppercase tracking-wider"
            onClick={onPanic}
          >
            <span className="material-symbols-outlined text-sm">{'pause'}</span>
            <span>Panic</span>
          </button>
        </div>
      </div>
      <div className="flex items-center gap-12">
        <div className="flex flex-col items-center">
          <span className="text-[9px] uppercase tracking-[0.2em] opacity-60 mb-0.5">BPM</span>
          <span className="text-xl font-medium font-mono tracking-tighter">{bpm.toFixed(2)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-[0.2em] opacity-60 mb-1 text-center">Seed</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
            <button type="button" className="material-symbols-outlined text-xs cursor-pointer opacity-50 hover:opacity-100" onClick={onSeedRandom} title="New seed">
              {'add'}
            </button>
            <button type="button" className="material-symbols-outlined text-xs cursor-pointer opacity-50 hover:opacity-100" onClick={onSeedPrev} disabled={seedIdx <= 0}>
              {'chevron_left'}
            </button>
            <input
              type="text"
              className="text-xs font-mono font-medium px-4 bg-transparent border-none outline-none w-20 text-center"
              value={seed}
              onChange={(e) => onSeedChange(e.target.value)}
            />
            <button type="button" className="material-symbols-outlined text-xs cursor-pointer opacity-50 hover:opacity-100" onClick={onSeedNext} disabled={seedIdx >= seedHistory.length - 1}>
              {'chevron_right'}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-[0.2em] opacity-60 mb-1 text-center">City</span>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-[10px] font-bold uppercase">
              {CITIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`px-3 py-1 rounded transition-colors ${cityMode === c.value ? 'bg-primary text-white shadow-sm' : 'opacity-40 hover:opacity-100'}`}
                  onClick={() => onCityModeChange(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-[0.2em] opacity-60 mb-1 text-center">Density</span>
            <input
              type="range"
              className="w-24 h-1 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
              min={0}
              max={1}
              step={0.01}
              value={dn}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDn(v);
                onDensityChange(v);
              }}
              onDoubleClick={() => {
                setDn(0.5);
                onDensityChange(0.5);
              }}
            />
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle theme"
          >
            <span className="material-symbols-outlined text-sm">{'wb_sunny'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
