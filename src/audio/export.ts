import type { Pattern, LaneId } from './types';
import { LANE_IDS } from './types';

const SAMPLE_RATE = 44100;
const STEPS_PER_BEAT = 4;

function createRumbleSend(ctx: OfflineAudioContext, master: GainNode): GainNode {
  const send = ctx.createGain();
  send.gain.value = 0.5;
  const sat = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i / 255) * 2 - 1;
    curve[i] = Math.tanh(x * 3);
  }
  (sat as { curve: Float32Array }).curve = curve;
  send.connect(sat);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 180;
  sat.connect(lp);
  const g = ctx.createGain();
  g.gain.value = 0.25;
  lp.connect(g);
  g.connect(master);
  return send;
}

function createVoiceChain(
  ctx: OfflineAudioContext,
  pattern: Pattern,
  bpm: number,
  startOffset: number,
  laneEnabled: Record<LaneId, boolean>,
  durationSec: number
): void {
  const stepDuration = 60 / bpm / STEPS_PER_BEAT;
  const master = ctx.createGain();
  master.gain.value = 0.4;
  master.connect(ctx.destination);
  const kickGain = ctx.createGain();
  kickGain.gain.value = 1;
  kickGain.connect(master);
  const subGain = ctx.createGain();
  subGain.connect(master);
  const hatGain = ctx.createGain();
  hatGain.connect(master);
  const noiseGain = ctx.createGain();
  noiseGain.connect(master);
  const chordPreGain = ctx.createGain();
  chordPreGain.connect(master);
  const lowPercGain = ctx.createGain();
  lowPercGain.connect(master);
  const midPercGain = ctx.createGain();
  midPercGain.connect(master);
  const rumbleSend = createRumbleSend(ctx, master);
  kickGain.connect(rumbleSend);
  lowPercGain.connect(rumbleSend);

  const totalSteps = Math.ceil((durationSec / stepDuration) / 16) * 16;
  for (let scheduledStep = 0; scheduledStep < totalSteps; scheduledStep++) {
    const playbackStep = (startOffset + scheduledStep) % 16;
    const t = scheduledStep * stepDuration;
    for (const laneId of LANE_IDS) {
      if (laneEnabled[laneId] === false) continue;
      const steps = pattern[laneId];
      if (!steps?.[playbackStep]?.on) continue;
      const vel = steps[playbackStep].vel ?? 0.8;
      if (laneId === 'Kick') playKick(ctx, kickGain, t, vel);
      else if (laneId === 'Sub') playSub(ctx, subGain, t, vel);
      else if (laneId === 'Hat') playHat(ctx, hatGain, t, vel);
      else if (laneId === 'Noise') playNoise(ctx, noiseGain, t, vel);
      else if (laneId === 'Low Perc') playLowPerc(ctx, lowPercGain, t, vel);
      else if (laneId === 'Mid Perc') playMidPerc(ctx, midPercGain, t, vel);
      else if (laneId === 'Chord') playChord(ctx, chordPreGain, t, vel);
    }
  }
}

function playKick(ctx: OfflineAudioContext, dest: GainNode, t: number, vel: number): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
  g.gain.setValueAtTime(vel * 0.9, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  osc.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + 0.45);
}
function playSub(ctx: OfflineAudioContext, dest: GainNode, t: number, vel: number): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(55, t);
  g.gain.setValueAtTime(vel * 0.7, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  osc.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + 0.3);
}
function playHat(ctx: OfflineAudioContext, dest: GainNode, t: number, vel: number): void {
  const bufSize = SAMPLE_RATE * 0.05;
  const buf = ctx.createBuffer(1, bufSize, SAMPLE_RATE);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3));
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 6000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vel * 0.3, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  src.connect(filter);
  filter.connect(g);
  g.connect(dest);
  src.start(t);
  src.stop(t + 0.05);
}
function playNoise(ctx: OfflineAudioContext, dest: GainNode, t: number, vel: number): void {
  const bufSize = SAMPLE_RATE * 0.1;
  const buf = ctx.createBuffer(1, bufSize, SAMPLE_RATE);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.2));
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vel * 0.25, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  src.connect(filter);
  filter.connect(g);
  g.connect(dest);
  src.start(t);
  src.stop(t + 0.1);
}
function playLowPerc(ctx: OfflineAudioContext, dest: GainNode, t: number, vel: number): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, t);
  g.gain.setValueAtTime(vel * 0.4, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + 0.14);
}
function playMidPerc(ctx: OfflineAudioContext, dest: GainNode, t: number, vel: number): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(280, t);
  g.gain.setValueAtTime(vel * 0.35, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  osc.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + 0.08);
}
function playChord(ctx: OfflineAudioContext, dest: GainNode, t: number, vel: number): void {
  const freqs = [261.63, 329.63, 392];
  const g = ctx.createGain();
  g.gain.setValueAtTime(vel * 0.2, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  g.connect(dest);
  for (const f of freqs) {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = f;
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.35);
  }
}

function encodeWAV(samples: Float32Array, numChannels: number, sampleRate: number): Blob {
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

export type ExportOptions = {
  pattern: Pattern;
  bpm: number;
  startOffsetSteps: number;
  laneEnabled: Record<LaneId, boolean>;
  bars?: number;
};

export async function exportWAV(options: ExportOptions): Promise<Blob> {
  const { pattern, bpm, startOffsetSteps, laneEnabled, bars = 8 } = options;
  const stepDuration = 60 / bpm / STEPS_PER_BEAT;
  const durationSec = bars * 16 * stepDuration;
  const numSamples = Math.ceil(durationSec * SAMPLE_RATE);
  const ctx = new OfflineAudioContext(1, numSamples, SAMPLE_RATE);
  createVoiceChain(ctx, pattern, bpm, startOffsetSteps, laneEnabled, durationSec);
  const rendered = await ctx.startRendering();
  const ch0 = rendered.getChannelData(0);
  return encodeWAV(ch0, 1, SAMPLE_RATE);
}

export function downloadWAV(blob: Blob, filename = 'export.wav'): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
