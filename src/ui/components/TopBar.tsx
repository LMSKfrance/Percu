import { useState, useEffect } from 'react';
import type { CityMode } from '../constants';

const CITIES: { value: CityMode; label: string }[] = [
  { value: 'detroit', label: 'Detroit' },
  { value: 'tbilisi', label: 'Tbilisi' },
  { value: 'berlin', label: 'Berlin' },
];

interface TopBarProps {
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

export function TopBar({
  isPlaying, onPlay, onPanic,
  bpm, onBPMChange,
  seed, onSeedChange, seedHistory, seedIdx, onSeedPrev, onSeedNext, onSeedRandom,
  cityMode, onCityModeChange,
  density, onDensityChange,
}: TopBarProps) {
  const [dn, setDn] = useState(density);
  useEffect(() => { setDn(density); }, [density]);

  return (
    <div className="topBar">
      <div className="topLeft">
        <span className="brand">PERCU PRO<span className="brandSub"> V1.0</span></span>
      </div>

      <div className="topCenter">
        <button className={`btn ${isPlaying ? 'btnStop' : 'btnPlay'}`} onClick={onPlay}>
          {isPlaying ? '■ STOP' : '▶ PLAY'}
        </button>
        <button className="btn btnStop" onClick={onPanic} title="Panic – stop playback">‖ PANIC</button>

        <div className="topGroup">
          <span className="topLabel">BPM</span>
          <span className="topBigNum">{bpm.toFixed(2)}</span>
          <input type="range" className="slider" min={60} max={180} step={1}
            value={bpm} onChange={e => onBPMChange(Number(e.target.value))}
            onDoubleClick={() => onBPMChange(128)}
            style={{ width: 72, marginTop: 2 }} />
        </div>

        <div className="topGroup">
          <span className="topLabel">SEED</span>
          <span className="topSeed">{seed}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
            <button className="seedNav" onClick={onSeedRandom} title="New seed" style={{ padding: '2px 6px', fontSize: 10 }}>▲</button>
            <button className="seedNav" onClick={onSeedPrev} disabled={seedIdx <= 0} title="Previous seed">◀</button>
            <button className="seedNav" onClick={onSeedNext} disabled={seedIdx >= seedHistory.length - 1} title="Next seed">▶</button>
            <input className="input" type="text" value={seed}
              onChange={e => onSeedChange(e.target.value)}
              style={{ width: 88, fontSize: 10, padding: '2px 6px', marginLeft: 2 }} />
          </div>
        </div>
      </div>

      <div className="topRight">
        <div className="topGroup">
          <span className="topLabel">City</span>
          <div className="segSwitch">
            {CITIES.map(c => (
              <button key={c.value}
                className={`segBtn${cityMode === c.value ? ' active' : ''}`}
                onClick={() => onCityModeChange(c.value)}>
                {c.label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="topGroup">
          <span className="topLabel">Density</span>
          <input type="range" className="slider" min={0} max={1} step={0.01} value={dn}
            onChange={e => { const v = Number(e.target.value); setDn(v); onDensityChange(v); }}
            onDoubleClick={() => { setDn(0.5); onDensityChange(0.5); }}
            style={{ width: 90, marginTop: 2 }} />
        </div>

        <button className="settingsBtn" title="Settings" aria-label="Settings">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="statusDot" title="Connected" />
          <span className="statusLabel">Sync</span>
        </div>
      </div>
    </div>
  );
}
