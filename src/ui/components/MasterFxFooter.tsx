import { useState } from 'react';

const SLIDER_WIDTH = 140;
const LABEL_WIDTH = 48;

interface MasterFxFooterProps {
  rumbleAmount: number;
  onRumbleAmountChange: (v: number) => void;
  rumbleTune: number;
  onRumbleTuneChange: (v: number) => void;
  rumbleWidth: number;
  onRumbleWidthChange: (v: number) => void;
  rumbleDecay: number;
  onRumbleDecayChange: (v: number) => void;
  rumbleDrive: number;
  onRumbleDriveChange: (v: number) => void;
  isPlaying: boolean;
}

function FxRow({ label, value, onChange, readout }: { label: string; value: number; onChange: (v: number) => void; readout: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[7px] uppercase font-bold flex-shrink-0" style={{ width: LABEL_WIDTH, color: 'var(--label)' }}>{label}</span>
      <input type="range" className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none accent-primary min-w-0" style={{ maxWidth: SLIDER_WIDTH }} min={0} max={1} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="text-[7px] font-mono flex-shrink-0 w-8" style={{ color: 'var(--muted)' }}>{readout}</span>
    </div>
  );
}

export function MasterFxFooter({
  rumbleAmount,
  onRumbleAmountChange,
  rumbleTune,
  onRumbleTuneChange,
  rumbleWidth,
  onRumbleWidthChange,
  rumbleDecay,
  onRumbleDecayChange,
  rumbleDrive,
  onRumbleDriveChange,
  isPlaying,
}: MasterFxFooterProps) {
  const [rumbleOpen, setRumbleOpen] = useState(false);
  const rumbleKnobs = [
    { key: 'Wet', value: rumbleAmount, onChange: onRumbleAmountChange, vertical: true },
    { key: 'Tune', value: rumbleTune, onChange: onRumbleTuneChange, vertical: false },
    { key: 'Width', value: rumbleWidth, onChange: onRumbleWidthChange, vertical: false },
    { key: 'Decay', value: rumbleDecay, onChange: onRumbleDecayChange, vertical: false },
    { key: 'Drive', value: rumbleDrive, onChange: onRumbleDriveChange, vertical: false },
  ] as const;

  return (
    <div className="flex-1 px-4 py-3 flex items-stretch gap-0 border-b border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-900/30 min-h-0">
      <div className="flex-1 grid grid-cols-3 gap-0 min-w-0">
        <section className="fx-block flex flex-col gap-3 border-r border-border-light dark:border-border-dark pr-4">
          <h4 className="text-[8px] uppercase font-black" style={{ color: 'var(--muted)' }}>Dynamics</h4>
          <div className="flex flex-col gap-2">
            <FxRow label="Thresh" value={0.4} onChange={() => {}} readout="-12" />
            <FxRow label="Ratio" value={0.5} onChange={() => {}} readout="4:1" />
          </div>
        </section>
        <section className="fx-block flex flex-col gap-3 border-r border-border-light dark:border-border-dark px-4">
          <h4 className="text-[8px] uppercase font-black" style={{ color: 'var(--muted)' }}>Shaper</h4>
          <div className="flex flex-col gap-2">
            <FxRow label="Drive" value={0.34} onChange={() => {}} readout="+3.4" />
            <FxRow label="Bias" value={0.5} onChange={() => {}} readout="0.0" />
          </div>
        </section>
        <section className="fx-block flex flex-col gap-2 pl-4">
          <button type="button" className="flex items-center gap-1 text-left w-full text-[8px] uppercase font-black transition-opacity hover:opacity-100 opacity-70" style={{ color: 'var(--muted)' }} onClick={() => setRumbleOpen((v) => !v)} aria-expanded={rumbleOpen}>
            Space {rumbleOpen ? '▼' : '▶'}
          </button>
          {rumbleOpen && (
            <div className="flex flex-wrap items-center gap-3">
              {rumbleKnobs.map(({ key, value, onChange, vertical }) => (
                <div key={key} className="flex flex-col gap-0.5 items-center">
                  <span className="text-[6px] uppercase font-bold" style={{ color: 'var(--label)' }}>{key}</span>
                  {vertical ? (
                    <div className="w-1.5 h-8 bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden">
                      <input type="range" className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize" min={0} max={1} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ writingMode: 'vertical-lr', direction: 'rtl' }} />
                      <div className="absolute bottom-0 left-0 right-0 bg-primary rounded-full pointer-events-none transition-all" style={{ height: `${value * 100}%` }} />
                    </div>
                  ) : (
                    <input type="range" className="rounded-full appearance-none bg-slate-100 dark:bg-slate-800 border border-border-light dark:border-border-dark cursor-ns-resize touch-none" style={{ writingMode: 'vertical-lr', direction: 'rtl', minWidth: 28, minHeight: 28, width: 28, height: 28 }} min={0} max={1} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} title={key} />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <div className="flex-shrink-0 flex items-center gap-3 pl-4 border-l border-border-light dark:border-border-dark">
        <div className="w-32 h-4 bg-slate-100 dark:bg-slate-900 border border-border-light dark:border-border-dark rounded flex items-center px-1 gap-0.5 overflow-hidden">
          <div className="h-2 flex-1 bg-primary/40 rounded max-w-[33%]" />
          <div className="h-2 flex-1 bg-primary rounded max-w-[50%]" />
        </div>
        <span className="text-xs font-bold font-mono tabular-nums" style={{ color: 'var(--accent)' }}>{isPlaying ? '-1.4' : '-∞'} dB</span>
      </div>
    </div>
  );
}
