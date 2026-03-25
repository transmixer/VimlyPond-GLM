/**
 * ===========================================
 * 流式推拉测试 (Stream Push/Pull)
 * ===========================================
 * 
 * 设计目标：流畅打谱体验
 * 
 * 核心原则：
 * - 输入音符：满小节时自动推到下一小节（像打字换行）
 * - 删除音符：后续音符立即前移填补（像 Backspace）
 * 
 * 类比文本编辑器：输入时字符向右推，删除时字符向左拉。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useVimlypondStore } from './store';
import { BEATS_PER_MEASURE } from './music';

describe('==========================================', () => {
  describe('流式推拉测试 (Stream Push/Pull)', () => {
    // 创建一个 4/4 拍的满小节
    const createFullMeasure = () => ({
      elements: [
        { type: 'note' as const, midiPitch: 60, duration: 4, dots: 0, alter: 0 as const },  // C4 四分音符
        { type: 'note' as const, midiPitch: 62, duration: 4, dots: 0, alter: 0 as const },  // D4 四分音符
        { type: 'note' as const, midiPitch: 64, duration: 4, dots: 0, alter: 0 as const },  // E4 四分音符
        { type: 'note' as const, midiPitch: 65, duration: 4, dots: 0, alter: 0 as const },  // F4 四分音符
      ],
      durationUsed: BEATS_PER_MEASURE  // 4拍
    });

    // 创建一个有 3 个四分音符的小节（剩余 1 拍空间）
    const createPartialMeasure = () => ({
      elements: [
        { type: 'note' as const, midiPitch: 60, duration: 4, dots: 0, alter: 0 as const },
        { type: 'note' as const, midiPitch: 62, duration: 4, dots: 0, alter: 0 as const },
        { type: 'note' as const, midiPitch: 64, duration: 4, dots: 0, alter: 0 as const },
      ],
      durationUsed: 3
    });

    // 创建一个空小节
    const createEmptyMeasure = () => ({
      elements: [],
      durationUsed: 0
    });

    // 默认的输入状态
    const defaultInputState = {
      pendingNote: null,
      lastDuration: 4,  // 四分音符
      lastDots: 0
    };

    beforeEach(() => {
      useVimlypondStore.setState({
        cursorPos: {
          staffIndex: 0,
          measureIndex: 0,
          elementIndex: 0,
          mode: 'normal'
        },
        inputState: defaultInputState
      });
    });

    describe('输入音符：满小节推到下一小节', () => {
      it('满小节后输入四分音符：新音符被推到下一小节', () => {
        const store = useVimlypondStore.getState();
        useVimlypondStore.setState({
          score: {
            ...store.score,
            staves: [{
              ...store.score.staves[0],
              measures: [
                createFullMeasure(),  // 第1小节：满（4个四分音符 C D E F）
                createEmptyMeasure(), // 第2小节：空
              ]
            }]
          },
          cursorPos: {
            staffIndex: 0,
            measureIndex: 0,
            elementIndex: 4,  // 在小节末尾
            mode: 'insert' as const,
            append: true
          },
          inputState: defaultInputState
        });

        // 输入一个四分音符 G
        useVimlypondStore.getState().insertNote('g');

        const newScore = useVimlypondStore.getState().score;
        const measure1 = newScore.staves[0].measures[0];
        const measure2 = newScore.staves[0].measures[1];

        // 推的逻辑：
        // 1. 插入 G 后：[C, D, E, F, G], durationUsed = 5
        // 2. 推：因为 5 > 4，把最后一个 G 推走
        // 3. 推后：[C, D, E, F], durationUsed = 4
        // 4. 第2小节收到 G
        
        expect(measure1.elements.length).toBe(4);
        expect(measure1.durationUsed).toBe(4);
        expect(measure2.elements.length).toBe(1);
        expect(measure2.durationUsed).toBe(1);
        // G 的 MIDI pitch 是 67，67 % 12 = 7
        expect((measure2.elements[0] as { midiPitch: number }).midiPitch % 12).toBe(7); // G
      });

      it('满小节后输入二分音符：新音符的一部分被推到下一小节', () => {
        const store = useVimlypondStore.getState();
        useVimlypondStore.setState({
          score: {
            ...store.score,
            staves: [{
              ...store.score.staves[0],
              measures: [
                createFullMeasure(),  // 第1小节：满（4个四分音符 = 4拍）
                createEmptyMeasure(), // 第2小节：空
              ]
            }]
          },
          cursorPos: {
            staffIndex: 0,
            measureIndex: 0,
            elementIndex: 4,
            mode: 'insert' as const,
            append: true
          },
          inputState: {
            pendingNote: null,
            lastDuration: 2,  // 二分音符 = 2拍
            lastDots: 0
          }
        });

        // 输入一个二分音符（2拍）
        useVimlypondStore.getState().insertNote('g');

        const newScore = useVimlypondStore.getState().score;
        const measure1 = newScore.staves[0].measures[0];
        const measure2 = newScore.staves[0].measures[1];

        // 推的逻辑：
        // 1. 插入 G（二分，2拍）后：[C, D, E, F, G(2拍)], durationUsed = 6
        // 2. 推：因为 6 > 4，把 G 推走
        // 3. 推后：[C, D, E, F], durationUsed = 4
        // 4. 第2小节收到 G
        
        // 实际上：第1小节还是 4 个四分音符，第2小节收到 G（二分）
        expect(measure1.elements.length).toBe(4);
        expect(measure1.durationUsed).toBe(4);
        expect(measure2.elements.length).toBe(1);
        expect(measure2.durationUsed).toBe(2);
      });

      it('连锁推：第2小节也满时，继续推到第3小节', () => {
        const store = useVimlypondStore.getState();
        useVimlypondStore.setState({
          score: {
            ...store.score,
            staves: [{
              ...store.score.staves[0],
              measures: [
                createFullMeasure(),  // 第1小节：满
                createFullMeasure(),  // 第2小节：满
                createEmptyMeasure(), // 第3小节：空
              ]
            }]
          },
          cursorPos: {
            staffIndex: 0,
            measureIndex: 0,
            elementIndex: 4,
            mode: 'insert' as const,
            append: true
          },
          inputState: defaultInputState
        });

        useVimlypondStore.getState().insertNote('g');

        const newScore = useVimlypondStore.getState().score;
        const measure1 = newScore.staves[0].measures[0];
        const measure2 = newScore.staves[0].measures[1];
        const measure3 = newScore.staves[0].measures[2];

        // 连锁推：
        // 1. 第1小节插入 G，满了，把 G 推到第2小节
        // 2. 第2小节现在有 5 个音符，满了，把最后一个推到第3小节
        
        expect(measure1.elements.length).toBe(4);
        expect(measure2.elements.length).toBe(4);
        expect(measure3.elements.length).toBe(1);
      });

      it('最后小节满时：自动创建新小节', () => {
        const store = useVimlypondStore.getState();
        useVimlypondStore.setState({
          score: {
            ...store.score,
            staves: [{
              ...store.score.staves[0],
              measures: [
                createFullMeasure(),  // 唯一的小节，满了
              ]
            }]
          },
          cursorPos: {
            staffIndex: 0,
            measureIndex: 0,
            elementIndex: 4,
            mode: 'insert' as const,
            append: true
          },
          inputState: defaultInputState
        });

        useVimlypondStore.getState().insertNote('g');

        const newScore = useVimlypondStore.getState().score;
        
        // 应该自动创建新小节
        expect(newScore.staves[0].measures.length).toBe(2);
        expect(newScore.staves[0].measures[1].elements.length).toBe(1);
      });
    });

    describe('删除音符：后续音符前移填补', () => {
      it('删除音符后：下一小节的音符移过来填补', () => {
        const store = useVimlypondStore.getState();
        useVimlypondStore.setState({
          score: {
            ...store.score,
            staves: [{
              ...store.score.staves[0],
              measures: [
                createFullMeasure(),  // 第1小节：满（4个四分音符）
                createPartialMeasure(), // 第2小节：3个四分音符
              ]
            }]
          },
          cursorPos: {
            staffIndex: 0,
            measureIndex: 0,
            elementIndex: 0,  // 选中第一个音符
            mode: 'normal' as const
          }
        });

        // 删除第一个音符
        useVimlypondStore.getState().deleteElement();

        const newScore = useVimlypondStore.getState().score;
        const measure1 = newScore.staves[0].measures[0];
        const measure2 = newScore.staves[0].measures[1];

        // 删除 C 后，第1小节只有 3 个音符（D E F）
        // 第2小节的第一个音符应该移过来填补
        // 结果：第1小节恢复 4 个音符，第2小节剩 2 个
        
        expect(measure1.elements.length).toBe(4);
        expect(measure2.elements.length).toBe(2);
        expect(measure1.durationUsed).toBe(4);
      });

      it('连锁拉：第2小节空后，从第3小节拉音符', () => {
        const store = useVimlypondStore.getState();
        useVimlypondStore.setState({
          score: {
            ...store.score,
            staves: [{
              ...store.score.staves[0],
              measures: [
                createFullMeasure(),   // 第1小节：满
                createPartialMeasure(), // 第2小节：3个
                createPartialMeasure(), // 第3小节：3个
              ]
            }]
          },
          cursorPos: {
            staffIndex: 0,
            measureIndex: 0,
            elementIndex: 0,
            mode: 'normal' as const
          }
        });

        // 连续删除两个音符
        useVimlypondStore.getState().deleteElement();
        useVimlypondStore.getState().deleteElement();

        const newScore = useVimlypondStore.getState().score;
        const measure1 = newScore.staves[0].measures[0];
        const measure2 = newScore.staves[0].measures[1];
        const measure3 = newScore.staves[0].measures[2];

        // 删除两个音符后：
        // 第1小节应该还是满的（从第2、3小节拉过来）
        // 第2小节可能变少
        // 第3小节也变少
        
        expect(measure1.durationUsed).toBe(4);  // 始终保持满
      });

      it('删除后所有小节都空：保留空小节', () => {
        const store = useVimlypondStore.getState();
        useVimlypondStore.setState({
          score: {
            ...store.score,
            staves: [{
              ...store.score.staves[0],
              measures: [
                {
                  elements: [
                    { type: 'note' as const, midiPitch: 60, duration: 4, dots: 0, alter: 0 as const },
                  ],
                  durationUsed: 1
                }
              ]
            }]
          },
          cursorPos: {
            staffIndex: 0,
            measureIndex: 0,
            elementIndex: 0,
            mode: 'normal' as const
          }
        });

        useVimlypondStore.getState().deleteElement();

        const newScore = useVimlypondStore.getState().score;
        const measure1 = newScore.staves[0].measures[0];

        expect(measure1.elements.length).toBe(0);
        expect(measure1.durationUsed).toBe(0);
      });
    });

    describe('非最后小节的输入', () => {
      it('非最后小节有空间：正常插入', () => {
        const store = useVimlypondStore.getState();
        useVimlypondStore.setState({
          score: {
            ...store.score,
            staves: [{
              ...store.score.staves[0],
              measures: [
                createPartialMeasure(), // 3个四分音符，剩1拍
                createEmptyMeasure(),
              ]
            }]
          },
          cursorPos: {
            staffIndex: 0,
            measureIndex: 0,
            elementIndex: 3,
            mode: 'insert' as const,
            append: true
          },
          inputState: defaultInputState
        });

        useVimlypondStore.getState().insertNote('g');

        const newScore = useVimlypondStore.getState().score;
        const measure1 = newScore.staves[0].measures[0];

        // 第1小节应该有 4 个音符
        expect(measure1.elements.length).toBe(4);
        expect(measure1.durationUsed).toBe(4);
      });

      it('非最后小节刚满：输入触发推音符', () => {
        const store = useVimlypondStore.getState();
        useVimlypondStore.setState({
          score: {
            ...store.score,
            staves: [{
              ...store.score.staves[0],
              measures: [
                createFullMeasure(),  // 满
                createEmptyMeasure(),
              ]
            }]
          },
          cursorPos: {
            staffIndex: 0,
            measureIndex: 0,
            elementIndex: 2,  // 在第3个音符位置
            mode: 'insert' as const,
            append: false  // 前插
          },
          inputState: defaultInputState
        });

        // 在第3个位置前插一个音符
        useVimlypondStore.getState().insertNote('g');

        const newScore = useVimlypondStore.getState().score;
        const measure1 = newScore.staves[0].measures[0];
        const measure2 = newScore.staves[0].measures[1];

        // 满小节前插，最后一个音符应该被推走
        expect(measure1.elements.length).toBe(4);
        expect(measure2.elements.length).toBe(1);
      });
    });
  });
});
