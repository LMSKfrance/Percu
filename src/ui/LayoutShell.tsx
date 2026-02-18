import { useRef, useCallback } from 'react';
import { ReactNode } from 'react';

interface LayoutShellProps {
  header: ReactNode;
  sequencer: ReactNode;
  mixer: ReactNode;
  percussion: ReactNode;
  chord: ReactNode;
  acid: ReactNode;
  laneInspector: ReactNode;
  masterFxFooter: ReactNode;
  statusBar: ReactNode;
}

export function LayoutShell({
  header,
  sequencer,
  mixer,
  percussion,
  chord,
  acid,
  laneInspector,
  masterFxFooter,
  statusBar,
}: LayoutShellProps) {
  const mainRef = useRef<HTMLElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLElement>) => {
    const el = mainRef.current;
    if (!el) return;
    if (e.shiftKey && (e.deltaX !== 0 || e.deltaY !== 0)) {
      e.preventDefault();
      el.scrollLeft += e.deltaX !== 0 ? e.deltaX : e.deltaY;
    }
  }, []);

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 h-screen overflow-hidden select-none flex flex-col">
      <div className="flex-shrink-0">{header}</div>
      <main
        ref={mainRef}
        className="main-content-scroll flex-1 min-h-0 p-4 overflow-x-auto overflow-y-auto"
        onWheel={handleWheel}
      >
        <div className="grid grid-cols-12 gap-4 min-w-[1280px]">
          <section className="col-span-12 lg:col-span-7 flex-shrink-0 min-w-0">
            {sequencer}
          </section>
          <section className="col-span-12 lg:col-span-5 flex-shrink-0 min-w-0">
            {mixer}
          </section>
          <section className="col-span-12 lg:col-span-3 min-w-0">
            {percussion}
          </section>
          <section className="col-span-12 lg:col-span-3 min-w-0">
            {chord}
          </section>
          <section className="col-span-12 lg:col-span-3 min-w-0">
            {acid}
          </section>
          <section className="col-span-12 lg:col-span-3 min-w-0">
            {laneInspector}
          </section>
        </div>
      </main>
      <footer className="h-28 flex-shrink-0 border-t border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark z-10 flex flex-col">
        {masterFxFooter}
        {statusBar}
      </footer>
    </div>
  );
}
