import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import type { LaneId, Pattern, Step, ScaleType } from '../audio/types';
import {
  createEmptyPattern,
  createEmptyStep,
  LANE_IDS,
} from '../audio/types';
import { audioEngine } from '../audio/engine';
import {
  generatePatternFromSeed,
  randomisePercFromSeed,
  randomiseTonalFromSeed,
  generateNewSeed,
} from '../audio/grooveGenerator';

export type ChordSynthType = 'analog' | 'fm' | 'prophet';

export type StoreState = {
  pattern: Pattern;
  playing: boolean;
  currentStep: number;
  bpm: number;
  startOffsetSteps: number;
  laneEnabled: Record<LaneId, boolean>;
  selectedCell: { lane: LaneId; stepIndex: number } | null;
  seed: string;
  world: number;
  masterRoot: string;
  masterScale: ScaleType;
  chordProgression: number;
  chordSynth: ChordSynthType;
  laneGain: Record<LaneId, number>;
  delayFdbk: number;
  delayWet: number;
  masterGain: number;
  percNoisy: number;
  density: number;
  closeFar: number;
  swing: number;
  percVoiceLow: string;
  percVoiceMid: string;
  laneSend: Record<LaneId, number>;
  laneEqHi: Record<LaneId, number>;
  laneEqLow: Record<LaneId, number>;
  meterPeak: Record<LaneId, number>;
  lanePan: Record<LaneId, number>;
  laneSolo: Record<LaneId, boolean>;
  laneSendR: Record<LaneId, number>;
  laneCompAmount: Record<LaneId, number>;
  laneFilterCutoff: Record<LaneId, number>;
  masterEnvAttack: number;
  masterEnvRelease: number;
};

const defaultLaneEnabled: Record<LaneId, boolean> = Object.fromEntries(
  LANE_IDS.map((id) => [id, true])
) as Record<LaneId, boolean>;

const defaultLaneGain: Record<LaneId, number> = Object.fromEntries(
  LANE_IDS.map((id) => [id, 0.75])
) as Record<LaneId, number>;

const initialState: StoreState = {
  pattern: generatePatternFromSeed('default'),
  playing: false,
  currentStep: 0,
  bpm: 128,
  startOffsetSteps: 0,
  laneEnabled: { ...defaultLaneEnabled },
  selectedCell: null,
  seed: 'default',
  world: 0.5,
  masterRoot: 'C',
  masterScale: 'Minor',
  chordProgression: 0.5,
  chordSynth: 'prophet',
  laneGain: { ...defaultLaneGain },
  delayFdbk: 0.75,
  delayWet: 0.25,
  masterGain: 0.75,
  percNoisy: 0.5,
  density: 0.7,
  closeFar: 0,
  swing: 0.5,
  percVoiceLow: 'default',
  percVoiceMid: 'default',
  laneSend: Object.fromEntries(LANE_IDS.map((id) => [id, 0])) as Record<LaneId, number>,
  laneEqHi: Object.fromEntries(LANE_IDS.map((id) => [id, 0.5])) as Record<LaneId, number>,
  laneEqLow: Object.fromEntries(LANE_IDS.map((id) => [id, 0.5])) as Record<LaneId, number>,
  meterPeak: Object.fromEntries(LANE_IDS.map((id) => [id, 0])) as Record<LaneId, number>,
  lanePan: Object.fromEntries(LANE_IDS.map((id) => [id, 0.5])) as Record<LaneId, number>,
  laneSolo: Object.fromEntries(LANE_IDS.map((id) => [id, false])) as Record<LaneId, boolean>,
  laneSendR: Object.fromEntries(LANE_IDS.map((id) => [id, 0])) as Record<LaneId, number>,
  laneCompAmount: Object.fromEntries(LANE_IDS.map((id) => [id, 0])) as Record<LaneId, number>,
  laneFilterCutoff: Object.fromEntries(LANE_IDS.map((id) => [id, 1])) as Record<LaneId, number>,
  masterEnvAttack: 0.01,
  masterEnvRelease: 0.2,
};

type Action =
  | { type: 'SET_PATTERN'; payload: Pattern }
  | { type: 'SET_STEP'; payload: { lane: LaneId; stepIndex: number; step: Step } }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_BPM'; payload: number }
  | { type: 'SET_START_OFFSET'; payload: number }
  | { type: 'SET_LANE_ENABLED'; payload: { lane: LaneId; on: boolean } }
  | { type: 'SET_LANES'; payload: Record<LaneId, boolean> }
  | { type: 'SELECT_CELL'; payload: { lane: LaneId; stepIndex: number } | null }
  | { type: 'SET_SEED'; payload: string }
  | { type: 'SET_WORLD'; payload: number }
  | { type: 'SET_MASTER_ROOT'; payload: string }
  | { type: 'SET_MASTER_SCALE'; payload: ScaleType }
  | { type: 'SET_CHORD_PROGRESSION'; payload: number }
  | { type: 'SET_CHORD_SYNTH'; payload: ChordSynthType }
  | { type: 'SET_LANE_GAIN'; payload: { lane: LaneId; value: number } }
  | { type: 'SET_DELAY_FDBK'; payload: number }
  | { type: 'SET_DELAY_WET'; payload: number }
  | { type: 'SET_MASTER_GAIN'; payload: number }
  | { type: 'SET_PERC_NOISY'; payload: number }
  | { type: 'SET_DENSITY'; payload: number }
  | { type: 'SET_CLOSE_FAR'; payload: number }
  | { type: 'SET_SWING'; payload: number }
  | { type: 'SET_PERC_VOICE_LOW'; payload: string }
  | { type: 'SET_PERC_VOICE_MID'; payload: string }
  | { type: 'SET_LANE_SEND'; payload: { lane: LaneId; value: number } }
  | { type: 'SET_LANE_EQ_HI'; payload: { lane: LaneId; value: number } }
  | { type: 'SET_LANE_EQ_LOW'; payload: { lane: LaneId; value: number } }
  | { type: 'SET_METER_PEAK'; payload: { lane: LaneId; value: number } }
  | { type: 'DECAY_METER_PEAKS' }
  | { type: 'SET_LANE_PAN'; payload: { lane: LaneId; value: number } }
  | { type: 'SET_LANE_SOLO'; payload: { lane: LaneId; on: boolean } }
  | { type: 'SET_LANE_SEND_R'; payload: { lane: LaneId; value: number } }
  | { type: 'SET_LANE_COMP_AMOUNT'; payload: { lane: LaneId; value: number } }
  | { type: 'SET_LANE_FILTER_CUTOFF'; payload: { lane: LaneId; value: number } }
  | { type: 'SET_MASTER_ENV_ATTACK'; payload: number }
  | { type: 'SET_MASTER_ENV_RELEASE'; payload: number };

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'SET_PATTERN':
      return { ...state, pattern: action.payload };
    case 'SET_STEP': {
      const { lane, stepIndex, step } = action.payload;
      const laneSteps = [...(state.pattern[lane] ?? [])];
      if (stepIndex >= 0 && stepIndex < 16) {
        laneSteps[stepIndex] = step;
      }
      return {
        ...state,
        pattern: { ...state.pattern, [lane]: laneSteps },
      };
    }
    case 'SET_PLAYING':
      return { ...state, playing: action.payload };
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_BPM':
      return { ...state, bpm: action.payload };
    case 'SET_START_OFFSET':
      return { ...state, startOffsetSteps: action.payload };
    case 'SET_LANE_ENABLED': {
      const next = { ...state.laneEnabled, [action.payload.lane]: action.payload.on };
      return { ...state, laneEnabled: next };
    }
    case 'SET_LANES':
      return { ...state, laneEnabled: action.payload };
    case 'SELECT_CELL':
      return { ...state, selectedCell: action.payload };
    case 'SET_SEED':
      return { ...state, seed: action.payload };
    case 'SET_WORLD':
      return { ...state, world: action.payload };
    case 'SET_MASTER_ROOT':
      return { ...state, masterRoot: action.payload };
    case 'SET_MASTER_SCALE':
      return { ...state, masterScale: action.payload };
    case 'SET_CHORD_PROGRESSION':
      return { ...state, chordProgression: action.payload };
    case 'SET_CHORD_SYNTH':
      return { ...state, chordSynth: action.payload };
    case 'SET_LANE_GAIN': {
      const next = { ...state.laneGain, [action.payload.lane]: action.payload.value };
      return { ...state, laneGain: next };
    }
    case 'SET_DELAY_FDBK':
      return { ...state, delayFdbk: action.payload };
    case 'SET_DELAY_WET':
      return { ...state, delayWet: action.payload };
    case 'SET_MASTER_GAIN':
      return { ...state, masterGain: action.payload };
    case 'SET_PERC_NOISY':
      return { ...state, percNoisy: Math.max(0, Math.min(1, action.payload)) };
    case 'SET_DENSITY':
      return { ...state, density: Math.max(0, Math.min(1, action.payload)) };
    case 'SET_CLOSE_FAR':
      return { ...state, closeFar: Math.max(0, Math.min(1, action.payload)) };
    case 'SET_SWING':
      return { ...state, swing: Math.max(0, Math.min(1, action.payload)) };
    case 'SET_PERC_VOICE_LOW':
      return { ...state, percVoiceLow: action.payload };
    case 'SET_PERC_VOICE_MID':
      return { ...state, percVoiceMid: action.payload };
    case 'SET_LANE_SEND': {
      const next = { ...state.laneSend, [action.payload.lane]: action.payload.value };
      return { ...state, laneSend: next };
    }
    case 'SET_LANE_EQ_HI': {
      const next = { ...state.laneEqHi, [action.payload.lane]: action.payload.value };
      return { ...state, laneEqHi: next };
    }
    case 'SET_LANE_EQ_LOW': {
      const next = { ...state.laneEqLow, [action.payload.lane]: action.payload.value };
      return { ...state, laneEqLow: next };
    }
    case 'SET_METER_PEAK': {
      const next = { ...state.meterPeak, [action.payload.lane]: action.payload.value };
      return { ...state, meterPeak: next };
    }
    case 'DECAY_METER_PEAKS': {
      const next = { ...state.meterPeak };
      LANE_IDS.forEach((lane) => {
        const v = next[lane] ?? 0;
        next[lane] = Math.max(0, v * 0.92);
      });
      return { ...state, meterPeak: next };
    }
    case 'SET_LANE_PAN': {
      const next = { ...state.lanePan, [action.payload.lane]: Math.max(0, Math.min(1, action.payload.value)) };
      return { ...state, lanePan: next };
    }
    case 'SET_LANE_SOLO': {
      const next = { ...state.laneSolo, [action.payload.lane]: action.payload.on };
      return { ...state, laneSolo: next };
    }
    case 'SET_LANE_SEND_R': {
      const next = { ...state.laneSendR, [action.payload.lane]: Math.max(0, Math.min(1, action.payload.value)) };
      return { ...state, laneSendR: next };
    }
    case 'SET_LANE_COMP_AMOUNT': {
      const next = { ...state.laneCompAmount, [action.payload.lane]: Math.max(0, Math.min(1, action.payload.value)) };
      return { ...state, laneCompAmount: next };
    }
    case 'SET_LANE_FILTER_CUTOFF': {
      const next = { ...state.laneFilterCutoff, [action.payload.lane]: Math.max(0, Math.min(1, action.payload.value)) };
      return { ...state, laneFilterCutoff: next };
    }
    case 'SET_MASTER_ENV_ATTACK':
      return { ...state, masterEnvAttack: Math.max(0.001, Math.min(1, action.payload)) };
    case 'SET_MASTER_ENV_RELEASE':
      return { ...state, masterEnvRelease: Math.max(0.01, Math.min(2, action.payload)) };
    default:
      return state;
  }
}

type StoreApi = {
  setPattern: (p: Pattern) => void;
  setStep: (lane: LaneId, stepIndex: number, step: Step) => void;
  setPlaying: (on: boolean) => void;
  setBPM: (bpm: number) => void;
  setStartOffsetSteps: (n: number) => void;
  setLaneEnabled: (lane: LaneId, on: boolean) => void;
  selectCell: (lane: LaneId | null, stepIndex: number | null) => void;
  createStep: (lane: LaneId, stepIndex: number) => void;
  deleteStep: (lane: LaneId, stepIndex: number) => void;
  setSeed: (seed: string) => void;
  newSeedAndGenerate: () => void;
  randomisePattern: () => void;
  randomisePerc: () => void;
  randomiseFilter: () => void;
  setWorld: (v: number) => void;
  setMasterRoot: (v: string) => void;
  setMasterScale: (v: ScaleType) => void;
  setChordProgression: (v: number) => void;
  setChordSynth: (v: ChordSynthType) => void;
  setLaneGain: (lane: LaneId, value: number) => void;
  setDelayFdbk: (v: number) => void;
  setDelayWet: (v: number) => void;
  setMasterGain: (v: number) => void;
  setPercNoisy: (v: number) => void;
  setDensity: (v: number) => void;
  setCloseFar: (v: number) => void;
  setSwing: (v: number) => void;
  setPercVoiceLow: (v: string) => void;
  setPercVoiceMid: (v: string) => void;
  setLaneSend: (lane: LaneId, value: number) => void;
  setLaneEqHi: (lane: LaneId, value: number) => void;
  setLaneEqLow: (lane: LaneId, value: number) => void;
  setMeterPeak: (lane: LaneId, value: number) => void;
  setLanePan: (lane: LaneId, value: number) => void;
  setLaneSolo: (lane: LaneId, on: boolean) => void;
  setLaneSendR: (lane: LaneId, value: number) => void;
  setLaneCompAmount: (lane: LaneId, value: number) => void;
  setLaneFilterCutoff: (lane: LaneId, value: number) => void;
  setMasterEnvAttack: (v: number) => void;
  setMasterEnvRelease: (v: number) => void;
};

const StoreContext = createContext<{ state: StoreState; api: StoreApi } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    audioEngine.init();
    audioEngine.setPattern(state.pattern);
    audioEngine.setBPM(state.bpm);
    audioEngine.setStartOffsetSteps(state.startOffsetSteps);
    audioEngine.setLanes(state.laneEnabled);
  }, []);

  useEffect(() => {
    audioEngine.setPattern(state.pattern);
  }, [state.pattern]);

  useEffect(() => {
    audioEngine.setBPM(state.bpm);
  }, [state.bpm]);

  useEffect(() => {
    audioEngine.setStartOffsetSteps(state.startOffsetSteps);
  }, [state.startOffsetSteps]);

  useEffect(() => {
    audioEngine.setLanes(state.laneEnabled);
  }, [state.laneEnabled]);

  useEffect(() => {
    audioEngine.setWorld(state.world);
  }, [state.world]);
  useEffect(() => {
    audioEngine.setMasterScale(state.masterRoot, state.masterScale);
  }, [state.masterRoot, state.masterScale]);
  useEffect(() => {
    audioEngine.setChordProgression(state.chordProgression);
  }, [state.chordProgression]);
  useEffect(() => {
    audioEngine.setChordSynth(state.chordSynth);
  }, [state.chordSynth]);
  useEffect(() => {
    LANE_IDS.forEach((lane) => audioEngine.setLaneGain(lane, state.laneGain[lane] ?? 0.75));
  }, [state.laneGain]);
  useEffect(() => {
    audioEngine.setDelayParams(state.delayFdbk, state.delayWet);
  }, [state.delayFdbk, state.delayWet]);
  useEffect(() => {
    audioEngine.setMasterGain(state.masterGain);
  }, [state.masterGain]);
  useEffect(() => {
    audioEngine.setPercNoisy(state.percNoisy);
  }, [state.percNoisy]);
  useEffect(() => {
    audioEngine.setDensity(state.density);
  }, [state.density]);
  useEffect(() => {
    audioEngine.setCloseFar(state.closeFar);
  }, [state.closeFar]);
  useEffect(() => {
    audioEngine.setSwing(state.swing);
  }, [state.swing]);
  useEffect(() => {
    audioEngine.setPercVoiceLow(state.percVoiceLow);
  }, [state.percVoiceLow]);
  useEffect(() => {
    audioEngine.setPercVoiceMid(state.percVoiceMid);
  }, [state.percVoiceMid]);
  useEffect(() => {
    LANE_IDS.forEach((lane) => audioEngine.setLanePan?.(lane, state.lanePan[lane] ?? 0.5));
  }, [state.lanePan]);
  useEffect(() => {
    LANE_IDS.forEach((lane) => audioEngine.setLaneSolo?.(lane, state.laneSolo[lane] ?? false));
  }, [state.laneSolo]);
  useEffect(() => {
    LANE_IDS.forEach((lane) => audioEngine.setLaneSendR?.(lane, state.laneSendR[lane] ?? 0));
  }, [state.laneSendR]);
  useEffect(() => {
    LANE_IDS.forEach((lane) => audioEngine.setLaneCompAmount?.(lane, state.laneCompAmount[lane] ?? 0));
  }, [state.laneCompAmount]);
  useEffect(() => {
    LANE_IDS.forEach((lane) => audioEngine.setLaneFilterCutoff?.(lane, state.laneFilterCutoff[lane] ?? 1));
  }, [state.laneFilterCutoff]);
  useEffect(() => {
    audioEngine.setMasterEnvAttack?.(state.masterEnvAttack);
  }, [state.masterEnvAttack]);
  useEffect(() => {
    audioEngine.setMasterEnvRelease?.(state.masterEnvRelease);
  }, [state.masterEnvRelease]);

  useEffect(() => {
    audioEngine.onStep = (stepIndex) => dispatch({ type: 'SET_CURRENT_STEP', payload: stepIndex });
    audioEngine.onTriggerLane = (lane, vel) => dispatch({ type: 'SET_METER_PEAK', payload: { lane, value: vel } });
    return () => {
      audioEngine.onStep = undefined;
      audioEngine.onTriggerLane = undefined;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'DECAY_METER_PEAKS' }), 50);
    return () => clearInterval(id);
  }, []);

  const setPattern = useCallback((p: Pattern) => dispatch({ type: 'SET_PATTERN', payload: p }), []);
  const setStep = useCallback((lane: LaneId, stepIndex: number, step: Step) => {
    dispatch({ type: 'SET_STEP', payload: { lane, stepIndex, step } });
  }, []);
  const setPlaying = useCallback((on: boolean) => {
    dispatch({ type: 'SET_PLAYING', payload: on });
    if (on) {
      audioEngine.resume().then(() => audioEngine.play());
    } else {
      audioEngine.stop();
    }
  }, []);
  const setBPM = useCallback((bpm: number) => dispatch({ type: 'SET_BPM', payload: bpm }), []);
  const setStartOffsetSteps = useCallback((n: number) => {
    const clamped = ((n % 16) + 16) % 16;
    dispatch({ type: 'SET_START_OFFSET', payload: clamped });
    audioEngine.setStartOffsetSteps(clamped);
  }, []);
  const setLaneEnabled = useCallback((lane: LaneId, on: boolean) => {
    dispatch({ type: 'SET_LANE_ENABLED', payload: { lane, on } });
    audioEngine.setLaneEnabled(lane, on);
  }, []);
  const selectCell = useCallback((lane: LaneId | null, stepIndex: number | null) => {
    dispatch({
      type: 'SELECT_CELL',
      payload: lane != null && stepIndex != null ? { lane, stepIndex } : null,
    });
  }, []);
  const createStep = useCallback((lane: LaneId, stepIndex: number) => {
    const step: Step = { ...createEmptyStep(), on: true, vel: 0.8, ratchet: 0, micro: 0 };
    dispatch({ type: 'SET_STEP', payload: { lane, stepIndex, step } });
  }, []);
  const deleteStep = useCallback((lane: LaneId, stepIndex: number) => {
    const step: Step = { ...createEmptyStep(), on: false };
    dispatch({ type: 'SET_STEP', payload: { lane, stepIndex, step } });
  }, []);

  const setSeed = useCallback((seed: string) => {
    dispatch({ type: 'SET_SEED', payload: seed });
  }, []);

  const newSeedAndGenerate = useCallback(() => {
    const seed = generateNewSeed();
    const { world, chordProgression } = stateRef.current;
    dispatch({ type: 'SET_SEED', payload: seed });
    const pattern = generatePatternFromSeed(seed, { world, chordProgression });
    dispatch({ type: 'SET_PATTERN', payload: pattern });
  }, []);

  const randomisePattern = useCallback(() => {
    const { seed, world, chordProgression } = stateRef.current;
    const pattern = generatePatternFromSeed(seed, { world, chordProgression });
    dispatch({ type: 'SET_PATTERN', payload: pattern });
  }, []);

  const randomisePerc = useCallback(() => {
    const { seed, pattern } = stateRef.current;
    const next = randomisePercFromSeed(seed, pattern);
    dispatch({ type: 'SET_PATTERN', payload: next });
  }, []);

  const randomiseFilter = useCallback(() => {
    const { seed, pattern } = stateRef.current;
    const next = randomiseTonalFromSeed(seed, pattern);
    dispatch({ type: 'SET_PATTERN', payload: next });
  }, []);

  const setWorld = useCallback((v: number) => dispatch({ type: 'SET_WORLD', payload: Math.max(0, Math.min(1, v)) }), []);
  const setMasterRoot = useCallback((v: string) => dispatch({ type: 'SET_MASTER_ROOT', payload: v }), []);
  const setMasterScale = useCallback((v: ScaleType) => dispatch({ type: 'SET_MASTER_SCALE', payload: v }), []);
  const setChordProgression = useCallback((v: number) => dispatch({ type: 'SET_CHORD_PROGRESSION', payload: Math.max(0, Math.min(1, v)) }), []);
  const setChordSynth = useCallback((v: ChordSynthType) => dispatch({ type: 'SET_CHORD_SYNTH', payload: v }), []);
  const setLaneGain = useCallback((lane: LaneId, value: number) => {
    dispatch({ type: 'SET_LANE_GAIN', payload: { lane, value: Math.max(0, Math.min(1, value)) } });
    audioEngine.setLaneGain(lane, Math.max(0, Math.min(1, value)));
  }, []);
  const setDelayFdbk = useCallback((v: number) => dispatch({ type: 'SET_DELAY_FDBK', payload: Math.max(0, Math.min(1, v)) }), []);
  const setDelayWet = useCallback((v: number) => dispatch({ type: 'SET_DELAY_WET', payload: Math.max(0, Math.min(1, v)) }), []);
  const setMasterGain = useCallback((v: number) => {
    dispatch({ type: 'SET_MASTER_GAIN', payload: Math.max(0, Math.min(1, v)) });
    audioEngine.setMasterGain(Math.max(0, Math.min(1, v)));
  }, []);
  const setPercNoisy = useCallback((v: number) => dispatch({ type: 'SET_PERC_NOISY', payload: v }), []);
  const setDensity = useCallback((v: number) => dispatch({ type: 'SET_DENSITY', payload: v }), []);
  const setCloseFar = useCallback((v: number) => dispatch({ type: 'SET_CLOSE_FAR', payload: v }), []);
  const setSwing = useCallback((v: number) => dispatch({ type: 'SET_SWING', payload: v }), []);
  const setPercVoiceLow = useCallback((v: string) => dispatch({ type: 'SET_PERC_VOICE_LOW', payload: v }), []);
  const setPercVoiceMid = useCallback((v: string) => dispatch({ type: 'SET_PERC_VOICE_MID', payload: v }), []);
  const setLaneSend = useCallback((lane: LaneId, value: number) => {
    dispatch({ type: 'SET_LANE_SEND', payload: { lane, value: Math.max(0, Math.min(1, value)) } });
    audioEngine.setLaneSend?.(lane, Math.max(0, Math.min(1, value)));
  }, []);
  const setLaneEqHi = useCallback((lane: LaneId, value: number) => {
    dispatch({ type: 'SET_LANE_EQ_HI', payload: { lane, value: Math.max(0, Math.min(1, value)) } });
    audioEngine.setLaneEqHi?.(lane, Math.max(0, Math.min(1, value)));
  }, []);
  const setLaneEqLow = useCallback((lane: LaneId, value: number) => {
    dispatch({ type: 'SET_LANE_EQ_LOW', payload: { lane, value: Math.max(0, Math.min(1, value)) } });
    audioEngine.setLaneEqLow?.(lane, Math.max(0, Math.min(1, value)));
  }, []);
  const setMeterPeak = useCallback((lane: LaneId, value: number) => {
    dispatch({ type: 'SET_METER_PEAK', payload: { lane, value } });
  }, []);
  const setLanePan = useCallback((lane: LaneId, value: number) => {
    const v = Math.max(0, Math.min(1, value));
    dispatch({ type: 'SET_LANE_PAN', payload: { lane, value: v } });
    audioEngine.setLanePan?.(lane, v);
  }, []);
  const setLaneSolo = useCallback((lane: LaneId, on: boolean) => {
    dispatch({ type: 'SET_LANE_SOLO', payload: { lane, on } });
    audioEngine.setLaneSolo?.(lane, on);
  }, []);
  const setLaneSendR = useCallback((lane: LaneId, value: number) => {
    const v = Math.max(0, Math.min(1, value));
    dispatch({ type: 'SET_LANE_SEND_R', payload: { lane, value: v } });
    audioEngine.setLaneSendR?.(lane, v);
  }, []);
  const setLaneCompAmount = useCallback((lane: LaneId, value: number) => {
    const v = Math.max(0, Math.min(1, value));
    dispatch({ type: 'SET_LANE_COMP_AMOUNT', payload: { lane, value: v } });
    audioEngine.setLaneCompAmount?.(lane, v);
  }, []);
  const setLaneFilterCutoff = useCallback((lane: LaneId, value: number) => {
    const v = Math.max(0, Math.min(1, value));
    dispatch({ type: 'SET_LANE_FILTER_CUTOFF', payload: { lane, value: v } });
    audioEngine.setLaneFilterCutoff?.(lane, v);
  }, []);
  const setMasterEnvAttack = useCallback((v: number) => {
    dispatch({ type: 'SET_MASTER_ENV_ATTACK', payload: Math.max(0.001, Math.min(1, v)) });
    audioEngine.setMasterEnvAttack?.(Math.max(0.001, Math.min(1, v)));
  }, []);
  const setMasterEnvRelease = useCallback((v: number) => {
    dispatch({ type: 'SET_MASTER_ENV_RELEASE', payload: Math.max(0.01, Math.min(2, v)) });
    audioEngine.setMasterEnvRelease?.(Math.max(0.01, Math.min(2, v)));
  }, []);

  const api: StoreApi = {
    setPattern,
    setStep,
    setPlaying,
    setBPM,
    setStartOffsetSteps,
    setLaneEnabled,
    selectCell,
    createStep,
    deleteStep,
    setSeed,
    newSeedAndGenerate,
    randomisePattern,
    randomisePerc,
    randomiseFilter,
    setWorld,
    setMasterRoot,
    setMasterScale,
    setChordProgression,
    setChordSynth,
    setLaneGain,
    setDelayFdbk,
    setDelayWet,
    setMasterGain,
    setPercNoisy,
    setDensity,
    setCloseFar,
    setSwing,
    setPercVoiceLow,
    setPercVoiceMid,
    setLaneSend,
    setLaneEqHi,
    setLaneEqLow,
    setMeterPeak,
    setLanePan,
    setLaneSolo,
    setLaneSendR,
    setLaneCompAmount,
    setLaneFilterCutoff,
    setMasterEnvAttack,
    setMasterEnvRelease,
  };

  return (
    <StoreContext.Provider value={{ state, api }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
