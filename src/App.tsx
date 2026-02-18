import { useState, useEffect } from 'react';
import { StoreProvider, useStore, type ChordSynthType } from './store/context';
import { LANE_IDS, type ScaleType } from './audio/types';
import { generatePatternFromSeed } from './audio/grooveGenerator';
import { exportWAV, downloadWAV } from './audio/export';
import { audioEngine } from './audio/engine';
import { SequencerGrid } from './ui/SequencerGrid';
import { RadialDial } from './ui/RadialDial';
import './App.css';
import './styles/sulfur.css';
import './styles/full-ui.css';

function TransportRow() {
  const { state, api } = useStore();
  return (
    <div className="tpg-transport">
      <button
        type="button"
        className="tpg-play"
        onClick={() => api.setPlaying(true)}
        disabled={state.playing}
        title="Play (Space)"
      >
        ► Play
      </button>
      <button
        type="button"
        className="tpg-stop"
        onClick={() => api.setPlaying(false)}
        disabled={!state.playing}
        title="Stop (Space)"
      >
        ■ Stop
      </button>
      <label>
        <span style={{ marginRight: 6, fontSize: 10, color: 'var(--ink-muted)' }}>BPM</span>
        <input
          type="number"
          min={20}
          max={300}
          value={state.bpm}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!Number.isNaN(n)) api.setBPM(n);
          }}
        />
      </label>
      <div className="tpg-seed">
        <label>
          <span style={{ marginRight: 6, fontSize: 10, color: 'var(--ink-muted)' }}>Seed</span>
          <input
            type="text"
            value={state.seed}
            onChange={(e) => api.setSeed(e.target.value)}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v) api.setPattern(generatePatternFromSeed(v, { world: state.world, chordProgression: state.chordProgression }));
            }}
            style={{ width: 100 }}
            title="Change seed and blur to generate a new groove from this seed"
          />
        </label>
        <button type="button" onClick={() => api.newSeedAndGenerate()}>
          New Seed
        </button>
      </div>
    </div>
  );
}

function TopSliders() {
  const { state, api } = useStore();
  const world = state.world;
  const worldLabel = world < 0.35 ? 'Detroit' : world > 0.65 ? 'Berlin' : 'Tbilisi';
  const swingPresets = [0.5, 0.55, 0.6, 0.66];
  const swingSelect = swingPresets.reduce((a, b) => Math.abs(state.swing - a) < Math.abs(state.swing - b) ? a : b);
  return (
    <>
      <div className="tpg-slider-row">
        <span className="tpg-slider-label">Detroit ↔ Tbilisi ↔ Berlin:</span>
        <input type="range" min={0} max={1} step={0.01} value={world} onChange={(e) => api.setWorld(Number(e.target.value))} className="tpg-slider" />
        <span className="tpg-slider-value">{worldLabel} ({(world * 100).toFixed(0)}%)</span>
      </div>
      <div className="tpg-slider-row">
        <span className="tpg-slider-label">Percussive ↔ Noisy:</span>
        <input type="range" min={0} max={1} step={0.01} value={state.percNoisy} onChange={(e) => api.setPercNoisy(Number(e.target.value))} className="tpg-slider" />
        <span className="tpg-slider-value">{(state.percNoisy * 100).toFixed(0)}%</span>
      </div>
      <div className="tpg-slider-row">
        <span className="tpg-slider-label">Density:</span>
        <input type="range" min={0} max={1} step={0.01} value={state.density} onChange={(e) => api.setDensity(Number(e.target.value))} className="tpg-slider" />
        <span className="tpg-slider-value">{(state.density * 100).toFixed(0)}%</span>
      </div>
      <div className="tpg-slider-row">
        <span className="tpg-slider-label">Close ↔ Far:</span>
        <input type="range" min={0} max={1} step={0.01} value={state.closeFar} onChange={(e) => api.setCloseFar(Number(e.target.value))} className="tpg-slider" />
        <span className="tpg-slider-value">{(state.closeFar * 100).toFixed(0)}%</span>
      </div>
      <div className="tpg-swing">
        <span className="tpg-slider-label">Swing</span>
        <select value={swingSelect} onChange={(e) => api.setSwing(Number(e.target.value))}>
          <option value={0.5}>Straight (50%)</option>
          <option value={0.55}>55%</option>
          <option value={0.6}>60%</option>
          <option value={0.66}>66%</option>
        </select>
        <input type="range" min={0.5} max={0.66} step={0.01} value={state.swing} onChange={(e) => api.setSwing(Number(e.target.value))} className="tpg-slider" style={{ width: 80 }} />
        <span className="tpg-slider-value">{(state.swing * 100).toFixed(0)}%</span>
      </div>
      <div className="tpg-master-scale">
        <span className="label">MASTER SCALE</span>
        <select value={state.masterRoot} onChange={(e) => api.setMasterRoot(e.target.value)}>
          {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select value={state.masterScale} onChange={(e) => api.setMasterScale(e.target.value as ScaleType)}>
          <option value="Minor">Minor</option>
          <option value="Dorian">Dorian</option>
          <option value="Phrygian">Phrygian</option>
          <option value="Major">Major</option>
        </select>
      </div>
    </>
  );
}

function DelayPanel() {
  const { state, api } = useStore();
  const [type, setType] = useState('Classic');
  const [time, setTime] = useState('1/8');
  return (
    <div className="tpg-panel">
      <div className="tpg-panel-title">DELAY</div>
      <div className="tpg-panel-row">
        <span className="tpg-slider-label">Type</span>
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ flex: 1 }}>
          <option value="Classic">Classic</option>
          <option value="Ping">Ping</option>
          <option value="Tape">Tape</option>
        </select>
      </div>
      <div className="tpg-panel-row">
        <span className="tpg-slider-label">Time</span>
        <select value={time} onChange={(e) => setTime(e.target.value)} style={{ flex: 1 }}>
          <option value="1/16">1/16</option>
          <option value="1/8">1/8</option>
          <option value="3/16">3/16</option>
          <option value="1/4">1/4</option>
        </select>
      </div>
      <div className="tpg-knob-row tpg-dials-sm">
        <RadialDial value={state.delayFdbk} onChange={api.setDelayFdbk} label="Fdbk" />
        <RadialDial value={state.delayWet} onChange={api.setDelayWet} label="D/W" />
      </div>
    </div>
  );
}

function PercussionPanel() {
  const { state, api } = useStore();
  const [fullness, setFullness] = useState(0);
  const [fm, setFm] = useState(0);
  const [decay, setDecay] = useState(0.5);
  const [resonance, setResonance] = useState(0.3);
  const [bite, setBite] = useState(0.5);
  const [grit, setGrit] = useState(0);
  const [hypnotic, setHypnotic] = useState(0);
  const [bgNoise, setBgNoise] = useState(0);
  const [ducking, setDucking] = useState(0);
  const [kickDuck, setKickDuck] = useState(true);
  return (
    <div className="tpg-panel">
      <div className="tpg-panel-title">PERCUSSION</div>
      <div className="tpg-panel-row">
        <span className="tpg-slider-label">Low Perc voice</span>
        <select
          style={{ flex: 1 }}
          value={state.percVoiceLow}
          onChange={(e) => api.setPercVoiceLow(e.target.value)}
        >
          <option value="default">Default</option>
          <option value="dfam">DFAM</option>
          <option value="syncussion">Syncussion</option>
          <option value="fm drum">FM Drum</option>
          <option value="fm drum 2">FM Drum 2</option>
          <option value="basimilus">Basimilus</option>
          <option value="perkons">Perkons</option>
        </select>
      </div>
      <div className="tpg-panel-row">
        <span className="tpg-slider-label">Mid Perc voice</span>
        <select
          style={{ flex: 1 }}
          value={state.percVoiceMid}
          onChange={(e) => api.setPercVoiceMid(e.target.value)}
        >
          <option value="default">Default</option>
          <option value="dfam">DFAM</option>
          <option value="syncussion">Syncussion</option>
          <option value="fm drum">FM Drum</option>
          <option value="fm drum 2">FM Drum 2</option>
          <option value="basimilus">Basimilus</option>
          <option value="perkons">Perkons</option>
        </select>
      </div>
      {([
        ['Fullness', fullness, setFullness],
        ['FM', fm, setFm],
        ['Decay', decay, setDecay],
        ['Resonance', resonance, setResonance],
        ['Bite', bite, setBite],
        ['Grit', grit, setGrit],
        ['Hypnotic', hypnotic, setHypnotic],
        ['Background Noise', bgNoise, setBgNoise],
        ['Ducking', ducking, setDucking],
      ] as [string, number, (n: number) => void][]).map(([label, val, set]) => (
        <div key={label} className="tpg-panel-row">
          <span className="tpg-slider-label" style={{ minWidth: 90 }}>{label}</span>
          <input type="range" min={0} max={1} step={0.01} value={val} onChange={(e) => set(Number(e.target.value))} className="tpg-slider" style={{ flex: 1 }} />
          <span className="tpg-slider-value">{(val * 100).toFixed(0)}</span>
        </div>
      ))}
      <div className="tpg-panel-row">
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={kickDuck} onChange={(e) => setKickDuck(e.target.checked)} />
          <span>Kick</span>
        </label>
      </div>
    </div>
  );
}

function ChordPanel() {
  const { state, api } = useStore();
  return (
    <div className="tpg-panel">
      <div className="tpg-panel-title">CHORD</div>
      <div className="tpg-panel-row">
        <span className="tpg-slider-label">Progression</span>
        <div className="tpg-knob-row tpg-dials-sm" style={{ flex: 1, justifyContent: 'flex-start' }}>
          <RadialDial value={state.chordProgression} onChange={api.setChordProgression} label="Min→Full" />
        </div>
      </div>
      <div className="tpg-panel-row">
        <span className="tpg-slider-label">Synth</span>
        <select value={state.chordSynth} onChange={(e) => api.setChordSynth(e.target.value as ChordSynthType)} style={{ flex: 1 }}>
          <option value="prophet">Prophet</option>
          <option value="analog">Analog</option>
          <option value="fm">FM</option>
        </select>
      </div>
      <div className="tpg-panel-row">
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" defaultChecked />
          <span>Filter</span>
        </label>
      </div>
      <div className="tpg-panel-row">
        <span className="tpg-slider-label">Type</span>
        <select style={{ flex: 1 }}><option>LP</option><option>HP</option></select>
      </div>
      <div className="tpg-panel-row">
        <span className="tpg-slider-label">Cutoff</span>
        <input type="range" min={0} max={1} defaultValue={0.5} className="tpg-slider" style={{ flex: 1 }} />
      </div>
      <div className="tpg-panel-row">
        <span className="tpg-slider-label">Res</span>
        <input type="range" min={0} max={1} step={0.01} defaultValue={0.2} className="tpg-slider" style={{ flex: 1 }} />
      </div>
    </div>
  );
}

/** Mixer panel: right column next to sequencer. Per-lane rows + master strip. Mute replaces Lanes panel. */
function MixerStrip() {
  const { state, api } = useStore();
  const masterMeter = Math.max(0, ...LANE_IDS.map((id) => state.meterPeak[id] ?? 0));
  return (
    <div className="tpg-mixer-panel">
      <div className="tpg-mixer-panel-title">MIXER</div>
      <div className="tpg-mixer-rows">
        <div className="tpg-mixer-row tpg-mixer-row-head">
          <span className="tpg-mixer-cell name">Name</span>
          <span className="tpg-mixer-cell mute">M</span>
          <span className="tpg-mixer-cell solo">S</span>
          <span className="tpg-mixer-cell meter">Meter</span>
          <span className="tpg-mixer-cell fader">Vol</span>
          <span className="tpg-mixer-cell pan">Pan</span>
          <span className="tpg-mixer-cell send">D</span>
          <span className="tpg-mixer-cell send">R</span>
        </div>
        {LANE_IDS.map((lane) => (
          <div key={lane} className={`tpg-mixer-row ${state.laneEnabled[lane] === false ? 'is-muted' : ''} ${state.laneSolo[lane] ? 'is-solo' : ''}`}>
            <span className="tpg-mixer-cell name">{lane}</span>
            <span className="tpg-mixer-cell mute">
              <button
                type="button"
                className={`tpg-mixer-btn ${state.laneEnabled[lane] === false ? 'active' : ''}`}
                onClick={() => api.setLaneEnabled(lane, state.laneEnabled[lane] !== false ? false : true)}
                title={state.laneEnabled[lane] === false ? 'Unmute' : 'Mute'}
                aria-pressed={state.laneEnabled[lane] === false}
              >
                M
              </button>
            </span>
            <span className="tpg-mixer-cell solo">
              <button
                type="button"
                className={`tpg-mixer-btn solo ${state.laneSolo[lane] ? 'active' : ''}`}
                onClick={() => api.setLaneSolo(lane, !state.laneSolo[lane])}
                title="Solo"
                aria-pressed={state.laneSolo[lane]}
              >
                S
              </button>
            </span>
            <span className="tpg-mixer-cell meter">
              <div className="tpg-mixer-meter-wrap row">
                <div
                  className="tpg-mixer-meter-fill"
                  style={{ width: `${Math.min(100, (state.meterPeak[lane] ?? 0) * 100)}%` }}
                />
              </div>
            </span>
            <span className="tpg-mixer-cell fader">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={state.laneGain[lane] ?? 0.75}
                onChange={(e) => api.setLaneGain(lane, Number(e.target.value))}
                className="tpg-mixer-fader-h"
                title={`${lane} level`}
              />
            </span>
            <span className="tpg-mixer-cell pan">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={state.lanePan[lane] ?? 0.5}
                onChange={(e) => api.setLanePan(lane, Number(e.target.value))}
                className="tpg-mixer-pan"
                title={`${lane} pan`}
              />
            </span>
            <span className="tpg-mixer-cell send">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={state.laneSend[lane] ?? 0}
                onChange={(e) => api.setLaneSend(lane, Number(e.target.value))}
                className="tpg-mixer-send"
                title="Delay send"
              />
            </span>
            <span className="tpg-mixer-cell send">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={state.laneSendR[lane] ?? 0}
                onChange={(e) => api.setLaneSendR(lane, Number(e.target.value))}
                className="tpg-mixer-send"
                title="Rumble send"
              />
            </span>
          </div>
        ))}
      </div>
      <div className="tpg-mixer-master">
        <span className="tpg-mixer-master-label">Master</span>
        <div className="tpg-mixer-master-meter-wrap">
          <div className="tpg-mixer-meter-fill" style={{ width: `${Math.min(100, masterMeter * 100)}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={state.masterGain}
          onChange={(e) => api.setMasterGain(Number(e.target.value))}
          className="tpg-mixer-fader-h"
          title="Master level"
        />
      </div>
    </div>
  );
}

function FilterPanel() {
  return (
    <div className="tpg-panel">
      <div className="tpg-panel-title">FILTER</div>
      <div className="tpg-panel-row">
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" />
          <span>On</span>
        </label>
      </div>
      <div className="tpg-panel-row">
        <span className="tpg-slider-label">Type</span>
        <select style={{ flex: 1 }}><option>Lowpass</option></select>
      </div>
      <div className="tpg-panel-row">
        <span className="tpg-slider-label">Target</span>
        <select style={{ flex: 1 }}><option>Master</option></select>
      </div>
      <div className="tpg-panel-row">
        <span className="tpg-slider-label">Cutoff</span>
        <input type="range" min={0} max={10000} step={100} defaultValue={8000} className="tpg-slider" style={{ flex: 1 }} />
        <span className="tpg-slider-value">8000</span>
      </div>
      <div className="tpg-panel-row">
        <span className="tpg-slider-label">Res</span>
        <input type="range" min={0} max={1} step={0.01} defaultValue={0.3} className="tpg-slider" style={{ flex: 1 }} />
        <span className="tpg-slider-value">0.30</span>
      </div>
    </div>
  );
}

function CompressorPanel() {
  return (
    <div className="tpg-panel">
      <div className="tpg-panel-title">COMPRESSOR</div>
      {[
        ['Threshold', -40, 0, -12, '-12'],
        ['Ratio', 1, 20, 4, '4'],
        ['Attack', 0, 1, 0.25, '25%'],
        ['Release', 0, 1, 0.25, '25%'],
      ].map(([label, min, max, def, display]) => (
        <div key={String(label)} className="tpg-panel-row">
          <span className="tpg-slider-label">{label}</span>
          <input type="range" min={min} max={max} step={0.01} defaultValue={def} className="tpg-slider" style={{ flex: 1 }} />
          <span className="tpg-slider-value">{display}</span>
        </div>
      ))}
    </div>
  );
}

function MasterPanel() {
  const { state, api } = useStore();
  return (
    <div className="tpg-panel">
      <div className="tpg-panel-title">MASTER</div>
      <div className="tpg-panel-row">
        <span className="tpg-slider-label">Gain</span>
        <input type="range" min={0} max={1} step={0.01} value={state.masterGain} onChange={(e) => api.setMasterGain(Number(e.target.value))} className="tpg-slider" style={{ flex: 1 }} />
        <span className="tpg-slider-value">{(state.masterGain * 100).toFixed(0)}%</span>
      </div>
      <div className="tpg-panel-row" style={{ marginTop: 4 }}>
        <span className="tpg-slider-label">Env A/H/R</span>
        <input type="range" min={0} max={1} defaultValue={0.25} className="tpg-slider" style={{ flex: 1 }} />
        <input type="range" min={0} max={1} defaultValue={0.25} className="tpg-slider" style={{ flex: 1 }} />
        <input type="range" min={0} max={1} defaultValue={0.5} className="tpg-slider" style={{ flex: 1 }} />
        <input type="range" min={0} max={1} defaultValue={0.25} className="tpg-slider" style={{ flex: 1 }} />
      </div>
    </div>
  );
}

function RandomisePanel() {
  const { api } = useStore();
  return (
    <div className="tpg-panel">
      <div className="tpg-panel-title">RANDOMISE</div>
      <div className="tpg-randomise-btns">
        <button type="button" onClick={() => api.newSeedAndGenerate()}>
          New Seed
        </button>
        <button type="button" onClick={() => api.randomisePattern()}>
          Pattern
        </button>
        <button type="button" onClick={() => api.randomisePerc()}>
          Perc
        </button>
        <button type="button" onClick={() => api.randomiseFilter()}>
          Filter
        </button>
      </div>
    </div>
  );
}

function ExportPanel() {
  const { state } = useStore();
  const [exporting, setExporting] = useState(false);
  const [bars, setBars] = useState(8);
  const handleWAV = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const blob = await exportWAV({
        pattern: state.pattern,
        bpm: state.bpm,
        startOffsetSteps: state.startOffsetSteps,
        laneEnabled: state.laneEnabled,
        bars,
      });
      downloadWAV(blob, `percu-export-${Date.now()}.wav`);
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className="tpg-panel">
      <div className="tpg-panel-title">Export</div>
      <div className="tpg-export-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span className="tpg-slider-label">Download WAV:</span>
          <select value={bars} onChange={(e) => setBars(Number(e.target.value))}>
            <option value={4}>4 bars</option>
            <option value={8}>8 bars</option>
            <option value={16}>16 bars</option>
          </select>
          <select><option>16-bit PCM</option></select>
          <button type="button" className="tpg-btn-green" onClick={handleWAV} disabled={exporting}>
            {exporting ? '…' : 'Download WAV'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="tpg-slider-label">Export MIDI:</span>
          <select><option>Master (all tracks)</option></select>
          <button type="button" className="tpg-btn-orange">Export MIDI</button>
        </div>
      </div>
    </div>
  );
}

function SequencerFull() {
  const { state, api } = useStore();
  const { currentStep } = state;
  const cellSizePx = 28;
  const labelWidthPx = 80;
  const playheadLeftPx = labelWidthPx + currentStep * cellSizePx + cellSizePx / 2 - 1;
  return (
    <div className="tpg-sequencer-wrap" title="Click step: select. Double-click: create/delete. Hold + drag: Y = velocity, X = ratchet (x2/x3).">
      <div
        className="tpg-seq-playhead-line"
        style={{ left: playheadLeftPx }}
        aria-hidden
      />
      <div className="tpg-seq-header">
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
      <div className="tpg-seq-lanes">
        {LANE_IDS.map((lane) => (
          <div key={lane} className={`tpg-seq-lane ${state.laneEnabled[lane] === false ? 'is-muted' : ''}`}>
            <div className="tpg-seq-lane-label">
              {lane}
              <span className="tpg-lane-btns">
                <button type="button" onClick={() => api.setStartOffsetSteps(((state.startOffsetSteps - 1) + 16) % 16)} title="Start earlier">‹</button>
                <button type="button" onClick={() => api.setStartOffsetSteps((state.startOffsetSteps + 1) % 16)} title="Start later">›</button>
              </span>
            </div>
            <div className="tpg-seq-cells su-seq-cells">
              <SequencerGrid laneOnly={lane} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppContent() {
  const { state, api } = useStore();
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const target = e.target as HTMLElement;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      e.preventDefault();
      api.setPlaying(!state.playing);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [api, state.playing]);
  return (
    <div className="tpg-app">
      <h1 className="tpg-title">Techno Percussive Noise Generator</h1>

      <div className="tpg-top">
        <TransportRow />
        <TopSliders />
      </div>

      <div className="tpg-middle">
        <PercussionPanel />
        <ChordPanel />
        <RandomisePanel />
        <ExportPanel />
        <CompressorPanel />
        <FilterPanel />
        <DelayPanel />
        <MasterPanel />
      </div>

      <div className="tpg-main">
        <div className="tpg-main-seq">
          <SequencerFull />
        </div>
        <div className="tpg-main-mixer">
          <MixerStrip />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;
