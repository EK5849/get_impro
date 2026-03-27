/**
 * app.js
 * Coordinador central: estado global, binding de eventos, orquestación de módulos.
 */

import { KEYS, SCALES, PROGRESSIONS, getScaleNotes, getDiatonicChords, resolveProgression, getSuggestions } from './musicLogic.js';
import { playChord, metronome, setLoopChords, processLoopBeat, resetLoopIndex } from './audioEngine.js';
import { renderFretboard } from './fretboard.js';
import { renderPiano } from './piano.js';

// ─── Estado Global ─────────────────────────────────────────────────────────────
const state = {
  key: 'A',
  scale: 'pentatonicMinor',
  bpm: 90,
  timeSignature: 4,
  instrument: 'guitar',
  isMetronomeOn: false,
  isLoopOn: false,
  selectedProgression: null,
  customProgression: [], // Array de hasta 8 acordes
  diatonicChords: [],
  scaleNotes: [],
  swing: 0,
  activeChordIndex: -1,
  chordExtensions: [],
  isMuted: false,
};

// ─── Funciones de actualización de UI ─────────────────────────────────────────

function updateScaleNotes() {
  state.scaleNotes    = getScaleNotes(state.key, state.scale);
  state.diatonicChords= getDiatonicChords(state.key, state.scale, state.chordExtensions);
}

function renderScaleNotesDisplay() {
  const el = document.getElementById('scale-notes-display');
  if (!el) return;
  el.innerHTML = state.scaleNotes.map((n, i) => {
    const isRoot = i === 0;
    return `<span class="scale-note-pill ${isRoot ? 'root' : ''}">${n}</span>`;
  }).join('');
}

function renderInstrument() {
  const fretboardContainer = document.getElementById('fretboard-container');
  const pianoContainer     = document.getElementById('piano-container');

  if (state.instrument === 'guitar' || state.instrument === 'bass') {
    fretboardContainer?.classList.remove('hidden');
    pianoContainer?.classList.add('hidden');
    renderFretboard('fretboard-container', state.instrument, state.scaleNotes);
  } else if (state.instrument === 'piano') {
    fretboardContainer?.classList.add('hidden');
    pianoContainer?.classList.remove('hidden');
    renderPiano('piano-container', state.scaleNotes);
  }
}

function renderChordsSection() {
  const container = document.getElementById('chords-grid');
  if (!container) return;

  if (!state.diatonicChords.length) {
    container.innerHTML = '<p class="no-data">Selecciona una escala de 7 notas para ver los acordes diatónicos.</p>';
    return;
  }

  container.innerHTML = state.diatonicChords.map((chord, idx) => {
    const isActive = idx === state.activeChordIndex;
    return `
      <div class="chord-card ${isActive ? 'active' : ''}" data-idx="${idx}">
        <div class="chord-roman">${chord.romanNumeral}</div>
        <div class="chord-name">${chord.name}</div>
        <div class="chord-notes">${chord.notes.join(' · ')}</div>
        <button class="btn-play-chord" data-idx="${idx}" title="Reproducir acorde">▶</button>
        <button class="btn-add-to-custom" data-idx="${idx}" title="Agregar a progresión personalizada">+</button>
      </div>`;
  }).join('');

  container.querySelectorAll('.btn-play-chord').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx, 10);
      const chord = state.diatonicChords[idx];
      if (chord) {
        playChord(chord.notes);
        highlightActiveChord(idx);
      }
    });
  });

  container.querySelectorAll('.btn-add-to-custom').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx, 10);
      const chord = state.diatonicChords[idx];
      if (chord && state.customProgression.length < 8) {
        state.customProgression.push({ ...chord });
        renderCustomProgression();
        if (state.isLoopOn && !state.selectedProgression) {
          triggerLoopRestart();
        }
      }
    });
  });
}

function renderCustomProgression() {
  const container = document.getElementById('custom-prog-slots');
  if (!container) return;

  let html = '';
  for (let i = 0; i < 8; i++) {
    const chord = state.customProgression[i];
    if (chord) {
      html += `
        <div class="custom-slot filled" data-idx="${i}">
          <div class="slot-roman">${chord.romanNumeral}</div>
          <div class="slot-name">${chord.name}</div>
          <div class="slot-remove" data-idx="${i}">×</div>
        </div>`;
    } else {
      html += `<div class="custom-slot" data-idx="${i}"></div>`;
    }
  }
  container.innerHTML = html;

  container.querySelectorAll('.slot-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx, 10);
      state.customProgression.splice(idx, 1);
      renderCustomProgression();
      if (state.isLoopOn && !state.selectedProgression) {
        triggerLoopRestart();
      }
    });
  });
}

function highlightActiveChord(chordOrIdx, loopIdx = -1) {
  let chordIdx = -1;
  
  if (chordOrIdx !== null && chordOrIdx !== undefined) {
    if (typeof chordOrIdx === 'number') {
      chordIdx = chordOrIdx;
    } else {
      // Buscar el índice exacto en el array actual de acordes diatónicos
      // Comparamos por nombre para ser robustos ante refrescos de estado
      chordIdx = state.diatonicChords.findIndex(c => c.name === chordOrIdx.name);
    }
  }

  state.activeChordIndex = chordIdx;

  // 1. Resaltar en la cuadrícula de acordes (Grado Real)
  const chordCards = document.querySelectorAll('.chord-card');
  chordCards.forEach((c, i) => {
    c.classList.toggle('active', i === chordIdx);
  });
  
  // 2. Resaltar en los slots de la progresión (Paso del Loop)
  const slots = document.querySelectorAll('.custom-slot');
  slots.forEach((s, i) => {
    // Si estamos en este paso del loop, añadir clase de pulso
    s.classList.toggle('active-beat', i === loopIdx);
  });
}

function renderProgressionsSection() {
  const container = document.getElementById('progressions-grid');
  if (!container) return;

  container.innerHTML = PROGRESSIONS.map(prog => {
    const resolved = resolveProgression(state.diatonicChords, prog.degrees);
    const chordNames = resolved.map(c => c?.name || '?').join(' → ');
    const isSelected = state.selectedProgression?.id === prog.id;
    return `
      <div class="progression-card ${isSelected ? 'selected' : ''}" data-prog="${prog.id}">
        <div class="prog-label">${prog.label}</div>
        <div class="prog-style">${prog.style}</div>
        <div class="prog-chords">${chordNames}</div>
      </div>`;
  }).join('');

  container.querySelectorAll('.progression-card').forEach(card => {
    card.addEventListener('click', () => {
      const progId = card.dataset.prog;
      const prog = PROGRESSIONS.find(p => p.id === progId);
      if (!prog) return;

      if (state.selectedProgression?.id === progId) {
        state.selectedProgression = null;
        card.classList.remove('selected');
      } else {
        document.querySelectorAll('.progression-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        state.selectedProgression = prog;
        // Al seleccionar una predefinida, ignoramos la custom para el loop
      }
      
      if (state.isLoopOn) {
        triggerLoopRestart();
      }
    });
  });

  renderCustomProgression();
}

function renderSuggestionsSection() {
  const s = getSuggestions(state.scale);
  const feelingEl = document.getElementById('suggestion-feeling-mini');
  const artistEl  = document.getElementById('suggestion-artists-mini');
  const notesEl   = document.getElementById('suggestion-notes-mini');

  if (feelingEl) feelingEl.textContent = s.feeling;
  if (artistEl)  artistEl.textContent  = s.artists.length ? s.artists.join(', ') : '...';
  if (notesEl) {
    notesEl.innerHTML = s.targetNotes.map(n => `<span class="target-note">${n}</span>`).join('');
  }
}

function renderBPMDisplay() {
  const navBpmInput = document.getElementById('nav-bpm-input');
  if (navBpmInput) navBpmInput.value = state.bpm;
}

// ─── Actualización completa de la UI ─────────────────────────────────────────
function refreshAll() {
  updateScaleNotes();
  renderScaleNotesDisplay();
  renderInstrument();
  renderChordsSection();
  renderProgressionsSection();
  renderSuggestionsSection();

  if (state.isLoopOn) {
    triggerLoopRestart();
  }
}

function triggerLoopRestart() {
  resetLoopIndex();
  let chordsToLoop = [];
  
  if (state.selectedProgression) {
    chordsToLoop = resolveProgression(state.diatonicChords, state.selectedProgression.degrees);
  } else if (state.customProgression.length > 0) {
    chordsToLoop = state.customProgression;
  }

  setLoopChords(chordsToLoop);
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

function initKeySelector() {
  const container = document.getElementById('key-selector');
  if (!container) return;

  container.innerHTML = KEYS.map(k =>
    `<button class="key-pill ${k === state.key ? 'active' : ''}" data-key="${k}">${k}</button>`
  ).join('');

  container.addEventListener('click', e => {
    const btn = e.target.closest('.key-pill');
    if (!btn) return;
    state.key = btn.dataset.key;
    container.querySelectorAll('.key-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    refreshAll();
  });
}

function initScaleSelector() {
  const select = document.getElementById('scale-selector');
  if (!select) return;

  select.innerHTML = Object.entries(SCALES).map(([id, s]) =>
    `<option value="${id}" ${id === state.scale ? 'selected' : ''}>${s.name}</option>`
  ).join('');

  select.addEventListener('change', () => {
    state.scale = select.value;
    refreshAll();
  });
}

function initInstrumentTabs() {
  const tabs = document.querySelectorAll('.instrument-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.instrument = tab.dataset.instrument;
      renderInstrument();
    });
  });
}

function initMetronome() {
  const bpmInput   = document.getElementById('nav-bpm-input');
  const tapTempo   = document.getElementById('nav-tap-tempo');
  const muteBtn    = document.getElementById('nav-mute-toggle');
  const beatVisual = document.getElementById('beat-visual-mini');

  function syncBPM(newBpm) {
    state.bpm = newBpm;
    if (bpmInput) bpmInput.value = newBpm;
    metronome.setBPM(newBpm);
  }

  if (bpmInput) {
    bpmInput.value = state.bpm;
    bpmInput.addEventListener('change', () => {
      const v = Math.max(30, Math.min(300, parseInt(bpmInput.value) || 120));
      syncBPM(v);
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      state.isMuted = !state.isMuted;
      metronome.setMuted(state.isMuted);
      muteBtn.classList.toggle('muted', state.isMuted);
      muteBtn.querySelector('.icon-volume').textContent = state.isMuted ? '🔇' : '🔊';
    });
  }

  // Metrónomo onBeat — Pulso visual y Proceso de Loop
  metronome.onBeat = (beatNum, accent) => {
    const beatInBar = beatNum % state.timeSignature;
    
    if (beatVisual) {
      beatVisual.classList.remove('active');
      void beatVisual.offsetWidth; // reflow trigger
      beatVisual.classList.add('active');
    }

    if (state.isLoopOn) {
      processLoopBeat(beatInBar, state.bpm, (chord, idx) => {
        highlightActiveChord(chord, idx);
      });
    }
  };
}

function initProgressionControls() {
  const btnLoop = document.getElementById('btn-loop');
  const btnStop = document.getElementById('btn-stop-loop');
  const btnClear= document.getElementById('btn-clear-custom');

  if (btnLoop) {
    btnLoop.addEventListener('click', () => {
      // Necesitamos o una seleccionada o algo en la custom
      if (!state.selectedProgression && state.customProgression.length === 0) {
        btnLoop.classList.add('shake');
        setTimeout(() => btnLoop.classList.remove('shake'), 500);
        return;
      }
      state.isLoopOn = true;
      btnLoop.classList.add('on');
      btnStop?.classList.remove('hidden');
      triggerLoopRestart();
      
      // Si el metrónomo no está corriendo, lo iniciamos para que el loop suene
      if (!state.isMetronomeOn) {
        metronome.start();
        state.isMetronomeOn = true;
      }
    });
  }

  if (btnStop) {
    btnStop.addEventListener('click', () => {
      state.isLoopOn = false;
      metronome.stop();
      state.isMetronomeOn = false;
      resetLoopIndex();
      state.activeChordIndex = -1;
      highlightActiveChord(null, -1);
      btnStop.classList.add('hidden');
      btnLoop?.classList.remove('on');
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      state.customProgression = [];
      renderCustomProgression();
      if (state.isLoopOn && !state.selectedProgression) {
        triggerLoopRestart();
      }
    });
  }
}

function initNavLinks() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function initTapTempo() {
  const btn = document.getElementById('nav-tap-tempo');
  if (!btn) return;
  let lastTap = 0;
  const taps = [];

  btn.addEventListener('click', () => {
    const now = Date.now();
    if (lastTap && now - lastTap < 3000) {
      taps.push(now - lastTap);
      if (taps.length > 4) taps.shift();
      const avg = taps.reduce((a, b) => a + b) / taps.length;
      const newBpm = Math.round(60000 / avg);
      state.bpm = Math.max(30, Math.min(300, newBpm));
      metronome.setBPM(state.bpm);
      
      const bpmInput = document.getElementById('nav-bpm-input');
      if (bpmInput) bpmInput.value = state.bpm;
    } else {
      taps.length = 0;
    }
    lastTap = now;
    btn.classList.add('tapped');
    setTimeout(() => btn.classList.remove('tapped'), 100);
  });
}

// ─── Inicialización ────────────────────────────────────────────────────────────
export function init() {
  initKeySelector();
  initScaleSelector();
  initInstrumentTabs();
  initMetronome();
  initProgressionControls();
  initNavLinks();
  initTapTempo();
  renderBPMDisplay();
  
  // Extensiones de acordes (7, 9, 11, 13)
  document.querySelectorAll('.ext-check').forEach(cb => {
    cb.addEventListener('change', () => {
      state.chordExtensions = Array.from(document.querySelectorAll('.ext-check:checked')).map(c => c.value);
      refreshAll();
    });
  });

  refreshAll();

  // Welcome animation
  document.querySelectorAll('.section').forEach((el, i) => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(20px)';
    setTimeout(() => {
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      el.style.opacity = 1;
      el.style.transform = 'translateY(0)';
    }, 100 + i * 80);
  });
}
