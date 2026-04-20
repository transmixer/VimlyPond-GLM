import { describe, it, expect } from 'vitest';
import {
  BEATS_PER_MEASURE,
  SEMITONES,
  NOTE_NAMES,
  DEFAULT_KEY_SIGNATURE,
  KEY_SIGNATURE_MAP,
  getKeySignature,
  getAlterForKey,
  getKeySignatureNotes,
  METER_MAP,
  getMeter,
  getMeasureCapacity,
  generateNoteId,
  createEmptyVoice,
  createEmptyMeasure,
  createMultiVoiceMeasure,
  createEmptyStaff,
  createDefaultScore,
  createNote,
  createSingleNote,
  createChord,
  createRest,
  createTuplet,
  createGraceNote,
  createBarline,
  midiToPitch,
  pitchToMidi,
  inferOctave,
  durationValue,
  tupletBeats,
  elementBeats,
  remainingInMeasure,
  getVexFlowDuration,
  generateLilyPond,
  splitNoteWithDuration,
  mergeTiedNotes,
  balanceMeasures,
} from './music-v2';

describe('music-v2 常量和映射', () => {
  it('BEATS_PER_MEASURE 应该是 4', () => {
    expect(BEATS_PER_MEASURE).toBe(4);
  });

  it('SEMITONES 应该正确映射音名到半音', () => {
    expect(SEMITONES['c']).toBe(0);
    expect(SEMITONES['d']).toBe(2);
    expect(SEMITONES['e']).toBe(4);
    expect(SEMITONES['f']).toBe(5);
    expect(SEMITONES['g']).toBe(7);
    expect(SEMITONES['a']).toBe(9);
    expect(SEMITONES['b']).toBe(11);
  });

  it('NOTE_NAMES 应该包含所有自然音名', () => {
    expect(NOTE_NAMES).toEqual(['c', 'd', 'e', 'f', 'g', 'a', 'b']);
  });
});

describe('music-v2 调号相关', () => {
  it('DEFAULT_KEY_SIGNATURE 应该是 C 大调', () => {
    expect(DEFAULT_KEY_SIGNATURE.name).toBe('C-major');
    expect(DEFAULT_KEY_SIGNATURE.sharps).toBe(0);
    expect(DEFAULT_KEY_SIGNATURE.flats).toBe(0);
  });

  it('getKeySignature 应该返回正确的调号信息', () => {
    const gMajor = getKeySignature('G-major');
    expect(gMajor.name).toBe('G-major');
    expect(gMajor.sharps).toBe(1);
    expect(gMajor.flats).toBe(0);
  });

  it('getAlterForKey 应该返回 G 大调中 F 的升号', () => {
    const gMajor = getKeySignature('G-major');
    expect(getAlterForKey('f', gMajor)).toBe(1);
  });

  it('getAlterForKey 应该返回 F 大调中 B 的降号', () => {
    const fMajor = getKeySignature('F-major');
    expect(getAlterForKey('b', fMajor)).toBe(-1);
  });

  it('getAlterForKey 应该在 C 大调返回 0', () => {
    expect(getAlterForKey('c', DEFAULT_KEY_SIGNATURE)).toBe(0);
    expect(getAlterForKey('d', DEFAULT_KEY_SIGNATURE)).toBe(0);
    expect(getAlterForKey('f', DEFAULT_KEY_SIGNATURE)).toBe(0);
  });

  it('getKeySignatureNotes 应该返回调号中的升降音', () => {
    const gMajor = getKeySignature('G-major');
    const notes = getKeySignatureNotes(gMajor);
    expect(notes.sharps).toContain('f');
    expect(notes.flats).toEqual([]);
  });
});

describe('music-v2 拍号相关', () => {
  it('METER_MAP 应该包含常用拍号', () => {
    expect(METER_MAP['4/4']).toEqual({ count: 4, unit: 4 });
    expect(METER_MAP['3/4']).toEqual({ count: 3, unit: 4 });
    expect(METER_MAP['6/8']).toEqual({ count: 6, unit: 8 });
  });

  it('getMeter 应该返回拍号信息', () => {
    expect(getMeter('4/4')).toEqual({ count: 4, unit: 4 });
  });

  it('getMeasureCapacity 应该正确计算小节容量', () => {
    expect(getMeasureCapacity({ count: 4, unit: 4 })).toBe(4);
    expect(getMeasureCapacity({ count: 3, unit: 4 })).toBe(3);
    expect(getMeasureCapacity({ count: 6, unit: 8 })).toBe(3);
  });
});

describe('music-v2 创建函数', () => {
  it('generateNoteId 应该生成唯一 ID', () => {
    const id1 = generateNoteId();
    const id2 = generateNoteId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^n_\d+_\d+$/);
  });

  it('createEmptyVoice 应该创建空声部', () => {
    const voice = createEmptyVoice();
    expect(voice.id).toBeDefined();
    expect(voice.elements).toEqual([]);
    expect(voice.name).toBeUndefined();
  });

  it('createEmptyMeasure 应该创建单声部空小节', () => {
    const measure = createEmptyMeasure();
    expect(measure.voices.length).toBe(1);
    expect(measure.durationUsed).toBe(0);
  });

  it('createMultiVoiceMeasure 应该创建多声部小节', () => {
    const measure = createMultiVoiceMeasure(2);
    expect(measure.voices.length).toBe(2);
  });

  it('createEmptyStaff 应该创建空谱表', () => {
    const staff = createEmptyStaff(4);
    expect(staff.id).toBeDefined();
    expect(staff.clef).toBe('treble');
    expect(staff.measures.length).toBe(4);
  });

  it('createDefaultScore 应该创建默认乐谱', () => {
    const score = createDefaultScore();
    expect(score.header).toEqual({});
    expect(score.meter).toEqual({ count: 4, unit: 4 });
    expect(score.groups.length).toBe(1);
    expect(score.groups[0].staves.length).toBe(1);
  });

  it('createSingleNote 应该创建单音音符', () => {
    const note = createSingleNote(60, 4, 0, 0);
    expect(note.type).toBe('note');
    expect(note.pitches.length).toBe(1);
    expect(note.pitches[0].midiPitch).toBe(60);
    expect(note.duration).toBe(4);
    expect(note.dots).toBe(0);
  });

  it('createChord 应该创建和弦', () => {
    const chord = createChord([
      { midiPitch: 60, alter: 0 },
      { midiPitch: 64, alter: 0 },
      { midiPitch: 67, alter: 0 },
    ], 4, 0);
    expect(chord.pitches.length).toBe(3);
  });

  it('createRest 应该创建休止符', () => {
    const rest = createRest(4, 1);
    expect(rest.type).toBe('rest');
    expect(rest.duration).toBe(4);
    expect(rest.dots).toBe(1);
  });

  it('createTuplet 应该创建连音组', () => {
    const tuplet = createTuplet([
      createSingleNote(60, 4, 0, 0),
      createSingleNote(62, 4, 0, 0),
      createSingleNote(64, 4, 0, 0),
    ], 3, 2);
    expect(tuplet.type).toBe('tuplet');
    expect(tuplet.actualNotes).toBe(3);
    expect(tuplet.normalNotes).toBe(2);
  });

  it('createBarline 应该创建小节线', () => {
    const barline = createBarline('end');
    expect(barline.type).toBe('barline');
    expect(barline.barType).toBe('end');
  });
});

describe('music-v2 音高转换', () => {
  it('midiToPitch 应该正确转换 MIDI 音高', () => {
    const pitch = midiToPitch(60);
    expect(pitch.name).toBe('c');
    expect(pitch.oct).toBe(4);
    expect(pitch.alter).toBe(0);
  });

  it('midiToPitch 应该处理升降号', () => {
    const sharp = midiToPitch(61); // C# / Db
    expect(sharp.alter).toBe(-1); // 优先降号表示

    const db = midiToPitch(61);
    expect(db.name).toBe('d');
    expect(db.alter).toBe(-1);
  });

  it('pitchToMidi 应该正确转换回 MIDI', () => {
    expect(pitchToMidi('c', 4, 0)).toBe(60);
    expect(pitchToMidi('c', 4, 1)).toBe(61);
    expect(pitchToMidi('c', 4, -1)).toBe(59);
  });

  it('inferOctave 应该智能推断八度', () => {
    expect(inferOctave('c', 60)).toBe(4); // 相邻音推断
    expect(inferOctave('c', null)).toBe(4); // 默认中央C八度
  });
});

describe('music-v2 时值计算', () => {
  it('durationValue 应该正确计算时值', () => {
    expect(durationValue(4, 0)).toBe(1); // 四分音符 = 1 拍
    expect(durationValue(2, 0)).toBe(2); // 二分音符 = 2 拍
    expect(durationValue(1, 0)).toBe(4); // 全音符 = 4 拍
    expect(durationValue(8, 0)).toBe(0.5); // 八分音符 = 0.5 拍
  });

  it('durationValue 应该正确计算附点时值', () => {
    expect(durationValue(4, 1)).toBe(1.5); // 附点四分 = 1.5 拍
    expect(durationValue(4, 2)).toBe(1.75); // 双附点四分 = 1.75 拍
  });

  it('tupletBeats 应该正确计算连音时值', () => {
    const tuplet = createTuplet([
      createSingleNote(60, 4, 0, 0),
      createSingleNote(62, 4, 0, 0),
      createSingleNote(64, 4, 0, 0),
    ], 3, 2);
    // 3 个四分音符基础 = 3 拍，占用 2 拍
    expect(tupletBeats(tuplet)).toBeCloseTo(2);
  });

  it('remainingInMeasure 应该正确计算剩余空间', () => {
    const measure = createEmptyMeasure();
    measure.durationUsed = 2;
    expect(remainingInMeasure(measure)).toBe(2);
  });
});

describe('music-v2 VexFlow 导出', () => {
  it('getVexFlowDuration 应该返回正确的 VexFlow 格式', () => {
    expect(getVexFlowDuration(4, 0, 'note')).toBe('q');
    expect(getVexFlowDuration(2, 0, 'note')).toBe('h');
    expect(getVexFlowDuration(1, 0, 'note')).toBe('w');
    expect(getVexFlowDuration(8, 0, 'note')).toBe('8');
    expect(getVexFlowDuration(16, 0, 'note')).toBe('16');
  });

  it('getVexFlowDuration 应该处理附点', () => {
    expect(getVexFlowDuration(4, 1, 'note')).toBe('qd');
    expect(getVexFlowDuration(4, 2, 'note')).toBe('qdd');
  });

  it('getVexFlowDuration 应该处理休止符', () => {
    expect(getVexFlowDuration(4, 0, 'rest')).toBe('qr');
    expect(getVexFlowDuration(2, 1, 'rest')).toBe('hdr');
  });
});

describe('music-v2 LilyPond 导出', () => {
  it('generateLilyPond 应该生成基本的 LilyPond 代码', () => {
    const score = createDefaultScore();
    const ly = generateLilyPond(score);
    expect(ly).toContain('\\version "2.24.0"');
    expect(ly).toContain('\\score');
  });

  it('generateLilyPond 应该包含 header 信息', () => {
    const score = createDefaultScore();
    score.header.title = 'Test Title';
    score.header.composer = 'Test Composer';
    const ly = generateLilyPond(score);
    expect(ly).toContain('title = "Test Title"');
    expect(ly).toContain('composer = "Test Composer"');
  });

  it('generateLilyPond 应该包含 tempo 信息', () => {
    const score = createDefaultScore();
    score.tempo = 120;
    const ly = generateLilyPond(score);
    expect(ly).toContain('\\tempo 4=120');
  });
});

describe('music-v2 流式推拉', () => {
  it('splitNoteWithDuration 应该分割音符', () => {
    // 使用全音符（4拍）分割成2拍 + 2拍
    const note = createSingleNote(60, 1, 0, 0);
    const split = splitNoteWithDuration(note, 2);

    expect(split).not.toBeNull();
    if (split) {
      const [first, second] = split;
      expect(first.duration).toBe(2); // 二分音符
      expect(second.duration).toBe(2); // 二分音符
      expect(first.tieStart).toBe(true);
      expect(second.tieEnd).toBe(true);
    }
  });

  it('splitNoteWithDuration 不应该分割无效时值', () => {
    const note = createSingleNote(60, 4, 0, 0);
    expect(splitNoteWithDuration(note, 0)).toBeNull();
    expect(splitNoteWithDuration(note, 5)).toBeNull();
  });

  it('mergeTiedNotes 应该合并带延音线的音符', () => {
    const first: any = {
      type: 'note',
      id: 'n1',
      pitches: [{ midiPitch: 60, alter: 0 }],
      duration: 4,
      dots: 0,
      articulations: [],
      tieStart: true,
      tieEnd: false,
    };
    const second: any = {
      type: 'note',
      id: 'n2',
      pitches: [{ midiPitch: 60, alter: 0 }],
      duration: 4,
      dots: 0,
      articulations: [],
      tieStart: false,
      tieEnd: true,
    };

    const merged = mergeTiedNotes(first, second);
    expect(merged).not.toBeNull();
    if (merged) {
      expect(merged.tieStart).toBe(false);
      expect(merged.tieEnd).toBe(false);
    }
  });

  it('balanceMeasures 应该平衡小节', () => {
    const staff = createEmptyStaff(2);
    // 第一个小节：5 拍（溢出 1 拍）
    staff.measures[0].voices[0].elements = [
      createSingleNote(60, 4, 0, 0), // 1 拍
      createSingleNote(62, 4, 0, 0), // 1 拍
      createSingleNote(64, 4, 0, 0), // 1 拍
      createSingleNote(65, 4, 0, 0), // 1 拍
      createSingleNote(67, 4, 0, 0), // 1 拍 (溢出)
    ];
    staff.measures[0].durationUsed = 5;

    const balanced = balanceMeasures(staff);

    // 第一个小节应该是 4 拍
    expect(balanced.measures[0].durationUsed).toBe(4);
    // 第二个小节应该有 1 拍
    expect(balanced.measures[1].durationUsed).toBe(1);
  });
});
