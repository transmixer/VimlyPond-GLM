/**
 * ===========================================
 * Vimlypond 光标框选测试
 * ===========================================
 *
 * 测试普通模式下光标是否正确框选音符头
 *
 * 问题背景：
 * - 用户反馈光标位置偏右下，已经压到符头
 * - 需要验证光标定位逻辑是否正确
 */

import { describe, it, expect } from 'vitest';
import {
  calculateNoteHeadPosition,
  calculateCursorPosition,
  isCursorCorrectlyFraming,
  NOTE_HEAD_WIDTH,
  NOTE_HEAD_HEIGHT,
  SVG_PADDING,
  STAVE_Y_OFFSET,
  STAVE_HEIGHT,
  type BoundingBox,
  type NoteHeadPosition
} from './renderer';

describe('光标框选音符头测试', () => {
  /**
   * 模拟真实场景：
   * - VexFlow 返回音符头的边界框
   * - 我们需要计算出正确的光标位置
   */

  describe('NoteRect 数据流程', () => {
    it('NoteRect 存储的是音符头实际位置（已加 SVG_PADDING）', () => {
      // renderer.ts 中：
      // noteHeadX = rawX + SVG_PADDING;
      // noteHeadY = rawY + SVG_PADDING;
      // noteRects.push({ x: noteHeadX, y: noteHeadY, ... });

      const rawX = 100; // VexFlow 返回的原始 X
      const rawY = 45;  // VexFlow 返回的原始 Y

      const storedX = rawX + SVG_PADDING;
      const storedY = rawY + SVG_PADDING;

      // NoteRect 中存储的坐标
      expect(storedX).toBe(120); // 100 + 20
      expect(storedY).toBe(65);  // 45 + 20
    });
  });

  describe('VimlypondEditor 光标计算流程', () => {
    it('从 NoteRect 计算 BoundingBox 时应该减去 SVG_PADDING', () => {
      // VimlypondEditor.tsx 中：
      // const bb: BoundingBox = {
      //   x: rect.x - SVG_PADDING,
      //   y: rect.y - SVG_PADDING,
      //   ...
      // };

      const noteRect = {
        x: 120, // 已加 SVG_PADDING
        y: 65,
        width: 11,
        height: 10
      };

      const bb: BoundingBox = {
        x: noteRect.x - SVG_PADDING,
        y: noteRect.y - SVG_PADDING,
        w: noteRect.width,
        h: noteRect.height
      };

      // 应该还原为 VexFlow 原始坐标
      expect(bb.x).toBe(100);
      expect(bb.y).toBe(45);
    });

    it('最终光标位置应该加回 SVG_PADDING', () => {
      // VimlypondEditor.tsx 中：
      // cursor.style.left = `${cursorPos_result.x + SVG_PADDING}px`;

      const calculatedX = 96; // 计算出的光标 X（相对于 SVG 内容区域）
      const finalLeft = calculatedX + SVG_PADDING;

      expect(finalLeft).toBe(116); // 应该与 NoteRect 同一坐标系
    });
  });

  describe('calculateNoteHeadPosition 核心逻辑', () => {
    it('对于无符干的音符，应该使用边界框中心', () => {
      // 短音符（如二分音符、全音符）通常没有符干
      const bb: BoundingBox = {
        x: 100,
        y: 45,  // 音符头顶部
        w: 11,
        h: 10   // 只有音符头高度
      };

      const staveY = 25; // 五线谱顶部
      const noteHead = calculateNoteHeadPosition(bb, staveY);

      // 音符头中心 Y = bb.y + bb.h / 2
      // 音符头顶部 Y = 中心 - 高度/2
      const expectedCenterY = 45 + 10 / 2; // 50
      const expectedTopY = expectedCenterY - NOTE_HEAD_HEIGHT / 2; // 50 - 6 = 44

      expect(noteHead.centerY).toBe(expectedCenterY);
      expect(noteHead.y).toBe(expectedTopY);
    });

    it('对于有符干的音符，音符头应该在边界框底部', () => {
      // 符干向上的四分音符
      const bb: BoundingBox = {
        x: 100,
        y: 15,   // 符干顶端
        w: 11,
        h: 40    // 从符干顶端到音符头底部
      };

      const staveY = 25;
      const noteHead = calculateNoteHeadPosition(bb, staveY);

      // 音符头应该在边界框底部附近
      // 代码中：noteHeadCenterY = bb.y + bb.h - NOTE_HEAD_HEIGHT / 2 - 5
      const expectedCenterY = 15 + 40 - 6 - 5; // 44
      const expectedTopY = expectedCenterY - NOTE_HEAD_HEIGHT / 2; // 44 - 6 = 38

      expect(noteHead.centerY).toBe(expectedCenterY);
      expect(noteHead.y).toBe(expectedTopY);
    });

    it('音符头 X 坐标应该等于边界框 X', () => {
      const bb: BoundingBox = {
        x: 100,
        y: 45,
        w: 11,
        h: 10
      };

      const noteHead = calculateNoteHeadPosition(bb, 25);

      // X 坐标应该直接使用边界框的 X
      expect(noteHead.x).toBe(100);
      expect(noteHead.centerX).toBe(100 + NOTE_HEAD_WIDTH / 2); // 107
    });
  });

  describe('calculateCursorPosition 核心逻辑', () => {
    it('光标应该正确框选音符头', () => {
      const noteHead: NoteHeadPosition = {
        x: 100,
        y: 44,
        width: NOTE_HEAD_WIDTH,
        height: NOTE_HEAD_HEIGHT,
        centerX: 107,
        centerY: 50
      };

      const padding = 4;
      const cursor = calculateCursorPosition(noteHead, padding);

      // 光标应该在音符头周围，各边距离 padding
      expect(cursor.x).toBe(100 - padding);      // 96
      expect(cursor.y).toBe(44 - padding);       // 40
      expect(cursor.width).toBe(14 + padding * 2); // 22
      expect(cursor.height).toBe(12 + padding * 2); // 20
    });

    it('光标中心应该与音符头中心对齐', () => {
      const noteHead: NoteHeadPosition = {
        x: 100,
        y: 44,
        width: NOTE_HEAD_WIDTH,
        height: NOTE_HEAD_HEIGHT,
        centerX: 107,
        centerY: 50
      };

      const padding = 4;
      const cursor = calculateCursorPosition(noteHead, padding);

      const cursorCenterX = cursor.x + cursor.width / 2;
      const cursorCenterY = cursor.y + cursor.height / 2;

      expect(cursorCenterX).toBe(noteHead.centerX);
      expect(cursorCenterY).toBe(noteHead.centerY);
    });
  });

  describe('isCursorCorrectlyFraming 验证函数', () => {
    it('正确框选时应该通过验证', () => {
      const noteHead: NoteHeadPosition = {
        x: 100,
        y: 44,
        width: NOTE_HEAD_WIDTH,
        height: NOTE_HEAD_HEIGHT,
        centerX: 107,
        centerY: 50
      };

      const padding = 4;
      const cursor = calculateCursorPosition(noteHead, padding);

      const result = isCursorCorrectlyFraming(cursor, noteHead, padding);

      expect(result.correct).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('光标偏右时应该失败', () => {
      const noteHead: NoteHeadPosition = {
        x: 100,
        y: 44,
        width: NOTE_HEAD_WIDTH,
        height: NOTE_HEAD_HEIGHT,
        centerX: 107,
        centerY: 50
      };

      const cursor = {
        x: 105, // 偏右 5px
        y: 40,
        width: 22,
        height: 20
      };

      const result = isCursorCorrectlyFraming(cursor, noteHead, 4);

      expect(result.correct).toBe(false);
      expect(result.errors.some(e => e.includes('左边界'))).toBe(true);
    });

    it('光标偏下时应该失败', () => {
      const noteHead: NoteHeadPosition = {
        x: 100,
        y: 44,
        width: NOTE_HEAD_WIDTH,
        height: NOTE_HEAD_HEIGHT,
        centerX: 107,
        centerY: 50
      };

      const cursor = {
        x: 96,
        y: 50, // 偏下 10px
        width: 22,
        height: 20
      };

      const result = isCursorCorrectlyFraming(cursor, noteHead, 4);

      expect(result.correct).toBe(false);
      expect(result.errors.some(e => e.includes('上边界'))).toBe(true);
    });
  });

  describe('端到端光标定位测试', () => {
    it('完整流程：从 VexFlow 边界框到光标位置', () => {
      // 模拟 VexFlow 返回的音符头边界框
      const vexflowBoundingBox: BoundingBox = {
        x: 100,  // VexFlow 原始坐标
        y: 45,
        w: 11,
        h: 10
      };

      // 模拟存储为 NoteRect（加 SVG_PADDING）
      const noteRect = {
        x: vexflowBoundingBox.x + SVG_PADDING, // 120
        y: vexflowBoundingBox.y + SVG_PADDING, // 65
        width: vexflowBoundingBox.w,
        height: vexflowBoundingBox.h
      };

      // 模拟 VimlypondEditor 中的处理流程
      const staveY = 0 * STAVE_HEIGHT + STAVE_Y_OFFSET; // 25

      // 步骤1：将 NoteRect 转换为 BoundingBox
      const bb: BoundingBox = {
        x: noteRect.x - SVG_PADDING, // 100
        y: noteRect.y - SVG_PADDING, // 45
        w: noteRect.width,
        h: noteRect.height
      };

      // 步骤2：计算音符头位置
      const noteHead = calculateNoteHeadPosition(bb, staveY);

      // 步骤3：计算光标位置
      const padding = 4;
      const cursorPos = calculateCursorPosition(noteHead, padding);

      // 步骤4：加回 SVG_PADDING 得到最终光标位置
      const finalCursorX = cursorPos.x + SVG_PADDING;
      const finalCursorY = cursorPos.y + SVG_PADDING;

      // 验证：最终光标应该在正确的位置
      // 光标应该框选音符头，而不是压到音符头

      // 使用 isCursorCorrectlyFraming 验证（注意坐标系）
      // noteHead 在 VexFlow 坐标系，cursorPos 也在 VexFlow 坐标系
      const result = isCursorCorrectlyFraming(cursorPos, noteHead, padding);

      expect(result.correct).toBe(true);

      // 最终光标的中心应该与音符头中心对齐
      const finalCursorCenterX = finalCursorX + cursorPos.width / 2;
      const finalCursorCenterY = finalCursorY + cursorPos.height / 2;
      const noteHeadCenterX = noteHead.centerX + SVG_PADDING;
      const noteHeadCenterY = noteHead.centerY + SVG_PADDING;

      expect(finalCursorCenterX).toBeCloseTo(noteHeadCenterX, 0.5);
      expect(finalCursorCenterY).toBeCloseTo(noteHeadCenterY, 0.5);
    });

    it('有符干音符的完整流程', () => {
      // 模拟 VexFlow 返回的四分音符边界框（有符干）
      const vexflowBoundingBox: BoundingBox = {
        x: 100,
        y: 15,   // 符干顶端
        w: 11,
        h: 40    // 包含符干
      };

      const noteRect = {
        x: vexflowBoundingBox.x + SVG_PADDING,
        y: vexflowBoundingBox.y + SVG_PADDING,
        width: vexflowBoundingBox.w,
        height: vexflowBoundingBox.h
      };

      const staveY = 25;

      const bb: BoundingBox = {
        x: noteRect.x - SVG_PADDING,
        y: noteRect.y - SVG_PADDING,
        w: noteRect.width,
        h: noteRect.height
      };

      const noteHead = calculateNoteHeadPosition(bb, staveY);
      const padding = 4;
      const cursorPos = calculateCursorPosition(noteHead, padding);

      // 验证光标位置正确
      const result = isCursorCorrectlyFraming(cursorPos, noteHead, padding);

      // 即使有符干，光标也应该正确框选音符头
      expect(result.correct).toBe(true);

      // 光标 Y 不应该太靠上（不应该包含符干）
      // 音符头中心应该在五线谱中心附近（约 45-55 范围）
      expect(noteHead.centerY).toBeGreaterThan(staveY);
      expect(noteHead.centerY).toBeLessThan(staveY + 60);
    });
  });

  describe('问题诊断：光标偏右下', () => {
    it('检查 noteHead.x 计算是否正确', () => {
      // 假设 VexFlow 返回的边界框 x = 100
      // noteHead.x 应该等于 100

      const bb: BoundingBox = { x: 100, y: 45, w: 11, h: 10 };
      const noteHead = calculateNoteHeadPosition(bb, 25);

      // 问题：代码中 noteHead.x = bb.x
      // 但 noteHead.width 被固定为 NOTE_HEAD_WIDTH = 14
      // 如果 bb.w = 11，而我们使用 width = 14，会导致 centerX 计算偏差

      // centerX = x + width / 2 = 100 + 7 = 107
      // 但实际音符头中心应该是 100 + 11/2 = 105.5
      const actualCenterX = bb.x + bb.w / 2;
      const calculatedCenterX = noteHead.centerX;

      // 这个差异可能导致光标偏右
      // 如果我们期望光标居中于实际音符头，而不是我们假设的宽度
      console.log(`实际中心: ${actualCenterX}, 计算中心: ${calculatedCenterX}`);
    });

    it('检查 noteHead.y 计算是否正确', () => {
      // 无符干情况
      const bb: BoundingBox = { x: 100, y: 45, w: 11, h: 10 };
      const noteHead = calculateNoteHeadPosition(bb, 25);

      // 代码中：
      // noteHeadCenterY = bb.y + bb.h / 2 = 45 + 5 = 50
      // noteHead.y = noteHeadCenterY - NOTE_HEAD_HEIGHT / 2 = 50 - 6 = 44

      // 但实际音符头 y = 45, height = 10
      // 实际中心 = 45 + 10/2 = 50
      // 这看起来是对的

      expect(noteHead.centerY).toBe(50);
      expect(noteHead.y).toBe(44);
    });

    it('假设 VexFlow 边界框准确，验证光标定位', () => {
      // 如果 VexFlow 的边界框就是音符头的精确位置
      // 那么我们应该直接使用它，而不是重新计算

      const bb: BoundingBox = { x: 100, y: 45, w: 11, h: 10 };

      // 方案A：直接使用边界框
      const directCursor = {
        x: bb.x - 4,
        y: bb.y - 4,
        width: bb.w + 8,
        height: bb.h + 8
      };

      // 方案B：使用 calculateNoteHeadPosition
      const noteHead = calculateNoteHeadPosition(bb, 25);
      const calculatedCursor = calculateCursorPosition(noteHead, 4);

      // 比较两种方案
      console.log('方案A（直接）:', directCursor);
      console.log('方案B（计算）:', calculatedCursor);

      // 两种方案的差异
      const deltaX = calculatedCursor.x - directCursor.x;
      const deltaY = calculatedCursor.y - directCursor.y;

      console.log(`X差异: ${deltaX}, Y差异: ${deltaY}`);

      // 如果差异很大，说明计算逻辑有问题
    });
  });
});
