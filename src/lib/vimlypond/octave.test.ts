/**
 * ===========================================
 * Vimlypond 八度升降测试
 * ===========================================
 * 
 * 测试八度升降功能：
 * - ' 键升八度（MIDI +12）
 * - , 键降八度（MIDI -12）
 * - 在普通模式和插入模式都有效
 * - MIDI 边界检查（0-127）
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useVimlypondStore } from '@/lib/vimlypond/store';
import { createDefaultScore, midiToPitch } from '@/lib/vimlypond/music';
import type { Note } from '@/lib/vimlypond/types';

// 辅助函数：获取最新状态
const getState = () => useVimlypondStore.getState();

// 辅助函数：完全重置状态
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
    history: {
      past: [],
      future: []
    },
    noteRects: []
  });
};

describe('==========================================', () => {
  describe('八度升降功能测试', () => {
    beforeEach(() => {
      act(() => resetState());
    });

    describe('升八度测试', () => {
      it('按 \' 键应将当前音符升八度', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c')); // C4 = 60
        
        const beforeNote = getState().score.staves[0].measures[0].elements[0] as Note;
        expect(beforeNote.pitches[0].midiPitch).toBe(60);
        
        act(() => getState().raiseOctave());
        
        const afterNote = getState().score.staves[0].measures[0].elements[0] as Note;
        expect(afterNote.pitches[0].midiPitch).toBe(72); // C5
      });

      it('升八度后音名应相同，八度+1', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        
        act(() => getState().raiseOctave());
        
        const note = getState().score.staves[0].measures[0].elements[0] as Note;
        const pitch = midiToPitch(note.pitches[0].midiPitch);
        
        expect(pitch.name).toBe('c');
        expect(pitch.oct).toBe(5);
      });

      it('多次升八度应正确叠加', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c')); // C4 = 60
        
        act(() => getState().raiseOctave()); // C5 = 72
        act(() => getState().raiseOctave()); // C6 = 84
        
        const note = getState().score.staves[0].measures[0].elements[0] as Note;
        expect(note.pitches[0].midiPitch).toBe(84);
        
        const pitch = midiToPitch(note.pitches[0].midiPitch);
        expect(pitch.oct).toBe(6);
      });

      it('最高 MIDI 127 边界检查', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('g')); // G4 = 67
        
        // 升到 G9 = 127 (最高音)
        act(() => getState().raiseOctave()); // G5 = 79
        act(() => getState().raiseOctave()); // G6 = 91
        act(() => getState().raiseOctave()); // G7 = 103
        act(() => getState().raiseOctave()); // G8 = 115
        act(() => getState().raiseOctave()); // G9 = 127
        
        let note = getState().score.staves[0].measures[0].elements[0] as Note;
        expect(note.pitches[0].midiPitch).toBe(127);
        
        // 再升应该无效（超过127）
        act(() => getState().raiseOctave());
        
        note = getState().score.staves[0].measures[0].elements[0] as Note;
        expect(note.pitches[0].midiPitch).toBe(127); // 仍然是127
      });
    });

    describe('降八度测试', () => {
      it('按 , 键应将当前音符降八度', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c')); // C4 = 60
        
        act(() => getState().lowerOctave());
        
        const note = getState().score.staves[0].measures[0].elements[0] as Note;
        expect(note.pitches[0].midiPitch).toBe(48); // C3
      });

      it('降八度后音名应相同，八度-1', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        
        act(() => getState().lowerOctave());
        
        const note = getState().score.staves[0].measures[0].elements[0] as Note;
        const pitch = midiToPitch(note.pitches[0].midiPitch);
        
        expect(pitch.name).toBe('c');
        expect(pitch.oct).toBe(3);
      });

      it('多次降八度应正确叠加', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c')); // C4 = 60
        
        act(() => getState().lowerOctave()); // C3 = 48
        act(() => getState().lowerOctave()); // C2 = 36
        
        const note = getState().score.staves[0].measures[0].elements[0] as Note;
        expect(note.pitches[0].midiPitch).toBe(36);
        
        const pitch = midiToPitch(note.pitches[0].midiPitch);
        expect(pitch.oct).toBe(2);
      });

      it('最低 MIDI 0 边界检查', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c')); // C4 = 60
        
        // 降到 C-1 = 0 (最低音)
        act(() => getState().lowerOctave()); // C3 = 48
        act(() => getState().lowerOctave()); // C2 = 36
        act(() => getState().lowerOctave()); // C1 = 24
        act(() => getState().lowerOctave()); // C0 = 12
        act(() => getState().lowerOctave()); // C-1 = 0
        
        let note = getState().score.staves[0].measures[0].elements[0] as Note;
        expect(note.pitches[0].midiPitch).toBe(0);
        
        // 再降应该无效（低于0）
        act(() => getState().lowerOctave());
        
        note = getState().score.staves[0].measures[0].elements[0] as Note;
        expect(note.pitches[0].midiPitch).toBe(0); // 仍然是0
      });
    });

    describe('不同音符的八度变化', () => {
      it('E4 升八度应为 E5', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('e')); // E4 = 64
        
        act(() => getState().raiseOctave());
        
        const note = getState().score.staves[0].measures[0].elements[0] as Note;
        expect(note.pitches[0].midiPitch).toBe(76); // E5
        
        const pitch = midiToPitch(note.pitches[0].midiPitch);
        expect(pitch.name).toBe('e');
        expect(pitch.oct).toBe(5);
      });

      it('A3 降八度应为 A2', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('a')); // A3 = 57
        
        act(() => getState().lowerOctave());
        
        const note = getState().score.staves[0].measures[0].elements[1] as Note;
        expect(note.pitches[0].midiPitch).toBe(45); // A2
        
        const pitch = midiToPitch(note.pitches[0].midiPitch);
        expect(pitch.name).toBe('a');
        expect(pitch.oct).toBe(2);
      });
    });

    describe('普通模式下的八度操作', () => {
      it('普通模式下按 \' 应升八度', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('d')); // D4 = 62
        act(() => getState().enterNormalMode());
        
        act(() => getState().raiseOctave());
        
        const note = getState().score.staves[0].measures[0].elements[0] as Note;
        expect(note.pitches[0].midiPitch).toBe(74); // D5
      });

      it('普通模式下按 , 应降八度', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('f')); // F4 = 65
        act(() => getState().enterNormalMode());
        
        act(() => getState().lowerOctave());
        
        const note = getState().score.staves[0].measures[0].elements[0] as Note;
        expect(note.pitches[0].midiPitch).toBe(53); // F3
      });
    });

    describe('休止符的处理', () => {
      it('休止符不应受升八度影响', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertRest());
        
        act(() => getState().raiseOctave());
        
        const element = getState().score.staves[0].measures[0].elements[0];
        expect(element.type).toBe('rest');
        expect(getState().score.staves[0].measures[0].elements.length).toBe(1);
      });

      it('休止符不应受降八度影响', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertRest());
        
        act(() => getState().lowerOctave());
        
        const element = getState().score.staves[0].measures[0].elements[0];
        expect(element.type).toBe('rest');
      });
    });

    describe('八度操作与其他操作组合', () => {
      it('升八度后修改时值应正确', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c')); // C4 = 60
        act(() => getState().raiseOctave()); // C5 = 72
        act(() => getState().modifyDuration(8)); // 八分音符
        
        const note = getState().score.staves[0].measures[0].elements[0] as Note;
        expect(note.pitches[0].midiPitch).toBe(72);
        expect(note.duration).toBe(8);
      });

      it('升八度后添加附点应正确', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().raiseOctave());
        act(() => getState().addDot());
        
        const note = getState().score.staves[0].measures[0].elements[0] as Note;
        expect(note.pitches[0].midiPitch).toBe(72);
        expect(note.dots).toBe(1);
      });

      it('升降号后升八度应保持升降号', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c')); // C4 = 60
        act(() => getState().makeSharp()); // C#4 = 61
        act(() => getState().raiseOctave()); // C#5 = 73
        
        const note = getState().score.staves[0].measures[0].elements[0] as Note;
        expect(note.pitches[0].midiPitch).toBe(73);
        expect(note.pitches[0].alter).toBe(1);
        
        // 注意：midiToPitch(73) 返回 Db5（因为优先使用降号表示法）
        // 但 alter 字段保持为 1（升号），这表示原始输入是 C#
        const pitch = midiToPitch(note.pitches[0].midiPitch);
        // MIDI 73 = Db5 (半音1在八度5)
        expect(pitch.oct).toBe(5);
      });
    });

    describe('撤销功能', () => {
      it('升八度应支持撤销', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c')); // C4 = 60
        act(() => getState().raiseOctave()); // C5 = 72
        
        const noteBeforeUndo = getState().score.staves[0].measures[0].elements[0] as Note;
        expect(noteBeforeUndo.pitches[0].midiPitch).toBe(72);
        
        act(() => getState().undo());
        
        const noteAfterUndo = getState().score.staves[0].measures[0].elements[0] as Note;
        expect(noteAfterUndo.pitches[0].midiPitch).toBe(60); // 恢复为 C4
      });

      it('降八度应支持撤销', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c')); // C4 = 60
        act(() => getState().lowerOctave()); // C3 = 48
        
        act(() => getState().undo());
        
        const note = getState().score.staves[0].measures[0].elements[0] as Note;
        expect(note.pitches[0].midiPitch).toBe(60);
      });
    });

    describe('光标位置不变', () => {
      it('升八度后光标位置不应改变', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('d'));
        
        const beforePos = { ...getState().cursorPos };
        
        act(() => getState().raiseOctave());
        
        const afterPos = getState().cursorPos;
        expect(afterPos.elementIndex).toBe(beforePos.elementIndex);
        expect(afterPos.measureIndex).toBe(beforePos.measureIndex);
        expect(afterPos.staffIndex).toBe(beforePos.staffIndex);
      });

      it('降八度后光标位置不应改变', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        
        const beforePos = { ...getState().cursorPos };
        
        act(() => getState().lowerOctave());
        
        const afterPos = getState().cursorPos;
        expect(afterPos.elementIndex).toBe(beforePos.elementIndex);
        expect(afterPos.measureIndex).toBe(beforePos.measureIndex);
      });
    });

    describe('多音符场景', () => {
      it('应对光标前的音符生效', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c')); // C4
        act(() => getState().insertNote('e')); // E4
        act(() => getState().insertNote('g')); // G4
        
        // 光标在位置3，对 G4（位置2）操作
        act(() => getState().raiseOctave());
        
        const elements = getState().score.staves[0].measures[0].elements;
        expect((elements[0] as Note).pitches[0].midiPitch).toBe(60); // C4 不变
        expect((elements[1] as Note).pitches[0].midiPitch).toBe(64); // E4 不变
        expect((elements[2] as Note).pitches[0].midiPitch).toBe(79); // G5 (原 G4=67)
      });

      it('移动光标后应对新的前一个音符生效', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c')); // 位置0
        act(() => getState().insertNote('e')); // 位置1
        act(() => getState().insertNote('g')); // 位置2
        
        // 移动光标到位置2
        act(() => getState().setCursorPos({ elementIndex: 2 }));
        
        // 现在应对 E4（位置1）操作
        act(() => getState().raiseOctave());
        
        const elements = getState().score.staves[0].measures[0].elements;
        expect((elements[0] as Note).pitches[0].midiPitch).toBe(60); // C4 不变
        expect((elements[1] as Note).pitches[0].midiPitch).toBe(76); // E5 (原 E4=64)
        expect((elements[2] as Note).pitches[0].midiPitch).toBe(67); // G4 不变
      });
    });
  });
});
