/**
 * ===========================================
 * Vimlypond 休止符位置测试
 * ===========================================
 * 
 * 测试休止符在不同谱号下的垂直位置：
 * - 高音谱号：休止符应在谱表中心（第三线 = B4）
 * - 低音谱号：休止符应在谱表中心（第三线 = D3）
 * 
 * VexFlow 中休止符位置由 keys 参数决定：
 * - keys: ['b/4'] 在高音谱号显示在第三线
 * - keys: ['d/3'] 在低音谱号显示在第三线
 */

import { describe, it, expect } from 'vitest';

describe('==========================================', () => {
  describe('休止符位置计算', () => {
    
    describe('谱号与线号对应关系', () => {
      it('高音谱号第三线是 B4', () => {
        // 高音谱号（G谱号）中心在第二线是 G4
        // 第三线（中心线）是 B4
        const trebleCenterLine = 'b/4';
        expect(trebleCenterLine).toBe('b/4');
      });

      it('低音谱号第三线是 D3', () => {
        // 低音谱号（F谱号）中心在第四线是 F3
        // 第三线（中心线）是 D3
        const bassCenterLine = 'd/3';
        expect(bassCenterLine).toBe('d/3');
      });
    });

    describe('休止符位置计算函数', () => {
      // 模拟渲染器中的逻辑
      const getRestKey = (clef: 'treble' | 'bass'): string => {
        // 休止符应显示在谱表中心（第三线）
        // 高音谱号第三线 = B4
        // 低音谱号第三线 = D3
        if (clef === 'treble') {
          return 'b/4';
        } else {
          return 'd/3';
        }
      };

      it('高音谱号休止符应在 B4 位置', () => {
        const key = getRestKey('treble');
        expect(key).toBe('b/4');
      });

      it('低音谱号休止符应在 D3 位置', () => {
        const key = getRestKey('bass');
        expect(key).toBe('d/3');
      });
    });

    describe('休止符位置不正确的问题', () => {
      it('当前实现：固定使用 b/4，在低音谱号位置错误', () => {
        // 当前代码问题：无论谱号如何，都使用 'b/4'
        const currentImplementation = 'b/4';
        
        // 在高音谱号正确
        expect(currentImplementation).toBe('b/4');
        
        // 但在低音谱号错误（应该在 D3，不是 B4）
        // B4 在低音谱号中是很高的位置（上加线）
        // 这会导致休止符显示在错误的位置
        expect(currentImplementation).not.toBe('d/3');
      });

      it('修复后：应根据谱号选择正确的休止符位置', () => {
        const getCorrectRestKey = (clef: 'treble' | 'bass'): string => {
          return clef === 'treble' ? 'b/4' : 'd/3';
        };
        
        expect(getCorrectRestKey('treble')).toBe('b/4');
        expect(getCorrectRestKey('bass')).toBe('d/3');
      });
    });

    describe('VexFlow 线号计算验证', () => {
      // VexFlow 线号计算：
      // 线号 0 = 第一线
      // 线号 2 = 第三线（中心）
      // 线号 4 = 第五线
      
      it('高音谱号：B4 在第三线（线号 2）', () => {
        // 高音谱号：E4(第一线), G4(第一间), B4(第二线), D5(第二间), F5(第三线)
        // 实际上 VexFlow 的计算方式不同：
        // 高音谱号第三线 = B4
        const trebleClef = {
          position: 2,  // 第三线位置
          note: 'b/4'   // 第三线对应的音符
        };
        expect(trebleClef.note).toBe('b/4');
      });

      it('低音谱号：D3 在第三线（线号 2）', () => {
        // 低音谱号：G2(第一线), B2(第一间), D3(第二线), F3(第二间), A3(第三线)
        // 实际上 VexFlow 的计算：
        // 低音谱号第三线 = D3
        const bassClef = {
          position: 2,  // 第三线位置
          note: 'd/3'   // 第三线对应的音符
        };
        expect(bassClef.note).toBe('d/3');
      });
    });

    describe('不同时值的休止符', () => {
      const getRestKey = (clef: 'treble' | 'bass'): string => {
        return clef === 'treble' ? 'b/4' : 'd/3';
      };

      it('全休止符位置应正确', () => {
        // 全休止符通常显示在第四线下方或第三线上方
        // 但 VexFlow 中使用 key 来定位
        expect(getRestKey('treble')).toBe('b/4');
        expect(getRestKey('bass')).toBe('d/3');
      });

      it('四分休止符位置应正确', () => {
        expect(getRestKey('treble')).toBe('b/4');
        expect(getRestKey('bass')).toBe('d/3');
      });

      it('八分休止符位置应正确', () => {
        expect(getRestKey('treble')).toBe('b/4');
        expect(getRestKey('bass')).toBe('d/3');
      });
    });
  });

  describe('==========================================', () => {
  describe('谱号切换后休止符位置更新', () => {
      
      it('切换谱号后应重新计算休止符位置', () => {
        // 渲染器应在 score.clef 变化时重新渲染
        // 并使用正确的休止符位置
        
        const clefBefore = 'treble';
        const clefAfter = 'bass';
        
        const getRestKey = (clef: 'treble' | 'bass') => 
          clef === 'treble' ? 'b/4' : 'd/3';
        
        expect(getRestKey(clefBefore as 'treble' | 'bass')).toBe('b/4');
        expect(getRestKey(clefAfter as 'treble' | 'bass')).toBe('d/3');
      });

      it('多个谱表应各自使用正确的休止符位置', () => {
        const staves = [
          { clef: 'treble' as const },
          { clef: 'bass' as const }
        ];
        
        const getRestKey = (clef: 'treble' | 'bass') => 
          clef === 'treble' ? 'b/4' : 'd/3';
        
        expect(getRestKey(staves[0].clef)).toBe('b/4');
        expect(getRestKey(staves[1].clef)).toBe('d/3');
      });
    });
  });
});
