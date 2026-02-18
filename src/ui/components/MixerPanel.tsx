import { Track } from '../../groove/generator';
import { VOICE_ICONS } from '../constants';
import { MeterBar } from './MeterBar';
import { VerticalFader } from './VerticalFader';

const FADER_HEIGHT = 100;

interface MixerPanelProps {
  tracks: Track[];
  laneToggles: Map<string, boolean>;
  onLaneToggle: (name: string, enabled: boolean) => void;
  selectedLane: string | null;
  onLaneSelect: (name: string) => void;
  isPlaying: boolean;
  channelGains: Map<string, number>;
  onChannelGainChange: (name: string, v: number) => void;
  delaySends: Map<string, number>;
  onDelaySendChange: (name: string, v: number) => void;
  reverbSends: Map<string, number>;
  onReverbSendChange: (name: string, v: number) => void;
  panSends: Map<string, number>;
  onPanSendChange: (name: string, v: number) => void;
  compSends: Map<string, number>;
  onCompSendChange: (name: string, v: number) => void;
}

export function MixerPanel({
  tracks, laneToggles, onLaneToggle, selectedLane, onLaneSelect,
  isPlaying, channelGains, onChannelGainChange,
  delaySends, onDelaySendChange, reverbSends, onReverbSendChange,
  panSends, onPanSendChange, compSends, onCompSendChange,
}: MixerPanelProps) {
  return (
    <div className="panel">
      <div className="panelHeader">MIXER</div>
      <div className="panelBody">
        <div className="mixerStrips">
          {tracks.map(t => {
            const en = laneToggles.get(t.name) ?? true;
            const sel = selectedLane === t.name;
            const onSteps = t.steps.filter(s => s.on);
            const avgVel = onSteps.length ? onSteps.reduce((a, s) => a + s.vel, 0) / onSteps.length : 0;
            const gain = channelGains.get(t.name) ?? 1;
            const dly = delaySends.get(t.name) ?? 0;
            const rev = reverbSends.get(t.name) ?? 0;
            const pan = panSends.get(t.name) ?? 0.5;
            const comp = compSends.get(t.name) ?? 0;
            const meterValue = isPlaying && en ? (gain * (0.15 + avgVel * 0.85)) : 0;
            const clip = false;
            return (
              <div
                key={t.name}
                className={`mixerStrip${sel ? ' selected' : ''}`}
                onClick={() => onLaneSelect(t.name)}
              >
                <div className="mixerStripHeader">
                  <div className="mixerStripNameRow">
                    <span className="mixerStripClip" data-clip={clip ? '1' : undefined} />
                    <span className="mixerStripName">{t.name.length > 6 ? t.name.slice(0, 5) : t.name}</span>
                  </div>
                  <div className="msGrp">
                    <button
                      type="button"
                      className={`msBtn${!en ? ' active' : ''}`}
                      onClick={e => { e.stopPropagation(); onLaneToggle(t.name, !en); }}
                      aria-pressed={!en}
                    >
                      M
                    </button>
                    <button type="button" className="msBtn" onClick={e => e.stopPropagation()} aria-pressed={false}>
                      S
                    </button>
                  </div>
                </div>
                <div className="mixerFaderArea">
                  <div className="mixerFaderMeterWrap" style={{ height: FADER_HEIGHT }}>
                    <MeterBar value={meterValue} height={FADER_HEIGHT} />
                  </div>
                  <div className="mixerFaderWrap" style={{ opacity: en ? 1 : 0.35 }}>
                    <VerticalFader
                      value={gain}
                      onChange={v => onChannelGainChange(t.name, v)}
                      height={FADER_HEIGHT}
                      disabled={!en}
                      stopPropagation
                    />
                  </div>
                </div>
                <div className={`mixerIcon${sel ? ' selected' : ''}`}>{VOICE_ICONS[t.name] || '•'}</div>
                <div className="mixerLabel">{t.name.length > 5 ? t.name.slice(0, 4) : t.name}</div>
                <div className="mixerSends">
                  <div className="sendGrp">
                    <input type="range" className="slider sendSlider sendSliderVertical" min={0} max={1} step={0.01} value={dly}
                      onChange={e => onDelaySendChange(t.name, Number(e.target.value))} onClick={e => e.stopPropagation()} aria-label={`${t.name} delay send`} />
                    <span className="sendLabel">DLY</span>
                  </div>
                  <div className="sendGrp">
                    <input type="range" className="slider sendSlider sendSliderVertical" min={0} max={1} step={0.01} value={rev}
                      onChange={e => onReverbSendChange(t.name, Number(e.target.value))} onClick={e => e.stopPropagation()} aria-label={`${t.name} reverb send`} />
                    <span className="sendLabel">REV</span>
                  </div>
                  <div className="sendGrp">
                    <input type="range" className="slider sendSlider sendSliderVertical" min={0} max={1} step={0.01} value={pan}
                      onChange={e => onPanSendChange(t.name, Number(e.target.value))} onClick={e => e.stopPropagation()} aria-label={`${t.name} pan`} />
                    <span className="sendLabel">PAN</span>
                  </div>
                  <div className="sendGrp">
                    <input type="range" className="slider sendSlider sendSliderVertical" min={0} max={1} step={0.01} value={comp}
                      onChange={e => onCompSendChange(t.name, Number(e.target.value))} onClick={e => e.stopPropagation()} aria-label={`${t.name} comp`} />
                    <span className="sendLabel">COMP</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mixerMasterRow">
          <span className="mixerLabel" style={{ minWidth: 64 }}>MASTER OUT</span>
          <div className="masterBar"><div className="masterFill" style={{ width: isPlaying ? '72%' : '0%' }} /></div>
          <span className="mixerMasterDb">-3.2 dB</span>
        </div>
      </div>
    </div>
  );
}
