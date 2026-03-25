/**
 * ===========================================
 * 光标渲染位置测试
 * ===========================================
 * 
 * 测试光标是否能正确框选音符头
 * 
 * 核心问题：给定 VexFlow 边界框，计算出的光标位置是否正确框选音符头？
 */

import { describe, it, expect } from 'vitest';
import {
  calculateNoteHeadPosition,
  calculateCursorPosition,
  calculateInsertCursorY,
  calculateStaveLineY,
  isCursorCorrectlyFraming,
  NOTE_HEAD_WIDTH,
  NOTE_HEAD_HEIGHT,
  STAVE_HEIGHT,
  STAVE_Y_OFFSET,
  SVG_PADDING,
  INSERT_CURSOR_HEIGHT,
  VEXFLOW_STAVE_LINE_OFFSET,
  type BoundingBox,
  type NoteHeadPosition,
  type CursorPosition
} from './renderer';

describe('==========================================', () => {
  describe('光标渲染位置测试', () => {
    const staveY = 25; // 五线谱顶部 Y 坐标（典型值）
    const padding = 6; // 光标边距
    
    describe('五线谱线条位置计算', () => {
      it('第一线位置 = staveY + VEXFLOW_STAVE_LINE_OFFSET + SVG_PADDING', () => {
        const staffIndex = 0;
        const firstLineY = calculateStaveLineY(staffIndex, 0);
        
        // staveY = 25
        // 第一线 = staveY + VEXFLOW_STAVE_LINE_OFFSET + SVG_PADDING
        //        = 25 + 40 + 20 = 85
        expect(firstLineY).toBe(staveY + VEXFLOW_STAVE_LINE_OFFSET + SVG_PADDING);
        expect(firstLineY).toBe(85);
      });
      
      it('第五线位置 = staveY + VEXFLOW_STAVE_LINE_OFFSET + 40 + SVG_PADDING', () => {
        const staffIndex = 0;
        const fifthLineY = calculateStaveLineY(staffIndex, 4);
        
        // 第五线 = staveY + 40 + 40 + 20 = 125
        expect(fifthLineY).toBe(staveY + VEXFLOW_STAVE_LINE_OFFSET + 40 + SVG_PADDING);
        expect(fifthLineY).toBe(125);
      });
      
      it('第三线位置 = staveY + VEXFLOW_STAVE_LINE_OFFSET + 20 + SVG_PADDING', () => {
        const staffIndex = 0;
        const thirdLineY = calculateStaveLineY(staffIndex, 2);
        
        // 第三线 = staveY + 40 + 20 + 20 = 105
        expect(thirdLineY).toBe(staveY + VEXFLOW_STAVE_LINE_OFFSET + 20 + SVG_PADDING);
        expect(thirdLineY).toBe(105);
      });
      
      it('VEXFLOW_STAVE_LINE_OFFSET 应该是正数（第一线在 staveY 下方）', () => {
        // 这个测试验证我们对 VexFlow 行为的理解：
        // staveY 是容器顶部，第一线在其下方
        expect(VEXFLOW_STAVE_LINE_OFFSET).toBeGreaterThan(0);
        expect(VEXFLOW_STAVE_LINE_OFFSET).toBe(40);
      });
    });
    
    describe('插入光标位置计算', () => {
      it('插入光标中心应该位于五线谱第三线（中央）', () => {
        // 第一个谱表
        const staffIndex = 0;
        const cursorY = calculateInsertCursorY(staffIndex);
        
        // 第三线位置 = staveY + VEXFLOW_STAVE_LINE_OFFSET + 20 + SVG_PADDING = 25 + 40 + 20 + 20 = 105
        const thirdLineY = calculateStaveLineY(staffIndex, 2);
        
        // 光标顶部 = 第三线 - 高度/2 = 105 - 16 = 89
        const expectedTop = thirdLineY - INSERT_CURSOR_HEIGHT / 2;
        
        expect(cursorY).toBe(expectedTop);
        expect(cursorY).toBe(89);
      });
      
      it('插入光标应该在五线谱范围内', () => {
        const staffIndex = 0;
        const cursorY = calculateInsertCursorY(staffIndex);
        const cursorBottom = cursorY + INSERT_CURSOR_HEIGHT;
        
        const firstLineY = calculateStaveLineY(staffIndex, 0);
        const thirdLineY = calculateStaveLineY(staffIndex, 2);
        const fifthLineY = calculateStaveLineY(staffIndex, 4);
        
        // 光标中心应该在第三线
        const cursorCenter = cursorY + INSERT_CURSOR_HEIGHT / 2;
        expect(cursorCenter).toBe(thirdLineY);
        
        // 光标顶部应该在第一线和第三线之间
        expect(cursorY).toBeGreaterThan(firstLineY);
        expect(cursorY).toBeLessThan(thirdLineY);
        
        // 光标底部应该在第三线和第五线之间
        expect(cursorBottom).toBeGreaterThan(thirdLineY);
        expect(cursorBottom).toBeLessThan(fifthLineY);
      });
      
      it('多谱表时，插入光标应该在各自五线谱中央', () => {
        // 第一个谱表
        const cursorY0 = calculateInsertCursorY(0);
        const thirdLineY0 = calculateStaveLineY(0, 2);
        expect(cursorY0).toBe(thirdLineY0 - INSERT_CURSOR_HEIGHT / 2);
        expect(cursorY0).toBe(89);
        
        // 第二个谱表
        const cursorY1 = calculateInsertCursorY(1);
        const thirdLineY1 = calculateStaveLineY(1, 2);
        expect(cursorY1).toBe(thirdLineY1 - INSERT_CURSOR_HEIGHT / 2);
        // 第二个谱表的第三线 = 130 + 25 + 40 + 20 + 20 = 235
        // 光标顶部 = 235 - 16 = 219
        expect(cursorY1).toBe(219);
      });
    });
    
    describe('音符头位置计算', () => {
      it('无符干音符（全音符）：边界框 X 直接对应音符头左边', () => {
        // 模拟 VexFlow 全音符边界框
        // VexFlow 边界框 X 通常是音符头的左边
        const bb: BoundingBox = {
          x: 100,   // 音符头左边界
          y: 35,    // 音符头顶部
          w: 14,    // 边界框宽度（可能大于音符头）
          h: 10     // 音符头高度（无符干）
        };
        
        const noteHead = calculateNoteHeadPosition(bb, staveY);
        
        // 新算法：直接使用 bb.x 作为音符头左边
        expect(noteHead.x).toBe(100);
        expect(noteHead.centerX).toBe(107); // 100 + 14/2
        expect(noteHead.centerY).toBe(40);  // 35 + 10/2
        
        expect(noteHead.width).toBe(NOTE_HEAD_WIDTH);
        expect(noteHead.height).toBe(NOTE_HEAD_HEIGHT);
      });
      
      it('有符干音符：边界框 X 仍然是音符头左边', () => {
        // 模拟 VexFlow 四分音符边界框
        // 边界框 X 是音符头左边，宽度可能更大
        const bb: BoundingBox = {
          x: 100,   // 音符头左边界
          y: 10,    // 符干顶端 Y
          w: 22,    // 边界框宽度（包含符干）
          h: 40     // 高度包含符干
        };
        
        const noteHead = calculateNoteHeadPosition(bb, staveY);
        
        // 新算法：直接使用 bb.x 作为音符头左边
        expect(noteHead.x).toBe(100);
        expect(noteHead.centerX).toBe(107); // 100 + 14/2
        
        // Y 仍然在边界框底部附近
        expect(noteHead.centerY).toBe(39);
      });
      
      it('边界框宽度大于音符头宽度时，仍正确计算', () => {
        // VexFlow 可能返回比音符头更宽的边界框
        const bb: BoundingBox = {
          x: 100,   // 音符头左边界
          y: 10,
          w: 30,    // 比音符头宽度大很多
          h: 40
        };
        
        const noteHead = calculateNoteHeadPosition(bb, staveY);
        
        // 不管边界框多宽，音符头 X 都是 bb.x
        expect(noteHead.x).toBe(100);
        expect(noteHead.centerX).toBe(107);
        expect(noteHead.width).toBe(NOTE_HEAD_WIDTH);
      });
    });
    
    describe('光标位置计算', () => {
      it('光标应该正确框选音符头', () => {
        const noteHead: NoteHeadPosition = {
          x: 100,
          y: 34,
          width: NOTE_HEAD_WIDTH,
          height: NOTE_HEAD_HEIGHT,
          centerX: 107,
          centerY: 40
        };
        
        const cursor = calculateCursorPosition(noteHead, padding);
        
        // 光标应该比音符头大，且包围音符头
        expect(cursor.x).toBe(94);      // 100 - 6
        expect(cursor.y).toBe(28);      // 34 - 6
        expect(cursor.width).toBe(26);  // 14 + 12
        expect(cursor.height).toBe(24); // 12 + 12
      });
      
      it('光标中心应该与音符头中心对齐', () => {
        const noteHead: NoteHeadPosition = {
          x: 100,
          y: 34,
          width: NOTE_HEAD_WIDTH,
          height: NOTE_HEAD_HEIGHT,
          centerX: 107,
          centerY: 40
        };
        
        const cursor = calculateCursorPosition(noteHead, padding);
        const cursorCenterX = cursor.x + cursor.width / 2;
        const cursorCenterY = cursor.y + cursor.height / 2;
        
        // 光标中心应该等于音符头中心
        expect(cursorCenterX).toBe(noteHead.centerX);
        expect(cursorCenterY).toBe(noteHead.centerY);
      });
    });
    
    describe('光标框选验证', () => {
      it('正确的光标位置应通过验证', () => {
        const noteHead: NoteHeadPosition = {
          x: 100,
          y: 34,
          width: NOTE_HEAD_WIDTH,
          height: NOTE_HEAD_HEIGHT,
          centerX: 107,
          centerY: 40
        };
        
        const cursor = calculateCursorPosition(noteHead, padding);
        const result = isCursorCorrectlyFraming(cursor, noteHead, padding);
        
        expect(result.correct).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
      
      it('光标偏左时应报告错误', () => {
        const noteHead: NoteHeadPosition = {
          x: 100,
          y: 34,
          width: NOTE_HEAD_WIDTH,
          height: NOTE_HEAD_HEIGHT,
          centerX: 107,
          centerY: 40
        };
        
        // 模拟错误的偏左光标
        const wrongCursor: CursorPosition = {
          x: 80,   // 应该是 94
          y: 28,
          width: 26,
          height: 24
        };
        
        const result = isCursorCorrectlyFraming(wrongCursor, noteHead, padding);
        
        expect(result.correct).toBe(false);
        expect(result.errors.some(e => e.includes('光标左边界错误'))).toBe(true);
      });
      
      it('光标中心未对齐时应报告错误', () => {
        const noteHead: NoteHeadPosition = {
          x: 100,
          y: 34,
          width: NOTE_HEAD_WIDTH,
          height: NOTE_HEAD_HEIGHT,
          centerX: 107,
          centerY: 40
        };
        
        // 模拟中心未对齐的光标
        const wrongCursor: CursorPosition = {
          x: 94,
          y: 28,
          width: 40,  // 宽度错误，导致中心偏移
          height: 24
        };
        
        const result = isCursorCorrectlyFraming(wrongCursor, noteHead, padding);
        
        expect(result.correct).toBe(false);
        expect(result.errors.some(e => e.includes('光标中心X未与音符头中心对齐'))).toBe(true);
      });
    });
    
    describe('完整流程测试：从边界框到光标', () => {
      it('完整流程：无符干音符', () => {
        const bb: BoundingBox = {
          x: 100,
          y: 35,
          w: 14,
          h: 10
        };
        
        const noteHead = calculateNoteHeadPosition(bb, staveY);
        const cursor = calculateCursorPosition(noteHead, padding);
        
        // 验证光标正确框选
        const result = isCursorCorrectlyFraming(cursor, noteHead, padding);
        expect(result.correct).toBe(true);
        
        // 验证光标四角位置
        expect(cursor.x).toBeCloseTo(noteHead.x - padding, 1);
        expect(cursor.y).toBeCloseTo(noteHead.y - padding, 1);
        expect(cursor.x + cursor.width).toBeCloseTo(noteHead.x + noteHead.width + padding, 1);
        expect(cursor.y + cursor.height).toBeCloseTo(noteHead.y + noteHead.height + padding, 1);
      });
      
      it('完整流程：有符干音符', () => {
        const bb: BoundingBox = {
          x: 100,
          y: 10,
          w: 14,
          h: 40
        };
        
        const noteHead = calculateNoteHeadPosition(bb, staveY);
        const cursor = calculateCursorPosition(noteHead, padding);
        
        // 验证光标正确框选
        const result = isCursorCorrectlyFraming(cursor, noteHead, padding);
        expect(result.correct).toBe(true);
      });
      
      it('完整流程：不同位置的音符', () => {
        // 测试多个不同位置的音符
        const testCases: BoundingBox[] = [
          { x: 50, y: 20, w: 14, h: 35 },   // 第一个音符
          { x: 100, y: 15, w: 14, h: 40 },  // 中间音符
          { x: 150, y: 25, w: 14, h: 30 },  // 最后音符
        ];
        
        testCases.forEach((bb, index) => {
          const noteHead = calculateNoteHeadPosition(bb, staveY);
          const cursor = calculateCursorPosition(noteHead, padding);
          const result = isCursorCorrectlyFraming(cursor, noteHead, padding);
          
          expect(result.correct).toBe(true);
          
          // 验证光标中心与音符头中心对齐
          const cursorCenterX = cursor.x + cursor.width / 2;
          const cursorCenterY = cursor.y + cursor.height / 2;
          expect(cursorCenterX).toBeCloseTo(noteHead.centerX, 1);
          expect(cursorCenterY).toBeCloseTo(noteHead.centerY, 1);
        });
      });
    });
    
    describe('边界条件测试', () => {
      it('音符超出五线谱上方时，Y 应被限制', () => {
        const bb: BoundingBox = {
          x: 100,
          y: 0,    // 很高的音符
          w: 14,
          h: 50
        };
        
        const noteHead = calculateNoteHeadPosition(bb, staveY);
        
        // centerY 应被限制在 minY = staveY - 20 = 5
        expect(noteHead.centerY).toBeGreaterThanOrEqual(staveY - 20);
      });
      
      it('音符超出五线谱下方时，Y 应被限制', () => {
        const bb: BoundingBox = {
          x: 100,
          y: 60,   // 很低的音符
          w: 14,
          h: 50
        };
        
        const noteHead = calculateNoteHeadPosition(bb, staveY);
        
        // centerY 应被限制在 maxY = staveY + 60 = 85
        expect(noteHead.centerY).toBeLessThanOrEqual(staveY + 60);
      });
    });
    
    describe('VexFlow 实际边界框测试', () => {
      // VexFlow 边界框行为：
      // - bb.x 是音符头左边
      // - bb.w 可能大于音符头宽度（包含符干、附点等）
      // - bb.h 对于有符干音符包含符干高度
      
      it('VexFlow 四分音符：边界框宽度大于音符头宽度', () => {
        // 模拟实际 VexFlow 四分音符边界框
        const bb: BoundingBox = {
          x: 100,   // 音符头左边
          y: 10,
          w: 22,   // 比音符头宽度大
          h: 40
        };
        
        const noteHead = calculateNoteHeadPosition(bb, staveY);
        const cursor = calculateCursorPosition(noteHead, padding);
        
        // 新算法：直接使用 bb.x
        console.log(`边界框: x=${bb.x}, w=${bb.w}`);
        console.log(`音符头: x=${noteHead.x}, centerX=${noteHead.centerX}`);
        console.log(`光标: x=${cursor.x}, centerX=${cursor.x + cursor.width/2}`);
        
        // 音符头 X 应该等于边界框 X
        expect(noteHead.x).toBe(100);
        expect(noteHead.centerX).toBe(107);
        
        // 光标应该正确框选
        const result = isCursorCorrectlyFraming(cursor, noteHead, padding);
        expect(result.correct).toBe(true);
      });
      
      it('关键测试：验证音符头 X 位置计算', () => {
        const bb: BoundingBox = {
          x: 100,
          y: 10,
          w: 22,
          h: 40
        };
        
        const noteHead = calculateNoteHeadPosition(bb, staveY);
        
        // 新算法：音符头 X = bb.x
        expect(noteHead.x).toBe(100);
        expect(noteHead.centerX).toBe(107); // 100 + 14/2
      });
      
      it('用户报告的问题模拟：验证光标不再偏左', () => {
        // 用户说光标偏左一个音符宽度
        // 原因：之前用 bb.x + bb.w/2 计算中心，但 bb.w 可能很大
        // 
        // 新算法：直接使用 bb.x 作为音符头左边
        
        const bb: BoundingBox = {
          x: 100,       // 音符头实际左边
          y: 10,
          w: 30,        // 边界框宽度（可能比音符头宽）
          h: 40
        };
        
        const noteHead = calculateNoteHeadPosition(bb, staveY);
        const cursor = calculateCursorPosition(noteHead, padding);
        
        // 音符头 X 应该等于边界框 X
        expect(noteHead.x).toBe(100);
        expect(noteHead.centerX).toBe(107);
        
        // 光标应该正确框选
        const result = isCursorCorrectlyFraming(cursor, noteHead, padding);
        expect(result.correct).toBe(true);
        
        console.log('验证修复：');
        console.log(`边界框 X: ${bb.x}`);
        console.log(`音符头 X: ${noteHead.x}`);
        console.log(`光标 X: ${cursor.x}`);
        console.log(`光标应该紧贴音符头左边: ${cursor.x} = ${noteHead.x - padding}`);
      });
    });
  });
});
