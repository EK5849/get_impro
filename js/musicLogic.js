/**
 * musicLogic.js
 * Módulo de lógica musical pura.
 * Escalas, acordes diatónicos, progresiones y sugerencias contextuales.
 */

// ─── Notas cromáticas ───────────────────────────────────────────────────────
export const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Nombres "amigables" de cada tonalidad (incluyendo enarmónicas)
export const KEY_DISPLAY = {
  'C': 'C', 'C#': 'C# / Db', 'D': 'D', 'D#': 'D# / Eb', 'E': 'E',
  'F': 'F', 'F#': 'F# / Gb', 'G': 'G', 'G#': 'G# / Ab', 'A': 'A',
  'A#': 'A# / Bb', 'B': 'B'
};

// ─── Intervalos de escalas (semitonos desde la tónica) ──────────────────────
export const SCALES = {
  major:           { name: 'Mayor',            intervals: [0, 2, 4, 5, 7, 9, 11] },
  naturalMinor:    { name: 'Menor Natural',     intervals: [0, 2, 3, 5, 7, 8, 10] },
  harmonicMinor:   { name: 'Menor Armónica',    intervals: [0, 2, 3, 5, 7, 8, 11] },
  melodicMinor:    { name: 'Menor Melódica',    intervals: [0, 2, 3, 5, 7, 9, 11] },
  pentatonicMajor: { name: 'Pentatónica Mayor', intervals: [0, 2, 4, 7, 9] },
  pentatonicMinor: { name: 'Pentatónica Menor', intervals: [0, 3, 5, 7, 10] },
  blues:           { name: 'Blues',             intervals: [0, 3, 5, 6, 7, 10] },
  dorian:          { name: 'Dórico',            intervals: [0, 2, 3, 5, 7, 9, 10] },
  phrygian:        { name: 'Frigio',            intervals: [0, 1, 3, 5, 7, 8, 10] },
  lydian:          { name: 'Lidio',             intervals: [0, 2, 4, 6, 7, 9, 11] },
  mixolydian:      { name: 'Mixolidio',         intervals: [0, 2, 4, 5, 7, 9, 10] },
  locrian:         { name: 'Locrio',            intervals: [0, 1, 3, 5, 6, 8, 10] },
  wholeTone:       { name: 'Tonos Enteros',     intervals: [0, 2, 4, 6, 8, 10] },
  diminished:      { name: 'Disminuida',        intervals: [0, 2, 3, 5, 6, 8, 9, 11] },
};

// ─── Calidades de acordes diatónicos por grado ──────────────────────────────
// Para escalas de 7 notas: triadas (maj, min, dim) y séptimas
const DIATONIC_QUALITIES_MAJOR   = ['maj7', 'min7', 'min7', 'maj7', 'dom7', 'min7', 'dim7'];
const DIATONIC_QUALITIES_MINOR   = ['min7', 'dim7', 'maj7', 'min7', 'min7', 'maj7', 'dom7'];
const DIATONIC_QUALITIES_HARMONIC= ['min7', 'dim7', 'maj7', 'min7', 'dom7', 'maj7', 'dim7'];
const DIATONIC_QUALITIES_DORIAN  = ['min7', 'min7', 'maj7', 'dom7', 'min7', 'dim7', 'maj7'];
const DIATONIC_QUALITIES_PHRYGIAN= ['min7', 'maj7', 'dom7', 'min7', 'dim7', 'maj7', 'min7'];
const DIATONIC_QUALITIES_LYDIAN  = ['maj7', 'dom7', 'min7', 'dim7', 'maj7', 'min7', 'min7'];
const DIATONIC_QUALITIES_MIXO    = ['dom7', 'min7', 'dim7', 'maj7', 'min7', 'min7', 'maj7'];

const ROMAN_NUMERALS_MAJOR = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const ROMAN_NUMERALS_MINOR = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];

// Intervalos de acordes en semitonos
const CHORD_INTERVALS = {
  maj:  [0, 4, 7],
  min:  [0, 3, 7],
  dim:  [0, 3, 6],
  aug:  [0, 4, 8],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
  dim7: [0, 3, 6, 9],
  min7b5: [0, 3, 6, 10],
  // Extensiones (semitonos desde tónica)
  '7':  11, // se ajustará según calidad en getChordNotes
  '9':  14,
  '11': 17,
  '13': 21
};

// ─── Funciones públicas ──────────────────────────────────────────────────────

/**
 * Devuelve las notas de una escala dada la tonalidad y tipo.
 * @param {string} key   - Tonalidad ('C', 'A#', etc.)
 * @param {string} type  - Tipo de escala (key de SCALES)
 * @returns {string[]}   - Array de nombres de notas
 */
export function getScaleNotes(key, type) {
  const scale = SCALES[type];
  if (!scale) return [];
  const rootIdx = CHROMATIC_NOTES.indexOf(key);
  if (rootIdx === -1) return [];
  return scale.intervals.map(interval =>
    CHROMATIC_NOTES[(rootIdx + interval) % 12]
  );
}

/**
 * Devuelve las notas de un acorde dado su raíz, calidad básica y extensiones.
 * @param {string} root    - Nota raíz ('C', 'G#', etc.)
 * @param {string} quality - Calidad base ('maj', 'min', 'dim')
 * @param {string[]} extensions - ['7', '9', '11', '13']
 * @param {string} romanNumeral - Para saber si es dominante
 * @returns {string[]}
 */
export function getChordNotes(root, quality, extensions = [], romanNumeral = '') {
  const rootIdx = CHROMATIC_NOTES.indexOf(root);
  if (rootIdx === -1) return [];

  // Notas base (triada)
  let intervals = [...(CHORD_INTERVALS[quality] || CHORD_INTERVALS.maj)];
  
  const isDominant = romanNumeral === 'V';

  // Agregar extensiones
  extensions.forEach(ext => {
    if (ext === '7') {
      // Ajustar 7a según calidad
      if (isDominant) intervals.push(10); // Dominante (7a menor)
      else if (quality === 'maj') intervals.push(11); // maj7
      else if (quality === 'min' || quality === 'dim') intervals.push(10); // m7 o m7b5
    } else if (ext === '9') {
      intervals.push(14);
    } else if (ext === '11') {
      intervals.push(17);
    } else if (ext === '13') {
      intervals.push(21);
    }
  });

  // Eliminar duplicados y ordenar
  intervals = [...new Set(intervals)].sort((a, b) => a - b);

  return intervals.map(interval =>
    CHROMATIC_NOTES[(rootIdx + interval) % 12]
  );
}

/**
 * Genera el nombre legible de un acorde con extensiones.
 */
function chordName(root, quality, extensions = [], romanNumeral = '') {
  const suffixes = {
    maj:  '', min: 'm', dim: '°', aug: '+',
  };
  let name = root + (suffixes[quality] ?? '');
  
  const isDominant = romanNumeral === 'V';

  // Agregar extensiones al nombre
  if (extensions.includes('7')) {
    if (isDominant) name += '7';
    else if (quality === 'maj') name += 'maj7';
    else if (quality === 'min') name += '7';
    else if (quality === 'dim') name += '7'; // m7b5 o dim7 simplificado
  }
  
  // Para 9, 11, 13: si hay 7a previa, se suele omitir el paréntesis si es mayor/dominante, 
  // pero mantendremos paréntesis para mayor claridad en una app educativa.
  if (extensions.includes('9')) name += '(9)';
  if (extensions.includes('11')) name += '(11)';
  if (extensions.includes('13')) name += '(13)';
  
  return name;
}

/**
 * Devuelve los acordes diatónicos de una tonalidad y escala.
 * @param {string} key   - Tonalidad
 * @param {string} type  - Tipo de escala
 * @param {string[]} extensions - Extensiones a añadir
 * @returns {Array<{degree, romanNumeral, name, quality, notes}>}
 */
export function getDiatonicChords(key, type, extensions = []) {
  // Mapear escalas con menos de 7 notas a una escala base para armonización
  let harmonizationType = type;
  if (type === 'pentatonicMajor') harmonizationType = 'major';
  if (type === 'pentatonicMinor' || type === 'blues') harmonizationType = 'naturalMinor';

  const scale = SCALES[harmonizationType];
  // Si después del mapeo seguimos sin tener 7 notas, devolvemos vacío
  if (!scale || scale.intervals.length < 7) return [];

  const scaleNotes = getScaleNotes(key, harmonizationType);
  let qualities, romans;

  switch (harmonizationType) {
    case 'major':       qualities = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim']; romans = ROMAN_NUMERALS_MAJOR; break;
    case 'naturalMinor':qualities = ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj']; romans = ROMAN_NUMERALS_MINOR; break;
    case 'harmonicMinor':qualities= ['min', 'dim', 'maj', 'min', 'maj', 'maj', 'dim']; romans = ROMAN_NUMERALS_MINOR; break;
    case 'dorian':      qualities = ['min', 'min', 'maj', 'maj', 'min', 'dim', 'maj']; romans = ROMAN_NUMERALS_MAJOR; break;
    case 'phrygian':    qualities = ['min', 'maj', 'maj', 'min', 'dim', 'maj', 'min']; romans = ROMAN_NUMERALS_MINOR; break;
    case 'lydian':      qualities = ['maj', 'maj', 'min', 'dim', 'maj', 'min', 'min']; romans = ROMAN_NUMERALS_MAJOR; break;
    case 'mixolydian':  qualities = ['maj', 'min', 'dim', 'maj', 'min', 'min', 'maj']; romans = ROMAN_NUMERALS_MAJOR; break;
    default:            qualities = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim']; romans = ROMAN_NUMERALS_MAJOR;
  }

  return scaleNotes.map((note, i) => ({
    degree: i + 1,
    romanNumeral: romans[i] || (i + 1).toString(),
    name: chordName(note, qualities[i], extensions, romans[i]),
    quality: qualities[i],
    notes: getChordNotes(note, qualities[i], extensions, romans[i]),
  }));
}

// ─── Progresiones predefinidas ───────────────────────────────────────────────
export const PROGRESSIONS = [
  { id: 'I-V-vi-IV',   label: 'I – V – vi – IV',  degrees: [0, 4, 5, 3], style: 'Pop / Rock' },
  { id: 'ii-V-I',      label: 'ii – V – I',        degrees: [1, 4, 0],    style: 'Jazz' },
  { id: 'i-VII-VI',    label: 'i – VII – VI',       degrees: [0, 6, 5],    style: 'Flamenco / Metal' },
  { id: 'I-IV-V',      label: 'I – IV – V',         degrees: [0, 3, 4],    style: 'Blues / Rock' },
  { id: 'i-iv-VII-III',label: 'i – iv – VII – III', degrees: [0, 3, 6, 2], style: 'Menor Clásica' },
  { id: 'I-vi-IV-V',   label: 'I – vi – IV – V',    degrees: [0, 5, 3, 4], style: '50s / Doo-wop' },
  { id: 'vi-IV-I-V',   label: 'vi – IV – I – V',    degrees: [5, 3, 0, 4], style: 'Indie / Alternativo' },
];

/**
 * Resuelve los acordes de una progresión a partir de los acordes diatónicos actuales.
 * @param {Object[]} diatonicChords - Resultado de getDiatonicChords()
 * @param {number[]} degrees        - Array de índices (0-based)
 * @returns {Object[]}              - Array de acordes
 */
export function resolveProgression(diatonicChords, degrees) {
  if (!diatonicChords || diatonicChords.length === 0) return [];
  return degrees.map(d => diatonicChords[d] || diatonicChords[0]);
}

// ─── Sugerencias contextuales ────────────────────────────────────────────────
export const SCALE_SUGGESTIONS = {
  major: {
    feeling: '😊 Alegre, brillante, estable — ideal para solos melódicos y canciones optimistas.',
    targetNotes: ['Tónica (grado 1)', 'Tercera mayor (grado 3)', 'Quinta (grado 5)'],
    tips: [
      'Comienza y termina frases en la tónica para crear reposo.',
      'El grado 7 (sensible) crea tensión hacia la tónica.',
      'Mezcla con pentatónica mayor para un sonido más fluido.',
    ],
    artists: ['John Mayer', 'Eric Clapton', 'Mark Knopfler'],
  },
  naturalMinor: {
    feeling: '🌑 Oscuro, melancólico, emotivo — perfecto para rock, baladas y expresión profunda.',
    targetNotes: ['Tónica (grado 1)', 'Tercera menor (grado 3)', 'Séptima menor (grado 7)'],
    tips: [
      'La tercera menor es la nota más característica de la escala.',
      'Los grados 3-7-6 crean una sensación de caída oscura.',
      'Combina con pentatónica menor para blues-rock.',
    ],
    artists: ['David Gilmour', 'Santana', 'Gary Moore'],
  },
  harmonicMinor: {
    feeling: '🔥 Exótico, dramático, flamencoso — gran tensión armónica.',
    targetNotes: ['Séptima mayor (grado 7)', 'Tónica (grado 1)', 'Tercera menor (grado 3)'],
    tips: [
      'El intervalo aumentado entre grado 6 y 7 es su sello distintivo.',
      'Úsala sobre el acorde V (dominante) para máxima tensión-resolución.',
      'Ideal para solos de estilo clásico o metal melódico.',
    ],
    artists: ['Yngwie Malmsteen', 'Ritchie Blackmore', 'Al Di Meola'],
  },
  melodicMinor: {
    feeling: '✨ Sofisticado, jazzístico, fluido — el favorito del jazz moderno.',
    targetNotes: ['Tónica', 'Tercera menor', 'Sexta mayor'],
    tips: [
      'Combina la oscuridad del menor con la brillantez del mayor.',
      'Los modos derivados (Lydian Dominant, Altered) son esenciales en jazz.',
      'Prueba sobre acordes min(maj7).',
    ],
    artists: ['Pat Metheny', 'Miles Davis', 'Herbie Hancock'],
  },
  pentatonicMajor: {
    feeling: '☀️ Luminoso, country, folk — sonido abierto y universalmente agradable.',
    targetNotes: ['Tónica', 'Segunda mayor', 'Quinta'],
    tips: [
      'Perfecta para solos country y rock melódico.',
      'Evita semitonos — todas las notas suenan bien entre sí.',
      'Bends en la segunda y sexta dan sabor bluesy.',
    ],
    artists: ['Brad Paisley', 'Albert Lee', 'The Beatles'],
  },
  pentatonicMinor: {
    feeling: '🎸 Poderoso, blues-rock, emotivo — la escala más usada en rock y blues.',
    targetNotes: ['Tónica', 'Tercera menor', 'Quinta'],
    tips: [
      'Las 5 posiciones en el diapasón cubren todo el mástil.',
      'Bends y vibratos en el grado 3 son el alma del rock.',
      'Agrega el blue note (b5) para más tensión y sabor.',
    ],
    artists: ['Jimmy Page', 'Slash', 'Jimi Hendrix'],
  },
  blues: {
    feeling: '🎷 Gritón, expresivo, raw — sangre y sudor puro.',
    targetNotes: ['Tónica', 'Blue note (b5)', 'Séptima menor'],
    tips: [
      'La blue note (b5) es la joya de la corona — úsala en momentos de clímax.',
      'Mezcla mayor y menor para el "clash" característico del blues.',
      'El call-and-response es tu mejor herramienta.',
    ],
    artists: ['B.B. King', 'Stevie Ray Vaughan', 'Robert Johnson'],
  },
  dorian: {
    feeling: '😎 Funky, groove, misterioso — menor con un toque brillante.',
    targetNotes: ['Tónica', 'Tercera menor', 'Sexta mayor'],
    tips: [
      'La sexta mayor (diferencia con menor natural) le da brillo y groove.',
      'Escala preferida para funk y jazz-rock.',
      'Funciona perfectamente sobre acordes m7.',
    ],
    artists: ['Carlos Santana', 'Miles Davis (So What)', 'Nile Rodgers'],
  },
  phrygian: {
    feeling: '🐉 Oscuro, flamenco, metálico — tensión y exotismo máximos.',
    targetNotes: ['Tónica', 'Segunda menor (identidad)', 'Quinta'],
    tips: [
      'La segunda menor (b2) es su sello — úsala prominentemente.',
      'El cliché descenso frigio (I-VII-VI-V) es icónico en flamenco.',
      'Ideal para riffs de metal y solos oscuros.',
    ],
    artists: ['Paco de Lucía', 'Metallica', 'Muse'],
  },
  lydian: {
    feeling: '🚀 Etéreo, dreamy, cinematográfico — mayor con un sabor flotante.',
    targetNotes: ['Tónica', 'Cuarta aumentada (identidad)', 'Séptima mayor'],
    tips: [
      'La #4 (tritono) es lo que crea esa sensación de "flotar".',
      'Muy usada en bandas sonoras y música épica.',
      'John Williams y Joe Satriani la adoran.',
    ],
    artists: ['Joe Satriani', 'Steve Vai', 'John Williams'],
  },
  mixolydian: {
    feeling: '🎉 Rockero, festivo, blues-rock — mayor con un twist oscuro.',
    targetNotes: ['Tónica', 'Séptima menor (identidad)', 'Quinta'],
    tips: [
      'La séptima menor es lo que la diferencia de la mayor normal.',
      'Escala base del rock clásico y el funk/blues.',
      'Perfecta sobre acordes dominantes (7).',
    ],
    artists: ['Led Zeppelin', 'Jimi Hendrix', 'The Rolling Stones'],
  },
  locrian: {
    feeling: '💀 Inestable, disonante, extremo — tensión sin resolución.',
    targetNotes: ['Segunda menor', 'Quinta disminuida', 'Séptima menor'],
    tips: [
      'Casi nunca se usa como tónica — es demasiado inestable.',
      'Perfecta para riffs de metal extremo y jazz avant-garde.',
      'El acorde raíz es disminuido — usa esa tensión.',
    ],
    artists: ['Meshuggah', 'Tom Morello', 'Steve Coleman'],
  },
  wholeTone: {
    feeling: '🌊 Flotante, impresionista, ambiguo — todo son tonos enteros.',
    targetNotes: ['Tónica', 'Segunda', 'Cuarta aumentada'],
    tips: [
      'No tiene semitonos — todo suena simétrico y vago.',
      'Debussy la usaba para crear atmósferas acuáticas.',
      'Perfecta para pasajes de tensión suspendida.',
    ],
    artists: ['Claude Debussy', 'Frank Zappa', 'Thelonious Monk'],
  },
  diminished: {
    feeling: '⚡ Simétrica, tensa, dramática — alterna tonos y semitonos.',
    targetNotes: ['Tónica', 'Menor segunda', 'Tercera menor'],
    tips: [
      'Es simétrica — se repite cada 3 semitonos.',
      'Usada sobre acordes disminuidos y dominantes alterados.',
      'Combina con cromáticos para máxima tensión.',
    ],
    artists: ['Guthrie Govan', 'Allan Holdsworth', 'John Coltrane'],
  },
};

/**
 * Devuelve las sugerencias para una escala dada.
 * @param {string} type - Tipo de escala
 * @returns {Object}
 */
export function getSuggestions(type) {
  return SCALE_SUGGESTIONS[type] || {
    feeling: '🎵 Explora esta escala con libertad creativa.',
    targetNotes: ['Tónica'],
    tips: ['Escucha primero, toca después.'],
    artists: [],
  };
}

/**
 * Frecuencia MIDI de una nota (octava 4 por defecto).
 * @param {string} note  - Nombre de la nota
 * @param {number} octave
 * @returns {number}     - Frecuencia en Hz
 */
export function noteToFrequency(note, octave = 4) {
  const idx = CHROMATIC_NOTES.indexOf(note);
  if (idx === -1) return 440;
  const midiNumber = (octave + 1) * 12 + idx;
  return 440 * Math.pow(2, (midiNumber - 69) / 12);
}
