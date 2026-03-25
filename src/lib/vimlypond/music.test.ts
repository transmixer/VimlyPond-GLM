import { describe, it, expect } from 'vitest';
import {
  createEmptyMeasure,
  createEmptyStaff,
  createDefaultScore,
  createNote,
  createRest,
  midiToPitch,
  pitchToMidi,
  inferOctave,
  durationValue,
  remainingInMeasure,
  getLastMidiPitch,
  getVexFlowDuration,
  generateLilyPond,
  BEATS_PER_MEASURE,
  INITIAL_MEASURES,
} from '@/lib/vimlypond/music';
import type { Score, Note } from '@/lib/vimlypond/types';

describe('音乐计算逻辑测试', () => {
  describe('创建数据结构', () => {
    it('createEmptyMeasure 应创建空小节', () => {
      const measure = createEmptyMeasure();
      expect(measure.elements).toEqual([]);
      expect(measure.durationUsed).toBe(0);
    });

    it('createEmptyStaff 应创建包含初始小节数的谱表', () => {
      const staff = createEmptyStaff();
      expect(staff.clef).toBe('treble');
      expect(staff.measures.length).toBe(INITIAL_MEASURES);
      staff.measures.forEach(m => {
        expect(m.elements).toEqual([]);
        expect(m.durationUsed).toBe(0);
      });
    });

    it('createDefaultScore 应创建默认乐谱', () => {
      const score = createDefaultScore();
      expect(score.meter.count).toBe(4);
      expect(score.meter.unit).toBe(4);
      expect(score.staves.length).toBe(1);
      expect(score.staves[0].clef).toBe('treble');
    });

    it('createNote 应正确创建音符', () => {
      const note = createNote(60, 4, 0, 0); // C4, 四分音符
      expect(note.type).toBe('note');
      expect(note.pitches[0].midiPitch).toBe(60);
      expect(note.duration).toBe(4);
      expect(note.dots).toBe(0);
      expect(note.pitches[0].alter).toBe(0);
    });

    it('createRest 应正确创建休止符', () => {
      const rest = createRest(4, 1); // 四分休止符，一个附点
      expect(rest.type).toBe('rest');
      expect(rest.duration).toBe(4);
      expect(rest.dots).toBe(1);
    });
  });

  describe('音高计算', () => {
    it('pitchToMidi 应正确转换音高到 MIDI 编号', () => {
      // C4 = 60 (中央C)
      expect(pitchToMidi('c', 4)).toBe(60);
      // A4 = 69 (标准音高)
      expect(pitchToMidi('a', 4)).toBe(69);
      // C5 = 72
      expect(pitchToMidi('c', 5)).toBe(72);
      // 带升号的 C#4 = 61
      expect(pitchToMidi('c', 4, 1)).toBe(61);
      // 带降号的 Cb4 = 59
      expect(pitchToMidi('c', 4, -1)).toBe(59);
    });

    it('midiToPitch 应正确转换 MIDI 编号到音高', () => {
      // C4 = 60
      const c4 = midiToPitch(60);
      expect(c4.name).toBe('c');
      expect(c4.oct).toBe(4);
      expect(c4.alter).toBe(0);

      // A4 = 69
      const a4 = midiToPitch(69);
      expect(a4.name).toBe('a');
      expect(a4.oct).toBe(4);

      // Db4 = 61 (优先使用降号表示)
      const db4 = midiToPitch(61);
      expect(db4.name).toBe('d');
      expect(db4.alter).toBe(-1);

      // Eb4 = 63
      const eb4 = midiToPitch(63);
      expect(eb4.name).toBe('e');
      expect(eb4.alter).toBe(-1);
      
      // Ab4 = 68
      const ab4 = midiToPitch(68);
      expect(ab4.name).toBe('a');
      expect(ab4.alter).toBe(-1);
      
      // Bb4 = 70
      const bb4 = midiToPitch(70);
      expect(bb4.name).toBe('b');
      expect(bb4.alter).toBe(-1);
    });

    it('midiToPitch 和 pitchToMidi 应该互为逆运算', () => {
      // 测试一些常见音高
      const testPitches = [
        { name: 'c', oct: 4, alter: 0 },
        { name: 'd', oct: 4, alter: 0 },
        { name: 'e', oct: 4, alter: 0 },
        { name: 'f', oct: 4, alter: 0 },
        { name: 'g', oct: 4, alter: 0 },
        { name: 'a', oct: 4, alter: 0 },
        { name: 'b', oct: 4, alter: 0 },
      ];

      testPitches.forEach(({ name, oct, alter }) => {
        const midi = pitchToMidi(name, oct, alter);
        const pitch = midiToPitch(midi);
        expect(pitch.name).toBe(name);
        expect(pitch.oct).toBe(oct);
      });
    });

    it('inferOctave 应推断最近的八度', () => {
      // 无前一个音符时，默认返回 4
      expect(inferOctave('c', null)).toBe(4);

      // 前一个音符是 C4，输入 'e' 应返回 4（E4 比 E3 或 E5 更近）
      expect(inferOctave('e', 60)).toBe(4);

      // 前一个音符是 C4，输入 'a' 应返回 3（A3 比 A4 更近）
      // C4=60, A3=57 (距离3), A4=69 (距离9)
      expect(inferOctave('a', 60)).toBe(3);

      // 前一个音符是 G4 (67)，输入 'c' 应返回 5（C5=72 比 C4=60 更近）
      expect(inferOctave('c', 67)).toBe(5);
    });
  });

  describe('时值计算', () => {
    it('durationValue 应正确计算音符时值', () => {
      // 全音符 = 4拍
      expect(durationValue(1, 0)).toBe(4);
      // 二分音符 = 2拍
      expect(durationValue(2, 0)).toBe(2);
      // 四分音符 = 1拍
      expect(durationValue(4, 0)).toBe(1);
      // 八分音符 = 0.5拍
      expect(durationValue(8, 0)).toBe(0.5);
      // 十六分音符 = 0.25拍
      expect(durationValue(16, 0)).toBe(0.25);
    });

    it('durationValue 应正确计算附点时值', () => {
      // 附点四分音符 = 1 + 0.5 = 1.5拍
      expect(durationValue(4, 1)).toBe(1.5);
      // 双附点四分音符 = 1 + 0.5 + 0.25 = 1.75拍
      expect(durationValue(4, 2)).toBe(1.75);
      // 附点二分音符 = 2 + 1 = 3拍
      expect(durationValue(2, 1)).toBe(3);
    });

    it('remainingInMeasure 应正确计算剩余空间', () => {
      const measure = createEmptyMeasure();
      expect(remainingInMeasure(measure)).toBe(BEATS_PER_MEASURE);

      // 添加一个四分音符后
      measure.elements.push(createNote(60, 4));
      measure.durationUsed = 1;
      expect(remainingInMeasure(measure)).toBe(3);
    });
  });

  describe('获取前一音符', () => {
    it('getLastMidiPitch 应在同小节内查找前一音符', () => {
      const score = createDefaultScore();
      score.staves[0].measures[0].elements = [
        createNote(60, 4), // C4
        createNote(64, 4), // E4
      ];

      expect(getLastMidiPitch(0, 0, 1, score)).toBe(60);
      expect(getLastMidiPitch(0, 0, 2, score)).toBe(64);
    });

    it('getLastMidiPitch 应跨小节查找', () => {
      const score = createDefaultScore();
      score.staves[0].measures[0].elements = [createNote(60, 4)]; // C4
      score.staves[0].measures[1].elements = [];

      // 在第2小节开头，应该找到第1小节的最后一个音符
      expect(getLastMidiPitch(0, 1, 0, score)).toBe(60);
    });

    it('getLastMidiPitch 在没有音符时返回 null', () => {
      const score = createDefaultScore();
      expect(getLastMidiPitch(0, 0, 0, score)).toBe(null);
    });
  });

  describe('VexFlow 时值转换', () => {
    it('getVexFlowDuration 应正确转换音符时值', () => {
      expect(getVexFlowDuration(1, 0, 'note')).toBe('w');
      expect(getVexFlowDuration(2, 0, 'note')).toBe('h');
      expect(getVexFlowDuration(4, 0, 'note')).toBe('q');
      expect(getVexFlowDuration(8, 0, 'note')).toBe('8');
      expect(getVexFlowDuration(16, 0, 'note')).toBe('16');
    });

    it('getVexFlowDuration 应正确转换休止符时值', () => {
      expect(getVexFlowDuration(1, 0, 'rest')).toBe('wr');
      expect(getVexFlowDuration(2, 0, 'rest')).toBe('hr');
      expect(getVexFlowDuration(4, 0, 'rest')).toBe('qr');
    });

    it('getVexFlowDuration 应正确处理附点', () => {
      expect(getVexFlowDuration(4, 1, 'note')).toBe('qd');
      expect(getVexFlowDuration(4, 2, 'note')).toBe('qdd');
      expect(getVexFlowDuration(8, 1, 'rest')).toBe('8dr');
    });
  });

  describe('LilyPond 导出', () => {
    it('generateLilyPond 应生成有效的 LilyPond 代码', () => {
      const score = createDefaultScore();
      const ly = generateLilyPond(score);
      
      expect(ly).toContain('\\version');
      expect(ly).toContain('\\score');
      expect(ly).toContain('\\clef treble');
      expect(ly).toContain('\\time 4/4');
    });

    it('generateLilyPond 应正确导出音符', () => {
      const score = createDefaultScore();
      score.staves[0].measures[0].elements = [
        createNote(60, 4), // C4
        createNote(62, 4), // D4
      ];
      
      const ly = generateLilyPond(score);
      expect(ly).toContain("c'");
      expect(ly).toContain("d'");
    });

    it('generateLilyPond 应正确处理升降号', () => {
      const score = createDefaultScore();
      // 创建带有降号的音符
      // MIDI 61 = Db4, MIDI 63 = Eb4
      const db4 = createNote(61, 4);
      db4.pitches[0] = { midiPitch: 61, alter: -1 }; // Db4
      
      const eb4 = createNote(63, 4);
      eb4.pitches[0] = { midiPitch: 63, alter: -1 }; // Eb4
      
      score.staves[0].measures[0].elements = [db4, eb4];
      
      const ly = generateLilyPond(score);
      expect(ly).toContain('des'); // D flat
      expect(ly).toContain('ees'); // E flat
    });

    it('generateLilyPond 应正确处理多个谱表', () => {
      const score: Score = {
        meter: { count: 4, unit: 4 },
        staves: [
          { clef: 'treble', measures: [createEmptyMeasure()] },
          { clef: 'bass', measures: [createEmptyMeasure()] },
        ],
      };
      
      const ly = generateLilyPond(score);
      expect(ly).toContain('\\clef treble');
      expect(ly).toContain('\\clef bass');
    });
  });
});
