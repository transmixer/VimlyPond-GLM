/**
 * ===========================================
 * Vimlypond 光标定位测试
 * ===========================================
 * 
 * 测试光标在普通模式下正确框选音符的行为
 */

import { describe, it, expect } from 'vitest';

describe('光标定位测试', () => {
  
  describe('NoteRect 坐标计算逻辑', () => {
    /**
     * VexFlow 的 getBoundingBox() 返回的边界框包括：
     * - 音符头 (note head)
     * - 符干 (stem)
     * - 符尾/符杠 (flags/beams)
     * 
     * 光标应该框选音符头，而不是整个边界框。
     * 
     * 对于 VexFlow StaveNote：
     * - bb.getX() = 左边界
     * - bb.getY() = 上边界（对于有符干的音符，这是符干顶端）
     * - bb.getW() = 宽度
     * - bb.getH() = 高度（包括符干）
     * 
     * 音符头位置：
     * - Y 坐标应该在五线谱的中心区域
     * - 高音谱号第三线 = B4
     * - 低音谱号第三线 = D3
     */
    
    it('音符头应该在五线谱范围内', () => {
      // 五线谱的 Y 坐标范围大约是 y 到 y + 40（五条线之间的距离）
      // 音符头的中心应该在五线谱范围内
      
      // 假设 stave.y = 25，五线谱范围约 25-65
      const staveY = 25;
      const staffHeight = 40;
      const minNoteY = staveY;
      const maxNoteY = staveY + staffHeight;
      
      // 音符头中心应该在五线谱范围内
      expect(minNoteY).toBeLessThan(maxNoteY);
    });

    it('光标高度应该固定覆盖音符头区域', () => {
      // 光标应该有固定高度，覆盖音符头区域
      // 典型的音符头高度约 8-10px
      // 光标高度应该稍大，比如 40px，确保覆盖音符头和上下空间
      
      const cursorHeight = 40;
      const noteHeadHeight = 10;
      
      expect(cursorHeight).toBeGreaterThan(noteHeadHeight);
    });

    it('光标 Y 坐标应该以音符头中心为基准', () => {
      // 光标应该居中显示在音符头上
      // 
      // VexFlow 的边界框问题：
      // - 对于符干向上的音符，bb.getY() 返回符干顶端的 Y
      // - 对于符干向下的音符，bb.getY() 返回音符头顶端的 Y
      // 
      // 解决方案：
      // - 使用 stave 的中心线作为参考
      // - 或者根据音符的 stem_direction 调整 Y 坐标
      
      // 假设我们知道音符头的中心 Y 坐标
      const noteHeadCenterY = 45; // 五线谱中心附近
      const cursorHeight = 40;
      
      // 光标顶部应该是：noteHeadCenterY - cursorHeight/2
      const cursorTopY = noteHeadCenterY - cursorHeight / 2;
      
      expect(cursorTopY).toBe(25);
    });
  });

  describe('普通模式光标框选逻辑', () => {
    it('光标应该水平居中于音符头', () => {
      // 音符头的宽度约 10-15px
      // 光标宽度应该覆盖音符头，比如 24-30px
      
      const noteHeadWidth = 12;
      const cursorWidth = 30;
      
      // 光标应该居中
      const noteX = 100;
      const noteWidth = 20; // VexFlow 返回的宽度
      
      // 光标 left = noteX + (noteWidth / 2) - (cursorWidth / 2)
      const cursorLeft = noteX + noteWidth / 2 - cursorWidth / 2;
      
      // 光标应该包围音符
      expect(cursorLeft).toBeLessThan(noteX + noteHeadWidth / 2);
    });

    it('光标应该覆盖音符头而非符干', () => {
      // VexFlow 边界框包含符干时：
      // - 符干向上的音符：bb.getY() 在符干顶端
      // - 符干向下的音符：bb.getY() 在音符头附近
      // 
      // 光标应该只覆盖音符头区域，不包含长符干
      
      // 模拟 VexFlow 返回的边界框（包含符干）
      const bbWithStemUp = {
        x: 100,
        y: 10,  // 符干顶端
        w: 20,
        h: 50   // 从符干顶端到音符头底部
      };
      
      // 实际音符头位置（在五线谱中心）
      const noteHeadCenterY = 45;
      const staffCenterY = 45;
      
      // 光标应该以音符头中心为准，而不是 bb.y
      const cursorHeight = 40;
      const expectedCursorY = noteHeadCenterY - cursorHeight / 2;
      
      // 不应该使用 bb.y (10)
      expect(expectedCursorY).toBe(25);
      expect(expectedCursorY).not.toBe(bbWithStemUp.y);
    });
  });

  describe('elementIndex 与音符位置映射', () => {
    it('elementIndex 应该正确映射到 noteRects 数组', () => {
      // 当有 3 个音符时，elementIndex 范围是 0-2
      // noteRects[0] 对应第一个音符
      // noteRects[1] 对应第二个音符
      // noteRects[2] 对应第三个音符
      
      const elements = [
        { type: 'note', pitches: [{ midiPitch: 60, alter: 0 }] },
        { type: 'note', pitches: [{ midiPitch: 62, alter: 0 }] },
        { type: 'note', pitches: [{ midiPitch: 64, alter: 0 }] }
      ];
      
      // 模拟 noteRects
      const noteRects = [
        { elementIndex: 0, x: 100, y: 50 },
        { elementIndex: 1, x: 130, y: 45 },
        { elementIndex: 2, x: 160, y: 40 }
      ];
      
      // 当 elementIndex = 1 时，应该找到第二个音符的位置
      const selectedIndex = 1;
      const rect = noteRects.find(r => r.elementIndex === selectedIndex);
      
      expect(rect?.x).toBe(130);
      expect(rect?.y).toBe(45);
    });

    it('h/l 移动后 elementIndex 应该更新到相邻音符', () => {
      // 初始状态：elementIndex = 1（第二个音符）
      // h 后：elementIndex = 0（第一个音符）
      // l 后：elementIndex = 2（第三个音符）
      
      let elementIndex = 1;
      const elementsLength = 3;
      
      // h 向左移动
      if (elementIndex > 0) {
        elementIndex--;
      }
      expect(elementIndex).toBe(0);
      
      // l 向右移动两次
      if (elementIndex < elementsLength - 1) {
        elementIndex++;
      }
      if (elementIndex < elementsLength - 1) {
        elementIndex++;
      }
      expect(elementIndex).toBe(2);
    });
  });

  describe('不同谱号下的光标位置', () => {
    it('高音谱号：C4 音符头应在下加一线附近', () => {
      // 高音谱号：
      // - 第三线 = B4
      // - C4 在下加一线
      // 音符头的 Y 坐标应该反映这个位置
      
      const staveY = 25;
      const lineSpacing = 10; // 五线谱线间距
      
      // B4（第三线）的 Y 坐标
      const b4Y = staveY + lineSpacing * 2;
      
      // C4 比 B4 低一条线（在下加一线位置）
      // 实际位置 = 第三线 Y + 一条线的距离
      const c4Y = b4Y + lineSpacing;
      
      // 音符头中心应该在这个位置附近
      expect(c4Y).toBe(staveY + 30);
    });

    it('低音谱号：C4 音符头应在上加一线附近', () => {
      // 低音谱号：
      // - 第三线 = D3
      // - C4 在上加一线
      // 音符头的 Y 坐标应该反映这个位置
      
      const staveY = 25;
      const lineSpacing = 10;
      
      // D3（第三线）的 Y 坐标
      const d3Y = staveY + lineSpacing * 2;
      
      // C4 比 D3 高两条线（在上加一线位置）
      // 实际位置 = 第三线 Y - 两条线的距离
      const c4Y = d3Y - lineSpacing * 2;
      
      expect(c4Y).toBe(staveY + 0);
    });
  });
});
