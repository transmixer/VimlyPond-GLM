// VexFlow 渲染逻辑
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Score, NoteRect, Note } from './types';
import { midiToPitch, getVexFlowDuration } from './music';
import {
  getVexFlow,
  isVexFlowReady,
  type VexFlowAPI,
  type VexFlowNote,
  type VexFlowStave,
  type VexFlowContext,
} from './vexflow-types';

// VexFlow CDN URL
const VEXFLOW_CDN = 'https://cdn.jsdelivr.net/npm/vexflow@4.2.2/build/cjs/vexflow.js';

export function useVexFlowRenderer(
  containerRef: React.RefObject<HTMLDivElement | null>,
  score: Score,
  onNoteRectsUpdate: (rects: NoteRect[]) => void
) {
  const [vfReady, setVfReady] = useState(false);
  const loadingRef = useRef(false);

  // 加载 VexFlow
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

    // 动态加载脚本
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

    // 检查是否已有脚本
    const existingScript = document.querySelector(`script[src="${VEXFLOW_CDN}"]`);
    if (!existingScript) {
      document.head.appendChild(script);
    } else {
      // 脚本已存在，等待加载完成
      const checkInterval = setInterval(() => {
        if (checkAndSetReady()) {
          clearInterval(checkInterval);
        }
      }, 100);
      
      // 5秒超时
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

    // 清空容器
    container.innerHTML = '';
    const noteRects: NoteRect[] = [];

    // 布局参数
    const marginLeft = 25;
    const measureWidth = 280;
    const staveHeight = 130;
    const totalHeight = score.staves.length * staveHeight + 50;
    const totalMeasures = score.staves[0].measures.length;
    const svgWidth = Math.max(marginLeft * 2 + totalMeasures * measureWidth, 800);

    try {
      // 创建渲染器
      const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
      const context = renderer.getContext();
      context.setFont('Arial', 10);
      renderer.resize(svgWidth, totalHeight);

      // 存储所有音符引用（用于跨小节延音线）
      const allNotes: { 
        staffIndex: number; 
        measureIndex: number; 
        noteIndex: number; 
        note: VexFlowNote;
        element: Note;
      }[] = [];

      // 绘制每个谱表
      score.staves.forEach((staff, sIdx) => {
        let x = marginLeft;
        const y = sIdx * staveHeight + 25;

        staff.measures.forEach((measure, mIdx) => {
          // 创建五线谱
          const stave = createStave(VF, x, y, measureWidth, mIdx === 0, staff.clef);
          stave.setContext(context).draw();

          // 计算休止符在当前谱号的中心位置
          const restKey = staff.clef === 'treble' ? 'b/4' : 'd/3';
          const clefType = staff.clef === 'treble' ? 'treble' : 'bass';

          const notes = createNotesFromMeasure(VF, measure, clefType, restKey);
          const ties = createTiesFromMeasure(VF, measure, notes);

          // 收集音符引用（用于跨小节延音线）
          measure.elements.forEach((el, elIdx) => {
            if (el.type === 'note' && notes[elIdx]) {
              allNotes.push({
                staffIndex: sIdx,
                measureIndex: mIdx,
                noteIndex: elIdx,
                note: notes[elIdx],
                element: el as Note
              });
            }
          });

          if (notes.length > 0) {
            const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
            voice.setStrict(false).addTickables(notes);
            
            const formatter = new VF.Formatter();
            formatter.joinVoices([voice]).format([voice], measureWidth - 60);
            
            voice.draw(context, stave);

            // 绘制延音线
            ties.forEach(tie => tie.setContext(context).draw());

            // 收集音符位置用于光标
            collectNoteRects(notes, sIdx, mIdx, noteRects);
          }

          x += measureWidth;
        });
      });

      // 绘制跨小节延音线
      createCrossMeasureTies(VF, allNotes, context);

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

// ===== 辅助函数（类型安全）=====

function createStave(
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
    // 设置 clef 属性（不显示符号，但影响音符位置计算）
    stave.clef = clefType;
  }
  
  return stave;
}

function createNotesFromMeasure(
  VF: VexFlowAPI,
  measure: { elements: Array<{ type: string; duration: number; dots: number }> },
  clefType: string,
  restKey: string
): VexFlowNote[] {
  const notes: VexFlowNote[] = [];

  if (measure.elements.length === 0) {
    // 空小节显示全休止符
    notes.push(new VF.StaveNote({
      keys: [restKey],
      duration: 'qr',
      auto_stem: false,
      clef: clefType
    }));
    return notes;
  }

  measure.elements.forEach((el) => {
    if (el.type === 'rest') {
      const restNote = new VF.StaveNote({
        keys: [restKey],
        duration: getVexFlowDuration(el.duration, el.dots, 'rest'),
        auto_stem: false,
        clef: clefType
      });

      for (let i = 0; i < el.dots; i++) {
        restNote.addDotToAll();
      }
      notes.push(restNote);
    } else {
      const noteEl = el as Note;
      
      // 支持多音高（和弦）
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

      // 添加升降号（为每个音高添加）
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

      // 添加附点
      for (let i = 0; i < el.dots; i++) {
        note.addDotToAll();
      }

      notes.push(note);
    }
  });

  return notes;
}

interface TiePair {
  firstIndex: number;
  secondIndex: number;
}

// 比较两个 pitches 数组是否相同
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

function createTiesFromMeasure(
  VF: VexFlowAPI,
  measure: { elements: Array<{ type: string; tieStart?: boolean; tieEnd?: boolean; pitches?: { midiPitch: number }[] }> },
  notes: VexFlowNote[]
): Array<{ setContext: (c: VexFlowContext) => { draw: () => void } }> {
  const ties: Array<{ setContext: (c: VexFlowContext) => { draw: () => void } }> = [];
  
  for (let i = 0; i < measure.elements.length - 1; i++) {
    const el = measure.elements[i];
    const nextEl = measure.elements[i + 1];
    
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

// 创建跨小节延音线
function createCrossMeasureTies(
  VF: VexFlowAPI,
  allNotes: { 
    staffIndex: number; 
    measureIndex: number; 
    noteIndex: number; 
    note: VexFlowNote;
    element: Note;
  }[],
  context: VexFlowContext
): void {
  // 遍历所有音符，查找跨小节的延音线
  for (let i = 0; i < allNotes.length; i++) {
    const current = allNotes[i];
    
    // 查找 tieEnd 的音符
    if (current.element.tieEnd) {
      // 向前查找对应的 tieStart 音符
      for (let j = 0; j < i; j++) {
        const prev = allNotes[j];
        
        // 必须是同一谱表、相邻小节
        if (prev.staffIndex === current.staffIndex &&
            prev.measureIndex === current.measureIndex - 1 &&
            prev.element.tieStart &&
            pitchesEqual(prev.element.pitches, current.element.pitches)) {
          // 创建跨小节延音线
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

function collectNoteRects(
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
