import { Pattern, Step } from '../groove/generator';
import { Voice, KickVoice, SubVoice, LowPercVoice, MidPercVoice, HatVoice, NoiseVoice } from './voices';

export interface RenderOptions {
  bars: number; // 8 or 16
  format: 'float32' | 'pcm16';
}

export async function renderWav(
  pattern: Pattern,
  bpm: number,
  laneToggles: Map<string, boolean>,
  percussiveNoisy: number,
  options: RenderOptions
): Promise<Blob> {
  const sampleRate = 48000;
  const stepTime = 60 / bpm / 4; // 16th note duration
  const totalSteps = 16 * options.bars;
  const duration = totalSteps * stepTime;
  const length = Math.ceil(duration * sampleRate);

  // Create offline context
  const offlineContext = new OfflineAudioContext(2, length, sampleRate);

  // Create master chain
  const masterGain = offlineContext.createGain();
  masterGain.gain.value = 0.8;

  // Saturation
  const waveshaper = offlineContext.createWaveShaper();
  const curve = new Float32Array(65536);
  for (let i = 0; i < 65536; i++) {
    const x = (i - 32768) / 32768;
    curve[i] = Math.tanh(x * 1.5) * 0.7;
  }
  waveshaper.curve = curve;

  // Limiter
  const limiterGain = offlineContext.createGain();
  limiterGain.gain.value = 1.0;

  masterGain.connect(waveshaper);
  waveshaper.connect(limiterGain);
  limiterGain.connect(offlineContext.destination);

  // Create voices
  const voices = new Map<string, Voice>();
  voices.set('Kick', new KickVoice(offlineContext));
  voices.set('Sub', new SubVoice(offlineContext));
  voices.set('Low Perc', new LowPercVoice(offlineContext));
  voices.set('Mid Perc', new MidPercVoice(offlineContext));
  voices.set('Hat', new HatVoice(offlineContext));
  voices.set('Noise', new NoiseVoice(offlineContext, percussiveNoisy));

  // Connect voices to master
  voices.forEach(voice => {
    voice.getOutput().connect(masterGain);
  });

  // Schedule all steps
  for (let bar = 0; bar < options.bars; bar++) {
    for (let step = 0; step < 16; step++) {
      const stepIndex = step;
      const time = (bar * 16 + step) * stepTime;

      pattern.tracks.forEach(track => {
        if (!laneToggles.get(track.name)) return;

        const stepData: Step = track.steps[stepIndex];
        if (stepData.on) {
          const voice = voices.get(track.name);
          if (voice) {
            voice.trigger(time, {
              vel: stepData.vel,
              micro: stepData.micro,
              ratchet: stepData.ratchet,
            });
          }
        }
      });
    }
  }

  // Render
  const renderedBuffer = await offlineContext.startRendering();

  // Encode to WAV
  if (options.format === 'float32') {
    return encodeFloat32Wav(renderedBuffer);
  } else {
    return encodePCM16Wav(renderedBuffer);
  }
}

function encodeFloat32Wav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const dataLength = length * numChannels * 4; // 4 bytes per float32

  const arrayBuffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 18, true); // fmt chunk size
  view.setUint16(20, 3, true); // IEEE float format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 4, true); // byte rate
  view.setUint16(32, numChannels * 4, true); // block align
  view.setUint16(34, 32, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // Write audio data (interleaved)
  const leftChannel = buffer.getChannelData(0);
  const rightChannel = numChannels > 1 ? buffer.getChannelData(1) : leftChannel;
  let offset = 44;

  for (let i = 0; i < length; i++) {
    view.setFloat32(offset, leftChannel[i], true);
    offset += 4;
    if (numChannels > 1) {
      view.setFloat32(offset, rightChannel[i], true);
      offset += 4;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function encodePCM16Wav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const dataLength = length * numChannels * 2; // 2 bytes per int16

  const arrayBuffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
  view.setUint16(32, numChannels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // Write audio data (interleaved, converted to int16)
  const leftChannel = buffer.getChannelData(0);
  const rightChannel = numChannels > 1 ? buffer.getChannelData(1) : leftChannel;
  let offset = 44;

  for (let i = 0; i < length; i++) {
    const leftSample = Math.max(-1, Math.min(1, leftChannel[i]));
    view.setInt16(offset, leftSample < 0 ? leftSample * 0x8000 : leftSample * 0x7FFF, true);
    offset += 2;
    if (numChannels > 1) {
      const rightSample = Math.max(-1, Math.min(1, rightChannel[i]));
      view.setInt16(offset, rightSample < 0 ? rightSample * 0x8000 : rightSample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
