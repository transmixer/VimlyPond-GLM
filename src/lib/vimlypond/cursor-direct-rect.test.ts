/**
 * ===========================================
 * Vimlypond 直接使用 NoteRect 测试
 * ===========================================
 *
 * 测试方案：直接使用 NoteRect 的坐标和尺寸来定位光标
 *
 * 原理：
 * - renderer.ts 已经使用 noteHeads[0].getBoundingBox() 获取了精确的音符头边界框
 * - NoteRect 包含的就是音符头的精确位置和尺寸
 * - 不需要重新计算，直接使用即可
 */

import { describe, it, expect } from 'vitest';

// 常量
const SVG_PADDING = 20;

interface NoteRectForTest {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CursorPositionForTest {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 直接从 NoteRect 计算光标位置
 */
function calculateCursorFromNoteRect(
  rect: NoteRectForTest,
  padding: number = 4
): CursorPositionForTest {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2
  };
}

describe('直接使用 NoteRect 定位光标', () => {
  describe('基础计算', () => {
    it('光标应该正确框选音符头', () => {
      const noteRect: NoteRectForTest = {
        x: 120,  // 已经加了 SVG_PADDING
        y: 65,   // 已经加了 SVG_PADDING
        width: 11, // VexFlow 返回的实际宽度
        height: 10 // VexFlow 返回的实际高度
      };

      const padding = 4;
      const cursor = calculateCursorFromNoteRect(noteRect, padding);

      // 光标左边界 = 音符头左边 - padding
      expect(cursor.x).toBe(116);

      // 光标上边界 = 音符头顶边 - padding
      expect(cursor.y).toBe(61);

      // 光标宽度 = 音符头宽度 + padding * 2
      expect(cursor.width).toBe(19);

      // 光标高度 = 音符头高度 + padding * 2
      expect(cursor.height).toBe(18);
    });

    it('光标中心应该与音符头中心对齐', () => {
      const noteRect: NoteRectForTest = {
        x: 120,
        y: 65,
        width: 11,
        height: 10
      };

      const padding = 4;
      const cursor = calculateCursorFromNoteRect(noteRect, padding);

      // 音符头中心
      const noteCenterX = noteRect.x + noteRect.width / 2;
      const noteCenterY = noteRect.y + noteRect.height / 2;

      // 光标中心
      const cursorCenterX = cursor.x + cursor.width / 2;
      const cursorCenterY = cursor.y + cursor.height / 2;

      // 中心应该完全对齐
      expect(cursorCenterX).toBe(noteCenterX);
      expect(cursorCenterY).toBe(noteCenterY);
    });
  });

  describe('与现有方案对比', () => {
    it('直接使用 NoteRect 应该比重新计算更准确', () => {
      // 假设 VexFlow 返回的原始边界框
      const rawBb = { x: 100, y: 45, w: 11, h: 10 };

      // NoteRect（加了 SVG_PADDING）
      const noteRect: NoteRectForTest = {
        x: rawBb.x + SVG_PADDING,
        y: rawBb.y + SVG_PADDING,
        width: rawBb.w,
        height: rawBb.h
      };

      const padding = 4;

      // 方案A：直接使用 NoteRect
      const directCursor = calculateCursorFromNoteRect(noteRect, padding);

      // 方案B：重新计算（现有逻辑）
      // 假设使用固定的 NOTE_HEAD_WIDTH = 14, NOTE_HEAD_HEIGHT = 12
      const NOTE_HEAD_WIDTH = 14;
      const NOTE_HEAD_HEIGHT = 12;
      const recalculatedCursor = {
        x: noteRect.x - SVG_PADDING - padding + SVG_PADDING, // 减去再加回 SVG_PADDING
        y: (rawBb.y + rawBb.h / 2 - NOTE_HEAD_HEIGHT / 2) + SVG_PADDING - padding,
        width: NOTE_HEAD_WIDTH + padding * 2,
        height: NOTE_HEAD_HEIGHT + padding * 2
      };

      // 比较中心位置
      const directCenterX = directCursor.x + directCursor.width / 2;
      const recalcCenterX = recalculatedCursor.x + recalculatedCursor.width / 2;

      // 直接使用 NoteRect 的中心应该等于实际音符头中心
      const actualNoteCenterX = noteRect.x + noteRect.width / 2;

      expect(directCenterX).toBe(actualNoteCenterX);

      // 重新计算的中心可能有偏差（因为使用了固定宽度）
      console.log(`直接方案中心X: ${directCenterX}`);
      console.log(`重算方案中心X: ${recalcCenterX}`);
      console.log(`实际音符头中心X: ${actualNoteCenterX}`);
    });
  });

  describe('边缘情况', () => {
    it('处理不同尺寸的音符头', () => {
      // 小音符头
      const smallRect: NoteRectForTest = { x: 100, y: 50, width: 8, height: 8 };
      const smallCursor = calculateCursorFromNoteRect(smallRect, 4);
      expect(smallCursor.width).toBe(16);
      expect(smallCursor.height).toBe(16);

      // 大音符头
      const largeRect: NoteRectForTest = { x: 100, y: 50, width: 15, height: 12 };
      const largeCursor = calculateCursorFromNoteRect(largeRect, 4);
      expect(largeCursor.width).toBe(23);
      expect(largeCursor.height).toBe(20);
    });

    it('处理不同 padding 值', () => {
      const rect: NoteRectForTest = { x: 100, y: 50, width: 11, height: 10 };

      const cursor2 = calculateCursorFromNoteRect(rect, 2);
      expect(cursor2.x).toBe(98);
      expect(cursor2.width).toBe(15);

      const cursor6 = calculateCursorFromNoteRect(rect, 6);
      expect(cursor6.x).toBe(94);
      expect(cursor6.width).toBe(23);
    });
  });

  describe('验证光标不压到音符头', () => {
    it('光标边界应该在音符头外部', () => {
      const noteRect: NoteRectForTest = {
        x: 120,
        y: 65,
        width: 11,
        height: 10
      };

      const padding = 4;
      const cursor = calculateCursorFromNoteRect(noteRect, padding);

      // 光标左边界应该在音符头左边界的左边
      expect(cursor.x).toBeLessThan(noteRect.x);

      // 光标上边界应该在音符头上边界的上边
      expect(cursor.y).toBeLessThan(noteRect.y);

      // 光标右边界应该在音符头右边界的右边
      expect(cursor.x + cursor.width).toBeGreaterThan(noteRect.x + noteRect.width);

      // 光标下边界应该在音符头下边界的下边
      expect(cursor.y + cursor.height).toBeGreaterThan(noteRect.y + noteRect.height);

      // 确保间距是 padding
      expect(noteRect.x - cursor.x).toBe(padding); // 左边距
      expect(noteRect.y - cursor.y).toBe(padding); // 上边距
    });
  });
});
