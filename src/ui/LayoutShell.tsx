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
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 min-h-screen overflow-hidden select-none flex flex-col">
      {header}
      <main className="flex-1 p-4 grid grid-cols-12 gap-4 overflow-y-auto pb-28">
        <section className="col-span-12 lg:col-span-7">
          {sequencer}
        </section>
        <section className="col-span-12 lg:col-span-5">
          {mixer}
        </section>
        <section className="col-span-12 lg:col-span-3">
          {percussion}
        </section>
        <section className="col-span-12 lg:col-span-3">
          {chord}
        </section>
        <section className="col-span-12 lg:col-span-3">
          {acid}
        </section>
        <section className="col-span-12 lg:col-span-3">
          {laneInspector}
        </section>
      </main>
      <footer className="h-28 border-t border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark fixed bottom-0 left-0 right-0 z-50 flex flex-col">
        {masterFxFooter}
        {statusBar}
      </footer>
    </div>
  );
}
