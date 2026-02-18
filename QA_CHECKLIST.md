# Manual QA Checklist – Techno Generator

Use this list to confirm each requirement after running the app (`npm run dev`).

## Transport & audio
- [ ] **Play works** – Click Play; transport starts, steps trigger sound.
- [ ] **Stop works** – Click Stop; transport stops, sound stops.
- [ ] **BPM works** – Change BPM (e.g. 128 → 100); tempo changes live.
- [ ] **First gesture resumes AudioContext** – Play (or any click) resumes context if suspended; no “resume” popup required before first sound.

## Sequencer step UX
- [ ] **Single click** – Click a cell only selects/highlights it; does **not** toggle the step on/off.
- [ ] **Double-click empty** – Double-click an empty step creates a step (vel 0.8, ratchet 0).
- [ ] **Double-click filled** – Double-click a filled step deletes it (step off, params cleared).
- [ ] **Click+hold drag velocity** – Click+hold on a filled step and drag up/down; velocity changes smoothly (up = louder, down = quieter).
- [ ] **Click+hold drag ratchet** – Horizontal drag adjusts ratchet (0..2).
- [ ] **Hover X/Y indicator** – Hovering a cell shows a subtle X/Y (horizontal/vertical) arrow indicator.
- [ ] **Tooltip during drag** – While dragging, a tooltip shows vel and ratchet values.
- [ ] **No step jitter** – No rerender storms; step updates feel smooth (single action per frame where applicable).

## Start offset
- [ ] **&lt; / &gt; buttons** – &lt; decreases start offset (0..15, wrap); &gt; increases. Display shows current start offset.
- [ ] **Shift + &lt; / &gt;** – Shift+&lt; moves by 4 steps back; Shift+&gt; moves by 4 steps forward.
- [ ] **Playback uses offset** – Playback step = (startOffsetSteps + transportStep) % 16; playhead and triggered steps follow this.
- [ ] **WAV export uses offset** – Exported WAV matches what you hear, including start offset (first bar starts at offset).

## Knobs / dials
- [ ] **No knob jitter** – Clicking a dial does **not** jump or shake the value; value only changes after a small drag (e.g. 4px) from pointerdown.

## Rumble & delays
- [ ] **Rumble on/off** – “Rumble” toggle (left column) turns rumble bus on/off; audible when on (kick + low perc feed rumble).
- [ ] **Chord delay** – “Chord Dly” toggle enables delay after chord; default OFF.
- [ ] **Master delay** – “Master Dly” toggle enables delay on master; default OFF.

## Kick & sub
- [ ] **Kick on/off** – Lane toggle for “Kick” mutes/unmutes kick.
- [ ] **Sub on/off** – Lane toggle for “Sub” mutes/unmutes sub.

## Export
- [ ] **WAV export** – Click EXPORT (in detail view when detail is open); a WAV file downloads (44.1 kHz, 16-bit).
- [ ] **Export matches playback** – Rendered WAV includes same pattern, BPM, start offset, and rumble as current state (delays in export can be added later if needed).

## UI / no dead UI
- [ ] **No fullscreen overlays** – No overlay div blocks the sequencer or transport.
- [ ] **No pointer-events: none** – Main containers do not use `pointer-events: none`; all buttons remain clickable.
- [ ] **All buttons wired** – Play, Stop, BPM, &lt; &gt;, lane toggles, Rumble/Chord Dly/Master Dly, Export have real handlers and work.

---

**Sign-off:** Complete each item and tick before release. If any item fails, fix before marking complete.
