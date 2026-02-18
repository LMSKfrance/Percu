import { useState } from 'react';
import { WIP_LANES } from '../constants';

interface LaneInspectorProps {
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

const MACROS = ['Tone', 'Drive', 'Motion', 'Decay', 'Color'] as const;

export function LaneInspector({
  selectedLane, lanes,
  wavBars, onWavBarsChange, wavFormat, onWavFormatChange,
  onDownloadWav, isRendering, hasPattern, onSeedRandom,
}: LaneInspectorProps) {
  const [vals, setVals] = useState<Record<string, Record<string, number>>>({});

  const lane = selectedLane ?? lanes[0] ?? '';
  const isWip = WIP_LANES.has(lane);
  const laneVals = vals[lane] ?? {};
  const setMacro = (key: string, v: number) => {
    setVals(prev => ({ ...prev, [lane]: { ...(prev[lane] ?? {}), [key]: v } }));
  };

  return (
    <div className="panel">
      <div className="panelHeader">
        LANE INSPECTOR
        {isWip && <span className="engineWipBadge">WIP</span>}
      </div>
      <div className="panelBody">
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)', marginBottom: 8 }}>
          Selected: <span style={{ color: 'var(--accent)' }}>{lane ? lane.toUpperCase() : '—'}</span>
        </div>
        <div className="inspectorGrid">
          {MACROS.map(m => (
            <div key={m} className="inspectorMacro">
              <span className="paramLabel" style={{ textAlign: 'center' }}>{m}</span>
              <input type="range" className="slider" min={0} max={1} step={.01}
                value={laneVals[m] ?? 0.5}
                onChange={e => setMacro(m, Number(e.target.value))} />
              <span className="paramVal" style={{ textAlign: 'center' }}>{Math.round((laneVals[m] ?? .5) * 100)}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--stroke)', marginTop: 10, paddingTop: 10 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            <button type="button" className="btn btnAccent" onClick={onSeedRandom}>New Seed</button>
            <button type="button" className="btn btnAccent" onClick={onSeedRandom}>Pattern</button>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
            <select className="select" value={wavBars} onChange={e => onWavBarsChange(Number(e.target.value) as 8 | 16)}>
              <option value={8}>8 bars</option><option value={16}>16 bars</option>
            </select>
            <select className="select" value={wavFormat} onChange={e => onWavFormatChange(e.target.value as 'float32' | 'pcm16')}>
              <option value="pcm16">16-bit</option><option value="float32">Float32</option>
            </select>
          </div>
          <button type="button" className="btn btnAccentSolid" style={{ width: '100%' }}
            onClick={onDownloadWav} disabled={isRendering || !hasPattern}>
            {isRendering ? 'Rendering...' : 'EXPORT WAV'}
          </button>
          <button type="button" className="btn btnAccent" style={{ width: '100%', marginTop: 6 }} disabled>EXPORT MIDI</button>
        </div>
      </div>
    </div>
  );
}
