/**
 * caged.js
 * Lógica para definir y renderizar las 5 formas del sistema CAGED (Guitarra).
 */

import { CHROMATIC_NOTES } from './musicLogic.js';

// Definición de formas relativas (fret 0 es el traste de la cejilla o raíz virtual)
const PATTERNS = {
  major: [
    { name: 'Forma de C', rootString: 5, rootRelativeFret: 3, positions: [
      { s: 5, f: 3, d: 'root' }, { s: 4, f: 2, d: 'third' }, { s: 3, f: 0, d: 'fifth' }, { s: 2, f: 1, d: 'root' }, { s: 1, f: 0, d: 'third' }
    ]},
    { name: 'Forma de A', rootString: 5, rootRelativeFret: 0, positions: [
      { s: 5, f: 0, d: 'root' }, { s: 4, f: 2, d: 'fifth' }, { s: 3, f: 2, d: 'root' }, { s: 2, f: 2, d: 'third' }, { s: 1, f: 0, d: 'fifth' }
    ]},
    { name: 'Forma de G', rootString: 6, rootRelativeFret: 3, positions: [
      { s: 6, f: 3, d: 'root' }, { s: 5, f: 2, d: 'third' }, { s: 4, f: 0, d: 'fifth' }, { s: 3, f: 0, d: 'root' }, { s: 2, f: 0, d: 'third' }, { s: 1, f: 3, d: 'root' }
    ]},
    { name: 'Forma de E', rootString: 6, rootRelativeFret: 0, positions: [
      { s: 6, f: 0, d: 'root' }, { s: 5, f: 2, d: 'fifth' }, { s: 4, f: 2, d: 'root' }, { s: 3, f: 1, d: 'third' }, { s: 2, f: 0, d: 'fifth' }, { s: 1, f: 0, d: 'root' }
    ]},
    { name: 'Forma de D', rootString: 4, rootRelativeFret: 0, positions: [
      { s: 4, f: 0, d: 'root' }, { s: 3, f: 2, d: 'fifth' }, { s: 2, f: 3, d: 'root' }, { s: 1, f: 2, d: 'third' }
    ]},
  ],
  minor: [
    { name: 'Forma de Cm', rootString: 5, rootRelativeFret: 3, positions: [
      { s: 5, f: 3, d: 'root' }, { s: 4, f: 1, d: 'third' }, { s: 3, f: 0, d: 'fifth' }, { s: 2, f: 1, d: 'root' }, { s: 1, f: 0, d: 'third' }
    ]},
    { name: 'Forma de Am', rootString: 5, rootRelativeFret: 0, positions: [
      { s: 5, f: 0, d: 'root' }, { s: 4, f: 2, d: 'fifth' }, { s: 3, f: 2, d: 'root' }, { s: 2, f: 1, d: 'third' }, { s: 1, f: 0, d: 'fifth' }
    ]},
    { name: 'Forma de Gm', rootString: 6, rootRelativeFret: 3, positions: [
      { s: 6, f: 3, d: 'root' }, { s: 5, f: 1, d: 'third' }, { s: 4, f: 0, d: 'fifth' }, { s: 3, f: 0, d: 'root' }, { s: 2, f: 0, d: 'third' }, { s: 1, f: 3, d: 'root' }
    ]},
    { name: 'Forma de Em', rootString: 6, rootRelativeFret: 0, positions: [
      { s: 6, f: 0, d: 'root' }, { s: 5, f: 2, d: 'fifth' }, { s: 4, f: 2, d: 'root' }, { s: 3, f: 0, d: 'third' }, { s: 2, f: 0, d: 'fifth' }, { s: 1, f: 0, d: 'root' }
    ]},
    { name: 'Forma de Dm', rootString: 4, rootRelativeFret: 0, positions: [
      { s: 4, f: 0, d: 'root' }, { s: 3, f: 2, d: 'fifth' }, { s: 2, f: 3, d: 'root' }, { s: 1, f: 1, d: 'third' }
    ]},
  ]
};

const GUITAR_TUNING = ['E', 'B', 'G', 'D', 'A', 'E'];

const COLORS = {
  root: '#F5C842',
  third: '#7B5CF6',
  fifth: '#E85C5C',
  none: '#555577'
};

/**
 * Encuentra el primer traste donde aparece una nota en una cuerda.
 */
function findFirstFret(note, stringIdx) {
  const openNote = GUITAR_TUNING[stringIdx];
  const openIdx = CHROMATIC_NOTES.indexOf(openNote);
  const targetIdx = CHROMATIC_NOTES.indexOf(note);
  let fret = targetIdx - openIdx;
  if (fret < 0) fret += 12;
  return fret;
}

/**
 * Renderiza los 5 diagramas en el contenedor.
 */
export function renderCagedShapes(containerId, rootNote, quality = 'maj') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const isMinor = quality.includes('min') || quality.includes('dim') || quality.includes('°') || quality.includes('m');
  const typeKey = isMinor ? 'minor' : 'major';
  const patterns = PATTERNS[typeKey];

  let html = `<div class="caged-grid">`;

  patterns.forEach(pattern => {
    // Calcular el traste base para esta forma
    // Ejemplo: Forma de E con raíz en G (traste 3 de la cuerda 6)
    // rootRelativeFret para E es 0. Entonces baseFret = 3 - 0 = 3.
    const rootFretOnString = findFirstFret(rootNote, pattern.rootString - 1);
    let baseFret = rootFretOnString - pattern.rootRelativeFret;
    if (baseFret < 0) baseFret += 12;

    html += `
      <div class="caged-diagram-item">
        <div class="caged-diagram-name">${pattern.name}</div>
        <div class="caged-svg-wrap">
          ${renderMiniFretboard(pattern.positions, baseFret, rootNote)}
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

function renderMiniFretboard(positions, baseFret, rootNote) {
  const numStrings = 6;
  const numFrets = 4; // Mostrar 4 trastes
  const fretW = 35;
  const stringH = 22;
  const paddingX = 20;
  const paddingY = 15;
  
  const svgW = paddingX * 2 + numFrets * fretW;
  const svgH = paddingY * 2 + (numStrings - 1) * stringH;

  let svg = `<svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Trastes
  for (let f = 0; f <= numFrets; f++) {
    const x = paddingX + f * fretW;
    svg += `<line x1="${x}" y1="${paddingY}" x2="${x}" y2="${paddingY + (numStrings - 1) * stringH}" stroke="#ffffff33" stroke-width="1.5"/>`;
  }

  // Cuerdas
  for (let s = 0; s < numStrings; s++) {
    const y = paddingY + s * stringH;
    svg += `<line x1="${paddingX}" y1="${y}" x2="${paddingX + numFrets * fretW}" y2="${y}" stroke="#ffffff22" stroke-width="1"/>`;
  }

  // Número de traste base
  svg += `<text x="${paddingX - 12}" y="${paddingY + (numStrings - 1) * stringH + 12}" font-size="9" fill="#888" font-weight="bold">${baseFret}</text>`;

  // Notas
  positions.forEach(pos => {
    const x = paddingX + (pos.f + 0.5) * fretW;
    const y = paddingY + (pos.s - 1) * stringH;
    const color = COLORS[pos.d] || COLORS.none;
    
    svg += `<circle cx="${x}" cy="${y}" r="8" fill="${color}" />`;
    if (pos.d === 'root') {
      svg += `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="8" font-weight="900" fill="#000">R</text>`;
    }
  });

  svg += `</svg>`;
  return svg;
}
