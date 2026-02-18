import type { Pattern, LaneId, ScaleType } from './types';
import { LANE_IDS } from './types';
import { getChordFreqs } from './scale';

const SAMPLE_RATE = 44100;

function makeSoftCurve(amount: number): Float32Array {
  const n = 256;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * amount);
  }
  return curve;
}
const STEPS_PER_BEAT = 4; // 16th notes

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private kickGain: GainNode | null = null;
  private subGain: GainNode | null = null;
  private hatGain: GainNode | null = null;
  private noiseGain: GainNode | null = null;
  private chordGain: GainNode | null = null;
  private lowPercGain: GainNode | null = null;
  private midPercGain: GainNode | null = null;
  private chordPreGain: GainNode | null = null;
  private rumbleGain: GainNode | null = null;
  private chordDelayOn = false;
  private masterDelayOn = false;
  private scheduledStep = 0;
  private nextBeatTime = 0;
  private rafId: number | null = null;
  private bpm = 128;
  private startOffsetSteps = 0;
  private pattern: Pattern = {} as Pattern;
  private laneEnabled: Record<LaneId, boolean> = {} as Record<LaneId, boolean>;
  private playing = false;
  private _lastTriggeredStep = 0;
  onStep?: (stepIndex: number) => void;
  onTriggerLane?: (lane: LaneId, vel: number) => void;
  private world = 0.5;
  private masterRoot = 'C';
  private masterScale: ScaleType = 'Minor';
  private chordProgression = 0.5;
  private chordSynth: 'analog' | 'fm' | 'prophet' = 'prophet';
  private laneGain: Record<LaneId, number> = {} as Record<LaneId, number>;
  private masterGainValue = 0.75;
  private percNoisy = 0.5;
  private density = 0.7;
  private closeFar = 0;
  private swing = 0.5;
  private percVoiceLow = 'default';
  private percVoiceMid = 'default';
  private lanePan: Record<LaneId, number> = {} as Record<LaneId, number>;
  private laneSolo: Record<LaneId, boolean> = {} as Record<LaneId, boolean>;
  private lanePanner: Record<LaneId, StereoPannerNode | null> = {} as Record<LaneId, StereoPannerNode | null>;
  private laneComp: Record<LaneId, DynamicsCompressorNode | null> = {} as Record<LaneId, DynamicsCompressorNode | null>;
  private laneFilter: Record<LaneId, BiquadFilterNode | null> = {} as Record<LaneId, BiquadFilterNode | null>;
  private laneCompAmount: Record<LaneId, number> = {} as Record<LaneId, number>;
  private laneFilterCutoff: Record<LaneId, number> = {} as Record<LaneId, number>;
  private masterEnvAttack = 0.01;
  private masterEnvRelease = 0.2;
  private masterEnvComp: DynamicsCompressorNode | null = null;

  async resume(): Promise<void> {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
    const g = this.ctx.createGain();
    g.gain.value = 0.4 * this.masterGainValue;
    this.masterGain = g;
    const envComp = this.ctx.createDynamicsCompressor();
    envComp.threshold.value = -6;
    envComp.knee.value = 6;
    envComp.ratio.value = 3;
    envComp.attack.value = this.masterEnvAttack;
    envComp.release.value = this.masterEnvRelease;
    g.connect(envComp);
    this.masterEnvComp = envComp;
    const masterDelay = this.ctx.createDelay(2);
    masterDelay.delayTime.value = 60 / 128 / 2;
    const masterWet = this.ctx.createGain();
    masterWet.gain.value = 0;
    const masterDry = this.ctx.createGain();
    masterDry.gain.value = 1;
    envComp.connect(masterDry);
    envComp.connect(masterDelay);
    masterDelay.connect(masterWet);
    masterDry.connect(this.ctx.destination);
    masterWet.connect(this.ctx.destination);
    this.masterDelayNode = masterDelay;
    this.masterDelayWet = masterWet;
    this.masterDelayDry = masterDry;

    const connectLaneToMaster = (gainNode: GainNode, lane: LaneId) => {
      const comp = this.ctx!.createDynamicsCompressor();
      comp.threshold.value = -24 + (1 - (this.laneCompAmount[lane] ?? 0)) * 24;
      comp.knee.value = 12;
      comp.ratio.value = 2 + (this.laneCompAmount[lane] ?? 0) * 6;
      comp.attack.value = 0.003;
      comp.release.value = 0.1;
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      const cutoffNorm = this.laneFilterCutoff[lane] ?? 1;
      filter.frequency.value = 200 + cutoffNorm * cutoffNorm * 11800;
      filter.Q.value = 0.7;
      const panner = this.ctx!.createStereoPanner();
      panner.pan.value = ((this.lanePan[lane] ?? 0.5) - 0.5) * 2;
      gainNode.connect(comp);
      comp.connect(filter);
      filter.connect(panner);
      panner.connect(g);
      this.laneComp[lane] = comp;
      this.laneFilter[lane] = filter;
      this.lanePanner[lane] = panner;
    };
    this.kickGain = this.ctx.createGain();
    this.kickGain.gain.value = this.laneGain['Kick'] ?? 1;
    connectLaneToMaster(this.kickGain, 'Kick');
    this.subGain = this.ctx.createGain();
    this.subGain.gain.value = this.laneGain['Sub'] ?? 0.9;
    connectLaneToMaster(this.subGain, 'Sub');
    this.hatGain = this.ctx.createGain();
    this.hatGain.gain.value = this.laneGain['Hat'] ?? 0.5;
    connectLaneToMaster(this.hatGain, 'Hat');
    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = this.laneGain['Noise'] ?? 0.4;
    connectLaneToMaster(this.noiseGain, 'Noise');
    this.chordPreGain = this.ctx.createGain();
    this.chordPreGain.gain.value = 1;
    const chordDelay = this.ctx.createDelay(1);
    chordDelay.delayTime.value = 60 / 128 / 4;
    const chordWet = this.ctx.createGain();
    chordWet.gain.value = 0;
    const chordDry = this.ctx.createGain();
    chordDry.gain.value = 1;
    this.chordGain = this.ctx.createGain();
    this.chordGain.gain.value = this.laneGain['Chord'] ?? 0.35;
    this.chordPreGain.connect(chordDry);
    this.chordPreGain.connect(chordDelay);
    chordDelay.connect(chordWet);
    chordDry.connect(this.chordGain);
    chordWet.connect(this.chordGain);
    connectLaneToMaster(this.chordGain, 'Chord');
    this.chordDelayNode = chordDelay;
    this.chordDelayWet = chordWet;
    this.chordDelayDry = chordDry;
    this.lowPercGain = this.ctx.createGain();
    this.lowPercGain.gain.value = this.laneGain['Low Perc'] ?? 0.7;
    connectLaneToMaster(this.lowPercGain, 'Low Perc');
    this.midPercGain = this.ctx.createGain();
    this.midPercGain.gain.value = this.laneGain['Mid Perc'] ?? 0.7;
    connectLaneToMaster(this.midPercGain, 'Mid Perc');
    this.setupRumble(g);
  }

  private masterDelayNode: DelayNode | null = null;
  private masterDelayWet: GainNode | null = null;
  private masterDelayDry: GainNode | null = null;
  private chordDelayNode: DelayNode | null = null;
  private chordDelayWet: GainNode | null = null;
  private chordDelayDry: GainNode | null = null;

  private setupRumble(master: GainNode): void {
    if (!this.ctx) return;
    const send = this.ctx.createGain();
    send.gain.value = 0.5;
    this.kickGain!.connect(send);
    this.lowPercGain!.connect(send);
    const sat = this.ctx.createWaveShaper();
    (sat as { curve: Float32Array }).curve = makeSoftCurve(3);
    send.connect(sat);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 180;
    lp.Q.value = 0.5;
    sat.connect(lp);
    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.value = 0.25;
    lp.connect(rumbleGain);
    rumbleGain.connect(master);
    this.rumbleGain = rumbleGain;
  }

  setChordDelay(on: boolean): void {
    this.chordDelayOn = on;
    if (this.chordDelayWet) this.chordDelayWet.gain.value = on ? 0.4 : 0;
    if (this.chordDelayDry) this.chordDelayDry.gain.value = on ? 0.7 : 1;
  }

  setMasterDelay(on: boolean): void {
    this.masterDelayOn = on;
    if (this.masterDelayWet) this.masterDelayWet.gain.value = on ? 0.35 : 0;
    if (this.masterDelayDry) this.masterDelayDry.gain.value = on ? 0.85 : 1;
  }

  setRumbleOn(on: boolean): void {
    if (this.rumbleGain) this.rumbleGain.gain.value = on ? 0.25 : 0;
  }

  setWorld(v: number): void {
    this.world = Math.max(0, Math.min(1, v));
  }
  setMasterScale(root: string, scale: ScaleType): void {
    this.masterRoot = root;
    this.masterScale = scale;
  }
  setChordProgression(v: number): void {
    this.chordProgression = Math.max(0, Math.min(1, v));
  }
  setChordSynth(type: 'analog' | 'fm' | 'prophet'): void {
    this.chordSynth = type;
  }
  setLaneGain(lane: LaneId, value: number): void {
    this.laneGain = { ...this.laneGain, [lane]: value };
    const g = this.getLaneGainNode(lane);
    if (g) g.gain.value = value;
  }
  private getLaneGainNode(lane: LaneId): GainNode | null {
    const map: Record<LaneId, GainNode | null> = {
      Kick: this.kickGain,
      Sub: this.subGain,
      'Low Perc': this.lowPercGain,
      'Mid Perc': this.midPercGain,
      Hat: this.hatGain,
      Noise: this.noiseGain,
      Chord: this.chordGain,
    };
    return map[lane] ?? null;
  }
  setDelayParams(fdbk: number, wet: number): void {
    if (this.chordDelayNode) this.chordDelayNode.delayTime.value = (60 / this.bpm) * 0.5 * (1 - fdbk * 0.3);
    if (this.chordDelayWet) this.chordDelayWet.gain.value = wet * 0.5;
    if (this.masterDelayNode) this.masterDelayNode.delayTime.value = (60 / this.bpm) * 0.5;
    if (this.masterDelayWet) this.masterDelayWet.gain.value = wet * 0.4;
  }
  setMasterGain(v: number): void {
    this.masterGainValue = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = 0.4 * this.masterGainValue;
  }
  setPercNoisy(v: number): void {
    this.percNoisy = Math.max(0, Math.min(1, v));
  }
  setDensity(v: number): void {
    this.density = Math.max(0, Math.min(1, v));
  }
  setCloseFar(v: number): void {
    this.closeFar = Math.max(0, Math.min(1, v));
  }
  setSwing(v: number): void {
    this.swing = Math.max(0, Math.min(1, v));
  }
  setPercVoiceLow(v: string): void {
    this.percVoiceLow = v;
  }
  setPercVoiceMid(v: string): void {
    this.percVoiceMid = v;
  }
  setLaneSend(_lane: LaneId, _value: number): void {
    // Send bus can be wired when building full mixer graph
  }
  setLaneEqHi(_lane: LaneId, _value: number): void {
    // Per-lane EQ can be wired when building full mixer graph
  }
  setLaneEqLow(_lane: LaneId, _value: number): void {
    // Per-lane EQ can be wired when building full mixer graph
  }
  setLanePan(lane: LaneId, value: number): void {
    this.lanePan = { ...this.lanePan, [lane]: value };
    const p = this.lanePanner[lane];
    if (p) p.pan.value = (value - 0.5) * 2;
  }
  setLaneSolo(lane: LaneId, on: boolean): void {
    this.laneSolo = { ...this.laneSolo, [lane]: on };
  }
  setLaneSendR(_lane: LaneId, _value: number): void {
    // Rumble send per lane can be wired when building full mixer graph
  }
  setLaneCompAmount(lane: LaneId, value: number): void {
    this.laneCompAmount = { ...this.laneCompAmount, [lane]: value };
    const c = this.laneComp[lane];
    if (c) {
      c.threshold.value = -24 + (1 - value) * 24;
      c.ratio.value = 2 + value * 6;
    }
  }
  setLaneFilterCutoff(lane: LaneId, value: number): void {
    this.laneFilterCutoff = { ...this.laneFilterCutoff, [lane]: value };
    const f = this.laneFilter[lane];
    if (f) f.frequency.value = 200 + value * value * 11800;
  }
  setMasterEnvAttack(v: number): void {
    this.masterEnvAttack = Math.max(0.001, Math.min(1, v));
    if (this.masterEnvComp) this.masterEnvComp.attack.value = this.masterEnvAttack;
  }
  setMasterEnvRelease(v: number): void {
    this.masterEnvRelease = Math.max(0.01, Math.min(2, v));
    if (this.masterEnvComp) this.masterEnvComp.release.value = this.masterEnvRelease;
  }

  setPattern(p: Pattern): void {
    this.pattern = p;
  }

  setLaneEnabled(lane: LaneId, on: boolean): void {
    this.laneEnabled = { ...this.laneEnabled, [lane]: on };
  }

  setLanes(lanes: Record<LaneId, boolean>): void {
    this.laneEnabled = { ...lanes };
  }

  setBPM(bpm: number): void {
    this.bpm = Math.max(20, Math.min(300, bpm));
  }

  setStartOffsetSteps(n: number): void {
    this.startOffsetSteps = ((n % 16) + 16) % 16;
  }

  getStartOffsetSteps(): number {
    return this.startOffsetSteps;
  }

  play(): void {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    this.playing = true;
    this.scheduledStep = 0;
    this.nextBeatTime = this.ctx.currentTime;
    this.scheduleLoop();
  }

  stop(): void {
    this.playing = false;
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  isPlaying(): boolean {
    return this.playing;
  }

  private scheduleLoop = (): void => {
    if (!this.playing || !this.ctx) return;
    const now = this.ctx.currentTime;
    const stepDuration = 60 / this.bpm / STEPS_PER_BEAT;
    const swingOffset = (this.swing - 0.5) * stepDuration * 0.35;
    while (this.nextBeatTime < now + 0.2) {
      const playbackStep = (this.startOffsetSteps + this.scheduledStep) % 16;
      const isOffbeat = (this.scheduledStep % 2) === 1;
      const triggerTime = this.nextBeatTime + (isOffbeat ? swingOffset : 0);
      if (triggerTime <= now) {
        this._lastTriggeredStep = playbackStep;
        this.onStep?.(playbackStep);
        this.triggerStep(playbackStep);
        this.scheduledStep = (this.scheduledStep + 1) % (16 * 4);
        this.nextBeatTime += stepDuration;
      } else {
        break;
      }
    }
    this.rafId = requestAnimationFrame(this.scheduleLoop);
  };

  private triggerStep(stepIndex: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const lanes: { id: LaneId; gain: GainNode | null }[] = [
      { id: 'Kick', gain: this.kickGain },
      { id: 'Sub', gain: this.subGain },
      { id: 'Low Perc', gain: this.lowPercGain },
      { id: 'Mid Perc', gain: this.midPercGain },
      { id: 'Hat', gain: this.hatGain },
      { id: 'Noise', gain: this.noiseGain },
      { id: 'Chord', gain: this.chordGain },
    ];
    const anySolo = LANE_IDS.some((id) => this.laneSolo[id] === true);
    for (const { id, gain } of lanes) {
      if (!gain) continue;
      if (anySolo && !this.laneSolo[id]) continue;
      if (this.laneEnabled[id] === false) continue;
      const steps = this.pattern[id];
      if (!steps || !steps[stepIndex]?.on) continue;
      const step = steps[stepIndex];
      const vel = step.vel ?? 0.8;
      this.onTriggerLane?.(id, vel);
      if (id === 'Kick') this.playKick(vel);
      else if (id === 'Sub') this.playSub(vel);
      else if (id === 'Hat') this.playHat(vel);
      else if (id === 'Noise') this.playNoise(vel);
      else if (id === 'Low Perc') this.playLowPerc(vel);
      else if (id === 'Mid Perc') this.playMidPerc(vel);
      else if (id === 'Chord') this.playChord(vel, stepIndex);
    }
  }

  private playKick(vel: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
    osc.frequency.setValueAtTime(40, now + 0.4);
    gain.gain.setValueAtTime(vel * 0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(this.kickGain!);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  private playSub(vel: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, now);
    gain.gain.setValueAtTime(vel * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.subGain!);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  private playHat(vel: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const noisy = this.percNoisy;
    const bufSize = ctx.sampleRate * (noisy > 0.5 ? 0.08 : 0.04);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * (0.2 + noisy * 0.3)));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    const far = this.closeFar;
    filter.frequency.value = (4000 + (1 - noisy) * 3000) * (1 - far * 0.6);
    const gain = ctx.createGain();
    const d = this.density;
    gain.gain.setValueAtTime(vel * 0.3 * (0.3 + 0.7 * d), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.hatGain!);
    src.start(now);
    src.stop(now + 0.05);
  }

  private playNoise(vel: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const noisy = this.percNoisy;
    const bufSize = ctx.sampleRate * (0.06 + noisy * 0.08);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * (0.15 + noisy * 0.2)));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const far = this.closeFar;
    filter.frequency.value = (400 + noisy * 800) * (1 - far * 0.4);
    filter.Q.value = 0.8 + noisy * 0.5;
    const gain = ctx.createGain();
    const d = this.density;
    gain.gain.setValueAtTime(vel * 0.25 * (0.3 + 0.7 * d) * (1 - far * 0.2), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.noiseGain!);
    src.start(now);
    src.stop(now + 0.1);
  }

  private playLowPerc(vel: number): void {
    const voice = this.percVoiceLow;
    if (voice === 'dfam') this.playLowPercDfam(vel);
    else if (voice === 'syncussion') this.playLowPercSyncussion(vel);
    else if (voice === 'fm drum') this.playLowPercFm(vel);
    else if (voice === 'fm drum 2') this.playLowPercFm2(vel);
    else if (voice === 'basimilus') this.playLowPercBasimilus(vel);
    else if (voice === 'perkons') this.playLowPercPerkons(vel);
    else this.playLowPercDefault(vel);
  }

  private playLowPercDefault(vel: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const d = this.density;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    gain.gain.setValueAtTime(vel * 0.4 * (0.4 + 0.6 * d), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.lowPercGain!);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  private playLowPercDfam(vel: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.06);
    const noise = ctx.createBufferSource();
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 1000);
    noise.buffer = noiseBuf;
    const mix = ctx.createGain();
    mix.gain.setValueAtTime(1, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * 0.35, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(mix);
    noise.connect(mix);
    mix.connect(g);
    g.connect(this.lowPercGain!);
    osc.start(now);
    osc.stop(now + 0.16);
    noise.start(now);
    noise.stop(now + 0.05);
  }

  private playLowPercSyncussion(vel: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = 'square';
    o2.type = 'sine';
    o1.frequency.setValueAtTime(90, now);
    o2.frequency.setValueAtTime(180, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * 0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    o1.connect(g);
    o2.connect(g);
    g.connect(this.lowPercGain!);
    o1.start(now);
    o1.stop(now + 0.12);
    o2.start(now);
    o2.stop(now + 0.12);
  }

  private playLowPercFm(vel: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(100, now);
    mod.type = 'sine';
    mod.frequency.setValueAtTime(150, now);
    const car = ctx.createOscillator();
    car.type = 'sine';
    car.frequency.setValueAtTime(100, now);
    mod.connect(modGain);
    modGain.connect(car.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * 0.35, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    car.connect(g);
    g.connect(this.lowPercGain!);
    mod.start(now);
    mod.stop(now + 0.12);
    car.start(now);
    car.stop(now + 0.12);
  }

  private playLowPercFm2(vel: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(200, now);
    modGain.gain.exponentialRampToValueAtTime(20, now + 0.04);
    mod.type = 'sine';
    mod.frequency.setValueAtTime(80, now);
    const car = ctx.createOscillator();
    car.type = 'triangle';
    car.frequency.setValueAtTime(60, now);
    mod.connect(modGain);
    modGain.connect(car.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * 0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    car.connect(g);
    g.connect(this.lowPercGain!);
    mod.start(now);
    mod.stop(now + 0.1);
    car.start(now);
    car.stop(now + 0.1);
  }

  private playLowPercBasimilus(vel: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 800);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 200;
    filter.Q.value = 4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * 0.4, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.lowPercGain!);
    src.start(now);
    src.stop(now + 0.08);
  }

  private playLowPercPerkons(vel: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.02);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * 0.5, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(g);
    g.connect(this.lowPercGain!);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  private playMidPerc(vel: number): void {
    const voice = this.percVoiceMid;
    if (voice === 'dfam') this.playMidPercDfam(vel);
    else if (voice === 'syncussion') this.playMidPercSyncussion(vel);
    else if (voice === 'fm drum') this.playMidPercFm(vel);
    else if (voice === 'fm drum 2') this.playMidPercFm2(vel);
    else if (voice === 'basimilus') this.playMidPercBasimilus(vel);
    else if (voice === 'perkons') this.playMidPercPerkons(vel);
    else this.playMidPercDefault(vel);
  }

  private playMidPercDefault(vel: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const d = this.density;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    gain.gain.setValueAtTime(vel * 0.35 * (0.4 + 0.6 * d), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(this.midPercGain!);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  private playMidPercDfam(vel: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * 0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(g);
    g.connect(this.midPercGain!);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  private playMidPercSyncussion(vel: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = 'sawtooth';
    o2.type = 'sine';
    o1.frequency.setValueAtTime(400, now);
    o2.frequency.setValueAtTime(800, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * 0.25, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    o1.connect(g);
    o2.connect(g);
    g.connect(this.midPercGain!);
    o1.start(now);
    o1.stop(now + 0.05);
    o2.start(now);
    o2.stop(now + 0.05);
  }

  private playMidPercFm(vel: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(150, now);
    mod.type = 'sine';
    mod.frequency.setValueAtTime(300, now);
    const car = ctx.createOscillator();
    car.type = 'sine';
    car.frequency.setValueAtTime(280, now);
    mod.connect(modGain);
    modGain.connect(car.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * 0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    car.connect(g);
    g.connect(this.midPercGain!);
    mod.start(now);
    mod.stop(now + 0.06);
    car.start(now);
    car.stop(now + 0.06);
  }

  private playMidPercFm2(vel: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(400, now);
    modGain.gain.exponentialRampToValueAtTime(50, now + 0.02);
    mod.type = 'sine';
    mod.frequency.setValueAtTime(600, now);
    const car = ctx.createOscillator();
    car.type = 'triangle';
    car.frequency.setValueAtTime(320, now);
    mod.connect(modGain);
    modGain.connect(car.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * 0.28, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    car.connect(g);
    g.connect(this.midPercGain!);
    mod.start(now);
    mod.stop(now + 0.05);
    car.start(now);
    car.stop(now + 0.05);
  }

  private playMidPercBasimilus(vel: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 400);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;
    filter.Q.value = 3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * 0.35, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.midPercGain!);
    src.start(now);
    src.stop(now + 0.04);
  }

  private playMidPercPerkons(vel: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * 0.35, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(g);
    g.connect(this.midPercGain!);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  private playChord(vel: number, stepIndex: number): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const freqs = getChordFreqs(this.masterRoot, this.masterScale, stepIndex, this.chordProgression);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vel * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    const chordDest = this.chordPreGain ?? this.chordGain;
    gain.connect(chordDest!);
    const type = this.chordSynth === 'analog' ? 'sawtooth' : this.chordSynth === 'fm' ? 'sine' : 'triangle';
    for (const f of freqs) {
      if (this.chordSynth === 'fm') {
        const mod = ctx.createOscillator();
        const modGain = ctx.createGain();
        modGain.gain.value = 80;
        mod.type = 'sine';
        mod.frequency.value = f;
        mod.connect(modGain);
        const car = ctx.createOscillator();
        car.type = 'sine';
        car.frequency.value = f;
        modGain.connect(car.frequency);
        car.connect(gain);
        mod.start(now);
        mod.stop(now + 0.4);
        car.start(now);
        car.stop(now + 0.4);
      } else {
        const osc = ctx.createOscillator();
        osc.type = type as OscillatorType;
        osc.frequency.value = f;
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    }
  }

  getContext(): AudioContext | null {
    return this.ctx;
  }

  getCurrentStep(): number {
    return this._lastTriggeredStep;
  }

  getPattern(): Pattern {
    return this.pattern;
  }
  getBPM(): number {
    return this.bpm;
  }
  getLaneEnabled(): Record<LaneId, boolean> {
    return { ...this.laneEnabled };
  }
}

export const audioEngine = new AudioEngine();
