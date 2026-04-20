// Vimlypond v2 音乐计算逻辑
import type {
  Note,
  Rest,
  Tuplet,
  GraceNote,
  Barline,
  MusicElement,
  Voice,
  Measure,
  Staff,
  StaffGroup,
  Score,
  KeySignature,
  KeySignatureName,
  Meter,
  MeterName,
  Pitch,
} from './types-v2';

// 常量
export const BEATS_PER_MEASURE = 4;
export const INITIAL_MEASURES = 4;

// 半音映射 (C=0, D=2, E=4, F=5, G=7, A=9, B=11)
export const SEMITONES: Record<string, number> = {
  c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11
};

// 音名数组
export const NOTE_NAMES = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];

// ==========================================
// 调号相关
// ==========================================

// 默认调号（C大调）
export const DEFAULT_KEY_SIGNATURE: KeySignature = {
  name: 'C-major',
  sharps: 0,
  flats: 0
};

// 调号数据：升号系列 (F, C, G, D, A, E, B)
const SHARP_ORDER = ['f', 'c', 'g', 'd', 'a', 'e', 'b'];
// 降号系列 (B, E, A, D, G, C, F)
const FLAT_ORDER = ['b', 'e', 'a', 'd', 'g', 'c', 'f'];

// 调号名称到升/降号数量的映射
export const KEY_SIGNATURE_MAP: Record<KeySignatureName, { sharps: number; flats: number }> = {
  'C-major': { sharps: 0, flats: 0 },
  'G-major': { sharps: 1, flats: 0 },
  'D-major': { sharps: 2, flats: 0 },
  'A-major': { sharps: 3, flats: 0 },
  'E-major': { sharps: 4, flats: 0 },
  'B-major': { sharps: 5, flats: 0 },
  'F#-major': { sharps: 6, flats: 0 },
  'C#-major': { sharps: 7, flats: 0 },
  'F-major': { sharps: 0, flats: 1 },
  'Bb-major': { sharps: 0, flats: 2 },
  'Eb-major': { sharps: 0, flats: 3 },
  'Ab-major': { sharps: 0, flats: 4 },
  'Db-major': { sharps: 0, flats: 5 },
  'Gb-major': { sharps: 0, flats: 6 },
  'Cb-major': { sharps: 0, flats: 7 },
  'A-minor': { sharps: 0, flats: 0 },
  'E-minor': { sharps: 1, flats: 0 },
  'B-minor': { sharps: 2, flats: 0 },
  'F#-minor': { sharps: 3, flats: 0 },
  'C#-minor': { sharps: 4, flats: 0 },
  'G#-minor': { sharps: 5, flats: 0 },
  'D#-minor': { sharps: 6, flats: 0 },
  'A#-minor': { sharps: 7, flats: 0 },
  'D-minor': { sharps: 0, flats: 1 },
  'G-minor': { sharps: 0, flats: 2 },
  'C-minor': { sharps: 0, flats: 3 },
  'F-minor': { sharps: 0, flats: 4 },
  'Bb-minor': { sharps: 0, flats: 5 },
  'Eb-minor': { sharps: 0, flats: 6 },
  'Ab-minor': { sharps: 0, flats: 7 },
};

// 获取调号信息
export function getKeySignature(name: KeySignatureName): KeySignature {
  const info = KEY_SIGNATURE_MAP[name];
  return { name, sharps: info.sharps, flats: info.flats };
}

// 获取指定音高在当前调号中的默认升降号
export function getAlterForKey(noteName: string, keySignature: KeySignature): number {
  const lowerName = noteName.toLowerCase();

  if (keySignature.sharps > 0) {
    for (let i = 0; i < keySignature.sharps; i++) {
      if (SHARP_ORDER[i] === lowerName) {
        return 1;
      }
    }
  }

  if (keySignature.flats > 0) {
    for (let i = 0; i < keySignature.flats; i++) {
      if (FLAT_ORDER[i] === lowerName) {
        return -1;
      }
    }
  }

  return 0;
}

// 获取调号中的所有升降音名
export function getKeySignatureNotes(keySignature: KeySignature): { sharps: string[]; flats: string[] } {
  return {
    sharps: SHARP_ORDER.slice(0, keySignature.sharps),
    flats: FLAT_ORDER.slice(0, keySignature.flats)
  };
}

// ==========================================
// 拍号相关
// ==========================================

export const METER_MAP: Record<MeterName, { count: number; unit: number }> = {
  '2/4': { count: 2, unit: 4 },
  '3/4': { count: 3, unit: 4 },
  '4/4': { count: 4, unit: 4 },
  '5/4': { count: 5, unit: 4 },
  '6/4': { count: 6, unit: 4 },
  '7/4': { count: 7, unit: 4 },
  '2/2': { count: 2, unit: 2 },
  '3/2': { count: 3, unit: 2 },
  '4/2': { count: 4, unit: 2 },
  '3/8': { count: 3, unit: 8 },
  '6/8': { count: 6, unit: 8 },
  '9/8': { count: 9, unit: 8 },
  '12/8': { count: 12, unit: 8 },
};

export function getMeter(name: MeterName): { count: number; unit: number } {
  return METER_MAP[name];
}

// 计算小节容量（以四分音符为单位）
export function getMeasureCapacity(meter: Meter): number {
  return meter.count * (4 / meter.unit);
}

// ==========================================
// 创建函数
// ==========================================

let noteIdCounter = 0;
export function generateNoteId(): string {
  return `n_${Date.now()}_${++noteIdCounter}`;
}

let voiceIdCounter = 0;
export function generateVoiceId(): string {
  return `v_${Date.now()}_${++voiceIdCounter}`;
}

let staffIdCounter = 0;
export function generateStaffId(): string {
  return `s_${Date.now()}_${++staffIdCounter}`;
}

// 创建空声部
export function createEmptyVoice(): Voice {
  return {
    id: generateVoiceId(),
    elements: [],
  };
}

// 创建空小节（单声部）
export function createEmptyMeasure(): Measure {
  return {
    voices: [createEmptyVoice()],
    durationUsed: 0,
  };
}

// 创建多声部小节
export function createMultiVoiceMeasure(voiceCount: number): Measure {
  return {
    voices: Array.from({ length: voiceCount }, () => createEmptyVoice()),
    durationUsed: 0,
  };
}

// 创建空谱表
export function createEmptyStaff(measureCount: number = INITIAL_MEASURES): Staff {
  return {
    id: generateStaffId(),
    clef: 'treble',
    keySignature: DEFAULT_KEY_SIGNATURE,
    measures: Array.from({ length: measureCount }, () => createEmptyMeasure()),
  };
}

// 创建默认乐谱（v2 结构）
export function createDefaultScore(): Score {
  const staff = createEmptyStaff();
  return {
    header: {},
    meter: { count: 4, unit: 4 },
    groups: [{
      type: 'staffGroup',
      staves: [staff],
    }],
  };
}

// 创建音符
export function createNote(
  pitches: Pitch[],
  duration: number,
  dots: number = 0
): Note {
  return {
    type: 'note',
    id: generateNoteId(),
    pitches,
    duration,
    dots,
    articulations: [],
  };
}

// 创建单音音符
export function createSingleNote(
  midiPitch: number,
  duration: number,
  dots: number = 0,
  alter: -2 | -1 | 0 | 1 | 2 = 0
): Note {
  return createNote([{ midiPitch, alter }], duration, dots);
}

// 创建和弦
export function createChord(
  pitches: { midiPitch: number; alter: number }[],
  duration: number,
  dots: number = 0
): Note {
  return createNote(
    pitches.map(p => ({ midiPitch: p.midiPitch, alter: p.alter as -2 | -1 | 0 | 1 | 2 })),
    duration,
    dots
  );
}

// 创建休止符
export function createRest(duration: number, dots: number = 0): Rest {
  return { type: 'rest', duration, dots };
}

// 创建连音组
let tupletIdCounter = 0;
export function createTuplet(
  elements: MusicElement[],
  actualNotes: number,
  normalNotes: number
): Tuplet {
  return {
    type: 'tuplet',
    id: `t_${Date.now()}_${++tupletIdCounter}`,
    actualNotes,
    normalNotes,
    elements,
  };
}

// 创建装饰音
export function createGraceNote(
  notes: Note[],
  isAcciaccatura: boolean = false
): GraceNote {
  return {
    type: 'grace',
    isAcciaccatura,
    notes,
  };
}

// 创建小节线
export function createBarline(barType: BarlineType['barType']): Barline {
  return {
    type: 'barline',
    barType,
  };
}

// ==========================================
// 音高转换
// ==========================================

export function midiToPitch(midi: number): { name: string; oct: number; alter: number } {
  const oct = Math.floor((midi - 12) / 12);
  const semitone = ((midi - 12) % 12 + 12) % 12;

  const semitoneToNote: Record<number, { name: string; alter: number }> = {
    0:  { name: 'c', alter: 0 },
    1:  { name: 'd', alter: -1 },
    2:  { name: 'd', alter: 0 },
    3:  { name: 'e', alter: -1 },
    4:  { name: 'e', alter: 0 },
    5:  { name: 'f', alter: 0 },
    6:  { name: 'g', alter: -1 },
    7:  { name: 'g', alter: 0 },
    8:  { name: 'a', alter: -1 },
    9:  { name: 'a', alter: 0 },
    10: { name: 'b', alter: -1 },
    11: { name: 'b', alter: 0 },
  };

  const note = semitoneToNote[semitone];
  return { name: note.name, oct, alter: note.alter };
}

export function pitchToMidi(name: string, oct: number, alter: number = 0): number {
  const safeOct = Math.max(0, Math.min(9, oct));
  return 12 + safeOct * 12 + SEMITONES[name] + alter;
}

// 智能八度推断
export function inferOctave(noteName: string, prevMidiPitch: number | null): number {
  if (prevMidiPitch === null) return 4;

  const prevPitch = midiToPitch(prevMidiPitch);
  const candidates = [prevPitch.oct - 1, prevPitch.oct, prevPitch.oct + 1];

  let bestOct = prevPitch.oct;
  let minDistance = Infinity;

  for (const oct of candidates) {
    const distance = Math.abs(pitchToMidi(noteName, oct) - prevMidiPitch);
    if (distance < minDistance) {
      minDistance = distance;
      bestOct = oct;
    }
  }

  return bestOct;
}

// ==========================================
// 时值计算
// ==========================================

export function durationValue(dur: number, dots: number): number {
  const base = BEATS_PER_MEASURE / dur;
  let value = base;

  for (let i = 0; i < dots; i++) {
    value += base / Math.pow(2, i + 1);
  }

  return value;
}

// 计算连音组实际时值
export function tupletBeats(tuplet: Tuplet): number {
  const baseDuration = tuplet.elements.reduce((sum, el) => {
    if (el.type === 'note') {
      return sum + durationValue(el.duration, el.dots);
    } else if (el.type === 'rest') {
      return sum + durationValue(el.duration, el.dots);
    }
    return sum;
  }, 0);
  return (baseDuration * tuplet.normalNotes) / tuplet.actualNotes;
}

// 计算 MusicElement 的时值
export function elementBeats(element: MusicElement): number {
  switch (element.type) {
    case 'note':
      return durationValue(element.duration, element.dots);
    case 'rest':
      return durationValue(element.duration, element.dots);
    case 'tuplet':
      return tupletBeats(element);
    case 'grace':
      return 0; // 装饰音不占用主谱面时值
    case 'barline':
      return 0; // 小节线不占用时值
    default:
      return 0;
  }
}

// 计算小节剩余空间
export function remainingInMeasure(measure: Measure): number {
  return Math.max(0, BEATS_PER_MEASURE - measure.durationUsed);
}

// ==========================================
// VexFlow 导出
// ==========================================

export function getVexFlowDuration(dur: number, dots: number, type: 'note' | 'rest'): string {
  const map: Record<number, string> = {
    1: 'w', 2: 'h', 4: 'q', 8: '8', 16: '16'
  };

  let vfd = map[dur] || 'q';

  for (let i = 0; i < dots; i++) {
    vfd += 'd';
  }

  if (type === 'rest') {
    vfd += 'r';
  }

  return vfd;
}

// ==========================================
// LilyPond 导出
// ==========================================

function pitchToLily(p: { midiPitch: number; alter: number }): string {
  const pitch = midiToPitch(p.midiPitch);
  let noteName = pitch.name;

  if (p.alter === 1) {
    noteName += 'is';
  } else if (p.alter === -1) {
    if (pitch.name === 'a') {
      noteName = 'as';
    } else if (pitch.name === 'e') {
      noteName = 'ees';
    } else {
      noteName += 'es';
    }
  } else if (p.alter === 2) {
    noteName += 'isis';
  } else if (p.alter === -2) {
    if (pitch.name === 'a') {
      noteName = 'ases';
    } else if (pitch.name === 'e') {
      noteName = 'eeses';
    } else {
      noteName += 'eses';
    }
  }

  const octDiff = pitch.oct - 3;
  const octaveStr = octDiff > 0 ? "'".repeat(octDiff) : ','.repeat(-octDiff);

  return noteName + octaveStr;
}

function elementToLily(element: MusicElement): string {
  switch (element.type) {
    case 'rest':
      return 'r' + element.duration + '.'.repeat(element.dots);

    case 'note': {
      let str = '';

      // 力度
      if (element.dynamics) {
        str += '\\' + element.dynamics + ' ';
      }

      // 演奏法
      for (const art of element.articulations) {
        switch (art.type) {
          case 'staccato': str += '.-'; break;
          case 'marcato': str += '->'; break;
          case 'accent': str += '->'; break;
          case 'tenuto': str += '--'; break;
          case 'staccatissimo': str += '.--'; break;
        }
      }

      // 延音线
      if (element.tieStart) {
        str += '~ ';
      }

      // 音符/和弦
      if (element.pitches.length === 1) {
        str += pitchToLily(element.pitches[0]) + element.duration + '.'.repeat(element.dots);
      } else {
        str += '<' + element.pitches.map(pitchToLily).join(' ') + '>' + element.duration + '.'.repeat(element.dots);
      }

      return str;
    }

    case 'tuplet': {
      const inner = element.elements.map(e => elementToLily(e)).join(' ');
      return `\\tuplet ${element.actualNotes}/${element.normalNotes} { ${inner} }`;
    }

    case 'grace': {
      const prefix = element.isAcciaccatura ? '\\grace ' : '\\grace ';
      const inner = element.notes.map(n => pitchToLily(n.pitches[0]) + n.duration).join(' ');
      return prefix + '{ ' + inner + ' }';
    }

    case 'barline': {
      switch (element.barType) {
        case 'single': return '';
        case 'double': return '\\bar "||" ';
        case 'end': return '\\bar "|." ';
        case 'repeat-start': return '\\bar ".|:" ';
        case 'repeat-end': return '\\bar ":|." ';
        default: return '';
      }
    }

    default:
      return '';
  }
}

function voiceToLily(voice: Voice, meter: Meter): string {
  if (voice.elements.length === 0) {
    return 'R' + meter.count + '/' + meter.unit;
  }

  return voice.elements.map(e => elementToLily(e)).join(' ');
}

function measureToLily(measure: Measure, meter: Meter): string {
  // 如果有多个声部，用 << >> 包裹
  if (measure.voices.length > 1) {
    const voicesStr = measure.voices
      .map(v => '\\new Voice { \\voiceOne ' + voiceToLily(v, meter) + ' }')
      .join(' \\nnew Voice { \\voiceTwo ');
    return '<< ' + voicesStr + ' >>';
  }

  return voiceToLily(measure.voices[0], meter);
}

export function generateLilyPond(score: Score): string {
  let ly = '\\version "2.24.0"\n';

  // Header
  if (score.header.title) {
    ly += `\\header { title = "${score.header.title}" }\n`;
  }
  if (score.header.composer) {
    ly += `\\header { composer = "${score.header.composer}" }\n`;
  }

  // Tempo
  if (score.tempo) {
    ly += `\\tempo 4=${score.tempo}\n`;
  }

  ly += '\\score {\n <<\n';

  for (const group of score.groups) {
    for (const staff of group.staves) {
      ly += ` \\new Staff {\n`;
      ly += `  \\clef ${staff.clef === 'treble' ? 'treble' : 'bass'}\n`;

      // 调号
      if (staff.keySignature.sharps > 0) {
        ly += `  \\key ${getKeySignatureNotes(staff.keySignature).sharps[0] || 'c'}\\major\n`;
      } else if (staff.keySignature.flats > 0) {
        ly += `  \\key ${getKeySignatureNotes(staff.keySignature).flats[0] || 'c'}\\major\n`;
      }

      // 拍号
      ly += `  \\time ${score.meter.count}/${score.meter.unit}\n`;

      // 小节
      for (const measure of staff.measures) {
        ly += '  ' + measureToLily(measure, score.meter) + '\n';
      }

      ly += ' }\n';
    }
  }

  ly += ' >>\n}\n';

  return ly;
}

// ==========================================
// 流式推拉函数 (Stream Push/Pull) - v2 版本
// ==========================================

export function calculateMeasureDuration(measure: Measure): number {
  return measure.voices.reduce((total, voice) => {
    return total + voice.elements.reduce((vTotal, el) => vTotal + elementBeats(el), 0);
  }, 0);
}

// 时值表
const BEATS_TO_DURATION: [number, number][] = [
  [4, 1],   [2, 2],   [1, 4],   [0.5, 8],   [0.25, 16],
];

function findDurationForBeats(beats: number): [number, number] {
  for (const [b, d] of BEATS_TO_DURATION) {
    if (Math.abs(beats - b) < 0.001) return [d, 0];
  }

  for (const [b, d] of BEATS_TO_DURATION) {
    const dottedBeats = b * 1.5;
    if (Math.abs(beats - dottedBeats) < 0.001) return [d, 1];
  }

  for (const [b, d] of BEATS_TO_DURATION) {
    if (b <= beats + 0.001) return [d, 0];
  }

  return [16, 0];
}

export function splitNoteWithDuration(note: Note, beatsForFirst: number): [Note, Note] | null {
  const totalBeats = durationValue(note.duration, note.dots);

  if (beatsForFirst <= 0 || beatsForFirst >= totalBeats) {
    return null;
  }

  const beatsForSecond = totalBeats - beatsForFirst;

  const [dur1, dots1] = findDurationForBeats(beatsForFirst);
  const [dur2, dots2] = findDurationForBeats(beatsForSecond);

  const actualBeats1 = durationValue(dur1, dots1);
  const actualBeats2 = durationValue(dur2, dots2);

  if (Math.abs(actualBeats1 + actualBeats2 - totalBeats) > 0.01) {
    return null;
  }

  const first: Note = {
    ...note,
    id: generateNoteId(),
    duration: dur1,
    dots: dots1,
    tieStart: true,
    tieEnd: note.tieEnd,
  };

  const second: Note = {
    ...note,
    id: generateNoteId(),
    duration: dur2,
    dots: dots2,
    tieStart: note.tieStart,
    tieEnd: true,
  };

  return [first, second];
}

export function mergeTiedNotes(first: Note, second: Note): Note | null {
  if (!first.tieStart || !second.tieEnd) return null;

  if (!pitchesEqual(first.pitches, second.pitches)) return null;

  const totalBeats = durationValue(first.duration, first.dots) +
                     durationValue(second.duration, second.dots);

  const [dur, dots] = findDurationForBeats(totalBeats);

  const actualBeats = durationValue(dur, dots);
  if (Math.abs(actualBeats - totalBeats) > 0.01) return null;

  return {
    ...first,
    id: generateNoteId(),
    duration: dur,
    dots,
    tieStart: false,
    tieEnd: false,
  };
}

function pitchesEqual(a: Pitch[], b: Pitch[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].midiPitch !== b[i].midiPitch || a[i].alter !== b[i].alter) {
      return false;
    }
  }
  return true;
}

export interface BalanceOptions {
  fillRestOnFinal?: boolean;
}

export function balanceMeasures(
  staff: Staff,
  startFromMeasure: number = 0,
  options: BalanceOptions = {}
): Staff {
  let newMeasures = [...staff.measures];

  if (newMeasures.every(m => m.voices.every(v => v.elements.length === 0))) {
    return staff;
  }

  for (let m = startFromMeasure; m < newMeasures.length; m++) {
    const measure = newMeasures[m];
    let currentDuration = calculateMeasureDuration(measure);

    while (currentDuration > BEATS_PER_MEASURE && measure.voices[0].elements.length > 0) {
      const result = pushElementToNextV2(newMeasures, m);
      if (!result) break;
      newMeasures = result;
      currentDuration = calculateMeasureDuration(newMeasures[m]);
    }

    const remaining = BEATS_PER_MEASURE - currentDuration;
    if (remaining > 0 && m + 1 < newMeasures.length) {
      newMeasures = pullFromNextV2(newMeasures, m);
    }
  }

  return { ...staff, measures: newMeasures };
}

function pushElementToNextV2(measures: Measure[], m: number): Measure[] | null {
  const measure = measures[m];
  const voice = measure.voices[0];

  if (voice.elements.length === 0) return null;

  let lastElement = voice.elements[voice.elements.length - 1];
  const lastDuration = elementBeats(lastElement);

  if (m + 1 >= measures.length) {
    measures = [...measures, createEmptyMeasure()];
  }

  if (lastElement.type === 'note' && lastElement.tieEnd && voice.elements.length >= 2) {
    const secondLast = voice.elements[voice.elements.length - 2];
    if (secondLast.type === 'note' && secondLast.tieStart) {
      const merged = mergeTiedNotes(secondLast as Note, lastElement as Note);
      if (merged) {
        const newElements = [...voice.elements.slice(0, -2), merged];
        const newMeasures = [...measures];
        newMeasures[m] = {
          ...measure,
          voices: [{ ...voice, elements: newElements }],
          durationUsed: calculateMeasureDuration({ ...measure, voices: [{ ...voice, elements: newElements }] }),
        };
        measures = newMeasures;
        return pushElementToNextV2(measures, m);
      }
    }
    lastElement = { ...lastElement, tieEnd: false } as MusicElement;
  }

  const newDuration = calculateMeasureDuration(measure) - lastDuration;

  if (newDuration >= BEATS_PER_MEASURE) {
    const newCurrentElements = voice.elements.slice(0, -1);
    const nextMeasure = measures[m + 1];
    const nextVoice = nextMeasure.voices[0];

    const newMeasures = [...measures];
    newMeasures[m] = {
      ...measure,
      voices: [{ ...voice, elements: newCurrentElements }],
      durationUsed: newDuration,
    };
    newMeasures[m + 1] = {
      ...nextMeasure,
      voices: [{ ...nextVoice, elements: [lastElement, ...nextVoice.elements] }],
      durationUsed: calculateMeasureDuration(nextMeasure) + lastDuration,
    };

    return newMeasures;
  }

  const remaining = BEATS_PER_MEASURE - newDuration;
  if (lastElement.type === 'note') {
    const split = splitNoteWithDuration(lastElement as Note, remaining);
    if (split) {
      const [first, second] = split;
      const nextMeasure = measures[m + 1];
      const nextVoice = nextMeasure.voices[0];

      const newMeasures = [...measures];
      newMeasures[m] = {
        ...measure,
        voices: [{ ...voice, elements: [...voice.elements.slice(0, -1), first] }],
        durationUsed: BEATS_PER_MEASURE,
      };
      newMeasures[m + 1] = {
        ...nextMeasure,
        voices: [{ ...nextVoice, elements: [second, ...nextVoice.elements] }],
        durationUsed: calculateMeasureDuration(nextMeasure) + durationValue(second.duration, second.dots),
      };

      return newMeasures;
    }
  }

  return null;
}

function pullFromNextV2(measures: Measure[], m: number): Measure[] {
  const measure = measures[m];
  const remaining = BEATS_PER_MEASURE - calculateMeasureDuration(measure);

  if (remaining <= 0 || m + 1 >= measures.length) return measures;

  const nextMeasure = measures[m + 1];
  const nextVoice = nextMeasure.voices[0];
  if (nextVoice.elements.length === 0) return measures;

  const firstElement = nextVoice.elements[0];
  const firstDuration = elementBeats(firstElement);

  if (firstDuration <= remaining) {
    const newMeasures = [...measures];
    newMeasures[m] = {
      ...measure,
      voices: [{ ...measure.voices[0], elements: [...measure.voices[0].elements, firstElement] }],
      durationUsed: calculateMeasureDuration(measure) + firstDuration,
    };
    newMeasures[m + 1] = {
      ...nextMeasure,
      voices: [{ ...nextVoice, elements: nextVoice.elements.slice(1) }],
      durationUsed: calculateMeasureDuration(nextMeasure) - firstDuration,
    };
    return newMeasures;
  }

  return measures;
}
