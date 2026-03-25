// 流式推拉性能测试
import { describe, test, expect } from 'bun:test';
import {
  createEmptyMeasure,
  createEmptyStaff,
  createNote,
  pitchToMidi,
  durationValue,
  pushOverflowToNextMeasure,
  pullNotesFromNextMeasure,
  BEATS_PER_MEASURE
} from './music';
import type { Staff, Measure } from './types';

// 创建满小节
function createFullMeasure(): Measure {
  return {
    elements: [
      createNote(pitchToMidi('c', 4), 4, 0), // 全音符
    ],
    durationUsed: BEATS_PER_MEASURE
  };
}

// 创建指定小节数的谱表
function createStaffWithMeasures(measureCount: number, full: boolean = true): Staff {
  const measures: Measure[] = [];
  for (let i = 0; i < measureCount; i++) {
    measures.push(full ? createFullMeasure() : createEmptyMeasure());
  }
  return { clef: 'treble', measures };
}

describe('流式推拉性能测试', () => {
  test('小规模 (100小节) - 典型短作品', () => {
    const staff = createStaffWithMeasures(100);
    
    const start = performance.now();
    const result = pushOverflowToNextMeasure(staff);
    const duration = performance.now() - start;
    
    console.log(`100小节 pushOverflow: ${duration.toFixed(3)}ms`);
    expect(duration).toBeLessThan(5); // 应该 < 5ms
  });

  test('中规模 (300小节) - 典型奏鸣曲乐章', () => {
    const staff = createStaffWithMeasures(300);
    
    const start = performance.now();
    const result = pushOverflowToNextMeasure(staff);
    const duration = performance.now() - start;
    
    console.log(`300小节 pushOverflow: ${duration.toFixed(3)}ms`);
    expect(duration).toBeLessThan(15); // 应该 < 15ms
  });

  test('大规模 (600小节) - 完整奏鸣曲', () => {
    const staff = createStaffWithMeasures(600);
    
    const start = performance.now();
    const result = pushOverflowToNextMeasure(staff);
    const duration = performance.now() - start;
    
    console.log(`600小节 pushOverflow: ${duration.toFixed(3)}ms`);
    expect(duration).toBeLessThan(30); // 应该 < 30ms
  });

  test('极端规模 (1200小节) - 大型作品', () => {
    const staff = createStaffWithMeasures(1200);
    
    const start = performance.now();
    const result = pushOverflowToNextMeasure(staff);
    const duration = performance.now() - start;
    
    console.log(`1200小节 pushOverflow: ${duration.toFixed(3)}ms`);
    expect(duration).toBeLessThan(60); // 应该 < 60ms
  });

  test('连锁推：在开头插入导致所有小节移动', () => {
    // 创建一个不满的小节在开头，后面跟着满小节
    const measures: Measure[] = [
      { elements: [], durationUsed: 0 }, // 空小节
    ];
    for (let i = 0; i < 300; i++) {
      measures.push(createFullMeasure());
    }
    
    // 在第一个空小节插入一个全音符
    measures[0].elements = [createNote(pitchToMidi('c', 4), 4, 0)];
    measures[0].durationUsed = 4;
    
    const staff: Staff = { clef: 'treble', measures };
    
    const start = performance.now();
    const result = pushOverflowToNextMeasure(staff);
    const duration = performance.now() - start;
    
    console.log(`连锁推 300小节: ${duration.toFixed(3)}ms`);
    
    // 验证结果：每个小节应该还是满的
    expect(result.measures[0].elements.length).toBe(1);
    
    // 性能要求：连锁推应该在合理时间内完成
    expect(duration).toBeLessThan(50);
  });

  test('拉操作性能 (300小节)', () => {
    const staff = createStaffWithMeasures(300, false); // 空小节
    
    const start = performance.now();
    const result = pullNotesFromNextMeasure(staff);
    const duration = performance.now() - start;
    
    console.log(`300小节 pullNotes: ${duration.toFixed(3)}ms`);
    expect(duration).toBeLessThan(10);
  });

  test('混合操作：插入+推送+渲染模拟', () => {
    const staff = createStaffWithMeasures(300);
    
    // 模拟用户连续输入
    const iterations = 10;
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      // 插入一个音符到第一个小节
      const newMeasures = [...staff.measures];
      newMeasures[0] = {
        elements: [...newMeasures[0].elements, createNote(pitchToMidi('d', 4), 4, 0)],
        durationUsed: newMeasures[0].durationUsed + 4
      };
      
      const tempStaff: Staff = { ...staff, measures: newMeasures };
      pushOverflowToNextMeasure(tempStaff);
    }
    
    const duration = performance.now() - start;
    console.log(`10次插入操作 (300小节): ${duration.toFixed(3)}ms, 平均 ${(duration/iterations).toFixed(3)}ms/次`);
    
    expect(duration / iterations).toBeLessThan(20); // 每次操作 < 20ms
  });
});

describe('性能边界分析', () => {
  test('分析卡顿阈值', () => {
    // 16ms 是 60fps 的一帧时间
    // 如果操作超过 16ms，用户可能感觉到卡顿
    const threshold16ms = 100; // 小节数
    const threshold33ms = 400; // 约 30fps
    const threshold100ms = 800; // 用户开始明显感知
    
    const results: { measures: number; duration: number }[] = [];
    
    for (const count of [50, 100, 200, 400, 800, 1200]) {
      const staff = createStaffWithMeasures(count);
      const start = performance.now();
      pushOverflowToNextMeasure(staff);
      const duration = performance.now() - start;
      results.push({ measures: count, duration });
    }
    
    console.log('\n性能基准:');
    console.log('小节数\t耗时\t状态');
    console.log('─'.repeat(40));
    
    for (const r of results) {
      let status = '✓ 流畅';
      if (r.duration > 100) status = '✗ 卡顿';
      else if (r.duration > 33) status = '⚠ 轻微延迟';
      else if (r.duration > 16) status = '○ 可接受';
      
      console.log(`${r.measures}\t${r.duration.toFixed(2)}ms\t${status}`);
    }
  });
});
