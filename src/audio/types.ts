/** Single step in the grid */
export interface Step {
  on: boolean;
  vel: number;
  ratchet: number;
  micro: number;
}

export const LANE_IDS = ['Kick', 'Sub', 'Low Perc', 'Mid Perc', 'Hat', 'Noise', 'Chord'] as const;
export type LaneId = (typeof LANE_IDS)[number];

export type Pattern = Record<LaneId, Step[]>;

export function createEmptyStep(): Step {
  return { on: false, vel: 0.8, ratchet: 0, micro: 0 };
}

export function createEmptyPattern(): Pattern {
  const empty = (): Step[] =>
    Array.from({ length: 16 }, () => createEmptyStep());
  return Object.fromEntries(LANE_IDS.map((id) => [id, empty()])) as Pattern;
}

export type ScaleType = 'Minor' | 'Dorian' | 'Phrygian' | 'Major';
export const ROOT_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
