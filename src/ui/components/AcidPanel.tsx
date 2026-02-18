export function AcidPanel() {
  return (
    <section className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark p-4 rounded shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] opacity-60">Acid</h3>
        <span className="text-[7px] opacity-40 uppercase">DSP Soon</span>
      </div>
      <div className="space-y-8">
        <div>
          <span className="text-[8px] uppercase opacity-40 block mb-4">Tone / Res / Drive</span>
          <div className="flex justify-between relative px-2">
            <div className="flex flex-col items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mb-1" />
              <span className="text-[7px] font-mono opacity-40">50</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mb-1" />
              <span className="text-[7px] font-mono opacity-40">40</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mb-1" />
              <span className="text-[7px] font-mono opacity-40">30</span>
            </div>
            <div className="absolute top-[0.45rem] left-4 right-4 h-[1px] bg-slate-200 dark:bg-slate-800 -z-10" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] uppercase font-bold opacity-40">Mix</span>
          <div className="flex-1 relative h-1 bg-slate-200 dark:bg-slate-800 rounded">
            <div className="absolute left-1/2 -top-1 w-3 h-3 bg-primary rounded-full border-2 border-panel-light dark:border-panel-dark" />
          </div>
          <span className="text-[9px] font-mono opacity-40">28%</span>
        </div>
        <button type="button" className="flex items-center gap-1 opacity-40 cursor-pointer hover:opacity-100 transition-opacity">
          <span className="text-[8px] uppercase font-bold">Advanced</span>
          <span className="material-symbols-outlined text-[12px]">{'arrow_forward'}</span>
        </button>
      </div>
    </section>
  );
}
