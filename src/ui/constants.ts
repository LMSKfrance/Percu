export type CityMode = 'detroit' | 'tbilisi' | 'berlin';

export const VOICE_ICONS: Record<string, string> = {
  Kick: '⬤', Sub: '◐', 'Low Perc': '◆', 'Mid Perc': '◇',
  Hat: '△', Noise: '∿', Chord: '♫', Acid: '⚗',
};

export const WIP_LANES = new Set(['Chord', 'Acid']);

export const CITY_MAP: Record<CityMode, number> = {
  detroit: 0.0,
  tbilisi: 0.5,
  berlin: 1.0,
};

export const PERC_MODELS = [
  'DFAM', 'Syncussion', 'Virus TI Noise', 'FM Metallic',
  'FM Wood', 'Analog Click', 'Ring Mod', 'Granular Noise',
] as const;
