/**
 * ===========================================
 * Vimlypond 光标位置与谱号切换测试
 * ===========================================
 * 
 * 本测试文件针对用户反馈的两个问题：
 * 1. 光标定位问题
 * 2. 谱号切换后音高显示是否正确
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useVimlypondStore } from '@/lib/vimlypond/store';
import { midiToPitch, pitchToMidi, createNote, createDefaultScore, generateLilyPond } from '@/lib/vimlypond/music';
import type { Score, Note } from '@/lib/vimlypond/types';

// 辅助函数：获取最新状态
const getState = () => useVimlypondStore.getState();

// 辅助函数：完全重置状态
const resetState = () => {
  // 使用 Zustand 的内部机制重置状态
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
  describe('光标位置测试', () => {
    beforeEach(() => {
      act(() => resetState());
    });

    describe('初始状态', () => {
      it('初始光标应在第1个谱表、第1个小节、位置0', () => {
        const { cursorPos } = getState();
        expect(cursorPos.staffIndex).toBe(0);
        expect(cursorPos.measureIndex).toBe(0);
        expect(cursorPos.elementIndex).toBe(0);
      });

      it('初始模式应为普通模式', () => {
        expect(getState().cursorPos.mode).toBe('normal');
      });
    });

    describe('插入音符后的光标位置', () => {
      it('插入第一个音符后，elementIndex 应为 1', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        
        const { cursorPos, score } = getState();
        expect(cursorPos.elementIndex).toBe(1);
        expect(score.staves[0].measures[0].elements.length).toBe(1);
      });

      it('插入两个音符后，elementIndex 应为 2', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('d'));
        
        const { cursorPos, score } = getState();
        expect(cursorPos.elementIndex).toBe(2);
        expect(score.staves[0].measures[0].elements.length).toBe(2);
      });

      it('插入休止符后，elementIndex 应正确递增', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertRest());
        act(() => getState().insertNote('d'));
        
        const { cursorPos, score } = getState();
        expect(cursorPos.elementIndex).toBe(3);
        expect(score.staves[0].measures[0].elements.length).toBe(3);
      });
    });

    describe('删除操作后的光标位置', () => {
      it('删除最后一个音符后，elementIndex 应减少', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('d'));
        act(() => getState().insertNote('e'));
        
        expect(getState().cursorPos.elementIndex).toBe(3);
        
        // 返回普通模式后删除
        act(() => getState().enterNormalMode());
        act(() => getState().deleteElement());
        
        const { cursorPos, score } = getState();
        expect(cursorPos.elementIndex).toBe(2);
        expect(score.staves[0].measures[0].elements.length).toBe(2);
      });

      it('删除唯一音符后，elementIndex 应为 0', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().enterNormalMode());
        act(() => getState().deleteElement());
        
        const { cursorPos, score } = getState();
        expect(cursorPos.elementIndex).toBe(0);
        expect(score.staves[0].measures[0].elements.length).toBe(0);
      });
    });

    describe('小节填满后的光标跳转', () => {
      it('填满小节后，光标应跳到下一小节开头', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c')); // 1拍
        act(() => getState().insertNote('d')); // 1拍
        act(() => getState().insertNote('e')); // 1拍
        act(() => getState().insertNote('f')); // 1拍，填满
        
        const { cursorPos } = getState();
        expect(cursorPos.measureIndex).toBe(1);
        expect(cursorPos.elementIndex).toBe(0);
      });

      it('使用不同时值填满小节', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().modifyDuration(2)); // 改为二分音符
        
        const { cursorPos, score } = getState();
        // 一个二分音符 = 2拍
        expect(score.staves[0].measures[0].durationUsed).toBe(2);
        expect(cursorPos.measureIndex).toBe(0);
      });

      it('二分音符填满后应跳转小节', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().modifyDuration(2)); // 二分音符
        act(() => getState().insertNote('d'));
        act(() => getState().modifyDuration(2)); // 二分音符
        
        // 2个二分音符 = 4拍，应跳转
        expect(getState().cursorPos.measureIndex).toBe(1);
      });
    });

    describe('导航操作后的光标位置', () => {
      it('按 l 向右移动后，elementIndex 应增加（选择下一个音符）', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('d'));
        act(() => getState().enterNormalMode());
        
        // 光标在位置2
        expect(getState().cursorPos.elementIndex).toBe(2);
        
        // 按 l 移动到位置3（不存在，保持在2）
        act(() => getState().navigateRight());
        expect(getState().cursorPos.elementIndex).toBe(2);
        
        // 移回位置1
        act(() => getState().navigateLeft());
        expect(getState().cursorPos.elementIndex).toBe(1);
        
        // 再按 l 移到位置2
        act(() => getState().navigateRight());
        expect(getState().cursorPos.elementIndex).toBe(2);
      });

      it('按 h 向左移动后，elementIndex 应减少（选择上一个音符）', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('d'));
        act(() => getState().insertNote('e'));
        act(() => getState().enterNormalMode());
        
        expect(getState().cursorPos.elementIndex).toBe(3);
        
        act(() => getState().navigateLeft());
        expect(getState().cursorPos.elementIndex).toBe(2);
        
        act(() => getState().navigateLeft());
        expect(getState().cursorPos.elementIndex).toBe(1);
      });

      it('按 n 跳转到下一小节', () => {
        act(() => getState().navigateNextMeasure());
        
        const { cursorPos } = getState();
        expect(cursorPos.measureIndex).toBe(1);
        expect(cursorPos.elementIndex).toBe(0);
      });

      it('按 p 跳转到上一小节末尾', () => {
        act(() => getState().navigateNextMeasure());
        expect(getState().cursorPos.measureIndex).toBe(1);
        
        act(() => getState().navigatePrevMeasure());
        
        const { cursorPos } = getState();
        expect(cursorPos.measureIndex).toBe(0);
        expect(cursorPos.elementIndex).toBe(0); // 空小节
      });

      it('有内容的小节按 b 后，elementIndex 应指向第一个音符', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('d'));
        act(() => getState().enterNormalMode());
        
        act(() => getState().navigateNextMeasure());
        expect(getState().cursorPos.measureIndex).toBe(1);
        
        act(() => getState().navigatePrevMeasure());
        
        const { cursorPos } = getState();
        expect(cursorPos.measureIndex).toBe(0);
        expect(cursorPos.elementIndex).toBe(0); // 指向第一个音符
      });

      it('按 j 向下移动后，staffIndex 应增加', () => {
        act(() => getState().addStaffBelow());
        expect(getState().cursorPos.staffIndex).toBe(1);
        
        act(() => getState().navigateUp());
        expect(getState().cursorPos.staffIndex).toBe(0);
        
        act(() => getState().navigateDown());
        expect(getState().cursorPos.staffIndex).toBe(1);
      });
    });

    describe('模式切换时的光标位置', () => {
      it('进入插入模式后，光标位置不应改变', () => {
        act(() => getState().navigateNextMeasure());
        const before = { ...getState().cursorPos };
        
        act(() => getState().enterInsertMode());
        
        const after = getState().cursorPos;
        expect(after.staffIndex).toBe(before.staffIndex);
        expect(after.measureIndex).toBe(before.measureIndex);
        expect(after.elementIndex).toBe(before.elementIndex);
        expect(after.mode).toBe('insert');
      });

      it('退出插入模式后，光标位置应保持', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('d'));
        
        const before = { ...getState().cursorPos };
        
        act(() => getState().enterNormalMode());
        
        const after = getState().cursorPos;
        expect(after.staffIndex).toBe(before.staffIndex);
        expect(after.measureIndex).toBe(before.measureIndex);
        expect(after.elementIndex).toBe(before.elementIndex);
        expect(after.mode).toBe('normal');
      });
    });

    describe('多谱表光标位置', () => {
      it('在下方添加谱表后，光标应移到新谱表', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().enterNormalMode());
        
        act(() => getState().addStaffBelow());
        
        const { cursorPos, score } = getState();
        expect(cursorPos.staffIndex).toBe(1);
        expect(score.staves.length).toBe(2);
        // 新谱表光标应重置到开头
        expect(cursorPos.measureIndex).toBe(0);
        expect(cursorPos.elementIndex).toBe(0);
      });

      it('在上方添加谱表后，光标应在新的第一个谱表', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().enterNormalMode());
        
        act(() => getState().addStaffAbove());
        
        const { cursorPos, score } = getState();
        expect(cursorPos.staffIndex).toBe(0);
        expect(score.staves.length).toBe(2);
      });

      it('跨谱表导航时，elementIndex 应重置', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('d'));
        act(() => getState().insertNote('e'));
        act(() => getState().enterNormalMode());
        
        expect(getState().cursorPos.elementIndex).toBe(3);
        
        act(() => getState().addStaffBelow());
        expect(getState().cursorPos.elementIndex).toBe(0);
        
        act(() => getState().navigateUp());
        // 回到上面的谱表，elementIndex 应重置为 0
        expect(getState().cursorPos.elementIndex).toBe(0);
      });
    });
  });

  describe('==========================================', () => {
    describe('谱号切换测试', () => {
      beforeEach(() => {
        act(() => resetState());
      });

      describe('基本切换功能', () => {
        it('初始谱号应为高音谱号 (treble)', () => {
          expect(getState().score.staves[0].clef).toBe('treble');
        });

        it('按 t 键应切换为低音谱号', () => {
          act(() => getState().toggleClef());
          expect(getState().score.staves[0].clef).toBe('bass');
        });

        it('再次按 t 应切换回高音谱号', () => {
          act(() => getState().toggleClef());
          expect(getState().score.staves[0].clef).toBe('bass');
          
          act(() => getState().toggleClef());
          expect(getState().score.staves[0].clef).toBe('treble');
        });
      });

      describe('谱号切换后音高显示问题', () => {
        it('高音谱号中 C4 (MIDI 60) 应正确显示', () => {
          act(() => getState().enterInsertMode());
          act(() => getState().insertNote('c'));
          
          const measure = getState().score.staves[0].measures[0];
          const note = measure.elements[0] as Note;
          
          expect(note.pitches[0].midiPitch).toBe(60);
          const pitch = midiToPitch(note.pitches[0].midiPitch);
          expect(pitch.name).toBe('c');
          expect(pitch.oct).toBe(4);
        });

        it('谱号切换后，音符的 MIDI 音高应保持不变', () => {
          act(() => getState().enterInsertMode());
          act(() => getState().insertNote('c')); // C4 = 60
          
          const beforePitch = getState().score.staves[0].measures[0].elements[0] as Note;
          expect(beforePitch.pitches[0].midiPitch).toBe(60);
          
          act(() => getState().enterNormalMode());
          act(() => getState().toggleClef()); // 切换到低音谱号
          
          const afterPitch = getState().score.staves[0].measures[0].elements[0] as Note;
          // MIDI 音高应该保持不变（这是绝对音高）
          expect(afterPitch.pitches[0].midiPitch).toBe(60);
        });

        it('谱号切换后，音名和八度应保持不变', () => {
          act(() => getState().enterInsertMode());
          act(() => getState().insertNote('a')); // A4 = 69
          
          const before = getState().score.staves[0].measures[0].elements[0] as Note;
          const beforePitch = midiToPitch(before.pitches[0].midiPitch);
          
          act(() => getState().enterNormalMode());
          act(() => getState().toggleClef());
          
          const after = getState().score.staves[0].measures[0].elements[0] as Note;
          const afterPitch = midiToPitch(after.pitches[0].midiPitch);
          
          // 音名和八度应保持不变
          expect(afterPitch.name).toBe(beforePitch.name);
          expect(afterPitch.oct).toBe(beforePitch.oct);
        });

        it('多个音符在谱号切换后应全部保持音高', () => {
          act(() => getState().enterInsertMode());
          act(() => getState().insertNote('c'));
          act(() => getState().insertNote('e'));
          act(() => getState().insertNote('g'));
          
          const beforePitches = getState().score.staves[0].measures[0].elements
            .map(el => (el as Note).pitches[0].midiPitch);
          
          act(() => getState().enterNormalMode());
          act(() => getState().toggleClef());
          
          const afterPitches = getState().score.staves[0].measures[0].elements
            .map(el => (el as Note).pitches[0].midiPitch);
          
          expect(afterPitches).toEqual(beforePitches);
        });
      });

      describe('不同谱号下的智能八度推断', () => {
        it('高音谱号中第一个音符应为 C4', () => {
          act(() => getState().enterInsertMode());
          act(() => getState().insertNote('c'));
          
          const note = getState().score.staves[0].measures[0].elements[0] as Note;
          expect(note.pitches[0].midiPitch).toBe(60); // C4
        });

        it('低音谱号中第一个音符也应为 C4（不变）', () => {
          act(() => getState().toggleClef()); // 先切换到低音谱号
          act(() => getState().enterInsertMode());
          act(() => getState().insertNote('c'));
          
          const note = getState().score.staves[0].measures[0].elements[0] as Note;
          // 当前实现：无论谱号如何，第一个音符都是 C4
          // 这可能是预期行为（保持绝对音高）
          expect(note.pitches[0].midiPitch).toBe(60); // C4
        });

        it('在低音谱号中连续输入音符的八度推断', () => {
          act(() => getState().toggleClef());
          act(() => getState().enterInsertMode());
          act(() => getState().insertNote('c')); // C4
          act(() => getState().insertNote('g')); // 应选择最近的 G
          
          const elements = getState().score.staves[0].measures[0].elements;
          const gNote = elements[1] as Note;
          
          // C4=60, G3=55 (距离5), G4=67 (距离7)
          // 应选择 G3
          expect(gNote.pitches[0].midiPitch).toBe(55); // G3
        });
      });

      describe('LilyPond 导出中的谱号', () => {
        it('高音谱号导出应包含 \\clef treble', () => {
          const score = createDefaultScore();
          score.staves[0].measures[0].elements = [createNote(60, 4)];
          
          const lily = generateLilyPond(score);
          
          expect(lily).toContain('\\clef treble');
        });

        it('低音谱号导出应包含 \\clef bass', () => {
          const score = createDefaultScore();
          score.staves[0].clef = 'bass';
          score.staves[0].measures[0].elements = [createNote(60, 4)];
          
          const lily = generateLilyPond(score);
          
          expect(lily).toContain('\\clef bass');
        });
      });

      describe('多谱表的谱号切换', () => {
        it('只应切换当前谱表的谱号', () => {
          act(() => getState().addStaffBelow());
          
          // 光标在第2个谱表
          expect(getState().cursorPos.staffIndex).toBe(1);
          
          act(() => getState().toggleClef());
          
          // 只有第2个谱表变为低音谱号
          expect(getState().score.staves[0].clef).toBe('treble');
          expect(getState().score.staves[1].clef).toBe('bass');
        });

        it('不同谱表可以有不同的谱号', () => {
          act(() => getState().toggleClef()); // 第1个谱表变低音
          act(() => getState().addStaffBelow()); // 添加第2个谱表（高音）
          
          expect(getState().score.staves[0].clef).toBe('bass');
          expect(getState().score.staves[1].clef).toBe('treble');
        });
      });

      describe('谱号切换的撤销', () => {
        it('谱号切换应支持撤销', () => {
          expect(getState().score.staves[0].clef).toBe('treble');
          
          act(() => getState().toggleClef());
          expect(getState().score.staves[0].clef).toBe('bass');
          
          act(() => getState().undo());
          expect(getState().score.staves[0].clef).toBe('treble');
        });
      });
    });
  });

  describe('==========================================', () => {
    describe('光标与渲染位置的对应关系', () => {
      beforeEach(() => {
        act(() => resetState());
      });

      it('空小节的光标 elementIndex 应为 0', () => {
        const { cursorPos, score } = getState();
        expect(score.staves[0].measures[0].elements.length).toBe(0);
        expect(cursorPos.elementIndex).toBe(0);
      });

      it('插入音符后，elementIndex 应指向插入位置之后', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        
        // 插入 C4 后，光标应在位置 1（等待下一个输入）
        expect(getState().cursorPos.elementIndex).toBe(1);
        
        // 在中间位置插入
        act(() => getState().setCursorPos({ elementIndex: 0 }));
        act(() => getState().insertNote('d'));
        
        // 在位置 0 插入后，元素顺序应为 [D4, C4]
        const elements = getState().score.staves[0].measures[0].elements;
        expect(elements.length).toBe(2);
        expect((elements[0] as Note).pitches[0].midiPitch).toBe(62); // D4
        expect((elements[1] as Note).pitches[0].midiPitch).toBe(60); // C4
      });

      it('setCursorPos 应能正确定位到任意位置', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('d'));
        act(() => getState().insertNote('e'));
        
        // 设置光标到位置 1
        act(() => getState().setCursorPos({ elementIndex: 1 }));
        expect(getState().cursorPos.elementIndex).toBe(1);
        
        // 设置光标到位置 3（末尾）
        act(() => getState().setCursorPos({ elementIndex: 3 }));
        expect(getState().cursorPos.elementIndex).toBe(3);
      });

      it('修改时值不应改变光标位置', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        
        const beforePos = { ...getState().cursorPos };
        
        act(() => getState().modifyDuration(8)); // 改为八分音符
        
        const afterPos = getState().cursorPos;
        expect(afterPos.elementIndex).toBe(beforePos.elementIndex);
        expect(afterPos.measureIndex).toBe(beforePos.measureIndex);
        expect(afterPos.staffIndex).toBe(beforePos.staffIndex);
      });

      it('添加附点不应改变光标位置', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        
        const beforePos = { ...getState().cursorPos };
        
        act(() => getState().addDot());
        
        const afterPos = getState().cursorPos;
        expect(afterPos.elementIndex).toBe(beforePos.elementIndex);
        expect(afterPos.measureIndex).toBe(beforePos.measureIndex);
        expect(afterPos.staffIndex).toBe(beforePos.staffIndex);
      });

      it('升降号操作不应改变光标位置', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        
        const beforePos = { ...getState().cursorPos };
        
        act(() => getState().makeSharp());
        
        const afterPos = getState().cursorPos;
        expect(afterPos.elementIndex).toBe(beforePos.elementIndex);
        expect(afterPos.measureIndex).toBe(beforePos.measureIndex);
        expect(afterPos.staffIndex).toBe(beforePos.staffIndex);
      });
    });
  });
});
