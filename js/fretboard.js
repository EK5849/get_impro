/**
 * fretboard.js
 * Renderiza diapasones SVG interactivos para guitarra y bajo.
 */

import { playNoteClick } from './audioEngine.js';

// ─── Afinaciones estándar ────────────────────────────────────────────────────
const GUITAR_TUNING = ['E', 'B', 'G', 'D', 'A', 'E']; 
const BASS_TUNING   = ['G', 'D', 'A', 'E'];
const CHROMATIC     = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const GUITAR_OCTAVES = [4, 3, 3, 3, 2, 2];
const BASS_OCTAVES   = [2, 2, 1, 1];

const INLAY_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21];

const DEGREE_COLORS = {
  root     : '#F5C842',
  second   : '#A8C97F',
  third    : '#7B5CF6',
  fourth   : '#5BC0EB',
  fifth    : '#E85C5C',
  sixth    : '#FF9F43',
  seventh  : '#B8B8FF',
  default  : '#555577',
};

function getNoteAtFret(openNote, fret) {
  const openIdx = CHROMATIC.indexOf(openNote);
  return CHROMATIC[(openIdx + fret) % 12];
}

function getOctaveAtFret(openOctave, openNote, fret) {
  const openIdx = CHROMATIC.indexOf(openNote);
  const newIdx  = openIdx + fret;
  return openOctave + Math.floor(newIdx / 12);
}

function getDegreeColor(note, scaleNotes) {
  const idx = scaleNotes.indexOf(note);
  if (idx === -1) return null;
  const colors = Object.values(DEGREE_COLORS);
  return colors[Math.min(idx, colors.length - 2)];
}

export function renderFretboard(containerId, instrument = 'guitar', scaleNotes = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const isGuitar   = instrument !== 'bass';
  const tuning     = isGuitar ? GUITAR_TUNING : BASS_TUNING;
  const octaves    = isGuitar ? GUITAR_OCTAVES : BASS_OCTAVES;
  const numStrings = tuning.length;
  const numFrets   = 12;

  const fretW    = 56;
  const stringH  = 32;
  const paddingX = 44;
  const paddingY = 24;
  const svgW     = paddingX + (numFrets + 1) * fretW;
  const svgH     = paddingY * 2 + numStrings * stringH;

  let svg = `<svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" 
    xmlns="http://www.w3.org/2000/svg" class="fretboard-svg">
    <rect x="${paddingX}" y="${paddingY}" width="${numFrets * fretW}" height="${(numStrings - 1) * stringH}" 
      rx="4" fill="#1a1a1a"/>`;

  for (let f = 0; f <= numFrets; f++) {
    const x = paddingX + f * fretW;
    svg += `<line x1="${x}" y1="${paddingY}" x2="${x}" y2="${paddingY + (numStrings - 1) * stringH}" 
      stroke="#C5A88066" stroke-width="${f === 0 ? 4 : 2}"/>`;
  }

  for (let s = 0; s < numStrings; s++) {
    const y = paddingY + s * stringH;
    svg += `<line x1="${paddingX}" y1="${y}" x2="${paddingX + numFrets * fretW}" y2="${y}" 
      stroke="#C5A88099" stroke-width="${1 + s * 0.4}"/>`;
    
    const openNote = tuning[s];
    svg += `<text x="${paddingX - 12}" y="${y + 4}" text-anchor="middle" 
      font-family="Space Grotesk, sans-serif" font-size="12" font-weight="800"
      fill="#C5A880">${openNote}</text>`;
  }

  for (let s = 0; s < numStrings; s++) {
    const y = paddingY + s * stringH;
    for (let f = 0; f <= numFrets; f++) {
      if (f === 0) continue; 
      const note   = getNoteAtFret(tuning[s], f);
      const inScale = scaleNotes.includes(note);
      const isRoot  = scaleNotes.length > 0 && note === scaleNotes[0];

      if (!inScale && scaleNotes.length > 0) continue;

      const cx = paddingX + (f - 0.5) * fretW;
      const color = isRoot ? DEGREE_COLORS.root : getDegreeColor(note, scaleNotes) || DEGREE_COLORS.default;
      const r = isRoot ? 11 : 10;
      const textColor = isRoot ? '#000' : '#fff';

      svg += `<circle cx="${cx}" cy="${y}" r="${r}" fill="${color}" 
        class="fret-note" style="cursor:pointer" 
        data-note="${note}" data-octave="${getOctaveAtFret(octaves[s], tuning[s], f)}" opacity="0.9">
      </circle>
      <text x="${cx}" y="${y + 4}" text-anchor="middle" 
        font-family="Space Grotesk, sans-serif" font-size="10" font-weight="800"
        fill="${textColor}" style="pointer-events:none">${note}</text>`;
    }
  }

  svg += '</svg>';
  container.innerHTML = svg;

  container.querySelectorAll('.fret-note').forEach(circle => {
    circle.addEventListener('click', (e) => {
      playNoteClick(e.target.dataset.note, parseInt(e.target.dataset.octave, 10));
    });
  });
}
