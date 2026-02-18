const CHORD_COLORS = ['Minor 7th', 'Major 7th', 'Dominant 7th'];

export function ChordPanel() {
  return (
    <section className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark p-4 rounded shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 mb-4">Chord</h3>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase opacity-60">Color</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-36 justify-between">
            <span className="material-symbols-outlined text-xs cursor-pointer opacity-40">{'chevron_left'}</span>
            <span className="text-[10px] font-bold truncate">{CHORD_COLORS[0]}</span>
            <span className="material-symbols-outlined text-xs cursor-pointer opacity-40">{'chevron_right'}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {['Spread', 'Decay', 'Drive'].map((label) => (
            <div key={label} className="flex flex-col items-center">
              <span className="text-[8px] uppercase opacity-40 mb-2">{label}</span>
              <div className="relative w-8 h-8 rounded-full border border-border-light dark:border-border-dark flex items-center justify-center bg-panel-light dark:bg-panel-dark">
                <div className="absolute w-0.5 h-2 bg-primary -top-0.5 rounded-full" />
                <span className="text-[8px] font-bold font-mono">50</span>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-2">
          <div className="flex items-center gap-4">
            <span className="text-[9px] uppercase font-bold opacity-40">Noisy</span>
            <input type="range" className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded appearance-none accent-primary" min={0} max={1} step={0.01} defaultValue={0.2} />
            <span className="text-[9px] font-mono opacity-40">20</span>
          </div>
        </div>
      </div>
    </section>
  );
}
