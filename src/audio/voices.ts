export interface VoiceParams {
  vel: number;
  micro?: number;
  ratchet?: number;
}

export abstract class Voice {
  protected context: BaseAudioContext;
  protected output: AudioNode;

  constructor(context: BaseAudioContext) {
    this.context = context;
    this.output = context.createGain();
  }

  getOutput(): AudioNode {
    return this.output;
  }

  abstract trigger(time: number, params: VoiceParams): void;
}

export class KickVoice extends Voice {
  private clickBuffer: AudioBuffer | null = null;

  constructor(context: BaseAudioContext) {
    super(context);
    
    // Create click buffer (short noise burst)
    const sampleRate = context.sampleRate;
    const clickLength = sampleRate * 0.01; // 10ms
    const buffer = context.createBuffer(1, clickLength, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < clickLength; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (clickLength * 0.3));
    }
    this.clickBuffer = buffer;
  }

  trigger(time: number, params: VoiceParams) {
    const { vel, micro = 0, ratchet = 0 } = params;
    const triggerTime = time + micro;

    // Click
    const clickSource = this.context.createBufferSource();
    clickSource.buffer = this.clickBuffer!;
    const clickGain = this.context.createGain();
    clickGain.gain.setValueAtTime(vel * 0.8, triggerTime);
    clickGain.gain.exponentialRampToValueAtTime(0.01, triggerTime + 0.01);
    clickSource.connect(clickGain);
    clickGain.connect(this.output);
    clickSource.start(triggerTime);
    clickSource.stop(triggerTime + 0.01);

    // Sine drop
    const sineOsc = this.context.createOscillator();
    sineOsc.type = 'sine';
    sineOsc.frequency.setValueAtTime(60, triggerTime);
    sineOsc.frequency.exponentialRampToValueAtTime(30, triggerTime + 0.15);
    
    const sineGain = this.context.createGain();
    sineGain.gain.setValueAtTime(vel * 0.6, triggerTime);
    sineGain.gain.exponentialRampToValueAtTime(0.01, triggerTime + 0.2);
    
    sineOsc.connect(sineGain);
    sineGain.connect(this.output);
    sineOsc.start(triggerTime);
    sineOsc.stop(triggerTime + 0.2);

    // Ratchet repeats
    if (ratchet > 0) {
      const ratchetInterval = 0.05;
      for (let r = 1; r <= ratchet; r++) {
        const ratchetTime = triggerTime + r * ratchetInterval;
        const ratchetVel = vel * Math.pow(0.7, r);
        
        const ratchetClick = this.context.createBufferSource();
        ratchetClick.buffer = this.clickBuffer!;
        const ratchetGain = this.context.createGain();
        ratchetGain.gain.setValueAtTime(ratchetVel * 0.5, ratchetTime);
        ratchetGain.gain.exponentialRampToValueAtTime(0.01, ratchetTime + 0.005);
        ratchetClick.connect(ratchetGain);
        ratchetGain.connect(this.output);
        ratchetClick.start(ratchetTime);
        ratchetClick.stop(ratchetTime + 0.005);
      }
    }
  }
}

export class SubVoice extends Voice {
  trigger(time: number, params: VoiceParams) {
    const { vel, micro = 0 } = params;
    const triggerTime = time + micro;

    const osc = this.context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 40;

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(vel * 0.8, triggerTime);
    gain.gain.exponentialRampToValueAtTime(0.01, triggerTime + 0.3);

    const lowpass = this.context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 100;

    osc.connect(gain);
    gain.connect(lowpass);
    lowpass.connect(this.output);

    osc.start(triggerTime);
    osc.stop(triggerTime + 0.3);
  }
}

export class LowPercVoice extends Voice {
  private noiseBuffer: AudioBuffer | null = null;

  constructor(context: BaseAudioContext) {
    super(context);
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, sampleRate * 0.2, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  trigger(time: number, params: VoiceParams) {
    const { vel, micro = 0, ratchet = 0 } = params;
    const triggerTime = time + micro;

    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer!;
    source.loop = false;

    const bandpass = this.context.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 200;
    bandpass.Q.value = 5;

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(vel * 0.7, triggerTime);
    gain.gain.exponentialRampToValueAtTime(0.01, triggerTime + 0.15);

    source.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.output);

    source.start(triggerTime);
    source.stop(triggerTime + 0.15);

    // Ratchet
    if (ratchet > 0) {
      const ratchetInterval = 0.04;
      for (let r = 1; r <= ratchet; r++) {
        const ratchetTime = triggerTime + r * ratchetInterval;
        const ratchetVel = vel * Math.pow(0.6, r);
        
        const ratchetSource = this.context.createBufferSource();
        ratchetSource.buffer = this.noiseBuffer!;
        const ratchetBandpass = this.context.createBiquadFilter();
        ratchetBandpass.type = 'bandpass';
        ratchetBandpass.frequency.value = 200;
        ratchetBandpass.Q.value = 5;
        const ratchetGain = this.context.createGain();
        ratchetGain.gain.setValueAtTime(ratchetVel * 0.5, ratchetTime);
        ratchetGain.gain.exponentialRampToValueAtTime(0.01, ratchetTime + 0.08);
        ratchetSource.connect(ratchetBandpass);
        ratchetBandpass.connect(ratchetGain);
        ratchetGain.connect(this.output);
        ratchetSource.start(ratchetTime);
        ratchetSource.stop(ratchetTime + 0.08);
      }
    }
  }
}

export class MidPercVoice extends Voice {
  private noiseBuffer: AudioBuffer | null = null;

  constructor(context: BaseAudioContext) {
    super(context);
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, sampleRate * 0.15, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  trigger(time: number, params: VoiceParams) {
    const { vel, micro = 0, ratchet = 0 } = params;
    const triggerTime = time + micro;

    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer!;

    const bandpass = this.context.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 800;
    bandpass.Q.value = 3;

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(vel * 0.6, triggerTime);
    gain.gain.exponentialRampToValueAtTime(0.01, triggerTime + 0.1);

    source.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.output);

    source.start(triggerTime);
    source.stop(triggerTime + 0.1);

    // Ratchet
    if (ratchet > 0) {
      const ratchetInterval = 0.03;
      for (let r = 1; r <= ratchet; r++) {
        const ratchetTime = triggerTime + r * ratchetInterval;
        const ratchetVel = vel * Math.pow(0.65, r);
        
        const ratchetSource = this.context.createBufferSource();
        ratchetSource.buffer = this.noiseBuffer!;
        const ratchetBandpass = this.context.createBiquadFilter();
        ratchetBandpass.type = 'bandpass';
        ratchetBandpass.frequency.value = 800;
        ratchetBandpass.Q.value = 3;
        const ratchetGain = this.context.createGain();
        ratchetGain.gain.setValueAtTime(ratchetVel * 0.5, ratchetTime);
        ratchetGain.gain.exponentialRampToValueAtTime(0.01, ratchetTime + 0.06);
        ratchetSource.connect(ratchetBandpass);
        ratchetBandpass.connect(ratchetGain);
        ratchetGain.connect(this.output);
        ratchetSource.start(ratchetTime);
        ratchetSource.stop(ratchetTime + 0.06);
      }
    }
  }
}

export class HatVoice extends Voice {
  private noiseBuffer: AudioBuffer | null = null;

  constructor(context: BaseAudioContext) {
    super(context);
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, sampleRate * 0.1, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  trigger(time: number, params: VoiceParams) {
    const { vel, micro = 0, ratchet = 0 } = params;
    const triggerTime = time + micro;

    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer!;

    const highpass = this.context.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 5000;
    highpass.Q.value = 1;

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(vel * 0.5, triggerTime);
    gain.gain.exponentialRampToValueAtTime(0.01, triggerTime + 0.05);

    source.connect(highpass);
    highpass.connect(gain);
    gain.connect(this.output);

    source.start(triggerTime);
    source.stop(triggerTime + 0.05);

    // Ratchet
    if (ratchet > 0) {
      const ratchetInterval = 0.02;
      for (let r = 1; r <= ratchet; r++) {
        const ratchetTime = triggerTime + r * ratchetInterval;
        const ratchetVel = vel * Math.pow(0.7, r);
        
        const ratchetSource = this.context.createBufferSource();
        ratchetSource.buffer = this.noiseBuffer!;
        const ratchetHighpass = this.context.createBiquadFilter();
        ratchetHighpass.type = 'highpass';
        ratchetHighpass.frequency.value = 5000;
        ratchetHighpass.Q.value = 1;
        const ratchetGain = this.context.createGain();
        ratchetGain.gain.setValueAtTime(ratchetVel * 0.4, ratchetTime);
        ratchetGain.gain.exponentialRampToValueAtTime(0.01, ratchetTime + 0.03);
        ratchetSource.connect(ratchetHighpass);
        ratchetHighpass.connect(ratchetGain);
        ratchetGain.connect(this.output);
        ratchetSource.start(ratchetTime);
        ratchetSource.stop(ratchetTime + 0.03);
      }
    }
  }
}

export class NoiseVoice extends Voice {
  private noiseBuffer: AudioBuffer | null = null;
  private distortionAmount: number = 0;

  constructor(context: BaseAudioContext, percussiveNoisy: number = 0) {
    super(context);
    this.distortionAmount = percussiveNoisy;
    
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, sampleRate * 0.3, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  setPercussiveNoisy(value: number) {
    this.distortionAmount = value;
  }

  trigger(time: number, params: VoiceParams) {
    const { vel, micro = 0, ratchet = 0 } = params;
    const triggerTime = time + micro;

    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer!;

    const bandpass = this.context.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1000 + this.distortionAmount * 2000;
    bandpass.Q.value = 2;

    // Bitcrush/distortion
    const waveshaper = this.context.createWaveShaper();
    const bits = Math.max(2, 16 - this.distortionAmount * 12);
    const levels = Math.pow(2, bits);
    const curve = new Float32Array(65536);
    for (let i = 0; i < 65536; i++) {
      const x = (i - 32768) / 32768;
      curve[i] = Math.round(x * levels) / levels;
    }
    waveshaper.curve = curve;

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(vel * (0.4 + this.distortionAmount * 0.4), triggerTime);
    gain.gain.exponentialRampToValueAtTime(0.01, triggerTime + 0.2);

    source.connect(bandpass);
    bandpass.connect(waveshaper);
    waveshaper.connect(gain);
    gain.connect(this.output);

    source.start(triggerTime);
    source.stop(triggerTime + 0.2);

    // Ratchet
    if (ratchet > 0) {
      const ratchetInterval = 0.05;
      for (let r = 1; r <= ratchet; r++) {
        const ratchetTime = triggerTime + r * ratchetInterval;
        const ratchetVel = vel * Math.pow(0.6, r);
        
        const ratchetSource = this.context.createBufferSource();
        ratchetSource.buffer = this.noiseBuffer!;
        const ratchetBandpass = this.context.createBiquadFilter();
        ratchetBandpass.type = 'bandpass';
        ratchetBandpass.frequency.value = 1000 + this.distortionAmount * 2000;
        ratchetBandpass.Q.value = 2;
        const ratchetWaveshaper = this.context.createWaveShaper();
        const bits = Math.max(2, 16 - this.distortionAmount * 12);
        const levels = Math.pow(2, bits);
        const curve = new Float32Array(65536);
        for (let i = 0; i < 65536; i++) {
          const x = (i - 32768) / 32768;
          curve[i] = Math.round(x * levels) / levels;
        }
        ratchetWaveshaper.curve = curve;
        const ratchetGain = this.context.createGain();
        ratchetGain.gain.setValueAtTime(ratchetVel * 0.3, ratchetTime);
        ratchetGain.gain.exponentialRampToValueAtTime(0.01, ratchetTime + 0.1);
        ratchetSource.connect(ratchetBandpass);
        ratchetBandpass.connect(ratchetWaveshaper);
        ratchetWaveshaper.connect(ratchetGain);
        ratchetGain.connect(this.output);
        ratchetSource.start(ratchetTime);
        ratchetSource.stop(ratchetTime + 0.1);
      }
    }
  }
}
