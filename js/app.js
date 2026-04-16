/**
 * app.js
 * Coordinador central: estado global, binding de eventos, orquestación de módulos.
 */

import { KEYS, SCALES, PROGRESSIONS, getScaleNotes, getDiatonicChords, getChordNotes, resolveProgression, getSuggestions } from './musicLogic.js';
import { playChord, metronome, setLoopChords, processLoopBeat, resetLoopIndex } from './audioEngine.js';
import { renderFretboard } from './fretboard.js';
import { renderPiano } from './piano.js';
import { renderCagedShapes } from './caged.js';

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
  customProgression: new Array(32).fill(null),
  editorDuration: 1, // 1=Negra, 2=Blanca, 4=Redonda
  diatonicChords: [],
  scaleNotes: [],
  swing: 0,
  activeChordIndex: -1,
  chordExtensions: [],
  isMuted: false,
  cagedRoot: 'C',
  cagedQuality: 'maj',
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
  renderCagedSection();
}

function renderCagedSection() {
  const container = document.getElementById('caged-container');
  const wrapper   = document.getElementById('section-caged'); // Actualizado al ID de la sección
  const heading   = document.getElementById('caged-heading');
  
  if (!container || !wrapper) return;

  if (state.instrument === 'guitar') {
    wrapper.classList.remove('hidden');
    
    // Actualizar el título con el nombre del acorde actual
    if (heading) {
      const qualityDisplay = state.cagedQuality === 'maj' ? '' : (state.cagedQuality === 'min' ? 'm' : state.cagedQuality);
      heading.textContent = `🎸 Formas del Acorde ${state.cagedRoot}${qualityDisplay} (CAGED)`;
    }

    const chordNotes = getChordNotes(state.cagedRoot, state.cagedQuality, state.chordExtensions);
    renderCagedShapes('caged-container', state.cagedRoot, chordNotes);
  } else {
    wrapper.classList.add('hidden');
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
        state.cagedRoot = chord.notes[0];
        state.cagedQuality = chord.quality;
        playChord(chord.notes);
        highlightActiveChord(idx);
        renderCagedSection();
      }
    });
  });

  container.querySelectorAll('.btn-add-to-custom').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx, 10);
      const chord = state.diatonicChords[idx];
      if (chord) {
        // En lugar de pushear, "seleccionamos" este acorde para pintar
        state.activeChordIndex = idx;
        highlightActiveChord(idx);
        
        // Pero también lo añadimos al primer slot vacío para dar feedback
        // IMPORTANTE: Al pulsar el botón '+', siempre se añade como NEGRA (duración 1)
        // para permitir repeticiones rápidas. El modo "pincel" se reserva para la rejilla.
        const firstEmpty = state.customProgression.findIndex(c => c === null);
        if (firstEmpty !== -1) {
          toggleChordAt(firstEmpty, 1);
        }
      }
    });
  });
}

function toggleChordAt(idx, forcedDuration = null) {
  const activeChord = state.diatonicChords[state.activeChordIndex];
  if (!activeChord) return;

  const duration = forcedDuration || parseInt(state.editorDuration, 10);
  // Creamos UNA SOLA instancia para este bloque. 
  // Esto permite diferenciar entre un acorde largo y 4 negras del mismo acorde.
  const newChordInstance = { ...activeChord };

  for (let i = 0; i < duration; i++) {
    if (idx + i < 32) {
      state.customProgression[idx + i] = newChordInstance;
    }
  }
  renderCustomProgression();
  if (state.isLoopOn && !state.selectedProgression) {
    triggerLoopRestart();
  }
}

function removeChordAt(idx) {
  const current = state.customProgression[idx];
  if (!current) return;

  // Borrar el bloque contiguo por IDENTIDAD de objeto
  let start = idx;
  while (start > 0 && state.customProgression[start - 1] === current) start--;
  let end = idx;
  while (end < 31 && state.customProgression[end + 1] === current) end++;

  for (let i = start; i <= end; i++) {
    state.customProgression[i] = null;
  }
  renderCustomProgression();
  if (state.isLoopOn && !state.selectedProgression) {
    triggerLoopRestart();
  }
}

function renderCustomProgression() {
  const container = document.getElementById('custom-prog-slots');
  if (!container) return;

  let html = '';
  for (let i = 0; i < 32; i++) {
    const chord = state.customProgression[i];
    const prev = i > 0 ? state.customProgression[i - 1] : null;
    const next = i < 31 ? state.customProgression[i + 1] : null;

    // Fusión visual solo si es el MISMO OBJETO exacto
    const isMergedLeft = chord && prev && chord === prev;
    const isMergedRight = chord && next && chord === next;

    let classes = 'custom-slot';
    if (chord) classes += ' filled';
    if (isMergedLeft) classes += ' merged-left';
    if (isMergedRight) classes += ' merged-right';

    html += `
      <div class="${classes}" data-idx="${i}">
        <div class="slot-roman">${chord && !isMergedLeft ? chord.romanNumeral : ''}</div>
        <div class="slot-name">${chord && !isMergedLeft ? chord.name : ''}</div>
        ${chord && !isMergedRight ? `<div class="slot-remove" data-idx="${i}">×</div>` : ''}
      </div>`;
  }
  container.innerHTML = html;

  container.querySelectorAll('.custom-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      const idx = parseInt(slot.dataset.idx, 10);
      toggleChordAt(idx);
    });
  });

  container.querySelectorAll('.slot-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx, 10);
      removeChordAt(idx);
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
  state.cagedRoot = state.key;
  // Determinar calidad básica de la tónica
  const tonicChord = state.diatonicChords[0];
  state.cagedQuality = tonicChord ? tonicChord.quality : (state.scale.includes('Minor') ? 'min' : 'maj');
  
  renderCagedSection();
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
  } else {
    // Para el modo manual, pasamos los 32 pasos
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
      processLoopBeat(beatNum, state.bpm, (chord, idx) => {
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
      state.customProgression = new Array(32).fill(null);
      renderCustomProgression();
      if (state.isLoopOn && !state.selectedProgression) {
        triggerLoopRestart();
      }
    });
  }
}

function initDurationButtons() {
  const btns = document.querySelectorAll('.duration-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.editorDuration = parseInt(btn.dataset.dur, 10);
    });
  });
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

function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nueva versión detectada y lista para activarse
              showUpdateBanner(newWorker);
            }
          });
        });
      });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        window.location.reload();
        refreshing = true;
      }
    });
  }
}

function showUpdateBanner(worker) {
  const banner = document.getElementById('update-banner');
  const refreshBtn = document.getElementById('update-refresh-btn');
  if (!banner || !refreshBtn) return;

  banner.classList.remove('hidden');
  refreshBtn.addEventListener('click', () => {
    worker.postMessage({ type: 'SKIP_WAITING' });
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
  initServiceWorker();
  renderBPMDisplay();
  
  initDurationButtons();
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
