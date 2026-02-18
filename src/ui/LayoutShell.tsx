import { ReactNode } from 'react';

interface LayoutShellProps {
  topBar: ReactNode;
  sequencer: ReactNode;
  mixer: ReactNode;
  masterFx: ReactNode;
  bottomRack: ReactNode;
}

export function LayoutShell({ topBar, sequencer, mixer, masterFx, bottomRack }: LayoutShellProps) {
  return (
    <div className="appFrame">
      {topBar}
      <div className="midRack">
        {sequencer}
        {mixer}
        {masterFx}
      </div>
      <div className="bottomRack">
        {bottomRack}
      </div>
    </div>
  );
}
