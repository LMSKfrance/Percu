import { Track } from '../../groove/generator';
import { usePeakMeter } from '../../hooks/usePeakMeter';
import { VerticalFader } from './VerticalFader';
import { ChannelMeter } from './ChannelMeter';

const PRO_CHANNELS = ['Kick', 'Sub', 'L-Perc', 'M-Perc', 'Hat', 'Noise', 'Aux 1', 'Aux 2'];
const FADER_HEIGHT = 100;

interface ProMixerPanelProps {
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

function ProMixerChannel({
  channelLabel,
  track,
  enabled,
  selected,
  isPlaying,
  gain,
  onGainChange,
  s1,
  s2,
  onS1Change,
  onS2Change,
  onLaneSelect,
  onLaneToggle,
}: {
  channelLabel: string;
  track: Track | undefined;
  enabled: boolean;
  selected: boolean;
  isPlaying: boolean;
  gain: number;
  onGainChange: (v: number) => void;
  s1: number;
  s2: number;
  onS1Change: (v: number) => void;
  onS2Change: (v: number) => void;
  onLaneSelect: () => void;
  onLaneToggle: (en: boolean) => void;
}) {
  const avgVel = track?.steps.filter((s) => s.on).reduce((a, s) => a + s.vel, 0) ?? 0;
  const stepCount = track?.steps.filter((s) => s.on).length ?? 0;
  const baseLevel = gain * (stepCount ? avgVel / stepCount * 0.88 + 0.12 : 0.1);
  const peak = usePeakMeter({ isPlaying, enabled, baseLevel });
  const dbVal = gain <= 0 ? -Infinity : Math.round(20 * Math.log10(gain + 0.001));
  const dbStr = dbVal === -Infinity ? '-∞' : `${dbVal > 0 ? '+' : ''}${dbVal.toFixed(1)}`;

  return (
    <div
      className={`flex flex-col flex-shrink-0 w-16 border-r border-border-light dark:border-border-dark last:border-0 pr-1 group cursor-pointer ${selected ? 'bg-slate-800/30 dark:bg-slate-700/20' : ''}`}
      onClick={onLaneSelect}
    >
      {/* Top: label + clip LED + M/S pills (min 28px) */}
      <div className="flex items-center justify-between gap-1 mb-2 min-h-[var(--hit-min,28px)]">
        <span className="text-[8px] font-black uppercase truncate flex-1">{channelLabel}</span>
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-red-500/80" title="Clip" aria-hidden style={{ pointerEvents: 'none' }} />
      </div>
      <div className="flex gap-1 mb-2">
        <button type="button" className={`btn-min min-w-[28px] min-h-[28px] flex items-center justify-center rounded-full text-[9px] font-bold transition-colors border ${!enabled ? 'bg-red-500/80 text-white border-red-500' : 'border-border-light dark:border-border-dark bg-slate-100 dark:bg-slate-800 hover:bg-red-500/20'}`} onClick={(e) => { e.stopPropagation(); onLaneToggle(!enabled); }} aria-pressed={!enabled}>M</button>
        <button type="button" className="btn-min min-w-[28px] min-h-[28px] flex items-center justify-center rounded-full border border-border-light dark:border-border-dark bg-slate-100 dark:bg-slate-800 hover:bg-yellow-500/20 text-[9px] font-bold transition-colors" onClick={(e) => e.stopPropagation()} aria-pressed={false}>S</button>
      </div>
      {/* Middle: meter behind, fader on top (pointer capture in VerticalFader) */}
      <div className="flex-1 flex flex-col items-center justify-end gap-1 pb-1 min-h-[120px]">
        <div className="relative w-4 flex justify-center" style={{ height: FADER_HEIGHT }}>
          <div className="absolute top-0 right-0 bottom-0 left-1/2 -translate-x-1/2 w-1.5 flex justify-center" style={{ pointerEvents: 'none' }}>
            <ChannelMeter value={peak} height={FADER_HEIGHT} clipThreshold={0.95} />
          </div>
          <div className="relative z-10 flex justify-center h-full" style={{ opacity: enabled ? 1 : 0.4 }}>
            <VerticalFader value={gain} onChange={onGainChange} height={FADER_HEIGHT} disabled={!enabled} stopPropagation />
          </div>
        </div>
        <div className="text-[7px] font-mono opacity-50 mt-1" style={{ color: 'var(--label)' }}>{dbStr}</div>
      </div>
      {/* Bottom: DLY / REV sends — min 28px touch target */}
      <div className="flex items-center justify-center gap-2 py-2 border-t border-border-light dark:border-border-dark">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[6px] uppercase font-bold" style={{ color: 'var(--label)' }}>DLY</span>
          <input type="range" min={0} max={1} step={0.01} value={s1} onChange={(e) => onS1Change(Number(e.target.value))} onClick={(e) => e.stopPropagation()} className="w-7 h-20 appearance-none bg-transparent cursor-ns-resize touch-none" style={{ writingMode: 'vertical-lr', direction: 'rtl', minHeight: 'var(--hit-min,28px)' }} />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[6px] uppercase font-bold" style={{ color: 'var(--label)' }}>REV</span>
          <input type="range" min={0} max={1} step={0.01} value={s2} onChange={(e) => onS2Change(Number(e.target.value))} onClick={(e) => e.stopPropagation()} className="w-7 h-20 appearance-none bg-transparent cursor-ns-resize touch-none" style={{ writingMode: 'vertical-lr', direction: 'rtl', minHeight: 'var(--hit-min,28px)' }} />
        </div>
      </div>
    </div>
  );
}

export function ProMixerPanel({
  tracks,
  laneToggles,
  onLaneToggle,
  selectedLane,
  onLaneSelect,
  isPlaying,
  channelGains,
  onChannelGainChange,
  delaySends,
  onDelaySendChange,
  reverbSends,
  onReverbSendChange,
  panSends,
  onPanSendChange,
  compSends,
  onCompSendChange,
}: ProMixerPanelProps) {
  const trackByName = Object.fromEntries(tracks.map((t) => [t.name, t]));
  const nameMap: Record<string, string> = {
    Kick: 'Kick',
    Sub: 'Sub',
    'Low Perc': 'L-Perc',
    'Mid Perc': 'M-Perc',
    Hat: 'Hat',
    Noise: 'Noise',
    Chord: 'Aux 1',
    Acid: 'Aux 2',
  };

  return (
    <section className="panel-container bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark overflow-hidden flex flex-col h-full min-h-0">
      <div className="panelHeader flex items-center justify-between mb-0">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--panel-title)' }}>Pro Mixer</h3>
        <div className="flex items-center gap-2">
          <span className="text-[8px] uppercase tracking-tighter opacity-40">View:</span>
          <button type="button" className="bg-primary/10 text-primary text-[8px] px-2 py-0.5 rounded border border-primary/20 font-bold">
            EXTENDED
          </button>
        </div>
      </div>
      <div className="flex-1 flex gap-2 overflow-x-auto pb-4 min-h-0">
        {PRO_CHANNELS.map((chLabel, idx) => {
          const trackName = Object.entries(nameMap).find(([, v]) => v === chLabel)?.[0] ?? chLabel;
          const track = trackByName[trackName] ?? trackByName[chLabel];
          const en = track ? (laneToggles.get(track.name) ?? true) : true;
          const selected = track ? selectedLane === track.name : false;
          const gain = track ? (channelGains.get(track.name) ?? 1) : 0.8;
          const s1 = track ? (delaySends.get(track.name) ?? 0) : 0.5;
          const s2 = track ? (reverbSends.get(track.name) ?? 0) : 0.3;
          return (
            <ProMixerChannel
              key={chLabel}
              channelLabel={chLabel}
              track={track}
              enabled={en}
              selected={selected}
              isPlaying={isPlaying}
              gain={gain}
              onGainChange={track ? (v) => onChannelGainChange(track.name, v) : () => {}}
              s1={s1}
              s2={s2}
              onS1Change={track ? (v) => onDelaySendChange(track.name, v) : () => {}}
              onS2Change={track ? (v) => onReverbSendChange(track.name, v) : () => {}}
              onLaneSelect={() => track && onLaneSelect(track.name)}
              onLaneToggle={track ? (en) => onLaneToggle(track.name, en) : () => {}}
            />
          );
        })}
      </div>
    </section>
  );
}
