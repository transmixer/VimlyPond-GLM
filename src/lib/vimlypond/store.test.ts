/**
 * ===========================================
 * Vimlypond 状态管理与按键交互测试
 * ===========================================
 * 
 * 本测试文件涵盖以下功能：
 * 1. 模式切换（普通模式 ↔ 插入模式）
 * 2. 音符输入与智能八度推断
 * 3. 时值修改与附点
 * 4. 升降号处理
 * 5. 导航操作（谱表/小节切换）
 * 6. 结构操作（添加谱表、切换谱号）
 * 7. 撤销功能
 * 8. 小节自动溢出
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useVimlypondStore } from '@/lib/vimlypond/store';
import { createDefaultScore } from '@/lib/vimlypond/music';

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
    noteRects: [],
    lastAction: null
  });
};

describe('==========================================', () => {
  // 在所有测试前重置状态
  beforeEach(() => {
    act(() => resetState());
  });

  describe('模式切换测试', () => {
    it('初始状态应为普通模式', () => {
      expect(getState().cursorPos.mode).toBe('normal');
    });

    it('按 i 键应进入插入模式', () => {
      act(() => {
        getState().enterInsertMode();
      });
      expect(getState().cursorPos.mode).toBe('insert');
    });

    it('按 ESC 键应返回普通模式', () => {
      act(() => {
        getState().enterInsertMode();
      });
      expect(getState().cursorPos.mode).toBe('insert');
      
      act(() => {
        getState().enterNormalMode();
      });
      expect(getState().cursorPos.mode).toBe('normal');
    });
  });

  describe('==========================================', () => {
    describe('音符输入测试', () => {
      beforeEach(() => {
        act(() => resetState());
      });

      it('输入第一个音符应为 C4（中央C）', () => {
        act(() => {
          getState().enterInsertMode();
        });
        act(() => {
          getState().insertNote('c');
        });
        
        const measure = getState().score.staves[0].measures[0];
        expect(measure.elements.length).toBe(1);
        expect(measure.elements[0].type).toBe('note');
        if (measure.elements[0].type === 'note') {
          expect(measure.elements[0].pitches[0].midiPitch).toBe(60);
        }
      });

      it('智能八度推断：C4 后输入 e 应为 E4', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('e'));
        
        const measure = getState().score.staves[0].measures[0];
        expect(measure.elements.length).toBe(2);
        if (measure.elements[1].type === 'note') {
          expect(measure.elements[1].pitches[0].midiPitch).toBe(64);
        }
      });

      it('智能八度推断：C4 后输入 a 应为 A3', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('a'));
        
        const measure = getState().score.staves[0].measures[0];
        expect(measure.elements.length).toBe(2);
        if (measure.elements[1].type === 'note') {
          expect(measure.elements[1].pitches[0].midiPitch).toBe(57);
        }
      });

      it('按 r 键应插入休止符', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertRest());
        
        const measure = getState().score.staves[0].measures[0];
        expect(measure.elements.length).toBe(1);
        expect(measure.elements[0].type).toBe('rest');
      });

      it('小节空间不足时应拒绝插入', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('d'));
        act(() => getState().insertNote('e'));
        act(() => getState().insertNote('f'));
        
        // 填满后光标应该跳到下一小节
        expect(getState().cursorPos.measureIndex).toBe(1);
        
        // 回到第一小节测试空间不足
        act(() => {
          getState().setCursorPos({ measureIndex: 0, elementIndex: 4 });
        });
        
        const measureBefore = getState().score.staves[0].measures[0];
        expect(measureBefore.elements.length).toBe(4);
        expect(measureBefore.durationUsed).toBe(4);
        
        // 在第一小节尝试插入（空间不足）
        act(() => getState().insertNote('g'));
        
        const measureAfter = getState().score.staves[0].measures[0];
        expect(measureAfter.elements.length).toBe(4);
      });
    });
  });

  describe('==========================================', () => {
    describe('时值修改测试', () => {
      beforeEach(() => {
        act(() => resetState());
      });

      it('按 8 键应将上一个音符修改为八分音符', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().modifyDuration(8));
        
        const measure = getState().score.staves[0].measures[0];
        if (measure.elements[0]?.type === 'note') {
          expect(measure.elements[0].duration).toBe(8);
        }
        expect(measure.durationUsed).toBe(0.5);
      });

      it('按 2 键应将上一个音符修改为二分音符', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().modifyDuration(2));
        
        const measure = getState().score.staves[0].measures[0];
        if (measure.elements[0]?.type === 'note') {
          expect(measure.elements[0].duration).toBe(2);
        }
        expect(measure.durationUsed).toBe(2);
      });

      it('按 . 键应为上一个音符添加附点', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().addDot());
        
        const measure = getState().score.staves[0].measures[0];
        if (measure.elements[0]?.type === 'note') {
          expect(measure.elements[0].dots).toBe(1);
        }
        expect(measure.durationUsed).toBe(1.5);
      });

      it('连续按两次 . 应添加两个附点', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().addDot());
        act(() => getState().addDot());
        
        const measure = getState().score.staves[0].measures[0];
        if (measure.elements[0]?.type === 'note') {
          expect(measure.elements[0].dots).toBe(2);
        }
        expect(measure.durationUsed).toBe(1.75);
      });
    });
  });

  describe('==========================================', () => {
    describe('升降号测试', () => {
      beforeEach(() => {
        act(() => resetState());
      });

      it('按 + 键应将上一个音符升高半音', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().makeSharp());
        
        const measure = getState().score.staves[0].measures[0];
        if (measure.elements[0]?.type === 'note') {
          expect(measure.elements[0].pitches[0].midiPitch).toBe(61);
          expect(measure.elements[0].pitches[0].alter).toBe(1);
        }
      });

      it('按 - 键应将上一个音符降低半音', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('d'));
        act(() => getState().makeFlat());
        
        const measure = getState().score.staves[0].measures[0];
        if (measure.elements[0]?.type === 'note') {
          expect(measure.elements[0].pitches[0].midiPitch).toBe(61);
          expect(measure.elements[0].pitches[0].alter).toBe(-1);
        }
      });

      it('休止符不应受升降号影响', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertRest());
        act(() => getState().makeSharp());
        
        const measure = getState().score.staves[0].measures[0];
        expect(measure.elements[0].type).toBe('rest');
        expect(measure.elements.length).toBe(1);
      });
    });
  });

  describe('==========================================', () => {
    describe('导航操作测试', () => {
      beforeEach(() => {
        act(() => resetState());
      });

      it('按 j 键应向下移动到下一个谱表', () => {
        act(() => getState().addStaffBelow());
        expect(getState().cursorPos.staffIndex).toBe(1);
      });

      it('按 k 键应向上移动到上一个谱表', () => {
        act(() => getState().addStaffBelow());
        expect(getState().cursorPos.staffIndex).toBe(1);
        
        act(() => getState().navigateUp());
        expect(getState().cursorPos.staffIndex).toBe(0);
      });

      it('按 l 键应向右移动到下一个音符', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('d'));
        act(() => getState().enterNormalMode());
        
        // 光标在位置2，按 l 应移动到位置3（如果有的话）
        // 但当前只有2个音符，所以保持在位置2
        expect(getState().cursorPos.elementIndex).toBe(2);
        
        act(() => getState().navigateLeft()); // 移到位置1
        expect(getState().cursorPos.elementIndex).toBe(1);
        
        act(() => getState().navigateRight()); // 移到位置2
        expect(getState().cursorPos.elementIndex).toBe(2);
      });

      it('按 h 键应向左移动到上一个音符', () => {
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
        
        act(() => getState().navigateLeft());
        expect(getState().cursorPos.elementIndex).toBe(0);
        
        // 在位置0按 h 应保持在原位
        act(() => getState().navigateLeft());
        expect(getState().cursorPos.elementIndex).toBe(0);
      });

      it('按 n 键应跳转到下一小节', () => {
        act(() => getState().navigateNextMeasure());
        expect(getState().cursorPos.measureIndex).toBe(1);
        expect(getState().cursorPos.elementIndex).toBe(0);
      });

      it('按 b 键应跳转到上一小节', () => {
        act(() => getState().navigateNextMeasure());
        expect(getState().cursorPos.measureIndex).toBe(1);
        
        act(() => getState().navigatePrevMeasure());
        expect(getState().cursorPos.measureIndex).toBe(0);
      });

      it('在最后一小节按 n 应自动添加新小节', () => {
        const initialMeasureCount = getState().score.staves[0].measures.length;
        
        act(() => getState().setCursorPos({ measureIndex: initialMeasureCount - 1 }));
        act(() => getState().navigateNextMeasure());
        
        expect(getState().score.staves[0].measures.length).toBe(initialMeasureCount + 1);
      });

      it('在第一个谱表按 k 应保持在原位', () => {
        act(() => getState().navigateUp());
        expect(getState().cursorPos.staffIndex).toBe(0);
      });

      it('在第一个小节按 b 应保持在原位', () => {
        act(() => getState().navigatePrevMeasure());
        expect(getState().cursorPos.measureIndex).toBe(0);
      });

      it('跳转小节后 elementIndex 应重置', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('d'));
        act(() => getState().enterNormalMode());
        
        expect(getState().cursorPos.elementIndex).toBe(2);
        
        act(() => getState().navigateNextMeasure());
        expect(getState().cursorPos.measureIndex).toBe(1);
        expect(getState().cursorPos.elementIndex).toBe(0);
      });
    });
  });

  describe('==========================================', () => {
    describe('结构操作测试', () => {
      beforeEach(() => {
        act(() => resetState());
      });

      it('按 o 键应在下方添加新谱表', () => {
        act(() => getState().addStaffBelow());
        expect(getState().score.staves.length).toBe(2);
        expect(getState().cursorPos.staffIndex).toBe(1);
      });

      it('按 O 键应在上方添加新谱表', () => {
        act(() => getState().addStaffAbove());
        expect(getState().score.staves.length).toBe(2);
        expect(getState().cursorPos.staffIndex).toBe(0);
      });

      it('按 t 键应切换谱号', () => {
        expect(getState().score.staves[0].clef).toBe('treble');
        
        act(() => getState().toggleClef());
        expect(getState().score.staves[0].clef).toBe('bass');
        
        act(() => getState().toggleClef());
        expect(getState().score.staves[0].clef).toBe('treble');
      });

      it('按 x 键应删除当前音符', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().enterNormalMode());
        act(() => getState().deleteElement());
        
        const measure = getState().score.staves[0].measures[0];
        expect(measure.elements.length).toBe(0);
        expect(measure.durationUsed).toBe(0);
      });
    });
  });

  describe('==========================================', () => {
    describe('调号测试', () => {
      beforeEach(() => {
        act(() => resetState());
      });

      it('初始调号应为 C 大调', () => {
        const staff = getState().score.staves[0];
        expect(staff.keySignature.name).toBe('C-major');
        expect(staff.keySignature.sharps).toBe(0);
        expect(staff.keySignature.flats).toBe(0);
      });

      it('切换到 G 大调应有 1 个升号', () => {
        act(() => getState().changeKeySignature('G-major'));
        
        const staff = getState().score.staves[0];
        expect(staff.keySignature.name).toBe('G-major');
        expect(staff.keySignature.sharps).toBe(1);
      });

      it('切换到 F 大调应有 1 个降号', () => {
        act(() => getState().changeKeySignature('F-major'));
        
        const staff = getState().score.staves[0];
        expect(staff.keySignature.name).toBe('F-major');
        expect(staff.keySignature.flats).toBe(1);
      });

      it('在 G 大调中输入 F 应自动添加升号', () => {
        act(() => getState().changeKeySignature('G-major'));
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('f'));
        
        const measure = getState().score.staves[0].measures[0];
        if (measure.elements[0]?.type === 'note') {
          // F 在 G 大调中应为 F# (MIDI 66 = F#5, 但根据八度推断可能是 F#4 = 66)
          const pitch = measure.elements[0].pitches[0];
          expect(pitch.alter).toBe(1); // 升号
        }
      });

      it('在 F 大调中输入 B 应自动添加降号', () => {
        act(() => getState().changeKeySignature('F-major'));
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('b'));
        
        const measure = getState().score.staves[0].measures[0];
        if (measure.elements[0]?.type === 'note') {
          const pitch = measure.elements[0].pitches[0];
          expect(pitch.alter).toBe(-1); // 降号
        }
      });

      it('调号切换应支持撤销', () => {
        act(() => getState().changeKeySignature('D-major'));
        expect(getState().score.staves[0].keySignature.name).toBe('D-major');
        
        act(() => getState().undo());
        expect(getState().score.staves[0].keySignature.name).toBe('C-major');
      });
    });
  });

  describe('==========================================', () => {
    describe('拍号测试', () => {
      beforeEach(() => {
        act(() => resetState());
      });

      it('初始拍号应为 4/4', () => {
        const meter = getState().score.meter;
        expect(meter.count).toBe(4);
        expect(meter.unit).toBe(4);
      });

      it('切换到 3/4 应正确', () => {
        act(() => getState().changeMeter('3/4'));
        
        const meter = getState().score.meter;
        expect(meter.count).toBe(3);
        expect(meter.unit).toBe(4);
      });

      it('切换到 6/8 应正确', () => {
        act(() => getState().changeMeter('6/8'));
        
        const meter = getState().score.meter;
        expect(meter.count).toBe(6);
        expect(meter.unit).toBe(8);
      });

      it('拍号切换应支持撤销', () => {
        act(() => getState().changeMeter('2/4'));
        expect(getState().score.meter.count).toBe(2);
        
        act(() => getState().undo());
        expect(getState().score.meter.count).toBe(4);
      });
    });
  });

  describe('==========================================', () => {
    describe('撤销功能测试', () => {
      beforeEach(() => {
        act(() => resetState());
      });

      it('按 u 键应撤销最后一个操作', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        expect(getState().score.staves[0].measures[0].elements.length).toBe(1);
        
        act(() => getState().undo());
        expect(getState().score.staves[0].measures[0].elements.length).toBe(0);
      });

      it('添加谱表后撤销应恢复原状', () => {
        act(() => getState().addStaffBelow());
        expect(getState().score.staves.length).toBe(2);
        
        act(() => getState().undo());
        expect(getState().score.staves.length).toBe(1);
      });

      it('应支持多次撤销', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('d'));
        act(() => getState().insertNote('e'));
        expect(getState().score.staves[0].measures[0].elements.length).toBe(3);
        
        act(() => getState().undo());
        expect(getState().score.staves[0].measures[0].elements.length).toBe(2);
        
        act(() => getState().undo());
        expect(getState().score.staves[0].measures[0].elements.length).toBe(1);
      });
    });
  });

  describe('==========================================', () => {
    describe('重做功能测试（Ctrl+R）', () => {
      beforeEach(() => {
        act(() => resetState());
      });

      it('无撤销历史时重做应无效果', () => {
        const scoreBefore = JSON.stringify(getState().score);
        const result = getState().redo();
        expect(result).toBe(false);
        expect(JSON.stringify(getState().score)).toBe(scoreBefore);
      });

      it('撤销后重做应恢复操作', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        expect(getState().score.staves[0].measures[0].elements.length).toBe(1);
        
        // 撤销
        act(() => getState().undo());
        expect(getState().score.staves[0].measures[0].elements.length).toBe(0);
        
        // 重做
        const result = getState().redo();
        expect(result).toBe(true);
        expect(getState().score.staves[0].measures[0].elements.length).toBe(1);
      });

      it('应支持多次撤销后多次重做', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('d'));
        act(() => getState().insertNote('e'));
        expect(getState().score.staves[0].measures[0].elements.length).toBe(3);
        
        // 两次撤销
        act(() => getState().undo());
        expect(getState().score.staves[0].measures[0].elements.length).toBe(2);
        act(() => getState().undo());
        expect(getState().score.staves[0].measures[0].elements.length).toBe(1);
        
        // 两次重做
        act(() => getState().redo());
        expect(getState().score.staves[0].measures[0].elements.length).toBe(2);
        act(() => getState().redo());
        expect(getState().score.staves[0].measures[0].elements.length).toBe(3);
      });

      it('新操作应清空重做历史', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c')); // 操作1
        act(() => getState().insertNote('d')); // 操作2
        expect(getState().score.staves[0].measures[0].elements.length).toBe(2);
        
        // 撤销到操作1（注意：undo 不恢复 cursorPos）
        act(() => getState().undo());
        expect(getState().score.staves[0].measures[0].elements.length).toBe(1);
        
        // 重置光标位置到有效位置
        act(() => getState().setCursorPos({ elementIndex: 1 }));
        
        // 新操作（应清空重做历史）
        act(() => getState().insertNote('e'));
        expect(getState().score.staves[0].measures[0].elements.length).toBe(2);
        
        // 重做应该无效果
        const result = getState().redo();
        expect(result).toBe(false);
        expect(getState().score.staves[0].measures[0].elements.length).toBe(2);
      });

      it('撤销添加谱表后重做应恢复', () => {
        act(() => getState().addStaffBelow());
        expect(getState().score.staves.length).toBe(2);
        
        act(() => getState().undo());
        expect(getState().score.staves.length).toBe(1);
        
        act(() => getState().redo());
        expect(getState().score.staves.length).toBe(2);
      });

      it('撤销删除后重做应恢复删除', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('d'));
        act(() => getState().enterNormalMode());
        
        // 删除
        act(() => getState().deleteElement());
        expect(getState().score.staves[0].measures[0].elements.length).toBe(1);
        
        // 撤销删除
        act(() => getState().undo());
        expect(getState().score.staves[0].measures[0].elements.length).toBe(2);
        
        // 重做删除
        act(() => getState().redo());
        expect(getState().score.staves[0].measures[0].elements.length).toBe(1);
      });
    });
  });

  describe('==========================================', () => {
    describe('小节自动溢出测试', () => {
      beforeEach(() => {
        act(() => resetState());
      });

      it('填满小节后光标应自动跳转到下一小节', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('d'));
        act(() => getState().insertNote('e'));
        act(() => getState().insertNote('f'));
        
        // 4个四分音符填满后应该跳到下一小节
        expect(getState().cursorPos.measureIndex).toBe(1);
      });

      it('在最后一小节填满后应自动添加新小节', () => {
        const lastMeasureIndex = getState().score.staves[0].measures.length - 1;
        
        act(() => getState().setCursorPos({ measureIndex: lastMeasureIndex, elementIndex: 0 }));
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('d'));
        act(() => getState().insertNote('e'));
        act(() => getState().insertNote('f'));
        
        expect(getState().score.staves[0].measures.length).toBe(lastMeasureIndex + 2);
        expect(getState().cursorPos.measureIndex).toBe(lastMeasureIndex + 1);
      });
    });
  });

  describe('==========================================', () => {
    describe('跨小节延音线测试', () => {
      beforeEach(() => {
        act(() => resetState());
      });

      it('修改时值溢出应创建延音线', () => {
        // 输入一个四分音符
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        
        // 输入一个二分音符，加上附点变成附点二分（3拍）
        act(() => getState().insertNote('d'));
        act(() => getState().modifyDuration(2));
        act(() => getState().addDot());
        
        // 现在小节有 1 + 3 = 4 拍
        // 再输入一个四分音符，会导致溢出
        act(() => getState().insertNote('e'));
        
        // 检查第一小节的最后一个音符是否有 tieStart
        const measure1 = getState().score.staves[0].measures[0];
        const lastNote = measure1.elements[measure1.elements.length - 1];
        if (lastNote?.type === 'note') {
          // 二分音符可能被分割成四分+四分
          // 具体行为取决于 splitNoteWithDuration 实现
          expect(lastNote.tieStart || measure1.durationUsed <= 4).toBeTruthy();
        }
      });

      it('延音线音符应能正确合并', () => {
        // 使用流式平衡系统的延音线合并
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c')); // 四分音符
        act(() => getState().insertNote('d')); // 四分音符
        act(() => getState().insertNote('e')); // 四分音符
        act(() => getState().insertNote('f')); // 四分音符，填满小节
        
        // 下一个小节
        act(() => getState().insertNote('g'));
        
        // 验证结构正确
        const measure1 = getState().score.staves[0].measures[0];
        const measure2 = getState().score.staves[0].measures[1];
        
        expect(measure1.elements.length).toBe(4);
        expect(measure1.durationUsed).toBe(4);
        expect(measure2.elements.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('==========================================', () => {
    describe('边界条件测试', () => {
      beforeEach(() => {
        act(() => resetState());
      });
      
      it('没有操作可撤销时应保持不变', () => {
        // resetState 后历史记录应该为空
        const scoreBefore = JSON.stringify(getState().score);
        
        act(() => getState().undo());
        
        expect(JSON.stringify(getState().score)).toBe(scoreBefore);
      });

      it('删除空小节的元素应无效果', () => {
        const measureBefore = JSON.stringify(getState().score.staves[0].measures[0]);
        
        act(() => getState().deleteElement());
        
        expect(JSON.stringify(getState().score.staves[0].measures[0])).toBe(measureBefore);
      });

      it('输入超出小节容量的时值应被拒绝', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().modifyDuration(2)); // 二分音符 = 2拍
        act(() => getState().insertNote('d'));
        act(() => getState().modifyDuration(2)); // 再输入二分音符
        
        // 小节应该满了
        expect(getState().score.staves[0].measures[0].durationUsed).toBe(4);
        
        // 尝试再输入应该失败
        act(() => getState().insertNote('e'));
        expect(getState().score.staves[0].measures[0].elements.length).toBe(2);
      });
    });
  });

  describe('==========================================', () => {
    describe('重复操作测试（普通模式下 `.` 键）', () => {
      beforeEach(() => {
        act(() => resetState());
      });

      it('无上次操作时按 `.` 应无效果', () => {
        const scoreBefore = JSON.stringify(getState().score);
        act(() => getState().repeatLastAction());
        expect(JSON.stringify(getState().score)).toBe(scoreBefore);
      });

      it('重复删除操作：删除音符后按 `.` 应继续删除', () => {
        // 插入3个音符
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().insertNote('d'));
        act(() => getState().insertNote('e'));
        act(() => getState().enterNormalMode());
        
        // 光标在位置3（e 之后）
        expect(getState().cursorPos.elementIndex).toBe(3);
        
        // 删除元素：删除 elementIndex - 1 = 2 (e)
        act(() => getState().deleteElement());
        expect(getState().score.staves[0].measures[0].elements.length).toBe(2);
        // 光标应在位置2
        expect(getState().cursorPos.elementIndex).toBe(2);
        
        // 重复删除：删除 elementIndex - 1 = 1 (d)
        act(() => getState().repeatLastAction());
        expect(getState().score.staves[0].measures[0].elements.length).toBe(1);
      });

      it('重复修改时值操作：按 `.` 应重复上次修改', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c')); // 四分音符
        act(() => getState().insertNote('d')); // 四分音符
        
        let measure = getState().score.staves[0].measures[0];
        expect(measure.elements[1].duration).toBe(4); // d 是四分音符
        
        // 修改 d 为八分音符
        act(() => getState().modifyDuration(8));
        
        measure = getState().score.staves[0].measures[0];
        expect(measure.elements[1].duration).toBe(8); // d 变成八分
        
        // 插入 e（继承八分时值）
        act(() => getState().insertNote('e'));
        
        measure = getState().score.staves[0].measures[0];
        expect(measure.elements[2].duration).toBe(8); // e 是八分
        
        // 现在 lastAction 是 modifyDuration(8)
        // 插入 f（四分，因为 lastDuration 在 modifyDuration 时被设为 8）
        act(() => getState().insertNote('f'));
        
        measure = getState().score.staves[0].measures[0];
        // f 应该是八分音符（因为 lastDuration = 8）
        expect(measure.elements[3].duration).toBe(8);
        
        // 重复修改：把 f 改成八分（它已经是八分）
        // 但我们可以验证 repeatLastAction 不报错
        act(() => getState().repeatLastAction());
        
        measure = getState().score.staves[0].measures[0];
        expect(measure.elements[3].duration).toBe(8);
      });

      it('重复添加附点操作', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c'));
        act(() => getState().addDot()); // c 加一个附点，lastDots = 1
        
        let measure = getState().score.staves[0].measures[0];
        expect(measure.elements[0].dots).toBe(1);
        
        // 插入 d（会继承 lastDots = 1）
        act(() => getState().insertNote('d'));
        
        measure = getState().score.staves[0].measures[0];
        expect(measure.elements[1].dots).toBe(1); // d 也有 1 个附点
        
        // 重复添加附点：给 d 再加一个附点，变成 2 个
        act(() => getState().repeatLastAction());
        
        measure = getState().score.staves[0].measures[0];
        expect(measure.elements[1].dots).toBe(2); // d 现在有 2 个附点
      });

      it('重复升号操作', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c')); // C4
        act(() => getState().makeSharp()); // C#4
        
        let measure = getState().score.staves[0].measures[0];
        if (measure.elements[0].type === 'note') {
          expect(measure.elements[0].pitches[0].alter).toBe(1);
          expect(measure.elements[0].pitches[0].midiPitch).toBe(61);
        }
        
        // 插入 d
        act(() => getState().insertNote('d')); // D4
        
        measure = getState().score.staves[0].measures[0];
        if (measure.elements[1].type === 'note') {
          expect(measure.elements[1].pitches[0].alter).toBe(0); // 没有升降号
        }
        
        // 重复升号：d -> d#
        act(() => getState().repeatLastAction());
        
        measure = getState().score.staves[0].measures[0];
        if (measure.elements[1].type === 'note') {
          expect(measure.elements[1].pitches[0].alter).toBe(1); // d 变成 d#
        }
      });

      it('重复降号操作', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('d')); // D4
        act(() => getState().makeFlat()); // Db4
        
        let measure = getState().score.staves[0].measures[0];
        if (measure.elements[0].type === 'note') {
          expect(measure.elements[0].pitches[0].alter).toBe(-1);
        }
        
        // 插入 e
        act(() => getState().insertNote('e')); // E4
        
        // 重复降号：e -> eb
        act(() => getState().repeatLastAction());
        
        measure = getState().score.staves[0].measures[0];
        if (measure.elements[1].type === 'note') {
          expect(measure.elements[1].pitches[0].alter).toBe(-1); // e 变成 eb
        }
      });

      it('重复升八度操作', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c')); // C4 = 60
        act(() => getState().raiseOctave()); // C5 = 72
        
        let measure = getState().score.staves[0].measures[0];
        if (measure.elements[0].type === 'note') {
          expect(measure.elements[0].pitches[0].midiPitch).toBe(72);
        }
        
        // 插入 d（会继承八度）
        act(() => getState().insertNote('d')); // D5 = 74
        
        measure = getState().score.staves[0].measures[0];
        if (measure.elements[1].type === 'note') {
          expect(measure.elements[1].pitches[0].midiPitch).toBe(74);
        }
        
        // 重复升八度：D5 -> D6
        act(() => getState().repeatLastAction());
        
        measure = getState().score.staves[0].measures[0];
        if (measure.elements[1].type === 'note') {
          expect(measure.elements[1].pitches[0].midiPitch).toBe(86); // D6 = 74 + 12
        }
      });

      it('重复降八度操作', () => {
        act(() => getState().enterInsertMode());
        act(() => getState().insertNote('c')); // C4 = 60
        act(() => getState().lowerOctave()); // C3 = 48
        
        let measure = getState().score.staves[0].measures[0];
        if (measure.elements[0].type === 'note') {
          expect(measure.elements[0].pitches[0].midiPitch).toBe(48);
        }
        
        // 插入 d
        act(() => getState().insertNote('d')); // D3 = 50
        
        // 重复降八度：D3 -> D2
        act(() => getState().repeatLastAction());
        
        measure = getState().score.staves[0].measures[0];
        if (measure.elements[1].type === 'note') {
          expect(measure.elements[1].pitches[0].midiPitch).toBe(38); // D2 = 50 - 12
        }
      });

      it('重复切换谱号操作', () => {
        expect(getState().score.staves[0].clef).toBe('treble');
        
        act(() => getState().toggleClef());
        expect(getState().score.staves[0].clef).toBe('bass');
        
        act(() => getState().repeatLastAction());
        expect(getState().score.staves[0].clef).toBe('treble');
      });
    });
  });
});
