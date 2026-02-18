import { useState, useEffect } from 'react';

export function StatusBar() {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0, f: 0 });
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((t) => {
        let f = t.f + 1;
        let s = t.s;
        let m = t.m;
        let h = t.h;
        if (f >= 24) { f = 0; s++; }
        if (s >= 60) { s = 0; m++; }
        if (m >= 60) { m = 0; h++; }
        return { h, m, s, f };
      });
    }, 42);
    return () => clearInterval(interval);
  }, []);

  const fmt = (n: number) => n.toString().padStart(2, '0');
  const timerStr = `${fmt(time.h)}:${fmt(time.m)}:${fmt(time.s)}:${fmt(time.f)}`;

  return (
    <div className="h-8 px-4 flex items-center justify-between text-[10px] font-medium opacity-50 bg-white dark:bg-slate-950">
      <div className="flex items-center gap-4">
        <span className="tracking-[0.15em]">PERCU.ENGINE: STABLE</span>
        <span className="flex items-center gap-1 opacity-70">
          <span className="w-1 h-1 rounded-full bg-primary" /> MIDI CLOCK SYNC
        </span>
      </div>
      <div className="flex items-center gap-6">
        <span>CPU: 12%</span>
        <span>RAM: 1.4GB</span>
        <span className="font-mono font-bold">{timerStr}</span>
      </div>
    </div>
  );
}
