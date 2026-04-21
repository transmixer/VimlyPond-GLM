// VexFlow 渲染逻辑 v2 - 适配新的 v2 数据结构
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Score, NoteRect, Staff, Measure, Voice, MusicElement, Note, Rest } from './types-v2';
import { midiToPitch, getVexFlowDuration } from './music-v2';
import {
  getVexFlow,
  isVexFlowReady,
  type VexFlowAPI,
  type VexFlowNote,
  type VexFlowStave,
  type VexFlowContext,
} from './vexflow-types';

const VEXFLOW_CDN = 'https://cdn.jsdelivr.net/npm/vexflow@4.2.2/build/cjs/vexflow.js';

export function useVexFlowRendererV2(
  containerRef: React.RefObject<HTMLDivElement | null>,
  score: Score,
  onNoteRectsUpdate: (rects: NoteRect[]) => void
) {
  const [vfReady, setVfReady] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (vfReady || loadingRef.current) return;

    const checkAndSetReady = () => {
      if (isVexFlowReady()) {
        setVfReady(true);
        return true;
      }
      return false;
    };

    if (checkAndSetReady()) return;

    loadingRef.current = true;

    const script = document.createElement('script');
    script.src = VEXFLOW_CDN;
    script.async = true;

    script.onload = () => {
      loadingRef.current = false;
      checkAndSetReady();
    };

    script.onerror = () => {
      loadingRef.current = false;
      console.error('Failed to load VexFlow from CDN');
    };

    const existingScript = document.querySelector(`script[src="${VEXFLOW_CDN}"]`);
    if (!existingScript) {
      document.head.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (checkAndSetReady()) {
          clearInterval(checkInterval);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        loadingRef.current = false;
      }, 5000);
    }
  }, [vfReady]);

  const renderScore = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const VF = getVexFlow();
    if (!VF) {
      container.innerHTML = `
        <div style="padding: 40px; text-align: center; color: #666;">
          <div style="margin-bottom: 12px;">正在加载五线谱渲染引擎...</div>
          <div style="font-size: 12px;">Loading VexFlow...</div>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    const noteRects: NoteRect[] = [];

    const marginLeft = 25;
    const measureWidth = 280;
    const staveHeight = 130;
    const allStaffs: Staff[] = score.groups.flatMap(g => g.staves);
    const totalHeight = allStaffs.length * staveHeight + 50;
    const totalMeasures = allStaffs[0]?.measures.length || 0;
    const svgWidth = Math.max(marginLeft * 2 + totalMeasures * measureWidth, 800);

    try {
      const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
      const context = renderer.getContext();
      context.setFont('Arial', 10);
      renderer.resize(svgWidth, totalHeight);

      const allNotes: {
        staffIndex: number;
        measureIndex: number;
        voiceIndex: number;
        noteIndex: number;
        note: VexFlowNote;
        element: Note;
      }[] = [];

      allStaffs.forEach((staff, sIdx) => {
        let x = marginLeft;
        const y = sIdx * staveHeight + 25;

        staff.measures.forEach((measure, mIdx) => {
          const stave = createStaveV2(VF, x, y, measureWidth, mIdx === 0, staff.clef);
          stave.setContext(context).draw();

          const restKey = staff.clef === 'treble' ? 'b/4' : 'd/3';
          const clefType = staff.clef === 'treble' ? 'treble' : 'bass';

          const notes = createNotesFromMeasureV2(VF, measure, clefType, restKey);
          const ties = createTiesFromMeasureV2(VF, measure, notes);

          measure.voices.forEach((voice, vIdx) => {
            voice.elements.forEach((el, elIdx) => {
              if (el.type === 'note') {
                const noteIndex = notes.findIndex((_, i) => {
                  let count = 0;
                  for (let j = 0; j <= i; j++) {
                    if (notes[j]) count++;
                  }
                  return count - 1 === elIdx;
                });
                if (noteIndex >= 0 && notes[noteIndex]) {
                  allNotes.push({
                    staffIndex: sIdx,
                    measureIndex: mIdx,
                    voiceIndex: vIdx,
                    noteIndex: elIdx,
                    note: notes[noteIndex],
                    element: el
                  });
                }
              }
            });
          });

          if (notes.length > 0) {
            const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
            voice.setStrict(false).addTickables(notes);

            const formatter = new VF.Formatter();
            formatter.joinVoices([voice]).format([voice], measureWidth - 60);

            voice.draw(context, stave);
            ties.forEach(tie => tie.setContext(context).draw());
            collectNoteRectsV2(notes, sIdx, mIdx, noteRects);
          }

          x += measureWidth;
        });
      });

      createCrossMeasureTiesV2(VF, allNotes, context);
      onNoteRectsUpdate(noteRects);
    } catch (err) {
      console.error('VexFlow render error:', err);
      container.innerHTML = `
        <div style="padding: 40px; color: #c00; text-align: center;">
          <div style="margin-bottom: 8px; font-weight: bold;">渲染错误</div>
          <div style="font-size: 12px; color: #666;">${err}</div>
          <button onclick="location.reload()" style="margin-top: 16px; padding: 8px 16px; cursor: pointer;">
            刷新页面
          </button>
        </div>
      `;
    }
  }, [score, containerRef, onNoteRectsUpdate]);

  return { renderScore, vfReady };
}

function createStaveV2(
  VF: VexFlowAPI,
  x: number,
  y: number,
  width: number,
  isFirst: boolean,
  clef: 'treble' | 'bass'
): VexFlowStave {
  const stave = new VF.Stave(x, y, width);
  const clefType = clef === 'treble' ? 'treble' : 'bass';

  if (isFirst) {
    stave.addClef(clefType).addTimeSignature('4/4');
  } else {
    stave.clef = clefType;
  }

  return stave;
}

function createNotesFromMeasureV2(
  VF: VexFlowAPI,
  measure: Measure,
  clefType: string,
  restKey: string
): VexFlowNote[] {
  const notes: VexFlowNote[] = [];
  const allElements: MusicElement[] = measure.voices.flatMap(v => v.elements);

  if (allElements.length === 0) {
    notes.push(new VF.StaveNote({
      keys: [restKey],
      duration: 'qr',
      auto_stem: false,
      clef: clefType
    }));
    return notes;
  }

  allElements.forEach((el) => {
    if (el.type === 'rest') {
      const rest = el as Rest;
      const restNote = new VF.StaveNote({
        keys: [restKey],
        duration: getVexFlowDuration(rest.duration, rest.dots, 'rest'),
        auto_stem: false,
        clef: clefType
      });

      for (let i = 0; i < rest.dots; i++) {
        restNote.addDotToAll();
      }
      notes.push(restNote);
    } else if (el.type === 'note') {
      const noteEl = el as Note;

      const keys = noteEl.pitches.map(p => {
        const pitch = midiToPitch(p.midiPitch);
        return pitch.name + '/' + pitch.oct;
      });

      const note = new VF.StaveNote({
        keys: keys,
        duration: getVexFlowDuration(noteEl.duration, noteEl.dots, 'note'),
        auto_stem: true,
        clef: clefType
      });

      noteEl.pitches.forEach((p, idx) => {
        if (p.alter === 1) {
          note.addModifier(new VF.Accidental('#'), idx);
        } else if (p.alter === -1) {
          note.addModifier(new VF.Accidental('b'), idx);
        } else if (p.alter === 2) {
          note.addModifier(new VF.Accidental('##'), idx);
        } else if (p.alter === -2) {
          note.addModifier(new VF.Accidental('bb'), idx);
        }
      });

      for (let i = 0; i < noteEl.dots; i++) {
        note.addDotToAll();
      }

      notes.push(note);
    } else if (el.type === 'tuplet') {
      el.elements.forEach(tupletEl => {
        if (tupletEl.type === 'note') {
          const noteEl = tupletEl as Note;
          const keys = noteEl.pitches.map(p => {
            const pitch = midiToPitch(p.midiPitch);
            return pitch.name + '/' + pitch.oct;
          });

          const note = new VF.StaveNote({
            keys: keys,
            duration: getVexFlowDuration(noteEl.duration, noteEl.dots, 'note'),
            auto_stem: true,
            clef: clefType
          });

          noteEl.pitches.forEach((p, idx) => {
            if (p.alter === 1) {
              note.addModifier(new VF.Accidental('#'), idx);
            } else if (p.alter === -1) {
              note.addModifier(new VF.Accidental('b'), idx);
            }
          });

          notes.push(note);
        }
      });
    } else if (el.type === 'grace') {
      el.notes.forEach(graceNote => {
        const keys = graceNote.pitches.map(p => {
          const pitch = midiToPitch(p.midiPitch);
          return pitch.name + '/' + pitch.oct;
        });

        const note = new VF.StaveNote({
          keys: keys,
          duration: '8',
          auto_stem: true,
          clef: clefType
        });

        notes.push(note);
      });
    }
  });

  return notes;
}

function createTiesFromMeasureV2(
  VF: VexFlowAPI,
  measure: Measure,
  notes: VexFlowNote[]
): Array<{ setContext: (c: VexFlowContext) => { draw: () => void } }> {
  const ties: Array<{ setContext: (c: VexFlowContext) => { draw: () => void } }> = [];
  const allElements: MusicElement[] = measure.voices.flatMap(v => v.elements);

  for (let i = 0; i < allElements.length - 1; i++) {
    const el = allElements[i];
    const nextEl = allElements[i + 1];

    if (el.type === 'note' && nextEl.type === 'note') {
      const noteEl = el as Note;
      const nextNoteEl = nextEl as Note;

      if (noteEl.tieStart && nextNoteEl.tieEnd &&
          pitchesEqual(noteEl.pitches, nextNoteEl.pitches)) {
        ties.push(new VF.StaveTie({
          notes: [notes[i], notes[i + 1]]
        }));
      }
    }
  }

  return ties;
}

function createCrossMeasureTiesV2(
  VF: VexFlowAPI,
  allNotes: {
    staffIndex: number;
    measureIndex: number;
    voiceIndex: number;
    noteIndex: number;
    note: VexFlowNote;
    element: Note;
  }[],
  context: VexFlowContext
): void {
  for (let i = 0; i < allNotes.length; i++) {
    const current = allNotes[i];

    if (current.element.tieEnd) {
      for (let j = 0; j < i; j++) {
        const prev = allNotes[j];

        if (prev.staffIndex === current.staffIndex &&
            prev.measureIndex === current.measureIndex - 1 &&
            prev.element.tieStart &&
            pitchesEqual(prev.element.pitches, current.element.pitches)) {
          const tie = new VF.StaveTie({
            notes: [prev.note, current.note]
          });
          tie.setContext(context).draw();
          break;
        }
      }
    }
  }
}

function collectNoteRectsV2(
  notes: VexFlowNote[],
  staffIndex: number,
  measureIndex: number,
  noteRects: NoteRect[]
): void {
  notes.forEach((note, tickableIndex) => {
    try {
      const bb = note.getBoundingBox();
      if (bb) {
        noteRects.push({
          staffIndex,
          measureIndex,
          voiceIndex: 0,
          elementIndex: tickableIndex,
          x: bb.getX() - 5,
          y: bb.getY(),
          width: bb.getW() + 10,
          height: bb.getH()
        });
      }
    } catch {
      // 忽略无法获取位置的音符
    }
  });
}

function pitchesEqual(
  a: { midiPitch: number }[],
  b: { midiPitch: number }[]
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].midiPitch !== b[i].midiPitch) return false;
  }
  return true;
}
