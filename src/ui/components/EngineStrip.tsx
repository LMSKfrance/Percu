import { PERC_MODELS } from '../constants';

interface EngineStripProps {
  percModel: number;
  onPercModelChange: (v: number) => void;
  percDecay: number;
  onPercDecayChange: (v: number) => void;
  percTone: number;
  onPercToneChange: (v: number) => void;
  percBite: number;
  onPercBiteChange: (v: number) => void;
  percMotion: number;
  onPercMotionChange: (v: number) => void;
  percussiveNoisy: number;
  onPercussiveNoisyChange: (v: number) => void;
}

function MacroKnob({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="knobWrap">
      <span className="knobLabel">{label}</span>
      <div className="knob knobSmall" style={{ cursor: 'default' }} title={`${label}: ${Math.round(value * 100)}`}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted2)' }}>{Math.round(value * 100)}</span>
        </div>
      </div>
      <input type="range" className="slider" min={0} max={1} step={.01} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', maxWidth: 36 }} />
    </div>
  );
}

function SliderRow({ label, value, onChange, suffix = '' }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="paramRow">
      <span className="paramLabel">{label}</span>
      <input type="range" className="slider" min={0} max={1} step={.01} value={value} onChange={e => onChange(Number(e.target.value))} style={{ flex: 1 }} />
      <span className="paramVal">{suffix || Math.round(value * 100)}</span>
    </div>
  );
}

export function EngineStrip({
  percModel, onPercModelChange,
  percDecay, onPercDecayChange,
  percTone, onPercToneChange,
  percBite, onPercBiteChange,
  percMotion, onPercMotionChange,
  percussiveNoisy, onPercussiveNoisyChange,
}: EngineStripProps) {
  return (
    <>
      <div className="panel">
        <div className="panelHeader">PERCUSSION</div>
        <div className="panelBody">
          <div className="paramRow">
            <span className="paramLabel">Model</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
              <button type="button" className="seedNav" style={{ padding: '1px 4px' }}>‹</button>
              <select className="select" value={percModel} onChange={e => onPercModelChange(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }}>
                {PERC_MODELS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <button type="button" className="seedNav" style={{ padding: '1px 4px' }}>›</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <MacroKnob label="Tone" value={percTone} onChange={onPercToneChange} />
            <MacroKnob label="Bite" value={percBite} onChange={onPercBiteChange} />
            <MacroKnob label="Motion" value={percMotion} onChange={onPercMotionChange} />
            <MacroKnob label="Decay" value={percDecay} onChange={onPercDecayChange} />
          </div>
          <SliderRow label="Perc ↔ Noisy" value={percussiveNoisy} onChange={onPercussiveNoisyChange} suffix={`${Math.round(percussiveNoisy * 100)}%`} />
          <a className="advancedLink" href="#" onClick={e => e.preventDefault()}>Advanced →</a>
        </div>
      </div>

      <div className="panel">
        <div className="panelHeader">CHORD</div>
        <div className="panelBody">
          <div className="paramRow">
            <span className="paramLabel">Color</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
              <button type="button" className="seedNav" style={{ padding: '1px 4px' }}>‹</button>
              <select className="select" style={{ flex: 1, minWidth: 0 }} defaultValue="minor7"><option>Minor 7th</option><option>Major 7th</option></select>
              <button type="button" className="seedNav" style={{ padding: '1px 4px' }}>›</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <MacroKnob label="Spread" value={0.5} onChange={() => {}} />
            <MacroKnob label="Decay" value={0.5} onChange={() => {}} />
            <MacroKnob label="Drive" value={0.3} onChange={() => {}} />
          </div>
          <SliderRow label="Noisy" value={0.2} onChange={() => {}} />
          <a className="advancedLink" href="#" onClick={e => e.preventDefault()}>Advanced →</a>
        </div>
      </div>

      <div className="panel">
        <div className="panelHeader">ACID</div>
        <div className="panelBody">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span className="paramLabel">Tone / Res / Drive</span>
            <span className="dspBadge">DSP Soon</span>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <MacroKnob label="Depth" value={0.5} onChange={() => {}} />
            <MacroKnob label="Drive" value={0.4} onChange={() => {}} />
            <MacroKnob label="Motion" value={0.3} onChange={() => {}} />
          </div>
          <SliderRow label="Mix" value={0.28} onChange={() => {}} suffix="28%" />
          <a className="advancedLink" href="#" onClick={e => e.preventDefault()}>Advanced →</a>
        </div>
      </div>
    </>
  );
}
