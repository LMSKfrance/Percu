import { useState } from 'react';

interface MasterFxRumbleProps {
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
}

export function MasterFxRumble({
  rumbleAmount, onRumbleAmountChange,
  rumbleTune, onRumbleTuneChange,
  rumbleWidth, onRumbleWidthChange,
  rumbleDecay, onRumbleDecayChange,
  rumbleDrive, onRumbleDriveChange,
}: MasterFxRumbleProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="masterFxRumble">
      <button
        type="button"
        className={`masterFxRumbleHeader ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="masterFxRumbleChevron" aria-hidden />
        <span className="paramLabel">Rumble</span>
        <span className="dspBadge">DSP soon</span>
      </button>
      {open && (
        <div className="masterFxRumbleBody">
          <div className="paramRow">
            <span className="paramLabel">Level</span>
            <input type="range" className="slider sliderCompact" min={0} max={1} step={0.01} value={rumbleAmount}
              onChange={e => onRumbleAmountChange(Number(e.target.value))} style={{ flex: 1 }} />
            <span className="paramVal valueMono">{rumbleAmount <= 0 ? '0' : '-3.2 dB'}</span>
          </div>
          <div className="paramRow">
            <span className="paramLabel">Tune</span>
            <input type="range" className="slider sliderCompact" min={0} max={1} step={0.01} value={rumbleTune}
              onChange={e => onRumbleTuneChange(Number(e.target.value))} style={{ flex: 1 }} />
            <span className="paramVal valueMono">{Math.round(rumbleTune * 100)}</span>
          </div>
          <div className="paramRow">
            <span className="paramLabel">Width</span>
            <input type="range" className="slider sliderCompact" min={0} max={1} step={0.01} value={rumbleWidth}
              onChange={e => onRumbleWidthChange(Number(e.target.value))} style={{ flex: 1 }} />
            <span className="paramVal valueMono">{Math.round(rumbleWidth * 100)}</span>
          </div>
          <div className="paramRow">
            <span className="paramLabel">Decay</span>
            <input type="range" className="slider sliderCompact" min={0} max={1} step={0.01} value={rumbleDecay}
              onChange={e => onRumbleDecayChange(Number(e.target.value))} style={{ flex: 1 }} />
            <span className="paramVal valueMono">{Math.round(rumbleDecay * 100)}</span>
          </div>
          <div className="paramRow">
            <span className="paramLabel">Drive</span>
            <input type="range" className="slider sliderCompact" min={0} max={1} step={0.01} value={rumbleDrive}
              onChange={e => onRumbleDriveChange(Number(e.target.value))} style={{ flex: 1 }} />
            <span className="paramVal valueMono">{Math.round(rumbleDrive * 100)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
