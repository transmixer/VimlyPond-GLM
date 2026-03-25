/**
 * ===========================================
 * 普通模式修改时值测试
 * ===========================================
 *
 * 测试普通模式下直接修改选中音符的时值
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useVimlypondStore } from './store';
import { durationValue } from './music';

describe('普通模式修改时值', () => {
  beforeEach(() => {
    // 重置状态
    useVimlypondStore.setState({
      score: {
        meter: { count: 4, unit: 4 },
        staves: [{
          clef: 'treble',
          measures: [{
            elements: [],
            durationUsed: 0
          }]
        }]
      },
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
      history: { past: [], future: [] }
    });
  });

  describe('普通模式修改选中音符时值', () => {
    it('应该能够修改选中音符的时值', () => {
      const store = useVimlypondStore.getState();
      
      // 先插入一个音符
      store.setCursorPos({ mode: 'insert', elementIndex: 0 });
      store.setInputState({ lastDuration: 4 });
      store.insertNote('c');
      
      // 切换到普通模式
      store.enterNormalMode();
      
      const scoreAfterInsert = useVimlypondStore.getState().score;
      expect(scoreAfterInsert.staves[0].measures[0].elements.length).toBe(1);
      expect(scoreAfterInsert.staves[0].measures[0].elements[0].duration).toBe(4);
      
      // 在普通模式下修改时值为 8
      store.modifyDuration(8);
      
      const scoreAfterModify = useVimlypondStore.getState().score;
      expect(scoreAfterModify.staves[0].measures[0].elements[0].duration).toBe(8);
    });

    it('应该能够修改选中音符添加附点', () => {
      const store = useVimlypondStore.getState();
      
      // 先插入一个四分音符
      store.setCursorPos({ mode: 'insert', elementIndex: 0 });
      store.setInputState({ lastDuration: 4, lastDots: 0 });
      store.insertNote('c');
      
      // 切换到普通模式
      store.enterNormalMode();
      
      // 添加附点
      store.addDot();
      
      const score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].dots).toBe(1);
    });

    it('应该能够修改选中音符的升降号', () => {
      const store = useVimlypondStore.getState();
      
      // 先插入一个音符
      store.setCursorPos({ mode: 'insert', elementIndex: 0 });
      store.insertNote('c');
      
      // 切换到普通模式
      store.enterNormalMode();
      
      // 添加升号
      store.makeSharp();
      
      let score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(1);
      
      // 再升号 -> 重升
      store.makeSharp();
      score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(2);
      
      // 降号（从重升变为升）
      store.makeFlat();
      score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(1);
    });

    it('光标移动后应该修改新选中的音符', () => {
      const store = useVimlypondStore.getState();
      
      // 插入两个音符
      store.setCursorPos({ mode: 'insert', elementIndex: 0 });
      store.setInputState({ lastDuration: 4 });
      store.insertNote('c');
      store.insertNote('d');
      
      // 切换到普通模式，光标应该在第二个音符
      store.enterNormalMode();
      
      let score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements.length).toBe(2);
      
      // 修改第二个音符时值为 8
      store.modifyDuration(8);
      
      score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[1].duration).toBe(8);
      expect(score.staves[0].measures[0].elements[0].duration).toBe(4); // 第一个不变
      
      // 移动光标到第一个音符
      store.navigateLeft();
      
      // 修改第一个音符时值为 2
      store.modifyDuration(2);
      
      score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].duration).toBe(2);
    });

    it('空小节时修改时值不应报错', () => {
      const store = useVimlypondStore.getState();
      
      // 普通模式，空小节
      store.setCursorPos({ mode: 'normal', elementIndex: 0 });
      
      // 尝试修改时值（应该不报错，只是更新 inputState）
      store.modifyDuration(8);
      
      const state = useVimlypondStore.getState();
      expect(state.inputState.lastDuration).toBe(8);
    });
  });

  describe('与插入模式的对比', () => {
    it('插入模式修改最后输入的音符，普通模式修改选中的音符', () => {
      const store = useVimlypondStore.getState();
      
      // 插入三个音符
      store.setCursorPos({ mode: 'insert', elementIndex: 0 });
      store.setInputState({ lastDuration: 4 });
      store.insertNote('c');
      store.insertNote('d');
      store.insertNote('e');
      
      // 插入模式下，修改最后输入的音符（第三个）
      store.modifyDuration(2);
      
      let score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[2].duration).toBe(2);
      
      // 切换到普通模式，光标在第三个音符
      store.enterNormalMode();
      
      // 移动到第二个音符
      store.navigateLeft();
      
      // 普通模式下，修改选中的音符（第二个）
      store.modifyDuration(8);
      
      score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[1].duration).toBe(8);
      expect(score.staves[0].measures[0].elements[2].duration).toBe(2); // 第三个不变
    });
  });

  describe('修改时值触发小节平衡', () => {
    it('增大时值导致溢出，应分割音符推到下一小节', () => {
      const store = useVimlypondStore.getState();
      
      // 设置：小节1有4个四分音符（满），小节2为空
      useVimlypondStore.setState({
        score: {
          meter: { count: 4, unit: 4 },
          staves: [{
            clef: 'treble',
            measures: [
              {
                elements: [
                  { type: 'note', midiPitch: 60, duration: 4, dots: 0, alter: 0, tieStart: false, tieEnd: false },
                  { type: 'note', midiPitch: 62, duration: 4, dots: 0, alter: 0, tieStart: false, tieEnd: false },
                  { type: 'note', midiPitch: 64, duration: 4, dots: 0, alter: 0, tieStart: false, tieEnd: false },
                  { type: 'note', midiPitch: 65, duration: 4, dots: 0, alter: 0, tieStart: false, tieEnd: false },
                ],
                durationUsed: 4
              },
              { elements: [], durationUsed: 0 }
            ]
          }]
        },
        cursorPos: {
          staffIndex: 0,
          measureIndex: 0,
          elementIndex: 3, // 选中最后一个四分音符
          mode: 'normal'
        }
      });
      
      // 将最后一个四分音符改为二分音符（2拍）
      // 这会导致小节溢出（4-1+2=5拍）
      useVimlypondStore.getState().modifyDuration(2);
      
      const score = useVimlypondStore.getState().score;
      
      // 小节1应该还是4拍
      expect(score.staves[0].measures[0].durationUsed).toBe(4);
      
      // 小节2应该有音符了（推过去的）
      expect(score.staves[0].measures[1].elements.length).toBeGreaterThan(0);
    });

    it('减小时值导致不满，应从下一小节拉入', () => {
      const store = useVimlypondStore.getState();
      
      // 设置：小节1有2个二分音符（满），小节2有1个二分音符
      useVimlypondStore.setState({
        score: {
          meter: { count: 4, unit: 4 },
          staves: [{
            clef: 'treble',
            measures: [
              {
                elements: [
                  { type: 'note', midiPitch: 60, duration: 2, dots: 0, alter: 0, tieStart: false, tieEnd: false },
                  { type: 'note', midiPitch: 62, duration: 2, dots: 0, alter: 0, tieStart: false, tieEnd: false },
                ],
                durationUsed: 4
              },
              {
                elements: [
                  { type: 'note', midiPitch: 64, duration: 2, dots: 0, alter: 0, tieStart: false, tieEnd: false },
                ],
                durationUsed: 2
              }
            ]
          }]
        },
        cursorPos: {
          staffIndex: 0,
          measureIndex: 0,
          elementIndex: 1, // 选中第二个二分音符
          mode: 'normal'
        }
      });
      
      // 将二分音符改为四分音符（1拍）
      // 这会导致小节不满（4-2+1=3拍）
      useVimlypondStore.getState().modifyDuration(4);
      
      const score = useVimlypondStore.getState().score;
      
      // 小节1应该恢复到4拍（拉入了下一小节的音符）
      expect(score.staves[0].measures[0].durationUsed).toBe(4);
    });
  });
});
