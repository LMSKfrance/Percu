/**
 * Export pattern data for injection into Percu Pro.
 * Returns JSON with tempo, loopLength, swing, grooveTemplateId, seed, channels and steps.
 */

import type { Pattern, Step, Track } from './groove/generator';
import type { GrooveTemplateId } from './audio/grooveTemplates';

export interface ExportChannel {
  id: string;
  name: string;
  role: string;
  mute: boolean;
  solo: boolean;
  steps: ExportStep[];
}

export interface ExportStep {
  isActive: boolean;
  velocity: number;
  probability: number;
  microShiftMs: number;
  ratchetCount: number;
  accent: boolean;
}

export interface PercuExportPayload {
  tempo: number;
  loopLength: number;
  swing: number;
  grooveTemplateId: GrooveTemplateId;
  seed: string;
  channels: ExportChannel[];
}

export function exportPercuPayload(
  pattern: Pattern,
  opts: {
    tempo: number;
    loopLength: number;
    swing: number;
    grooveTemplateId: GrooveTemplateId;
    seed: string;
    laneToggles: Map<string, boolean>;
    soloToggles: Map<string, boolean>;
  }
): PercuExportPayload {
  const channels: ExportChannel[] = pattern.tracks.map((track) => ({
    id: track.id,
    name: track.name,
    role: track.role,
    mute: !(opts.laneToggles.get(track.name) ?? true),
    solo: opts.soloToggles.get(track.name) ?? false,
    steps: track.steps.map(stepToExportStep),
  }));

  return {
    tempo: opts.tempo,
    loopLength: opts.loopLength,
    swing: opts.swing,
    grooveTemplateId: opts.grooveTemplateId,
    seed: opts.seed,
    channels,
  };
}

function stepToExportStep(s: Step): ExportStep {
  return {
    isActive: s.on,
    velocity: s.vel,
    probability: s.probability ?? 1,
    microShiftMs: (s.micro ?? 0) * 1000,
    ratchetCount: s.ratchet ?? 0,
    accent: s.accent ?? false,
  };
}
