/**
 * Groove templates: microtiming curves per step (16th grid).
 * Each returns offset in milliseconds; applied after base step time, then swing scales offbeats.
 */

export type GrooveTemplateId =
  | 'straight'
  | '8th'
  | '16th'
  | 'ableton-16-swing-55'
  | 'mpc-16-swing'
  | 'sp1200-shuffle';

export const GROOVE_TEMPLATE_IDS: GrooveTemplateId[] = [
  'straight',
  '8th',
  '16th',
  'ableton-16-swing-55',
  'mpc-16-swing',
  'sp1200-shuffle',
];

/** Get microtiming offset in ms for a step index (0–15). Even = downbeat/8th, odd = offbeat. */
export function getGrooveOffsetMs(stepIndex: number, templateId: GrooveTemplateId): number {
  const isOffbeat = stepIndex % 2 === 1;
  const stepInPair = stepIndex % 2;
  switch (templateId) {
    case 'straight':
      return 0;
    case '8th':
      // Slight push on offbeats (8th-note feel)
      return isOffbeat ? 4 : 0;
    case '16th':
      // 16th-note shuffle: delay second 16th in each 8th
      return isOffbeat ? 8 : 0;
    case 'ableton-16-swing-55':
      // Ableton-style 55% swing: offbeats late
      return isOffbeat ? 6 : 0;
    case 'mpc-16-swing':
      // MPC feel: subtle push
      return isOffbeat ? 5 : 0;
    case 'sp1200-shuffle':
      // SP-1200 style shuffle
      return isOffbeat ? 10 : 0;
    default:
      return 0;
  }
}
