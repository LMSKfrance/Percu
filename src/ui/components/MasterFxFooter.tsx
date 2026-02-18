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
  return (
    <div className="flex-1 px-4 flex items-center justify-between gap-8 border-b border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-900/30">
      <div className="flex flex-col gap-1 w-24">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Master FX</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
          <span className="text-[8px] font-bold uppercase opacity-60">Engine Link</span>
        </div>
      </div>
      <div className="flex items-center gap-6 border-l border-border-light dark:border-border-dark pl-6 h-12">
        <span className="text-[8px] uppercase font-black opacity-40 rotate-180 [writing-mode:vertical-lr]">Dynamics</span>
        <div className="flex flex-col gap-3 w-40">
          <div className="flex items-center gap-3">
            <span className="text-[7px] uppercase font-bold opacity-60 w-8">Thresh</span>
            <input type="range" className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none accent-primary" min={0} max={1} step={0.01} defaultValue={0.4} />
            <span className="text-[7px] font-mono opacity-60 w-6">-12</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[7px] uppercase font-bold opacity-60 w-8">Ratio</span>
            <input type="range" className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none accent-primary" min={0} max={1} step={0.01} defaultValue={0.5} />
            <span className="text-[7px] font-mono opacity-60 w-6">4:1</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 border-l border-border-light dark:border-border-dark pl-6 h-12">
        <span className="text-[8px] uppercase font-black opacity-40 rotate-180 [writing-mode:vertical-lr]">Shaper</span>
        <div className="flex flex-col gap-3 w-40">
          <div className="flex items-center gap-3">
            <span className="text-[7px] uppercase font-bold opacity-60 w-8">Drive</span>
            <input type="range" className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none accent-primary" min={0} max={1} step={0.01} defaultValue={0.34} />
            <span className="text-[7px] font-mono opacity-60 w-6">+3.4</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[7px] uppercase font-bold opacity-60 w-8">Bias</span>
            <input type="range" className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none accent-primary" min={0} max={1} step={0.01} defaultValue={0.5} />
            <span className="text-[7px] font-mono opacity-60 w-6">0.0</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 border-l border-border-light dark:border-border-dark pl-6 h-12">
        <span className="text-[8px] uppercase font-black opacity-40 rotate-180 [writing-mode:vertical-lr]">Space</span>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <button type="button" className="w-8 h-8 rounded border border-border-light dark:border-border-dark flex items-center justify-center opacity-60 hover:opacity-100 text-[7px] font-bold">
              RUM
            </button>
            <div className="w-1.5 h-8 bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden">
              <input type="range" className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize" min={0} max={1} step={0.01} value={rumbleAmount} onChange={(e) => onRumbleAmountChange(Number(e.target.value))} style={{ writingMode: 'vertical-lr', direction: 'rtl' }} />
              <div className="absolute bottom-0 left-0 right-0 bg-primary rounded-full pointer-events-none transition-all" style={{ height: `${rumbleAmount * 100}%` }} />
            </div>
          </div>
          <span className="text-[6px] font-bold uppercase text-center opacity-40">Wet</span>
        </div>
      </div>
      <div className="flex-1 max-w-xs flex items-center gap-4 border-l border-border-light dark:border-border-dark pl-6">
        <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-900 border border-border-light dark:border-border-dark rounded-sm relative overflow-hidden flex items-center px-1 gap-0.5">
          <div className="h-2 flex-1 bg-primary/40 rounded-full max-w-[33%]" />
          <div className="h-2 flex-1 bg-primary rounded-full max-w-[50%]" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-30">MASTER OUTPUT</span>
          </div>
        </div>
        <span className="text-xs font-bold font-mono text-primary">{isPlaying ? '-1.4' : '-∞'} dB</span>
      </div>
    </div>
  );
}
