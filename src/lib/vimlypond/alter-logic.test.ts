/**
 * ===========================================
 * 升降半音逻辑测试
 * ===========================================
 *
 * 设计原则：
 * 1. 升降半音互为逆操作
 * 2. 连续升降半音不影响渲染音高（alter 只影响显示，不影响 MIDI 音高）
 * 3. 最多连续升或者连续降两次
 * 4. 连续升/降两次为重升、重降，做相应渲染
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useVimlypondStore } from './store';

describe('升降半音逻辑', () => {
  beforeEach(() => {
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

  describe('升降互为逆操作', () => {
    it('自然音升号后降号应回到自然音', () => {
      const store = useVimlypondStore.getState();
      
      // 插入 C（自然音，alter=0）
      store.setCursorPos({ mode: 'insert', elementIndex: 0 });
      store.insertNote('c');
      
      // 升号 -> C#（alter=1）
      store.makeSharp();
      let score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(1);
      
      // 降号 -> C（alter=0）
      store.makeFlat();
      score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(0);
    });

    it('自然音降号后升号应回到自然音', () => {
      const store = useVimlypondStore.getState();
      
      // 插入 C（自然音，alter=0）
      store.setCursorPos({ mode: 'insert', elementIndex: 0 });
      store.insertNote('c');
      
      // 降号 -> Cb（alter=-1）
      store.makeFlat();
      let score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(-1);
      
      // 升号 -> C（alter=0）
      store.makeSharp();
      score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(0);
    });

    it('升号状态下降号应变为自然音', () => {
      const store = useVimlypondStore.getState();
      
      store.setCursorPos({ mode: 'insert', elementIndex: 0 });
      store.insertNote('d');
      
      // 升号 -> D#（alter=1）
      store.makeSharp();
      let score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(1);
      
      // 再次降号 -> D（alter=0）
      store.makeFlat();
      score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(0);
    });

    it('降号状态下升号应变为自然音', () => {
      const store = useVimlypondStore.getState();
      
      store.setCursorPos({ mode: 'insert', elementIndex: 0 });
      store.insertNote('e');
      
      // 降号 -> Eb（alter=-1）
      store.makeFlat();
      let score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(-1);
      
      // 再次升号 -> E（alter=0）
      store.makeSharp();
      score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(0);
    });
  });

  describe('连续升降不影响 MIDI 音高', () => {
    it('升号不应改变 MIDI 音高', () => {
      const store = useVimlypondStore.getState();
      
      store.setCursorPos({ mode: 'insert', elementIndex: 0 });
      store.insertNote('c'); // C4 = MIDI 60
      
      const originalPitch = useVimlypondStore.getState().score.staves[0].measures[0].elements[0].midiPitch;
      
      // 升号后 MIDI 音高不变
      store.makeSharp();
      let score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].midiPitch).toBe(originalPitch);
      
      // 再升号后 MIDI 音高仍不变
      store.makeSharp();
      score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].midiPitch).toBe(originalPitch);
    });

    it('降号不应改变 MIDI 音高', () => {
      const store = useVimlypondStore.getState();
      
      store.setCursorPos({ mode: 'insert', elementIndex: 0 });
      store.insertNote('d'); // D4 = MIDI 62
      
      const originalPitch = useVimlypondStore.getState().score.staves[0].measures[0].elements[0].midiPitch;
      
      // 降号后 MIDI 音高不变
      store.makeFlat();
      let score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].midiPitch).toBe(originalPitch);
      
      // 再降号后 MIDI 音高仍不变
      store.makeFlat();
      score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].midiPitch).toBe(originalPitch);
    });
  });

  describe('最多连续升降两次', () => {
    it('连续升号最多两次（重升）', () => {
      const store = useVimlypondStore.getState();
      
      store.setCursorPos({ mode: 'insert', elementIndex: 0 });
      store.insertNote('c');
      
      // 第一次升号 -> #（alter=1）
      store.makeSharp();
      let score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(1);
      
      // 第二次升号 -> ##（重升，alter=2）
      store.makeSharp();
      score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(2);
      
      // 第三次升号应无效
      store.makeSharp();
      score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(2);
    });

    it('连续降号最多两次（重降）', () => {
      const store = useVimlypondStore.getState();
      
      store.setCursorPos({ mode: 'insert', elementIndex: 0 });
      store.insertNote('c');
      
      // 第一次降号 -> b（alter=-1）
      store.makeFlat();
      let score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(-1);
      
      // 第二次降号 -> bb（重降，alter=-2）
      store.makeFlat();
      score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(-2);
      
      // 第三次降号应无效
      store.makeFlat();
      score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(-2);
    });
  });

  describe('重升重降与逆操作', () => {
    it('重升后降号应变为升号', () => {
      const store = useVimlypondStore.getState();
      
      store.setCursorPos({ mode: 'insert', elementIndex: 0 });
      store.insertNote('c');
      
      // 升到重升
      store.makeSharp();
      store.makeSharp();
      let score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(2);
      
      // 降号 -> 变为升号（alter=1）
      store.makeFlat();
      score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(1);
    });

    it('重降后升号应变为降号', () => {
      const store = useVimlypondStore.getState();
      
      store.setCursorPos({ mode: 'insert', elementIndex: 0 });
      store.insertNote('c');
      
      // 降到重降
      store.makeFlat();
      store.makeFlat();
      let score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(-2);
      
      // 升号 -> 变为降号（alter=-1）
      store.makeSharp();
      score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(-1);
    });

    it('重升后两次降号应回到自然音', () => {
      const store = useVimlypondStore.getState();
      
      store.setCursorPos({ mode: 'insert', elementIndex: 0 });
      store.insertNote('c');
      
      // 升到重升
      store.makeSharp();
      store.makeSharp();
      
      // 第一次降号 -> 升号
      store.makeFlat();
      let score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(1);
      
      // 第二次降号 -> 自然音
      store.makeFlat();
      score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(0);
    });

    it('重降后两次升号应回到自然音', () => {
      const store = useVimlypondStore.getState();
      
      store.setCursorPos({ mode: 'insert', elementIndex: 0 });
      store.insertNote('c');
      
      // 降到重降
      store.makeFlat();
      store.makeFlat();
      
      // 第一次升号 -> 降号
      store.makeSharp();
      let score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(-1);
      
      // 第二次升号 -> 自然音
      store.makeSharp();
      score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(0);
    });
  });

  describe('alter 范围限制', () => {
    it('alter 应在 -2 到 2 之间', () => {
      const store = useVimlypondStore.getState();
      
      store.setCursorPos({ mode: 'insert', elementIndex: 0 });
      store.insertNote('c');
      
      // 连续升号
      store.makeSharp(); // alter = 1
      store.makeSharp(); // alter = 2
      store.makeSharp(); // 应无效，alter 仍为 2
      
      let score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[0].alter).toBe(2);
      
      // 换一个音符测试降号
      store.insertNote('d');
      store.setCursorPos({ mode: 'normal', elementIndex: 1 });
      
      store.makeFlat(); // alter = -1
      store.makeFlat(); // alter = -2
      store.makeFlat(); // 应无效，alter 仍为 -2
      
      score = useVimlypondStore.getState().score;
      expect(score.staves[0].measures[0].elements[1].alter).toBe(-2);
    });
  });
});
