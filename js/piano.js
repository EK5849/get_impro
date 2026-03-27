/**
 * piano.js
 * Renderiza un teclado de piano SVG interactivo.
 */

import { playNoteClick } from './audioEngine.js';

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const WHITE_KEYS = [
  { note: 'C', offset: 0 },
  { note: 'D', offset: 1 },
  { note: 'E', offset: 2 },
  { note: 'F', offset: 3 },
  { note: 'G', offset: 4 },
  { note: 'A', offset: 5 },
  { note: 'B', offset: 6 },
];

const BLACK_KEYS = [
  { note: 'C#', offset: 0.7 },
  { note: 'D#', offset: 1.7 },
  { note: 'F#', offset: 3.7 },
  { note: 'G#', offset: 4.7 },
  { note: 'A#', offset: 5.7 },
];

const DEGREE_COLORS = {
  root: '#F5C842',
  second: '#A8C97F',
  third: '#7B5CF6',
  fourth: '#5BC0EB',
  fifth: '#E85C5C',
  sixth: '#FF9F43',
  seventh: '#B8B8FF',
  default: '#555577',
};

function getDegreeColor(note, scaleNotes) {
  const idx = scaleNotes.indexOf(note);
  if (idx === -1) return null;
  const colors = Object.values(DEGREE_COLORS);
  return colors[Math.min(idx, colors.length - 2)];
}

export function renderPiano(containerId, scaleNotes = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const keyWidth = 40;
  const whiteHeight = 160;
  const blackWidth = 26;
  const blackHeight = 100;
  const numOctaves = 2;
  const totalWidth = (7 * numOctaves + 1) * keyWidth + 20;

  let svg = `<svg width="${totalWidth}" height="${whiteHeight + 20}" viewBox="0 0 ${totalWidth} ${whiteHeight + 10}" 
    xmlns="http://www.w3.org/2000/svg" class="piano-svg">
    <rect x="0" y="0" width="${totalWidth}" height="${whiteHeight + 10}" fill="#111" rx="6"/>`;

  for (let oct = 0; oct < numOctaves; oct++) {
    WHITE_KEYS.forEach(wk => {
      const x = (oct * 7 + wk.offset) * keyWidth + 10;
      const noteName = wk.note;
      const inScale = scaleNotes.includes(noteName);
      const isRoot = scaleNotes.length > 0 && noteName === scaleNotes[0];
      const color = inScale ? (isRoot ? DEGREE_COLORS.root : getDegreeColor(noteName, scaleNotes)) : '#FFF';
      
      svg += `<rect x="${x}" y="0" width="${keyWidth - 2}" height="${whiteHeight}" 
        fill="${color}" stroke="#000" rx="3" class="piano-key white"
        data-note="${noteName}" data-octave="${oct + 3}" style="cursor:pointer"></rect>`;
    });
  }
  const lastX = (numOctaves * 7) * keyWidth + 10;
  svg += `<rect x="${lastX}" y="0" width="${keyWidth - 2}" height="${whiteHeight}" 
    fill="${scaleNotes.includes('C') ? (scaleNotes[0] === 'C' ? DEGREE_COLORS.root : getDegreeColor('C', scaleNotes)) : '#FFF'}" 
    stroke="#000" rx="3" class="piano-key white"
    data-note="C" data-octave="${numOctaves + 3}" style="cursor:pointer"></rect>`;

  for (let oct = 0; oct < numOctaves; oct++) {
    BLACK_KEYS.forEach(bk => {
      const x = (oct * 7 + bk.offset) * keyWidth + 10;
      const noteName = bk.note;
      const inScale = scaleNotes.includes(noteName);
      const isRoot = scaleNotes.length > 0 && noteName === scaleNotes[0];
      const color = inScale ? (isRoot ? DEGREE_COLORS.root : getDegreeColor(noteName, scaleNotes)) : '#222';

      svg += `<rect x="${x}" y="0" width="${blackWidth}" height="${blackHeight}" 
        fill="${color}" stroke="#000" rx="2" class="piano-key black"
        data-note="${noteName}" data-octave="${oct + 3}" style="cursor:pointer"></rect>`;
    });
  }

  svg += '</svg>';
  container.innerHTML = svg;

  container.querySelectorAll('.piano-key').forEach(key => {
    key.addEventListener('click', (e) => {
      playNoteClick(e.target.dataset.note, parseInt(e.target.dataset.octave, 10));
    });
  });
}
