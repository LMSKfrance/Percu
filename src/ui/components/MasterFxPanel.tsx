import { useState } from 'react';

interface MasterFxPanelProps {
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

function FxBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="masterFxBlock">
      <div className="masterFxBlockTitle">{title}</div>
      {children}
    </div>
  );
}

export function MasterFxPanel({
  rumbleAmount, onRumbleAmountChange,
  rumbleTune, onRumbleTuneChange,
  rumbleWidth, onRumbleWidthChange,
  rumbleDecay, onRumbleDecayChange,
  rumbleDrive, onRumbleDriveChange,
}: MasterFxPanelProps) {
  const [rumbleOpen, setRumbleOpen] = useState(false);

  return (
    <div className="panel">
      <div className="panelHeader">
        MASTER FX
        <span className="masterFxActiveBadge">Active</span>
      </div>
      <div className="panelBody masterFxBody">
        <div className="masterFxRow">
          <FxBlock title="Dynamics">
            <div className="paramRow">
              <span className="paramLabel">Thresh</span>
              <input type="range" className="slider" min={0} max={1} step={0.01} defaultValue={0.4} style={{ flex: 1 }} />
              <span className="paramVal">-12 dB</span>
            </div>
            <div className="paramRow">
              <span className="paramLabel">Ratio</span>
              <input type="range" className="slider" min={0} max={1} step={0.01} defaultValue={0.5} style={{ flex: 1 }} />
              <span className="paramVal">4:1</span>
            </div>
          </FxBlock>

          <FxBlock title="Shaper">
            <div className="paramRow">
              <span className="paramLabel">Drive</span>
              <input type="range" className="slider" min={0} max={1} step={0.01} defaultValue={0.5} style={{ flex: 1 }} />
              <span className="paramVal">50%</span>
            </div>
            <div className="paramRow">
              <span className="paramLabel">Bias</span>
              <input type="range" className="slider" min={0} max={1} step={0.01} defaultValue={0.48} style={{ flex: 1 }} />
              <span className="paramVal">-6.5%</span>
            </div>
          </FxBlock>

          <FxBlock title="Space">
            <div className="paramRow">
              <span className="paramLabel">D Mix</span>
              <input type="range" className="slider" min={0} max={1} step={0.01} defaultValue={0.16} style={{ flex: 1 }} />
              <span className="paramVal">16%</span>
            </div>
            <div className="paramRow">
              <span className="paramLabel">R Mix</span>
              <input type="range" className="slider" min={0} max={1} step={0.01} defaultValue={0.18} style={{ flex: 1 }} />
              <span className="paramVal">18%</span>
            </div>
          </FxBlock>
        </div>

        <div className="masterFxRumble">
          <button
            type="button"
            className={`masterFxRumbleHeader ${rumbleOpen ? 'open' : ''}`}
            onClick={() => setRumbleOpen(!rumbleOpen)}
            aria-expanded={rumbleOpen}
          >
            <span className="masterFxRumbleChevron" aria-hidden />
            <span className="paramLabel">Rumble</span>
            <span className="dspBadge">DSP soon</span>
          </button>
          {rumbleOpen && (
            <div className="masterFxRumbleBody">
              <div className="paramRow">
                <span className="paramLabel">Level</span>
                <input type="range" className="slider" min={0} max={1} step={0.01} value={rumbleAmount}
                  onChange={e => onRumbleAmountChange(Number(e.target.value))} style={{ flex: 1 }} />
                <span className="paramVal">{rumbleAmount <= 0 ? '0' : '-3.2 dB'}</span>
              </div>
              <div className="paramRow">
                <span className="paramLabel">Tune</span>
                <input type="range" className="slider" min={0} max={1} step={0.01} value={rumbleTune}
                  onChange={e => onRumbleTuneChange(Number(e.target.value))} style={{ flex: 1 }} />
                <span className="paramVal">{Math.round(rumbleTune * 100)}</span>
              </div>
              <div className="paramRow">
                <span className="paramLabel">Width</span>
                <input type="range" className="slider" min={0} max={1} step={0.01} value={rumbleWidth}
                  onChange={e => onRumbleWidthChange(Number(e.target.value))} style={{ flex: 1 }} />
                <span className="paramVal">{Math.round(rumbleWidth * 100)}</span>
              </div>
              <div className="paramRow">
                <span className="paramLabel">Decay</span>
                <input type="range" className="slider" min={0} max={1} step={0.01} value={rumbleDecay}
                  onChange={e => onRumbleDecayChange(Number(e.target.value))} style={{ flex: 1 }} />
                <span className="paramVal">{Math.round(rumbleDecay * 100)}</span>
              </div>
              <div className="paramRow">
                <span className="paramLabel">Drive</span>
                <input type="range" className="slider" min={0} max={1} step={0.01} value={rumbleDrive}
                  onChange={e => onRumbleDriveChange(Number(e.target.value))} style={{ flex: 1 }} />
                <span className="paramVal">{Math.round(rumbleDrive * 100)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
