import { Pattern, Step } from '../groove/generator';
import { Voice, KickVoice, SubVoice, LowPercVoice, MidPercVoice, HatVoice, NoiseVoice } from './voices';

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
  private laneOffsets: Map<string, number> = new Map();
  private percussiveNoisy: number = 0;

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

  private stepTime(): number {
    return 60 / this.bpm / 4; // 16th note duration
  }

  private scheduleStep(stepIndex: number, time: number) {
    this.pattern.tracks.forEach(track => {
      if (!this.laneToggles.get(track.name)) return;

      const offset = this.laneOffsets.get(track.name) ?? 0;
      const effectiveStep = (stepIndex + offset) % 16;
      const step: Step = track.steps[effectiveStep];
      if (step.on) {
        const voice = this.voices.get(track.name);
        if (voice) {
          voice.trigger(time, {
            vel: step.vel,
            micro: step.micro,
            ratchet: step.ratchet,
          });
        }
      }
    });
  }

  private scheduler() {
    const currentTime = this.context.currentTime;
    
    while (this.nextStepTime < currentTime + this.scheduleAhead) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      
      this.currentStep = (this.currentStep + 1) % 16;
      this.nextStepTime += this.stepTime();
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

  stop() {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.currentStep = 0;
  }

  isPlayingNow(): boolean {
    return this.isPlaying;
  }
}
