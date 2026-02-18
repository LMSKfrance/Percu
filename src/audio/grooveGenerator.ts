/**
 * Seed-based groove generator for techno-style patterns.
 * Same seed → same groove (reproducible idea generation).
 */
import seedrandom from 'seedrandom';
import type { LaneId, Pattern, Step } from './types';
import { LANE_IDS, createEmptyStep, createEmptyPattern } from './types';

function stepOn(vel: number, ratchet: number = 0, micro: number = 0): Step {
  return { on: true, vel, ratchet, micro };
}

function stepOff(): Step {
  return { ...createEmptyStep(), on: false };
}

export type GenerateOptions = { world?: number; chordProgression?: number };

/** Generate a full pattern from a seed string. Deterministic. world 0=Detroit, 0.5=Tbilisi, 1=Berlin. chordProgression 0=minimal, 1=full. */
export function generatePatternFromSeed(seed: string, options: GenerateOptions = {}): Pattern {
  const rng = seedrandom(seed);
  const world = options.world ?? 0.5;
  const chordProg = options.chordProgression ?? 0.5;
  const pattern = createEmptyPattern();

  // Kick: techno 4-on-floor or variant (1, 5, 9, 13 or 1, 9, 13)
  const kickStyle = rng();
  const kickSteps = kickStyle < 0.7 ? [0, 4, 8, 12] : kickStyle < 0.9 ? [0, 8, 12] : [0, 6, 12];
  for (let i = 0; i < 16; i++) {
    pattern.Kick![i] = kickSteps.includes(i)
      ? stepOn(0.85 + rng() * 0.15)
      : stepOff();
  }
  // Occasional extra kick (e.g. step 2 or 14)
  if (rng() < 0.4) pattern.Kick![rng() < 0.5 ? 2 : 14] = stepOn(0.7 + rng() * 0.2);

  // Sub: often on 1 and 9, sometimes follow kick
  for (let i = 0; i < 16; i++) {
    const on = i === 0 || i === 8 || (pattern.Kick![i].on && rng() < 0.6);
    pattern.Sub![i] = on ? stepOn(0.75 + rng() * 0.2) : stepOff();
  }

  // Hat: 8ths or 16ths with skips and accents
  const hatDensity = 0.3 + rng() * 0.5;
  for (let i = 0; i < 16; i++) {
    const is8th = i % 2 === 0;
    const prob = is8th ? 0.9 : hatDensity;
    if (rng() < prob) {
      const vel = 0.4 + rng() * 0.5;
      const ratchet = rng() < 0.15 ? (rng() < 0.5 ? 1 : 2) : 0;
      pattern.Hat![i] = stepOn(vel, ratchet);
    } else {
      pattern.Hat![i] = stepOff();
    }
  }

  // Low Perc: sparse, often offbeat
  for (let i = 0; i < 16; i++) {
    if (rng() < 0.25) {
      pattern['Low Perc']![i] = stepOn(0.6 + rng() * 0.3, rng() < 0.1 ? 1 : 0);
    } else {
      pattern['Low Perc']![i] = stepOff();
    }
  }

  // Mid Perc: sparse
  for (let i = 0; i < 16; i++) {
    if (rng() < 0.2) {
      pattern['Mid Perc']![i] = stepOn(0.5 + rng() * 0.4, rng() < 0.12 ? 1 : 0);
    } else {
      pattern['Mid Perc']![i] = stepOff();
    }
  }

  // Noise: very sparse
  for (let i = 0; i < 16; i++) {
    if (rng() < 0.12) {
      pattern.Noise![i] = stepOn(0.4 + rng() * 0.4, rng() < 0.15 ? 1 : 0);
    } else {
      pattern.Noise![i] = stepOff();
    }
  }

  // Chord: world 0=Detroit (more), 0.5=Tbilisi (minimal), 1=Berlin (fewer). chordProgression = density.
  const chordMin = world < 0.35 ? 3 : world > 0.65 ? 1 : 2;
  const chordMax = world < 0.35 ? 6 : world > 0.65 ? 4 : 5;
  const chordCount = chordMin + Math.floor(rng() * (chordMax - chordMin + 1));
  const progScale = chordProg * 0.5 + 0.5;
  const actualCount = Math.max(1, Math.floor(chordCount * progScale));
  const chordCandidates = [0, 4, 8, 12, 2, 6, 10, 14];
  const chosen: number[] = [];
  for (let c = 0; c < actualCount && chordCandidates.length > 0; c++) {
    const idx = Math.floor(rng() * chordCandidates.length);
    chosen.push(chordCandidates.splice(idx, 1)[0]);
  }
  for (let i = 0; i < 16; i++) {
    pattern.Chord![i] = chosen.includes(i)
      ? stepOn(0.6 + rng() * 0.3)
      : stepOff();
  }

  return pattern;
}

/** Regenerate only percussion lanes (Low Perc, Mid Perc, Hat, Noise) from seed + salt. */
export function randomisePercFromSeed(seed: string, currentPattern: Pattern): Pattern {
  const rng = seedrandom(seed + ':perc');
  const next = { ...currentPattern };

  const percLanes: LaneId[] = ['Hat', 'Low Perc', 'Mid Perc', 'Noise'];
  for (const lane of percLanes) {
    const steps = [...(next[lane] ?? [])];
    for (let i = 0; i < 16; i++) {
      const baseProb = lane === 'Hat' ? 0.5 : lane === 'Low Perc' ? 0.25 : lane === 'Mid Perc' ? 0.2 : 0.12;
      const is8th = i % 2 === 0;
      const prob = lane === 'Hat' && is8th ? 0.9 : baseProb;
      if (rng() < prob) {
        const vel = 0.4 + rng() * 0.5;
        const ratchet = rng() < 0.12 ? (rng() < 0.5 ? 1 : 2) : 0;
        steps[i] = stepOn(vel, ratchet);
      } else {
        steps[i] = stepOff();
      }
    }
    next[lane] = steps;
  }
  return next;
}

/** Regenerate only kick, sub, chord (tonal/rhythm backbone) from seed + salt. */
export function randomiseTonalFromSeed(seed: string, currentPattern: Pattern): Pattern {
  const rng = seedrandom(seed + ':tonal');
  const next: Pattern = { ...currentPattern };
  next.Kick = [...(currentPattern.Kick ?? [])];
  next.Sub = [...(currentPattern.Sub ?? [])];
  next.Chord = [...(currentPattern.Chord ?? [])];

  // Kick
  const kickSteps = rng() < 0.7 ? [0, 4, 8, 12] : [0, 8, 12];
  for (let i = 0; i < 16; i++) {
    next.Kick[i] = kickSteps.includes(i) ? stepOn(0.85 + rng() * 0.15) : stepOff();
  }
  if (rng() < 0.4) next.Kick[rng() < 0.5 ? 2 : 14] = stepOn(0.7 + rng() * 0.2);

  // Sub
  for (let i = 0; i < 16; i++) {
    const on = i === 0 || i === 8 || (next.Kick[i].on && rng() < 0.6);
    next.Sub[i] = on ? stepOn(0.75 + rng() * 0.2) : stepOff();
  }

  // Chord
  const chordCount = 2 + Math.floor(rng() * 4);
  const chordCandidates = [0, 4, 8, 12, 2, 6, 10, 14];
  const chosen: number[] = [];
  for (let c = 0; c < chordCount && chordCandidates.length > 0; c++) {
    const idx = Math.floor(rng() * chordCandidates.length);
    chosen.push(chordCandidates.splice(idx, 1)[0]);
  }
  for (let i = 0; i < 16; i++) {
    next.Chord[i] = chosen.includes(i) ? stepOn(0.6 + rng() * 0.3) : stepOff();
  }

  return next;
}

/** Generate a new random seed string (for "New Seed" button). */
export function generateNewSeed(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
