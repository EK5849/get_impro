# Documento de Especificación de Requerimientos (ERS)

## 1. Introducción

### 1.1 Propósito
Definir los requerimientos para una aplicación interactiva enfocada en el aprendizaje de improvisación musical en guitarra, bajo y batería, con herramientas prácticas y contenido teórico contextual.

### 1.2 Alcance
La aplicación permitirá a los usuarios:
- Seleccionar tonalidades y escalas
- Visualizar instrumentos (guitarra, bajo, batería)
- Practicar con metrónomo configurable
- Explorar acordes y progresiones
- Recibir sugerencias y datos musicales relevantes

### 1.3 Público objetivo
- Músicos principiantes e intermedios
- Productores musicales
- Estudiantes autodidactas

---

## 2. Descripción General

### 2.1 Perspectiva del producto
Aplicación educativa musical interactiva (web o escritorio), centrada en la práctica de improvisación en tiempo real.

### 2.2 Funciones principales
- Selector de tonalidad y escala
- Visualización de instrumentos
- Generador de acordes
- Motor de progresiones
- Metrónomo integrado
- Sistema de sugerencias

---

## 3. Requerimientos Funcionales

### 3.1 Selector de Tonalidad y Escala
El sistema debe permitir:
- Seleccionar tonalidad (C, C#, D, etc.)
- Seleccionar tipo de escala:
  - Mayor
  - Menor natural
  - Menor armónica
  - Menor melódica
  - Pentatónica
  - Modos (dórico, frigio, lidio, mixolidio, etc.)

**Comportamiento esperado:**
- Actualización dinámica de notas, acordes y sugerencias

---

### 3.2 Selector de Instrumentos
El usuario podrá seleccionar:
- Guitarra (diapasón interactivo)
- Bajo (diapasón simplificado)
- Batería (mapa rítmico visual)

**Funciones:**
- Mostrar notas de la escala en el instrumento
- Resaltar posiciones clave
- Activar/desactivar instrumentos

---

### 3.3 Metrónomo y BPM
El sistema incluirá:
- Control de BPM (40–240)
- Activar/desactivar metrónomo
- Configuración de compás (4/4, 3/4, etc.)

**Opciones avanzadas:**
- Subdivisiones
- Swing

---

### 3.4 Acordes Más Usados
El sistema deberá mostrar:
- Acordes diatónicos de la tonalidad
- Triadas y acordes séptimos

**Funciones:**
- Visualización en instrumento
- Reproducción de audio

---

### 3.5 Sección de Progresiones de Acordes
El sistema deberá incluir progresiones como:
- I - V - vi - IV
- ii - V - I
- i - VII - VI

**Funciones:**
- Reproducción en loop
- Sincronización con BPM

---

### 3.6 Sugerencias y Datos Curiosos
El sistema mostrará:
- Sensación emocional de la tonalidad
- Ejemplos musicales
- Consejos de improvisación
- Notas objetivo

---

## 4. Requerimientos No Funcionales

### 4.1 Usabilidad
- Interfaz intuitiva
- Diseño atractivo
- Flujo claro

### 4.2 Rendimiento
- Baja latencia en audio
- Respuesta inmediata

### 4.3 Compatibilidad
- macOS (prioridad)
- Navegadores web modernos

### 4.4 Escalabilidad
- Sistema modular
- Preparado para integración con IA

---

## 5. Requerimientos Técnicos

### 5.1 Tecnologías sugeridas
- Frontend: React / Electron
- Audio: Web Audio API / Core Audio
- Visualización: Canvas / SVG

### 5.2 Integraciones futuras
- MIDI
- Plugins VST/AU

---

## 6. Casos de Uso

### Caso 1: Improvisación
1. Seleccionar tonalidad
2. Seleccionar escala
3. Activar metrónomo
4. Visualizar instrumento
5. Improvisar

### Caso 2: Exploración
1. Seleccionar tonalidad
2. Revisar acordes
3. Probar progresiones

---

## 7. Roadmap Futuro

- IA generadora de licks
- Evaluación automática
- Grabación
- Comunidad

---

## 8. Criterios de Aceptación

- Selección correcta de tonalidad
- Acordes coherentes
- Metrónomo funcional
- Progresiones reproducibles
- UI fluida

---

## 9. Notas Finales

El sistema está diseñado como una herramienta creativa para explorar la improvisación de forma intuitiva, combinando teoría y práctica en una experiencia interactiva.

