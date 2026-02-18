import seedrandom from 'seedrandom';

export interface Step {
  on: boolean;
  vel: number; // 0..1
  micro: number; // seconds, microtiming offset
  ratchet: number; // 0..2, number of repeats
}

export interface Track {
  name: string;
  steps: Step[];
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

  // Kick track
  const kickSteps: Step[] = [];
  for (let i = 0; i < 16; i++) {
    const step = i % 4 === 0; // 4/4 default
    const on = step || (kick4on4 < 0.5 && rng() < effectiveDensity * 0.3);
    kickSteps.push({
      on,
      vel: on ? 0.8 + rng() * 0.2 : 0,
      micro: on ? (rng() - 0.5) * microtimingAmount : 0,
      ratchet: on && rng() < ratchetProbability ? 1 + Math.floor(rng() * 2) : 0,
    });
  }
  tracks.push({ name: 'Kick', steps: kickSteps });

  // Sub track (follows kick but lower velocity)
  const subSteps: Step[] = [];
  for (let i = 0; i < 16; i++) {
    const kickStep = kickSteps[i];
    const on = kickStep.on && rng() < 0.7; // Sometimes skip
    subSteps.push({
      on,
      vel: on ? kickStep.vel * (0.5 + rng() * 0.3) : 0,
      micro: on ? kickStep.micro + (rng() - 0.5) * 0.005 : 0,
      ratchet: 0, // Sub doesn't ratchet
    });
  }
  tracks.push({ name: 'Sub', steps: subSteps });

  // Low Perc track
  const lowPercSteps: Step[] = [];
  for (let i = 0; i < 16; i++) {
    const avoidKick = kickSteps[i].on;
    const prob = avoidKick ? effectiveDensity * 0.2 : effectiveDensity * 0.4;
    const on = rng() < prob;
    lowPercSteps.push({
      on,
      vel: on ? 0.5 + rng() * 0.4 : 0,
      micro: on ? (rng() - 0.5) * microtimingAmount : 0,
      ratchet: on && rng() < ratchetProbability * 0.5 ? 1 : 0,
    });
  }
  tracks.push({ name: 'Low Perc', steps: lowPercSteps });

  // Mid Perc track
  const midPercSteps: Step[] = [];
  for (let i = 0; i < 16; i++) {
    const prob = effectiveDensity * 0.3;
    const on = rng() < prob;
    midPercSteps.push({
      on,
      vel: on ? 0.4 + rng() * 0.5 : 0,
      micro: on ? (rng() - 0.5) * microtimingAmount : 0,
      ratchet: on && rng() < ratchetProbability * 0.7 ? 1 + Math.floor(rng() * 2) : 0,
    });
  }
  tracks.push({ name: 'Mid Perc', steps: midPercSteps });

  // Hat track
  const hatSteps: Step[] = [];
  for (let i = 0; i < 16; i++) {
    const straight = i % 2 === 0 || (i % 2 === 1 && hatStraightness > 0.5);
    const swingOffset = i % 2 === 1 ? (1 - swing) * 0.1 : 0;
    const prob = straight ? effectiveDensity * 0.6 : effectiveDensity * 0.3;
    const on = rng() < prob;
    hatSteps.push({
      on,
      vel: on ? 0.3 + rng() * 0.5 : 0,
      micro: on ? (rng() - 0.5) * microtimingAmount * 0.5 + swingOffset : 0,
      ratchet: on && rng() < ratchetProbability * 0.8 ? 1 + Math.floor(rng() * 2) : 0,
    });
  }
  tracks.push({ name: 'Hat', steps: hatSteps });

  // Noise track (affected by percussiveNoisy)
  const noiseSteps: Step[] = [];
  const noiseProb = percussiveNoisy * 0.4 + effectiveDensity * 0.2;
  for (let i = 0; i < 16; i++) {
    const on = rng() < noiseProb;
    noiseSteps.push({
      on,
      vel: on ? percussiveNoisy * 0.6 + rng() * 0.4 : 0,
      micro: on ? (rng() - 0.5) * microtimingAmount : 0,
      ratchet: on && rng() < ratchetProbability * 0.6 ? 1 : 0,
    });
  }
  tracks.push({ name: 'Noise', steps: noiseSteps });

  // Chord track (engine WIP — generates sparse chord hits)
  const chordSteps: Step[] = [];
  for (let i = 0; i < 16; i++) {
    const on = i % 4 === 0 && rng() < effectiveDensity * 0.5;
    chordSteps.push({
      on,
      vel: on ? 0.4 + rng() * 0.3 : 0,
      micro: on ? (rng() - 0.5) * microtimingAmount * 0.5 : 0,
      ratchet: 0,
    });
  }
  tracks.push({ name: 'Chord', steps: chordSteps });

  // Acid track (engine WIP — generates acid bass/lead pattern)
  const acidSteps: Step[] = [];
  for (let i = 0; i < 16; i++) {
    const on = rng() < effectiveDensity * 0.35;
    acidSteps.push({
      on,
      vel: on ? 0.5 + rng() * 0.4 : 0,
      micro: on ? (rng() - 0.5) * microtimingAmount : 0,
      ratchet: on && rng() < ratchetProbability * 0.4 ? 1 : 0,
    });
  }
  tracks.push({ name: 'Acid', steps: acidSteps });

  return { tracks };
}
