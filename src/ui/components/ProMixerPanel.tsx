import { Track } from '../../groove/generator';
import { usePeakMeter } from '../../hooks/usePeakMeter';
import { VerticalFader } from './VerticalFader';

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
      <div className="text-[8px] font-black uppercase text-center mb-2 truncate">{channelLabel}</div>
      <div className="bg-slate-50 dark:bg-slate-900/40 rounded p-1 mb-3 space-y-0.5 border border-slate-100 dark:border-slate-800">
        {['EQ', 'COMP', 'SAT', 'WIDTH'].map((label, i) => (
          <div key={label} className="border-b border-slate-100 dark:border-slate-800/50 py-1 flex items-center justify-between px-1 text-[7px] uppercase font-bold opacity-60">
            <span>{label}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-primary shadow-[0_0_4px_rgba(59,130,246,0.5)]' : 'bg-primary/20'}`} />
          </div>
        ))}
      </div>
      <div className="mb-3 space-y-2 px-1">
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between items-center text-[6px] opacity-40">
            <span>S1</span>
            <span className="font-mono">{s1 <= 0 ? 'OFF' : (s1 * 24 - 24).toFixed(0)}</span>
          </div>
          <div className="h-0.5 bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-primary/60 rounded-full transition-all" style={{ width: `${s1 * 100}%` }} />
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between items-center text-[6px] opacity-40">
            <span>S2</span>
            <span className="font-mono">{s2 <= 0 ? 'OFF' : (s2 * 24 - 24).toFixed(0)}</span>
          </div>
          <div className="h-0.5 bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-primary/60 rounded-full transition-all" style={{ width: `${s2 * 100}%` }} />
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-end gap-2 pb-1 min-h-[120px]">
        <div className="flex gap-1 mb-1">
          <button
            type="button"
            className={`w-6 h-4 border border-border-light dark:border-border-dark flex items-center justify-center rounded-sm text-[7px] font-bold transition-colors ${!enabled ? 'bg-red-500/80 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white'}`}
            onClick={(e) => { e.stopPropagation(); onLaneToggle(!enabled); }}
          >
            M
          </button>
          <button type="button" className="w-6 h-4 bg-slate-100 dark:bg-slate-800 border border-border-light dark:border-border-dark flex items-center justify-center rounded-sm text-[7px] font-bold hover:bg-yellow-500 hover:text-white transition-colors">
            S
          </button>
        </div>
        <div className="relative w-4 h-[100px] bg-slate-100 dark:bg-slate-900 border border-border-light dark:border-border-dark rounded flex flex-col justify-end p-0.5">
          <div className="absolute top-0 right-0.5 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
            <div className="absolute bottom-0 w-full bg-green-400 transition-all duration-75" style={{ height: `${peak * 100}%` }} />
          </div>
          <div className="relative z-10 flex justify-center h-full" style={{ opacity: enabled ? 1 : 0.4 }}>
            <VerticalFader value={gain} onChange={onGainChange} height={FADER_HEIGHT} disabled={!enabled} stopPropagation />
          </div>
        </div>
        <div className="text-[7px] font-mono opacity-50 mt-1">{dbStr}</div>
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
    <section className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark p-4 rounded shadow-sm overflow-hidden flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] opacity-60">Pro Mixer</h3>
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
