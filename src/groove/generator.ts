import seedrandom from 'seedrandom';

/** Channel role for techno sequencing and export */
export type ChannelRole = 'kick' | 'hat' | 'clap' | 'perc' | 'fx';

export interface Step {
  on: boolean;
  vel: number; // 0..1
  micro: number; // seconds, microtiming offset
  ratchet: number; // 0..2, number of repeats (ratchetCount)
  probability: number; // 0..1, used in generation; playback uses on (deterministic)
  accent: boolean;
}

export interface Track {
  id: string;
  name: string;
  role: ChannelRole;
  steps: Step[];
}

/** Default step for deterministic generation */
function defaultStep(overrides: Partial<Step> = {}): Step {
  return {
    on: false,
    vel: 0.8,
    micro: 0,
    ratchet: 0,
    probability: 1,
    accent: false,
    ...overrides,
  };
}

export interface Pattern {
  tracks: Track[];
}

export interface GeneratorParams {
  seed: string;
  detroitBerlin: number; // 0..1, 0=Detroit, 1=Berlin
  percussiveNoisy: number; // 0..1, 0=Percussive, 1=Noisy
  density: number; // 0..1
}

/** Deterministic: same seed and params produce the same pattern (RNG is seeded). */
export function generatePattern(params: GeneratorParams): Pattern {
  const rng = seedrandom(params.seed);
  const { detroitBerlin, percussiveNoisy, density } = params;

  // Detroit↔Berlin affects:
  // - swing (Detroit more)
  // - density (Berlin more)
  // - hat straightness
  // - microtiming (Detroit more human)
  // - ratchets (Berlin more)
  // - kick template blend (Berlin closer to 4/4)

  // Percussive↔Noisy affects:
  // - noise probability and level
  // - distortion/bitcrush amount
  // - tonal vs noise mix

  const swing = 1 - detroitBerlin * 0.3; // Detroit has more swing
  const effectiveDensity = density * (0.5 + detroitBerlin * 0.5); // Berlin more dense
  const hatStraightness = detroitBerlin; // Berlin more straight
  const microtimingAmount = (1 - detroitBerlin) * 0.02; // Detroit more human
  const ratchetProbability = detroitBerlin * 0.3; // Berlin more ratchets
  const kick4on4 = detroitBerlin; // Berlin closer to 4/4

  const tracks: Track[] = [];

  // Kick: stable foundation with occasional offbeat variations bounded by density
  const kickSteps: Step[] = [];
  for (let i = 0; i < 16; i++) {
    const step = i % 4 === 0; // 4/4 default
    const prob = step ? 1 : effectiveDensity * 0.3;
    const on = step || (kick4on4 < 0.5 && rng() < prob);
    kickSteps.push({
      ...defaultStep(),
      on,
      vel: on ? 0.8 + rng() * 0.2 : 0,
      micro: on ? (rng() - 0.5) * microtimingAmount : 0,
      ratchet: on && rng() < ratchetProbability ? 1 + Math.floor(rng() * 2) : 0,
      probability: on ? 1 : prob,
      accent: on && (i % 4 === 0) && rng() < 0.4,
    });
  }
  tracks.push({ id: 'kick', name: 'Kick', role: 'kick', steps: kickSteps });

  // Sub track (follows kick but lower velocity)
  const subSteps: Step[] = [];
  for (let i = 0; i < 16; i++) {
    const kickStep = kickSteps[i];
    const on = kickStep.on && rng() < 0.7; // Sometimes skip
    subSteps.push({
      ...defaultStep(),
      on,
      vel: on ? kickStep.vel * (0.5 + rng() * 0.3) : 0,
      micro: on ? kickStep.micro + (rng() - 0.5) * 0.005 : 0,
      ratchet: 0,
      probability: kickStep.on ? 0.7 : 0,
    });
  }
  tracks.push({ id: 'sub', name: 'Sub', role: 'kick', steps: subSteps });

  // Perc: syncopation, call/response, bounded hits per bar to avoid clutter
  const lowPercSteps: Step[] = [];
  for (let i = 0; i < 16; i++) {
    const avoidKick = kickSteps[i].on;
    const prob = avoidKick ? effectiveDensity * 0.2 : effectiveDensity * 0.4;
    const on = rng() < prob;
    lowPercSteps.push({
      ...defaultStep(),
      on,
      vel: on ? 0.5 + rng() * 0.4 : 0,
      micro: on ? (rng() - 0.5) * microtimingAmount : 0,
      ratchet: on && rng() < ratchetProbability * 0.5 ? 1 : 0,
      probability: prob,
    });
  }
  tracks.push({ id: 'lowPerc', name: 'Low Perc', role: 'perc', steps: lowPercSteps });

  const midPercSteps: Step[] = [];
  for (let i = 0; i < 16; i++) {
    const prob = effectiveDensity * 0.3;
    const on = rng() < prob;
    midPercSteps.push({
      ...defaultStep(),
      on,
      vel: on ? 0.4 + rng() * 0.5 : 0,
      micro: on ? (rng() - 0.5) * microtimingAmount : 0,
      ratchet: on && rng() < ratchetProbability * 0.7 ? 1 + Math.floor(rng() * 2) : 0,
      probability: prob,
    });
  }
  tracks.push({ id: 'midPerc', name: 'Mid Perc', role: 'perc', steps: midPercSteps });

  // Hat: 8th/16th base with probability and accent patterns
  const hatSteps: Step[] = [];
  for (let i = 0; i < 16; i++) {
    const straight = i % 2 === 0 || (i % 2 === 1 && hatStraightness > 0.5);
    const swingOffset = i % 2 === 1 ? (1 - swing) * 0.1 : 0;
    const prob = straight ? effectiveDensity * 0.6 : effectiveDensity * 0.3;
    const on = rng() < prob;
    hatSteps.push({
      ...defaultStep(),
      on,
      vel: on ? 0.3 + rng() * 0.5 : 0,
      micro: on ? (rng() - 0.5) * microtimingAmount * 0.5 + swingOffset : 0,
      ratchet: on && rng() < ratchetProbability * 0.8 ? 1 + Math.floor(rng() * 2) : 0,
      probability: prob,
      accent: on && (i % 4 === 0) && rng() < 0.35,
    });
  }
  tracks.push({ id: 'hat', name: 'Hat', role: 'hat', steps: hatSteps });

  // FX / Noise (affected by percussiveNoisy)
  const noiseSteps: Step[] = [];
  const noiseProb = percussiveNoisy * 0.4 + effectiveDensity * 0.2;
  for (let i = 0; i < 16; i++) {
    const on = rng() < noiseProb;
    noiseSteps.push({
      ...defaultStep(),
      on,
      vel: on ? percussiveNoisy * 0.6 + rng() * 0.4 : 0,
      micro: on ? (rng() - 0.5) * microtimingAmount : 0,
      ratchet: on && rng() < ratchetProbability * 0.6 ? 1 : 0,
      probability: noiseProb,
    });
  }
  tracks.push({ id: 'noise', name: 'Noise', role: 'fx', steps: noiseSteps });

  // Chord track (engine WIP — generates sparse chord hits)
  const chordSteps: Step[] = [];
  for (let i = 0; i < 16; i++) {
    const on = i % 4 === 0 && rng() < effectiveDensity * 0.5;
    chordSteps.push({
      ...defaultStep(),
      on,
      vel: on ? 0.4 + rng() * 0.3 : 0,
      micro: on ? (rng() - 0.5) * microtimingAmount * 0.5 : 0,
      ratchet: 0,
      probability: effectiveDensity * 0.5,
    });
  }
  tracks.push({ id: 'chord', name: 'Chord', role: 'fx', steps: chordSteps });

  // Acid track (engine WIP — generates acid bass/lead pattern)
  const acidSteps: Step[] = [];
  for (let i = 0; i < 16; i++) {
    const on = rng() < effectiveDensity * 0.35;
    acidSteps.push({
      ...defaultStep(),
      on,
      vel: on ? 0.5 + rng() * 0.4 : 0,
      micro: on ? (rng() - 0.5) * microtimingAmount : 0,
      ratchet: on && rng() < ratchetProbability * 0.4 ? 1 : 0,
      probability: effectiveDensity * 0.35,
    });
  }
  tracks.push({ id: 'acid', name: 'Acid', role: 'fx', steps: acidSteps });

  return { tracks };
}
