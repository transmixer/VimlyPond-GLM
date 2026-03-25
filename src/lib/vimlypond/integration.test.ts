/**
 * ===========================================
 * Vimlypond 集成测试
 * ===========================================
 * 
 * 测试核心功能组合使用时不会崩溃
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useVimlypondStore } from '@/lib/vimlypond/store';
import { createDefaultScore } from '@/lib/vimlypond/music';

const getState = () => useVimlypondStore.getState();

const resetState = () => {
  useVimlypondStore.setState({
    score: createDefaultScore(),
    cursorPos: {
      staffIndex: 0,
      measureIndex: 0,
      elementIndex: 0,
      mode: 'normal'
    },
    inputState: {
      pendingNote: null,
      lastDuration: 4,
      lastDots: 0
    },
    history: { past: [], future: [] },
    noteRects: [],
    lastAction: null
  });
};

describe('集成测试', () => {
  beforeEach(() => {
    act(() => resetState());
  });

  describe('页面初始化', () => {
    it('初始化状态不应崩溃', () => {
      const state = getState();
      expect(state.score).toBeDefined();
      expect(state.score.staves.length).toBeGreaterThan(0);
      expect(state.score.staves[0].keySignature).toBeDefined();
      expect(state.score.staves[0].keySignature.name).toBe('C-major');
      expect(state.score.meter).toBeDefined();
      expect(state.score.meter.count).toBe(4);
      expect(state.score.meter.unit).toBe(4);
    });

    it('调号选择器数据应有效', () => {
      const state = getState();
      const keySignature = state.score.staves[0].keySignature;
      expect(keySignature.name).toBeDefined();
      expect(typeof keySignature.sharps).toBe('number');
      expect(typeof keySignature.flats).toBe('number');
    });
  });

  describe('插入模式工作流', () => {
    it('完整工作流：进入插入模式 → 输入音符 → 添加和弦 → 修改时值', () => {
      // 进入插入模式
      act(() => getState().enterInsertMode());
      expect(getState().cursorPos.mode).toBe('insert');
      
      // 输入音符
      act(() => getState().insertNote('c'));
      const measure = getState().score.staves[0].measures[0];
      expect(measure.elements.length).toBe(1);
      
      // 添加和弦音高
      act(() => getState().addToChord('e'));
      act(() => getState().addToChord('g'));
      
      const note = getState().score.staves[0].measures[0].elements[0];
      if (note.type === 'note') {
        expect(note.pitches.length).toBe(3);
      }
      
      // 修改时值
      act(() => getState().modifyDuration(2));
      const noteAfter = getState().score.staves[0].measures[0].elements[0];
      if (noteAfter.type === 'note') {
        expect(noteAfter.duration).toBe(2);
      }
    });

    it('完整工作流：输入音符 → 升号 → 升八度 → 撤销', () => {
      act(() => getState().enterInsertMode());
      act(() => getState().insertNote('f'));
      
      // 升号
      act(() => getState().makeSharp());
      let note = getState().score.staves[0].measures[0].elements[0];
      if (note.type === 'note') {
        expect(note.pitches[0].alter).toBe(1);
      }
      
      // 升八度
      act(() => getState().raiseOctave());
      note = getState().score.staves[0].measures[0].elements[0];
      if (note.type === 'note') {
        expect(note.pitches[0].midiPitch).toBeGreaterThan(70);
      }
      
      // 撤销
      act(() => getState().undo());
      act(() => getState().undo());
      note = getState().score.staves[0].measures[0].elements[0];
      if (note.type === 'note') {
        expect(note.pitches[0].alter).toBe(0);
      }
    });
  });

  describe('调号与音符输入', () => {
    it('切换调号后输入音符应自动应用升降号', () => {
      // 切换到 G 大调
      act(() => getState().changeKeySignature('G-major'));
      expect(getState().score.staves[0].keySignature.name).toBe('G-major');
      
      // 进入插入模式输入 F（应为 F#）
      act(() => getState().enterInsertMode());
      act(() => getState().insertNote('f'));
      
      const note = getState().score.staves[0].measures[0].elements[0];
      if (note.type === 'note') {
        expect(note.pitches[0].alter).toBe(1); // F#
      }
    });

    it('切换拍号后应正确显示', () => {
      act(() => getState().changeMeter('6/8'));
      const meter = getState().score.meter;
      expect(meter.count).toBe(6);
      expect(meter.unit).toBe(8);
    });
  });

  describe('多谱表操作', () => {
    it('添加谱表 → 切换谱号 → 导航', () => {
      // 添加谱表
      act(() => getState().addStaffBelow());
      expect(getState().score.staves.length).toBe(2);
      expect(getState().cursorPos.staffIndex).toBe(1);
      
      // 切换谱号
      act(() => getState().toggleClef());
      expect(getState().score.staves[1].clef).toBe('bass');
      
      // 导航回第一个谱表
      act(() => getState().navigateUp());
      expect(getState().cursorPos.staffIndex).toBe(0);
    });
  });

  describe('重复操作集成', () => {
    it('多次重复操作应正常工作', () => {
      act(() => getState().enterInsertMode());
      act(() => getState().insertNote('c'));
      act(() => getState().insertNote('d'));
      act(() => getState().insertNote('e'));
      
      // 切换到普通模式
      act(() => getState().enterNormalMode());
      
      // 删除最后一个音符
      act(() => getState().deleteElement());
      expect(getState().score.staves[0].measures[0].elements.length).toBe(2);
      
      // 重复删除
      act(() => getState().repeatLastAction());
      expect(getState().score.staves[0].measures[0].elements.length).toBe(1);
    });
  });

  describe('边界条件', () => {
    it('空小节导航不应崩溃', () => {
      // 没有音符时导航
      act(() => getState().navigateRight());
      act(() => getState().navigateLeft());
      act(() => getState().navigateNextMeasure());
      act(() => getState().navigatePrevMeasure());
      
      // 应该仍在有效位置
      const pos = getState().cursorPos;
      expect(pos.staffIndex).toBeGreaterThanOrEqual(0);
      expect(pos.measureIndex).toBeGreaterThanOrEqual(0);
    });

    it('在第一个谱表向上导航不应崩溃', () => {
      act(() => getState().navigateUp());
      expect(getState().cursorPos.staffIndex).toBe(0);
    });

    it('在第一小节向前导航不应崩溃', () => {
      act(() => getState().navigatePrevMeasure());
      expect(getState().cursorPos.measureIndex).toBe(0);
    });

    it('没有历史时撤销不应崩溃', () => {
      act(() => getState().undo());
      expect(getState().score.staves.length).toBe(1);
    });

    it('没有未来历史时重做不应崩溃', () => {
      act(() => getState().redo());
      expect(getState().score.staves.length).toBe(1);
    });
  });
});
