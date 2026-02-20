import { Pattern, Step } from '../groove/generator';
import { Voice, KickVoice, SubVoice, LowPercVoice, MidPercVoice, HatVoice, NoiseVoice } from './voices';
import { getGrooveOffsetMs, type GrooveTemplateId } from './grooveTemplates';

export class Transport {
  private context: AudioContext;
  private pattern: Pattern;
  private bpm: number;
  private isPlaying: boolean = false;
  private nextStepTime: number = 0;
  private currentStep: number = 0;
  private lookahead: number = 0.025; // 25ms
  private scheduleAhead: number = 0.1; // 100ms
  private intervalId: number | null = null;
  private voices: Map<string, Voice> = new Map();
  private masterGain: GainNode;
  private laneToggles: Map<string, boolean> = new Map();
  private laneSolo: Map<string, boolean> = new Map();
  private laneOffsets: Map<string, number> = new Map();
  private percussiveNoisy: number = 0;
  private swingPercent: number = 50;
  private grooveTemplateId: GrooveTemplateId = 'straight';
  private loopSteps: number = 16; // 16 or 32 step timeline

  constructor(context: AudioContext, pattern: Pattern, bpm: number) {
    this.context = context;
    this.pattern = pattern;
    this.bpm = bpm;

    // Create master chain with saturation and limiter
    this.masterGain = context.createGain();
    this.masterGain.gain.value = 0.8;

    // Saturation (soft clipping)
    const waveshaper = context.createWaveShaper();
    const curve = new Float32Array(65536);
    for (let i = 0; i < 65536; i++) {
      const x = (i - 32768) / 32768;
      curve[i] = Math.tanh(x * 1.5) * 0.7;
    }
    waveshaper.curve = curve;

    // Limiter (simple hard limiter)
    const limiterGain = context.createGain();
    limiterGain.gain.value = 1.0;

    this.masterGain.connect(waveshaper);
    waveshaper.connect(limiterGain);
    limiterGain.connect(context.destination);

    // Initialize voices
    this.voices.set('Kick', new KickVoice(context));
    this.voices.set('Sub', new SubVoice(context));
    this.voices.set('Low Perc', new LowPercVoice(context));
    this.voices.set('Mid Perc', new MidPercVoice(context));
    this.voices.set('Hat', new HatVoice(context));
    this.voices.set('Noise', new NoiseVoice(context, this.percussiveNoisy));

    // Connect voices to master
    this.voices.forEach(voice => {
      voice.getOutput().connect(this.masterGain);
    });

    // Initialize lane toggles (all on by default)
    pattern.tracks.forEach(track => {
      this.laneToggles.set(track.name, true);
    });
  }

  setPattern(pattern: Pattern) {
    this.pattern = pattern;
    // Update lane toggles for new tracks
    pattern.tracks.forEach(track => {
      if (!this.laneToggles.has(track.name)) {
        this.laneToggles.set(track.name, true);
      }
    });
  }

  setBPM(bpm: number) {
    this.bpm = bpm;
  }

  setPercussiveNoisy(value: number) {
    this.percussiveNoisy = value;
    const noiseVoice = this.voices.get('Noise');
    if (noiseVoice instanceof NoiseVoice) {
      noiseVoice.setPercussiveNoisy(value);
    }
  }

  setLaneEnabled(trackName: string, enabled: boolean) {
    this.laneToggles.set(trackName, enabled);
  }

  setLaneSolo(trackName: string, solo: boolean) {
    this.laneSolo.set(trackName, solo);
  }

  setSoloToggles(soloMap: Map<string, boolean>) {
    this.laneSolo = new Map(soloMap);
  }

  setSwingPercent(percent: number) {
    this.swingPercent = Math.max(0, Math.min(100, percent));
  }

  setGrooveTemplateId(id: GrooveTemplateId) {
    this.grooveTemplateId = id;
  }

  setLoopSteps(steps: number) {
    this.loopSteps = steps === 32 ? 32 : 16;
  }

  setLaneOffset(trackName: string, offset: number) {
    this.laneOffsets.set(trackName, ((offset % 16) + 16) % 16);
  }

  getLaneOffset(trackName: string): number {
    return this.laneOffsets.get(trackName) ?? 0;
  }

  getLaneEnabled(trackName: string): boolean {
    return this.laneToggles.get(trackName) ?? true;
  }

  getCurrentStep(): number {
    return this.currentStep;
  }

  /** 16th note duration in seconds; grid is fixed to avoid drift */
  private stepTime(): number {
    return 60 / this.bpm / 4;
  }

  /** Offbeat delay from swing 0–100 (50 = no swing). Applied only to odd steps. */
  private swingOffsetSeconds(stepIndex: number): number {
    if (this.swingPercent === 50) return 0;
    if (stepIndex % 2 !== 1) return 0;
    const base = this.stepTime();
    return base * ((this.swingPercent - 50) / 100) * 0.5;
  }

  /** Whether a track should be scheduled: mute off, solo overrides (any solo = only soloed play). */
  private shouldScheduleTrack(trackName: string): boolean {
    const muted = !this.laneToggles.get(trackName);
    const soloed = this.laneSolo.get(trackName) ?? false;
    const anySolo = Array.from(this.laneSolo.values()).some(Boolean);
    if (anySolo) return soloed;
    return !muted;
  }

  private scheduleStep(stepIndex: number, baseTime: number) {
    const stepInBar = stepIndex % 16;
    const grooveMs = getGrooveOffsetMs(stepInBar, this.grooveTemplateId);
    const swingSec = this.swingOffsetSeconds(stepInBar);
    const triggerTime = baseTime + grooveMs / 1000 + swingSec;

    this.pattern.tracks.forEach(track => {
      if (!this.shouldScheduleTrack(track.name)) return;

      const offset = this.laneOffsets.get(track.name) ?? 0;
      const effectiveStep = (stepInBar + offset) % 16;
      const step: Step = track.steps[effectiveStep];
      const micro = step.micro ?? 0;
      if (step.on) {
        const voice = this.voices.get(track.name);
        if (voice) {
          voice.trigger(triggerTime + micro, {
            vel: step.vel,
            micro: 0, // already applied to triggerTime
            ratchet: step.ratchet,
          });
        }
      }
    });
  }

  /** Scheduler: fixed grid (baseStep) avoids drift; groove/swing applied as trigger offset only. */
  private scheduler() {
    const currentTime = this.context.currentTime;
    const baseStep = this.stepTime();

    while (this.nextStepTime < currentTime + this.scheduleAhead) {
      this.scheduleStep(this.currentStep, this.nextStepTime);

      this.currentStep = (this.currentStep + 1) % this.loopSteps;
      this.nextStepTime += baseStep;
    }
  }

  async play() {
    if (this.isPlaying) return;
    
    await this.context.resume();
    this.isPlaying = true;
    this.nextStepTime = this.context.currentTime;
    this.currentStep = 0;

    this.intervalId = window.setInterval(() => {
      this.scheduler();
    }, this.lookahead * 1000);
  }

  /** Stop clears scheduler and resets time/step so no double-trigger or drift on next play. */
  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.nextStepTime = 0;
    this.currentStep = 0;
  }

  isPlayingNow(): boolean {
    return this.isPlaying;
  }
}
