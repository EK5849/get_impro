/**
 * caged.js
 * Lógica para definir y renderizar las 5 formas del sistema CAGED (Guitarra).
 * Ahora soportan extensiones de forma dinámica.
 */

import { CHROMATIC_NOTES } from './musicLogic.js';

// Anclas de las 5 formas: indican en qué cuerda y qué traste relativo está la tónica "guía".
const ANCHORS = [
  { name: 'Forma de C', rootString: 5, rootRelativeFret: 3 },
  { name: 'Forma de A', rootString: 5, rootRelativeFret: 0 },
  { name: 'Forma de G', rootString: 6, rootRelativeFret: 3 },
  { name: 'Forma de E', rootString: 6, rootRelativeFret: 0 },
  { name: 'Forma de D', rootString: 4, rootRelativeFret: 0 },
];

const GUITAR_TUNING = ['E', 'B', 'G', 'D', 'A', 'E'];

const COLORS = {
  root:    '#F5C842',
  third:   '#7B5CF6',
  fifth:   '#E85C5C',
  ext7:    '#5BC0EB',
  ext9:    '#FF9F43',
  ext11:   '#A8C97F',
  ext13:   '#EB5BEE',
  none:    '#555577'
};

/**
 * Determina el intervalo de una nota respecto a la tónica.
 */
function getIntervalLabel(note, rootNote) {
  const rootIdx = CHROMATIC_NOTES.indexOf(rootNote);
  const noteIdx = CHROMATIC_NOTES.indexOf(note);
  let diff = noteIdx - rootIdx;
  if (diff < 0) diff += 12;

  switch (diff) {
    case 0:  return { label: 'R',  type: 'root' };
    case 3:  
    case 4:  return { label: '3',  type: 'third' };
    case 6:  
    case 7:  return { label: '5',  type: 'fifth' };
    case 10: 
    case 11: return { label: '7',  type: 'ext7' };
    case 1:  
    case 2:  return { label: '9',  type: 'ext9' }; // simplificado para 9a
    case 5:  return { label: '11', type: 'ext11' };
    case 8:  
    case 9:  return { label: '13', type: 'ext13' };
    default: return { label: '?',  type: 'none' };
  }
}

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
 * Renderiza los 5 diagramas en el contenedor de forma dinámica.
 */
export function renderCagedShapes(containerId, rootNote, chordNotes) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let html = `<div class="caged-grid">`;

  ANCHORS.forEach(anchor => {
    // 1. Calcular baseFret de la forma
    const rootFretOnString = findFirstFret(rootNote, anchor.rootString - 1);
    let baseFret = rootFretOnString - anchor.rootRelativeFret;
    if (baseFret < 0) baseFret += 12;

    // 2. Calcular qué notas del acorde caen en el rango [baseFret, baseFret + 3]
    const positions = [];
    for (let s = 1; s <= 6; s++) {
      for (let fRel = 0; fRel <= 3; fRel++) {
        const absFret = baseFret + fRel;
        const noteAtPos = getNoteAt(s, absFret);
        if (chordNotes.includes(noteAtPos)) {
          const info = getIntervalLabel(noteAtPos, rootNote);
          positions.push({ s, f: fRel, d: info.type, label: info.label });
        }
      }
    }

    html += `
      <div class="caged-diagram-item">
        <div class="caged-diagram-name">${anchor.name}</div>
        <div class="caged-svg-wrap">
          ${renderMiniFretboard(positions, baseFret)}
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

function getNoteAt(stringNum, fret) {
  const openNote = GUITAR_TUNING[stringNum - 1];
  const openIdx = CHROMATIC_NOTES.indexOf(openNote);
  return CHROMATIC_NOTES[(openIdx + fret) % 12];
}

function renderMiniFretboard(positions, baseFret) {
  const numStrings = 6;
  const numFrets = 4;
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
    svg += `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="8" font-weight="950" fill="#000">${pos.label}</text>`;
  });

  svg += `</svg>`;
  return svg;
}
