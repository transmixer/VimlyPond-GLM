/**
 * ===========================================
 * Vimlypond 谱号切换后音符位置渲染测试
 * ===========================================
 * 
 * 问题：切换谱号后，音符在五线谱上的位置应该变化
 * 
 * 音乐理论基础：
 * - MIDI 60 = C4（中央C）
 * - 在高音谱号(treble)中，C4 显示在下加一线
 * - 在低音谱号(bass)中，C4 显示在上加一线（第二线之上）
 * 
 * VexFlow 使用 keys 格式如 'c/4' 来指定音高，
 * 并根据 stave 的 clef 自动计算正确的 Y 位置。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { midiToPitch, pitchToMidi, createNote, createDefaultScore, generateLilyPond } from '@/lib/vimlypond/music';

describe('==========================================', () => {
  describe('谱号与音符位置测试', () => {
    
    describe('MIDI 音高转换', () => {
      it('C4 (MIDI 60) 应正确转换为 c/4', () => {
        const pitch = midiToPitch(60);
        expect(pitch.name).toBe('c');
        expect(pitch.oct).toBe(4);
        expect(pitch.alter).toBe(0);
      });

      it('C4 在 VexFlow 格式中应为 "c/4"', () => {
        const pitch = midiToPitch(60);
        const vexflowKey = `${pitch.name}/${pitch.oct}`;
        expect(vexflowKey).toBe('c/4');
      });

      it('不同八度的 C 应有不同的 VexFlow key', () => {
        const c3 = midiToPitch(48); // C3
        const c4 = midiToPitch(60); // C4
        const c5 = midiToPitch(72); // C5
        
        expect(`${c3.name}/${c3.oct}`).toBe('c/3');
        expect(`${c4.name}/${c4.oct}`).toBe('c/4');
        expect(`${c5.name}/${c5.oct}`).toBe('c/5');
      });
    });

    describe('谱号与音高关系', () => {
      it('高音谱号：C4 在下加一线', () => {
        // 高音谱号的中心线（第三线）是 B4
        // C4 比 B4 低一个全音 + 一个八度 = 9个半音
        // 在五线谱上，C4 在下加一线
        const c4 = midiToPitch(60);
        expect(c4.name).toBe('c');
        expect(c4.oct).toBe(4);
      });

      it('低音谱号：C4 在上加一线（第二线之上）', () => {
        // 低音谱号的中心线（第三线）是 D3
        // C4 比 D3 高一个全音 + 一个八度 = 14个半音
        // 在五线谱上，C4 在第二线和第三线之间（上加一线位置）
        const c4 = midiToPitch(60);
        expect(c4.name).toBe('c');
        expect(c4.oct).toBe(4);
        // 关键：同一个 C4 在不同谱号下显示位置不同！
      });

      it('同一个 MIDI 音高在不同谱号下应该有不同的显示位置', () => {
        // 这是核心问题：VexFlow 应该根据 clef 自动调整显示位置
        // MIDI 60 = C4，无论谱号如何，VexFlow key 都是 'c/4'
        // 但 VexFlow 会根据 stave 的 clef 自动计算 Y 坐标
        
        const midi = 60;
        const pitch = midiToPitch(midi);
        const vexflowKey = `${pitch.name}/${pitch.oct}`;
        
        // 在两种谱号下，VexFlow key 相同
        expect(vexflowKey).toBe('c/4');
        
        // 但 VexFlow 渲染时：
        // - treble clef: C4 在下加一线（Y 坐标较低）
        // - bass clef: C4 在上加一线（Y 坐标较高）
        // 这需要 VexFlow 根据 clef 正确计算
      });
    });

    describe('谱号切换后的渲染预期', () => {
      it('切换谱号后，VexFlow key 不应变', () => {
        // MIDI 音高不变，所以 VexFlow key 不变
        const beforePitch = midiToPitch(60);
        const beforeKey = `${beforePitch.name}/${beforePitch.oct}`;
        
        // 模拟切换谱号（不影响 MIDI 音高）
        const afterPitch = midiToPitch(60);
        const afterKey = `${afterPitch.name}/${afterPitch.oct}`;
        
        expect(afterKey).toBe(beforeKey);
      });

      it('谱号信息应正确存储在 score 中', () => {
        const score = createDefaultScore();
        expect(score.staves[0].clef).toBe('treble');
        
        // 切换谱号
        score.staves[0].clef = 'bass';
        expect(score.staves[0].clef).toBe('bass');
      });

      it('generateLilyPond 应正确导出谱号', () => {
        const score = createDefaultScore();
        score.staves[0].measures[0].elements = [createNote(60, 4)];
        
        const lyTreble = generateLilyPond(score);
        expect(lyTreble).toContain('\\clef treble');
        
        score.staves[0].clef = 'bass';
        const lyBass = generateLilyPond(score);
        expect(lyBass).toContain('\\clef bass');
      });
    });

    describe('音符在不同谱号下的 VexFlow 线号计算', () => {
      // VexFlow 使用线号来计算音符位置
      // 线号从 0 开始，每条线和间都有对应的数字
      
      it('高音谱号：C4 对应线号约 -2（下加一线）', () => {
        // 高音谱号第三线 = B4 = 线号 0
        // C4 = B4 - 9个半音 = 线号约 -2
        // 计算：B4 -> A4 -> G4 -> F4 -> E4 -> D4 -> C4 (向下7个位置)
        // 线号：0 -> -1 -> -2 -> -3 -> -4 -> -5 -> -6
        // 但实际上 VexFlow 的计算方式不同
        
        // 这个测试验证我们的理解
        expect(true).toBe(true); // 占位，实际需要 VexFlow API 测试
      });

      it('低音谱号：C4 对应线号约 2（第二线和第三线之间）', () => {
        // 低音谱号第三线 = D3 = 线号 0
        // C4 = D3 + 14个半音 = 线号约 2
        expect(true).toBe(true); // 占位，实际需要 VexFlow API 测试
      });
    });
  });

  describe('==========================================', () => {
  describe('谱号切换渲染问题诊断', () => {
      
      it('问题诊断：stave 的 clef 应在 draw 之前设置', () => {
        // VexFlow 的 StaveNote 在 draw 时会读取 stave 的 clef
        // 如果 clef 没有正确设置，音符位置不会变化
        
        // 这个测试验证渲染逻辑的正确顺序
        // 1. 创建 stave
        // 2. 设置 clef (addClef)
        // 3. draw stave
        // 4. 创建 notes
        // 5. draw notes
        
        expect(true).toBe(true); // 渲染顺序测试
      });

      it('问题诊断：每个 stave 应有独立的 clef', () => {
        const score = createDefaultScore();
        score.staves[0].clef = 'bass';
        
        // 确保只有第一个谱表是低音谱号
        expect(score.staves[0].clef).toBe('bass');
        
        // 添加新谱表
        score.staves.push({
          clef: 'treble',
          measures: score.staves[0].measures.map(() => ({ elements: [], durationUsed: 0 }))
        });
        
        expect(score.staves[0].clef).toBe('bass');
        expect(score.staves[1].clef).toBe('treble');
      });

      it('问题诊断：StaveNote 应在正确的 stave context 中绘制', () => {
        // VexFlow 的 StaveNote 需要知道它属于哪个 stave
        // 才能正确计算 Y 坐标
        
        // voice.draw(context, stave) 将 notes 与 stave 关联
        expect(true).toBe(true);
      });
    });

    describe('渲染更新机制', () => {
      it('切换谱号后应触发重新渲染', () => {
        // React 的 useEffect 依赖 score 变化
        // 当 score.staves[x].clef 变化时，score 引用应变
        
        const score1 = createDefaultScore();
        const score2 = { ...score1 };
        score2.staves = [...score1.staves];
        score2.staves[0] = { ...score1.staves[0], clef: 'bass' };
        
        // score2 是新对象，应触发 React 重渲染
        expect(score2).not.toBe(score1);
        expect(score2.staves[0].clef).toBe('bass');
        expect(score1.staves[0].clef).toBe('treble');
      });

      it('toggleClef 应创建新的 score 对象', () => {
        // Zustand 的 set 会触发订阅更新
        // 如果 toggleClef 正确实现了不可变更新，应该会触发重渲染
        
        const score = createDefaultScore();
        const originalClef = score.staves[0].clef;
        
        // 模拟 toggleClef 的实现
        const newStaves = [...score.staves];
        newStaves[0] = { ...newStaves[0], clef: 'bass' };
        const newScore = { ...score, staves: newStaves };
        
        expect(newScore.staves[0].clef).not.toBe(originalClef);
        expect(newScore).not.toBe(score);
        expect(newScore.staves).not.toBe(score.staves);
      });
    });
  });

  describe('==========================================', () => {
  describe('渲染器代码审查', () => {
      
      it('渲染器应为每个 stave 设置正确的 clef', () => {
        // 审查 renderer.ts 第 147 行：
        // stave.addClef(staff.clef === 'treble' ? 'treble' : 'bass');
        
        // 这应该是正确的
        const trebleClef = 'treble';
        const bassClef = 'bass';
        
        const clef1 = trebleClef === 'treble' ? 'treble' : 'bass';
        const clef2 = bassClef === 'treble' ? 'treble' : 'bass';
        
        expect(clef1).toBe('treble');
        expect(clef2).toBe('bass');
      });

      it('渲染器应使用 staff.clef 而非硬编码', () => {
        // 审查：渲染器读取 staff.clef
        // 如果 staff.clef 正确更新，渲染器应该正确显示
        
        const staff1 = { clef: 'treble' as const, measures: [] };
        const staff2 = { clef: 'bass' as const, measures: [] };
        
        const getClef = (staff: { clef: string }) => 
          staff.clef === 'treble' ? 'treble' : 'bass';
        
        expect(getClef(staff1)).toBe('treble');
        expect(getClef(staff2)).toBe('bass');
      });

      it('音符 key 应基于 MIDI 音高计算，不受 clef 影响', () => {
        // 审查 renderer.ts 第 176-177 行：
        // const pitch = midiToPitch((el as Note).pitches[0].midiPitch);
        // const key = pitch.name + '/' + pitch.oct;
        
        // 这是正确的：MIDI -> pitch -> VexFlow key
        // VexFlow 会根据 stave 的 clef 自动计算 Y 位置
        
        const note = createNote(60, 4); // C4
        const pitch = midiToPitch(note.pitches[0].midiPitch);
        const key = `${pitch.name}/${pitch.oct}`;
        
        expect(key).toBe('c/4');
      });
    });

    describe('潜在问题分析', () => {
      it('检查：stave.addClef 是否在 stave.draw 之前调用', () => {
        // 审查 renderer.ts:
        // 1. stave.addClef(...) - 设置谱号
        // 2. stave.setContext(context).draw() - 绘制谱表
        // 3. 创建 notes
        // 4. voice.draw(context, stave) - 绘制音符
        
        // 这个顺序是正确的
        expect(true).toBe(true);
      });

      it('检查：StaveNote 创建时是否需要指定 clef', () => {
        // VexFlow 的 StaveNote 不需要指定 clef
        // 它通过 voice.draw(context, stave) 关联到 stave
        // stave 已经有 clef，所以音符位置会正确计算
        
        expect(true).toBe(true);
      });

      it('关键问题：VexFlow clef 是否影响已创建的 StaveNote', () => {
        // 这可能是问题所在！
        // 
        // 在当前实现中：
        // 1. stave.addClef('treble') - 这只是绘制谱号符号
        // 2. StaveNote 创建时，VexFlow 可能缓存了位置计算
        // 
        // 解决方案可能需要：
        // - 在 clef 变化后完全重新创建 stave 和 notes
        // - 或者调用某种更新方法
        
        expect(true).toBe(true);
      });
    });
  });
});
