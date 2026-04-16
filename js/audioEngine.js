/**
 * audioEngine.js
 * Motor de audio basado en Web Audio API.
 * Metrónomo con scheduling preciso, síntesis de acordes y clics.
 */

import { noteToFrequency } from './musicLogic.js';

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// ─── Síntesis de nota individual ─────────────────────────────────────────────

/**
 * Toca una nota con un oscilador sinusoidal y envelope ADSR.
 * @param {number} frequency - Frecuencia en Hz
 * @param {number} duration  - Duración en segundos
 * @param {number} startTime - Tiempo de inicio (AudioContext.currentTime)
 * @param {number} volume    - 0..1
 * @param {string} type      - 'sine' | 'triangle' | 'sawtooth' | 'square'
 */
function playNote(frequency, duration = 0.8, startTime = 0, volume = 0.4, type = 'triangle') {
  const ctx = getAudioContext();
  const t = startTime || ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, t);

  // ADSR: attack 5ms, decay 50ms, sustain 70%, release
  const attack  = 0.005;
  const decay   = 0.05;
  const sustain = volume * 0.7;
  const release = 0.1;

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + attack);
  gain.gain.linearRampToValueAtTime(sustain, t + attack + decay);
  gain.gain.setValueAtTime(sustain, t + duration - release);
  gain.gain.linearRampToValueAtTime(0, t + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.01);
}

/**
 * Toca un acorde (array de nombres de notas) con voz MIDI media.
 * @param {string[]} notes   - Array de notas ['C','E','G']
 * @param {number} duration  - Duración en segundos
 * @param {number} startTime - Web Audio start time
 */
export function playChord(notes, duration = 1.2, startTime = 0) {
  const ctx = getAudioContext();
  const t = startTime || ctx.currentTime;

  // Strum effect: pequeño delay entre notas (10ms cada una)
  notes.forEach((note, i) => {
    const freq = noteToFrequency(note, 4);
    // Bajos una octava abajo
    const oct = i === 0 ? 3 : 4;
    playNote(noteToFrequency(note, oct), duration, t + i * 0.012, 0.28, 'triangle');
  });
}

/**
 * Toca una nota individual al hacer clic en el diapasón.
 * @param {string} note   - Nombre de nota
 * @param {number} octave
 */
export function playNoteClick(note, octave = 4) {
  const freq = noteToFrequency(note, octave);
  playNote(freq, 1.0, 0, 0.5, 'sawtooth');
}

// ─── Metrónomo ────────────────────────────────────────────────────────────────

/**
 * Clic de metrónomo — genera un sonido de click percusivo.
 * @param {boolean} accent  - true = primer tiempo (más fuerte)
 * @param {number}  time    - Web Audio scheduled time
 */
function scheduleClick(accent, time) {
  const ctx = getAudioContext();

  // BufferSource con ruido + filtro = click más realista
  const bufferSize = ctx.sampleRate * 0.04;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 10);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = accent ? 2800 : 1800;
  filter.Q.value = 1;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(accent ? 1.0 : 0.55, time);
  gain.gain.linearRampToValueAtTime(0, time + 0.04);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(time);
}

class Metronome {
  constructor() {
    this.bpm = 120;
    this.timeSignature = 4;
    this.running = false;
    this.currentBeat = 0;
    this.nextBeatTime = 0;
    this.scheduleAheadTime = 0.1; // segundos
    this.lookahead = 25;          // ms de intervalo de polling
    this.timerId = null;
    this.swingRatio = 0;          // 0 = sin swing, 0.33 = tercina
    this.onBeat = null;           // callback(beatNumber, accent)
    this.isMuted = false;         // true = no suena el click
  }

  _scheduleBeats() {
    const ctx = getAudioContext();
    const secondsPerBeat = 60.0 / this.bpm;

    while (this.nextBeatTime < ctx.currentTime + this.scheduleAheadTime) {
      const beatInBar = this.currentBeat % this.timeSignature;
      const accent = beatInBar === 0;

      // Swing en tiempos pares (off-beats)
      let swingOffset = 0;
      if (this.swingRatio > 0 && beatInBar % 2 === 1) {
        swingOffset = secondsPerBeat * this.swingRatio;
      }

      if (!this.isMuted) {
        scheduleClick(accent, this.nextBeatTime + swingOffset);
      }

      // Notificar UI via callback
      if (typeof this.onBeat === 'function') {
        const beatTime = this.nextBeatTime;
        const beatNum  = this.currentBeat;
        setTimeout(() => {
          const delay = (beatTime - ctx.currentTime) * 1000;
          setTimeout(() => this.onBeat(beatNum, accent), Math.max(0, delay));
        }, 0);
      }

      this.nextBeatTime += secondsPerBeat;
      this.currentBeat++;
    }

    this.timerId = setTimeout(() => this._scheduleBeats(), this.lookahead);
  }

  start() {
    if (this.running) return;
    const ctx = getAudioContext();
    this.running = true;
    this.currentBeat = 0;
    this.nextBeatTime = ctx.currentTime + 0.05;
    this._scheduleBeats();
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    clearTimeout(this.timerId);
    this.timerId = null;
  }

  setBPM(bpm) {
    this.bpm = Math.max(30, Math.min(300, bpm));
  }

  setTimeSignature(beats) {
    this.timeSignature = beats;
  }

  setSwing(ratio) {
    this.swingRatio = Math.max(0, Math.min(0.5, ratio));
  }

  setMuted(muted) {
    this.isMuted = !!muted;
  }

  toggle() {
    this.running ? this.stop() : this.start();
    return this.running;
  }
}

export const metronome = new Metronome();

// ─── Progresión en loop (Sincronizada con Metrónomo) ──────────────────────────

let loopChords = [];
let loopIndex = 0;
let chordsPerBar = 1; // Por defecto 1 acorde por compás

/**
 * Prepara los acordes para el loop.
 * @param {Object[]} chords - Array de acordes
 */
export function setLoopChords(chords) {
  loopChords = chords;
  loopIndex = 0;
}

/**
 * Procesa un beat del metrónomo para tocar el acorde correspondiente.
 * @param {number} currentBeat - Pulso absoluto del metrónomo
 * @param {number} bpm         - BPM actual para calcular duración
 * @param {Function} onChordChange - Callback(chord, index)
 */
export function processLoopBeat(currentBeat, bpm, onChordChange) {
  if (!loopChords.length) return;

  const idx = currentBeat % loopChords.length;
  const chord = loopChords[idx];
  
  // Detección de cambio: ¿tenemos un acorde nuevo en este pulso?
  // Miramos el acorde del pulso anterior
  const prevIdx = (idx - 1 + loopChords.length) % loopChords.length;
  const prevChord = loopChords[prevIdx];

  const secondsPerBeat = 60 / bpm;

  // Disparamos sonido si:
  // 1. Hay un acorde en este paso Y
  // 2. (Es el inicio absoluto del loop OR es un objeto diferente al del paso anterior)
  const isNewChord = chord && (!prevChord || chord !== prevChord);
  const isStartOfLoop = idx === 0 && chord;

  if (isNewChord || isStartOfLoop) {
    if (chord.notes) {
      // Calculamos cuánto dura este bloque por IDENTIDAD de objeto
      let durationSteps = 1;
      let checkIdx = (idx + 1) % loopChords.length;
      while (checkIdx !== idx && loopChords[checkIdx] === chord) {
        durationSteps++;
        checkIdx = (checkIdx + 1) % loopChords.length;
        if (durationSteps >= loopChords.length) break;
      }
      
      // La duración es el número de pasos contiguos * segundos por beat
      playChord(chord.notes, secondsPerBeat * durationSteps * 0.95);
    }
  }

  if (typeof onChordChange === 'function') {
    onChordChange(chord, idx);
  }
}

/**
 * Detiene el loop de progresión.
 */
export function resetLoopIndex() {
  loopIndex = 0;
}
