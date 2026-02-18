import type { ScaleType } from './types';
import { ROOT_NAMES } from './types';

/** Semitone offsets from root for each scale (one octave). */
const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  Minor: [0, 2, 3, 5, 7, 8, 10],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Phrygian: [0, 1, 3, 5, 7, 8, 10],
  Major: [0, 2, 4, 5, 7, 9, 11],
};

const ROOT_FREQ: Record<string, number> = {
  C: 261.63, 'C#': 277.18, D: 293.66, 'D#': 311.13, E: 329.63,
  F: 349.23, 'F#': 369.99, G: 392, 'G#': 415.30, A: 440, 'A#': 466.16, B: 493.88,
};

/** Root index 0-11 (C=0). */
export function rootNameToIndex(name: string): number {
  const i = ROOT_NAMES.indexOf(name as any);
  return i >= 0 ? i : 0;
}

/** Get frequency for a note: rootName (e.g. 'C'), semitones above root, optional octave offset. */
export function noteFreq(rootName: string, semitones: number, octave = 0): number {
  const base = ROOT_FREQ[rootName] ?? 261.63;
  return base * Math.pow(2, (semitones + octave * 12) / 12);
}

/** Triad (root, 3rd, 5th) in scale. degree 0 = I, 1 = II, etc. Returns semitone offsets from root. */
export function triadInScale(scale: ScaleType, degree: number): number[] {
  const intervals = SCALE_INTERVALS[scale];
  const r = ((degree % 7) + 7) % 7;
  const root = intervals[r] ?? 0;
  const third = intervals[(r + 2) % 7] ?? 0;
  const fifth = intervals[(r + 4) % 7] ?? 0;
  const thirdOff = (third - root + 12) % 12;
  const fifthOff = (fifth - root + 12) % 12;
  return [0, thirdOff, fifthOff].map((s) => root + s);
}

/** Minor 7th chord degrees (add 7th): 0, 3, 7, 10 semitones from chord root. */
export function seventhInScale(scale: ScaleType, degree: number): number[] {
  const tri = triadInScale(scale, degree);
  const intervals = SCALE_INTERVALS[scale];
  const r = ((degree % 7) + 7) % 7;
  const seventh = intervals[(r + 6) % 7] ?? 0;
  const root = intervals[r] ?? 0;
  const seventhOff = (seventh - root + 12) % 12;
  if (seventhOff <= tri[2]) return [...tri, tri[2] + seventhOff];
  return [...tri, tri[0] + seventhOff];
}

/** Chord tones (semitones from scale root) for progression amount: 0 = minimal (triads), 1 = full (7ths). */
export function chordTonesForProgression(
  scale: ScaleType,
  stepIndex: number,
  progressionAmount: number
): number[] {
  const degree = stepIndex % 7;
  if (progressionAmount < 0.4) return triadInScale(scale, degree);
  return seventhInScale(scale, degree);
}

/** Chord root semitones from C for a scale degree. */
export function chordRootSemitones(scale: ScaleType, degree: number): number {
  const intervals = SCALE_INTERVALS[scale];
  return intervals[((degree % 7) + 7) % 7] ?? 0;
}

/** Get frequencies in Hz for a chord: rootName (e.g. 'C'), scale, stepIndex (picks degree), progressionAmount. */
export function getChordFreqs(
  rootName: string,
  scale: ScaleType,
  stepIndex: number,
  progressionAmount: number
): number[] {
  const degree = stepIndex % 7;
  const rootSemitones = chordRootSemitones(scale, degree);
  const tones = progressionAmount < 0.4 ? triadInScale(scale, degree) : seventhInScale(scale, degree);
  const base = ROOT_FREQ[rootName] ?? 261.63;
  return tones.map((s) => base * Math.pow(2, (rootSemitones + s) / 12));
}
