import { Track } from '../../groove/generator';
import { VOICE_ICONS } from '../constants';
import { usePeakMeter } from '../../hooks/usePeakMeter';
import { SegmentedPeakMeter } from './SegmentedPeakMeter';
import { VerticalFader } from './VerticalFader';

const FADER_HEIGHT = 88;
const METER_SEGMENTS = 10;

interface MixerStripProps {
  track: Track;
  enabled: boolean;
  selected: boolean;
  isPlaying: boolean;
  gain: number;
  onGainChange: (v: number) => void;
  delaySend: number;
  onDelaySendChange: (v: number) => void;
  reverbSend: number;
  onReverbSendChange: (v: number) => void;
  panSend: number;
  onPanSendChange: (v: number) => void;
  compSend: number;
  onCompSendChange: (v: number) => void;
  onLaneSelect: () => void;
  onLaneToggle: (enabled: boolean) => void;
}

export function MixerStrip({
  track,
  enabled,
  selected,
  isPlaying,
  gain,
  onGainChange,
  delaySend,
  onDelaySendChange,
  reverbSend,
  onReverbSendChange,
  panSend,
  onPanSendChange,
  compSend,
  onCompSendChange,
  onLaneSelect,
  onLaneToggle,
}: MixerStripProps) {
  const onSteps = track.steps.filter(s => s.on);
  const avgVel = onSteps.length ? onSteps.reduce((a, s) => a + s.vel, 0) / onSteps.length : 0;
  const baseLevel = gain * (0.12 + avgVel * 0.88);
  const peak = usePeakMeter({ isPlaying, enabled, baseLevel });

  const clip = false;

  return (
    <div
      className={`mixerStripRow${selected ? ' selected' : ''}`}
      onClick={onLaneSelect}
    >
      <div className="mixerStripRowLabel">
        <span className="mixerStripClip" data-clip={clip ? '1' : undefined} />
        <span className="mixerStripName">{track.name.length > 6 ? track.name.slice(0, 5) : track.name}</span>
        <div className="msGrp">
          <button
            type="button"
            className={`msBtn${!enabled ? ' active' : ''}`}
            onClick={e => { e.stopPropagation(); onLaneToggle(!enabled); }}
            aria-pressed={!enabled}
          >
            M
          </button>
          <button type="button" className="msBtn" onClick={e => e.stopPropagation()} aria-pressed={false}>
            S
          </button>
        </div>
      </div>
      <div className="mixerStripRowFaderArea">
        <SegmentedPeakMeter value={peak} height={FADER_HEIGHT} segments={METER_SEGMENTS} />
        <div className="mixerFaderWrap" style={{ opacity: enabled ? 1 : 0.35 }}>
          <VerticalFader
            value={gain}
            onChange={onGainChange}
            height={FADER_HEIGHT}
            disabled={!enabled}
            stopPropagation
          />
        </div>
      </div>
      <div className={`mixerIcon${selected ? ' selected' : ''}`}>{VOICE_ICONS[track.name] || '•'}</div>
      <div className="mixerStripRowSends">
        <div className="sendGrp sendGrpCompact">
          <input type="range" className="slider sliderCompact" min={0} max={1} step={0.01} value={delaySend}
            onChange={e => onDelaySendChange(Number(e.target.value))} onClick={e => e.stopPropagation()} aria-label={`${track.name} delay`} />
          <span className="sendLabel">DLY</span>
        </div>
        <div className="sendGrp sendGrpCompact">
          <input type="range" className="slider sliderCompact" min={0} max={1} step={0.01} value={reverbSend}
            onChange={e => onReverbSendChange(Number(e.target.value))} onClick={e => e.stopPropagation()} aria-label={`${track.name} reverb`} />
          <span className="sendLabel">REV</span>
        </div>
        <div className="sendGrp sendGrpCompact">
          <input type="range" className="slider sliderCompact" min={0} max={1} step={0.01} value={panSend}
            onChange={e => onPanSendChange(Number(e.target.value))} onClick={e => e.stopPropagation()} aria-label={`${track.name} pan`} />
          <span className="sendLabel">PAN</span>
        </div>
        <div className="sendGrp sendGrpCompact">
          <input type="range" className="slider sliderCompact" min={0} max={1} step={0.01} value={compSend}
            onChange={e => onCompSendChange(Number(e.target.value))} onClick={e => e.stopPropagation()} aria-label={`${track.name} comp`} />
          <span className="sendLabel">COMP</span>
        </div>
      </div>
    </div>
  );
}
