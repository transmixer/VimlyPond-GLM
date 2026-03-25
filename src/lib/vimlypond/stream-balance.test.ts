// 流式推拉平衡测试
// 设计原则：
// 1. 每个小节必须满时值（4拍）
// 2. 分割产生延音线，合并消除延音线
// 3. 推拉操作可逆

import { describe, it, expect } from 'bun:test';
import {
  balanceMeasures,
  splitNoteWithDuration,
  mergeTiedNotes,
} from './music';
import type { Note, Staff, Measure } from './types';

// 辅助函数：创建简单音符
function note(duration: number, midiPitch: number = 60): Note {
  return {
    type: 'note',
    midiPitch,
    duration,
    dots: 0,
    alter: 0,
    tieStart: false,
    tieEnd: false,
  };
}

// 辅助函数：创建带延音线的音符对
function tiedNotes(duration: number, midiPitch: number = 60): [Note, Note] {
  const first = note(duration, midiPitch);
  const second = note(duration, midiPitch);
  first.tieStart = true;
  second.tieEnd = true;
  return [first, second];
}

describe('splitNoteWithDuration', () => {
  it('分割二分音符为两个四分音符（带延音线）', () => {
    const halfNote = note(2); // 二分音符 = 2拍
    const [first, second] = splitNoteWithDuration(halfNote, 1); // 分割为各1拍

    expect(first.duration).toBe(4); // 四分音符
    expect(second.duration).toBe(4);
    expect(first.tieStart).toBe(true);
    expect(second.tieEnd).toBe(true);
    expect(first.midiPitch).toBe(second.midiPitch);
  });

  it('分割附点四分音符为四分+八分（带延音线）', () => {
    const dottedQuarter = note(4, 60);
    dottedQuarter.dots = 1; // 附点四分 = 1.5拍

    const [first, second] = splitNoteWithDuration(dottedQuarter, 1); // 分出1拍

    expect(first.duration).toBe(4); // 四分音符 = 1拍
    expect(first.dots).toBe(0);
    expect(first.tieStart).toBe(true);

    expect(second.duration).toBe(8); // 八分音符 = 0.5拍
    expect(second.dots).toBe(0);
    expect(second.tieEnd).toBe(true);
  });

  it('分割全音符为二分+二分（带延音线）', () => {
    const wholeNote = note(1); // 全音符 = 4拍
    const [first, second] = splitNoteWithDuration(wholeNote, 2); // 分出2拍

    expect(first.duration).toBe(2); // 二分音符
    expect(second.duration).toBe(2);
    expect(first.tieStart).toBe(true);
    expect(second.tieEnd).toBe(true);
  });
});

describe('mergeTiedNotes', () => {
  it('合并两个带延音线的四分音符为二分音符', () => {
    const [first, second] = tiedNotes(4); // 两个四分音符带延音线
    const merged = mergeTiedNotes(first, second);

    expect(merged.duration).toBe(2); // 二分音符
    expect(merged.tieStart).toBe(false);
    expect(merged.tieEnd).toBe(false);
  });

  it('合并四分+八分为附点四分', () => {
    const first = note(4);
    const second = note(8);
    first.tieStart = true;
    second.tieEnd = true;

    const merged = mergeTiedNotes(first, second);

    expect(merged.duration).toBe(4);
    expect(merged.dots).toBe(1); // 附点
    expect(merged.tieStart).toBe(false);
    expect(merged.tieEnd).toBe(false);
  });

  it('不同音高不能合并，返回 null', () => {
    const first = note(4, 60); // C4
    const second = note(4, 62); // D4
    first.tieStart = true;
    second.tieEnd = true;

    const merged = mergeTiedNotes(first, second);
    expect(merged).toBeNull();
  });

  it('没有延音线关系不能合并，返回 null', () => {
    const first = note(4);
    const second = note(4);
    // 没有 tieStart/tieEnd

    const merged = mergeTiedNotes(first, second);
    expect(merged).toBeNull();
  });
});

describe('balanceMeasures', () => {
  // 场景1：小节溢出，推完整音符到下一小节
  it('溢出时推完整音符到下一小节', () => {
    // 小节1：4.5拍（超0.5拍），小节2：空
    const staff: Staff = {
      clef: 'treble',
      measures: [
        {
          elements: [note(2), note(2), note(4)], // 2+2+1=5拍，超1拍
          durationUsed: 5,
        },
        {
          elements: [],
          durationUsed: 0,
        },
      ],
    };

    const result = balanceMeasures(staff, 0);

    // 小节1应该变成4拍
    expect(result.measures[0].durationUsed).toBe(4);
    expect(result.measures[0].elements).toHaveLength(2);

    // 小节2应该有1拍
    expect(result.measures[1].durationUsed).toBe(1);
    expect(result.measures[1].elements).toHaveLength(1);
    expect(result.measures[1].elements[0].duration).toBe(4); // 四分音符
  });

  // 场景2：小节不满，拉完整音符
  it('不满时从下一小节拉完整音符', () => {
    // 小节1：3拍，小节2：四分音符
    const staff: Staff = {
      clef: 'treble',
      measures: [
        {
          elements: [note(2), note(4)], // 2+1=3拍
          durationUsed: 3,
        },
        {
          elements: [note(4)], // 1拍
          durationUsed: 1,
        },
      ],
    };

    const result = balanceMeasures(staff, 0);

    // 小节1应该满4拍
    expect(result.measures[0].durationUsed).toBe(4);
    expect(result.measures[0].elements).toHaveLength(3);

    // 小节2应该变空
    expect(result.measures[1].durationUsed).toBe(0);
    expect(result.measures[1].elements).toHaveLength(0);
  });

  // 场景3：分割 + 添加延音线
  it('不满时分割下一个音符（产生延音线）', () => {
    // 小节1：3拍，小节2：二分音符（2拍）
    // 剩余1拍，需要分割二分音符
    const staff: Staff = {
      clef: 'treble',
      measures: [
        {
          elements: [note(2), note(4)], // 3拍
          durationUsed: 3,
        },
        {
          elements: [note(2, 64)], // 二分音符E4
          durationUsed: 2,
        },
      ],
    };

    const result = balanceMeasures(staff, 0);

    // 小节1应该满4拍
    expect(result.measures[0].durationUsed).toBe(4);
    expect(result.measures[0].elements).toHaveLength(3);

    // 最后一个元素应该是分割出来的四分音符，带 tieStart（延音线的开始）
    const lastInM1 = result.measures[0].elements[2] as Note;
    expect(lastInM1.duration).toBe(4);
    expect(lastInM1.tieStart).toBe(true);
    expect(lastInM1.midiPitch).toBe(64);

    // 小节2应该有1拍，是分割出来的四分音符，带 tieEnd（延音线的结束）
    expect(result.measures[1].durationUsed).toBe(1);
    const firstInM2 = result.measures[1].elements[0] as Note;
    expect(firstInM2.duration).toBe(4);
    expect(firstInM2.tieEnd).toBe(true);
    expect(firstInM2.midiPitch).toBe(64);
  });

  // 场景4：合并延音线音符
  it('不满时合并带延音线的音符（消除延音线）', () => {
    // 小节1：3拍，小节2开头是 tieEnd 的四分音符（与前一个音符有延音线）
    // 小节1末尾是 tieStart 的四分音符
    const [tiedFirst, tiedSecond] = tiedNotes(4, 60);

    const staff: Staff = {
      clef: 'treble',
      measures: [
        {
          elements: [note(2), tiedFirst], // 2+1=3拍，最后一个是 tieStart
          durationUsed: 3,
        },
        {
          elements: [tiedSecond, note(2)], // tieEnd + 二分
          durationUsed: 3,
        },
      ],
    };

    const result = balanceMeasures(staff, 0);

    // 小节1应该满4拍，但应该是合并后的二分音符
    expect(result.measures[0].durationUsed).toBe(4);
    const lastInM1 = result.measures[0].elements[1] as Note;
    expect(lastInM1.duration).toBe(2); // 合并后是二分音符
    expect(lastInM1.tieStart).toBe(false); // 延音线消除
    expect(lastInM1.tieEnd).toBe(false);
  });

  // 场景5：溢出时，当前音符是 tieEnd，需要先合并
  it('溢出时合并延音线音符再推', () => {
    // 小节1：4拍 + tieEnd四分，小节2：tieStart四分
    // 当前小节1有5拍需要推，但末尾是 tieEnd
    const [tiedFirst, tiedSecond] = tiedNotes(4, 60);

    const staff: Staff = {
      clef: 'treble',
      measures: [
        {
          elements: [note(2), note(2), tiedSecond], // 2+2+1=5拍，最后是 tieEnd
          durationUsed: 5,
        },
        {
          elements: [tiedFirst, note(4)], // tieStart + 四分
          durationUsed: 2,
        },
      ],
    };

    const result = balanceMeasures(staff, 0);

    // 小节1应该满4拍
    expect(result.measures[0].durationUsed).toBe(4);

    // 小节2开头的延音线应该被消除（合并了）
    const firstInM2 = result.measures[1].elements[0] as Note;
    expect(firstInM2.tieStart).toBe(false);
    expect(firstInM2.tieEnd).toBe(false);
  });

  // 场景6：连锁推拉
  it('连锁推：多个小节依次溢出', () => {
    // 小节1：5拍，小节2：5拍，小节3：空
    const staff: Staff = {
      clef: 'treble',
      measures: [
        { elements: [note(2), note(2), note(4)], durationUsed: 5 },
        { elements: [note(2), note(2), note(4)], durationUsed: 5 },
        { elements: [], durationUsed: 0 },
      ],
    };

    const result = balanceMeasures(staff, 0);

    expect(result.measures[0].durationUsed).toBe(4);
    expect(result.measures[1].durationUsed).toBe(4);
    expect(result.measures[2].durationUsed).toBe(2);
  });

  // 场景7：最后一个小节不满，填休止符
  it('最后一个小节不满时填入休止符', () => {
    const staff: Staff = {
      clef: 'treble',
      measures: [
        { elements: [note(2)], durationUsed: 2 },
      ],
    };

    const result = balanceMeasures(staff, 0, { fillRestOnFinal: true });

    expect(result.measures[0].durationUsed).toBe(4);
    expect(result.measures[0].elements).toHaveLength(2);
    expect(result.measures[0].elements[1].type).toBe('rest');
    expect(result.measures[0].elements[1].duration).toBe(2); // 二分休止符
  });
});
