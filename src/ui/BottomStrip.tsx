import { useState } from 'react';
import { useStore } from '../store/context';
import { LANE_IDS } from '../audio/types';
import type { LaneId } from '../audio/types';
import { SequencerFull } from './SequencerFull';
import { RadialDial } from './RadialDial';
import { SegmentedToggle } from './SegmentedToggle';
import { VerticalFader } from './VerticalFader';
import './styles/tokens.css';
import './styles/components.css';
import './BottomStrip.css';

/** Vertical channel strip: Mute, Solo, meter, fader, pan, D, R, CH COMP, CH FILT */
function MixerPanelVertical() {
  const { state, api } = useStore();
  const [activeLane, setActiveLane] = useState<LaneId | null>(null);
  const masterMeter = Math.max(0, ...LANE_IDS.map((id) => state.meterPeak[id] ?? 0));
  return (
    <div className="bottom-strip-mixer ui-panel">
      <div className="bottom-strip-mixer-title ui-panel__title">MIXER</div>
      <div className="bottom-strip-mixer-strips">
        <div className="bottom-strip-legend-row" aria-hidden>
          {LANE_IDS.map((lane) => (
            <span key={lane} className="bottom-strip-legend-cell">
              <span>D</span>
              <span>R</span>
            </span>
          ))}
        </div>
        <div className="bottom-strip-channels-row">
        {LANE_IDS.map((lane) => (
          <div
            key={lane}
            className={`bottom-strip-channel ${state.laneEnabled[lane] === false ? 'is-muted' : ''} ${state.laneSolo[lane] ? 'is-solo' : ''} ${activeLane === lane ? 'is-active' : ''}`}
          >
            <button
              type="button"
              className="bottom-strip-channel-name"
              onClick={() => setActiveLane(activeLane === lane ? null : lane)}
              title="Select lane"
            >
              {lane}
            </button>
            <SegmentedToggle
              options={[
                {
                  id: 'm',
                  label: 'M',
                  active: state.laneEnabled[lane] === false,
                  onClick: () => api.setLaneEnabled(lane, state.laneEnabled[lane] !== false ? false : true),
                  title: state.laneEnabled[lane] === false ? 'Unmute' : 'Mute',
                },
                {
                  id: 's',
                  label: 'S',
                  active: state.laneSolo[lane],
                  onClick: () => api.setLaneSolo(lane, !state.laneSolo[lane]),
                  title: 'Solo',
                  activeClass: 'is-solo is-active',
                },
              ]}
            />
            <div className="bottom-strip-meter-fader-row">
              <div className="ui-meter-v bottom-strip-meter-v">
                <div
                  className="ui-meter-v__fill bottom-strip-meter-fill"
                  style={{ height: `${Math.min(100, (state.meterPeak[lane] ?? 0) * 100)}%` }}
                />
              </div>
              <VerticalFader
                value={state.laneGain[lane] ?? 0.75}
                onChange={(v) => api.setLaneGain(lane, v)}
                defaultValue={0.75}
                title={lane}
              />
            </div>
            <div className="bottom-strip-knobs">
              <RadialDial
                value={state.lanePan[lane] ?? 0.5}
                onChange={(v) => api.setLanePan(lane, v)}
                label="Pan"
                bipolar
                defaultValue={0.5}
                className="ui-knob--small"
              />
              <div className="bottom-strip-send-cell">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={state.laneSend[lane] ?? 0}
                  onChange={(e) => api.setLaneSend(lane, Number(e.target.value))}
                  className="ui-slider bottom-strip-send-slider"
                  title="Delay send"
                />
              </div>
              <div className="bottom-strip-send-cell">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={state.laneSendR[lane] ?? 0}
                  onChange={(e) => api.setLaneSendR(lane, Number(e.target.value))}
                  className="ui-slider bottom-strip-send-slider"
                  title="Rumble send"
                />
              </div>
              <RadialDial
                value={state.laneCompAmount[lane] ?? 0}
                onChange={(v) => api.setLaneCompAmount(lane, v)}
                label="CH COMP"
                defaultValue={0}
                className="ui-knob--small"
              />
              <RadialDial
                value={state.laneFilterCutoff[lane] ?? 1}
                onChange={(v) => api.setLaneFilterCutoff(lane, v)}
                label="CH FILT"
                defaultValue={1}
                className="ui-knob--small"
              />
            </div>
          </div>
        ))}
        </div>
      </div>
      <div className="bottom-strip-mixer-master">
        <span className="bottom-strip-master-label ui-param-label">Master</span>
        <div className="ui-meter-v bottom-strip-master-meter">
          <div className="ui-meter-v__fill" style={{ height: `${Math.min(100, masterMeter * 100)}%` }} />
        </div>
        <VerticalFader
          value={state.masterGain}
          onChange={api.setMasterGain}
          defaultValue={0.75}
          title="Master"
        />
      </div>
    </div>
  );
}

/** Tools rack: Channel Dynamics, Channel Filters, Master Comp, Env Shaper, Master Filter, Master Delay */
function ToolsRackPanel() {
  const { state, api } = useStore();
  return (
    <div className="bottom-strip-tools">
      <div className="bottom-strip-tool-section">
        <div className="bottom-strip-tool-title">CH DYNAMICS</div>
        <div className="bottom-strip-tool-row">
          <span className="bottom-strip-tool-label">Amount</span>
          <input type="range" min={0} max={1} step={0.01} defaultValue={0} className="ui-slider" />
        </div>
      </div>
      <div className="bottom-strip-tool-section">
        <div className="bottom-strip-tool-title">CH FILTERS</div>
        <div className="bottom-strip-tool-row">
          <span className="bottom-strip-tool-label">Tone</span>
          <input type="range" min={0} max={1} step={0.01} defaultValue={1} className="ui-slider" />
        </div>
      </div>
      <div className="bottom-strip-tool-section">
        <div className="bottom-strip-tool-title">MASTER COMP</div>
        <div className="bottom-strip-tool-row">
          <span className="bottom-strip-tool-label">Thresh</span>
          <input type="range" min={-40} max={0} step={1} defaultValue={-12} className="ui-slider" />
          <span className="bottom-strip-tool-label">Ratio</span>
          <input type="range" min={1} max={20} step={0.5} defaultValue={4} className="ui-slider" />
        </div>
      </div>
      <div className="bottom-strip-tool-section">
        <div className="bottom-strip-tool-title">ENV SHAPER</div>
        <div className="bottom-strip-tool-row">
          <span className="bottom-strip-tool-label">Attack</span>
          <input
            type="range"
            min={0.001}
            max={1}
            step={0.01}
            value={state.masterEnvAttack}
            onChange={(e) => api.setMasterEnvAttack(Number(e.target.value))}
            className="ui-slider"
          />
          <span className="bottom-strip-tool-label">Release</span>
          <input
            type="range"
            min={0.01}
            max={2}
            step={0.01}
            value={state.masterEnvRelease}
            onChange={(e) => api.setMasterEnvRelease(Number(e.target.value))}
            className="ui-slider"
          />
        </div>
      </div>
      <div className="bottom-strip-tool-section">
        <div className="bottom-strip-tool-title">MASTER FILTER</div>
        <div className="bottom-strip-tool-row">
          <span className="bottom-strip-tool-label">Cutoff</span>
          <input type="range" min={0} max={10000} step={100} defaultValue={8000} className="ui-slider" />
          <span className="bottom-strip-tool-label">Res</span>
          <input type="range" min={0} max={1} step={0.01} defaultValue={0.3} className="ui-slider" />
        </div>
      </div>
      <div className="bottom-strip-tool-section">
        <div className="bottom-strip-tool-title">MASTER DELAY</div>
        <div className="bottom-strip-tool-row">
          <span className="bottom-strip-tool-label">Fdbk</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={state.delayFdbk}
            onChange={(e) => api.setDelayFdbk(Number(e.target.value))}
            className="ui-slider"
          />
          <span className="bottom-strip-tool-label">Wet</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={state.delayWet}
            onChange={(e) => api.setDelayWet(Number(e.target.value))}
            className="ui-slider"
          />
        </div>
      </div>
    </div>
  );
}

export function BottomStrip() {
  return (
    <div className="bottom-strip">
      <div className="bottom-strip-row-a">
        <div className="bottom-strip-sequencer-panel">
          <SequencerFull />
        </div>
        <div className="bottom-strip-mixer-panel">
          <MixerPanelVertical />
        </div>
      </div>
      <div className="bottom-strip-row-b">
        <ToolsRackPanel />
      </div>
    </div>
  );
}
