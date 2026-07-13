// 音乐计算逻辑
import type { Note, Rest, Measure, Staff, Score, MeasureElement, KeySignature, KeySignatureName, MeterName } from './types';

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
  // 升号大调
  'C-major': { sharps: 0, flats: 0 },
  'G-major': { sharps: 1, flats: 0 },
  'D-major': { sharps: 2, flats: 0 },
  'A-major': { sharps: 3, flats: 0 },
  'E-major': { sharps: 4, flats: 0 },
  'B-major': { sharps: 5, flats: 0 },
  'F#-major': { sharps: 6, flats: 0 },
  'C#-major': { sharps: 7, flats: 0 },
  // 降号大调
  'F-major': { sharps: 0, flats: 1 },
  'Bb-major': { sharps: 0, flats: 2 },
  'Eb-major': { sharps: 0, flats: 3 },
  'Ab-major': { sharps: 0, flats: 4 },
  'Db-major': { sharps: 0, flats: 5 },
  'Gb-major': { sharps: 0, flats: 6 },
  'Cb-major': { sharps: 0, flats: 7 },
  // 升号小调
  'A-minor': { sharps: 0, flats: 0 },
  'E-minor': { sharps: 1, flats: 0 },
  'B-minor': { sharps: 2, flats: 0 },
  'F#-minor': { sharps: 3, flats: 0 },
  'C#-minor': { sharps: 4, flats: 0 },
  'G#-minor': { sharps: 5, flats: 0 },
  'D#-minor': { sharps: 6, flats: 0 },
  'A#-minor': { sharps: 7, flats: 0 },
  // 降号小调
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
// 例如：在 G 大调（1个升号）中，F 默认为升号
export function getAlterForKey(noteName: string, keySignature: KeySignature): number {
  const lowerName = noteName.toLowerCase();
  
  if (keySignature.sharps > 0) {
    // 检查是否在升号列表中
    for (let i = 0; i < keySignature.sharps; i++) {
      if (SHARP_ORDER[i] === lowerName) {
        return 1; // 升号
      }
    }
  }
  
  if (keySignature.flats > 0) {
    // 检查是否在降号列表中
    for (let i = 0; i < keySignature.flats; i++) {
      if (FLAT_ORDER[i] === lowerName) {
        return -1; // 降号
      }
    }
  }
  
  return 0; // 无升降号
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

// 拍号名称到数值的映射
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

// 获取拍号信息
export function getMeter(name: MeterName): { count: number; unit: number } {
  return METER_MAP[name];
}

// 计算小节容量（以四分音符为单位）
export function getMeasureCapacity(meter: { count: number; unit: number }): number {
  // 小节容量 = 拍数 × (4 / 单位时值)
  // 例如：4/4 = 4 × (4/4) = 4 个四分音符
  //       6/8 = 6 × (4/8) = 3 个四分音符
  return meter.count * (4 / meter.unit);
}

// 创建空小节
export function createEmptyMeasure(): Measure {
  return { elements: [], durationUsed: 0 };
}

// 创建空谱表
export function createEmptyStaff(): Staff {
  const measures: Measure[] = [];
  for (let i = 0; i < INITIAL_MEASURES; i++) {
    measures.push(createEmptyMeasure());
  }
  return { clef: 'treble', keySignature: DEFAULT_KEY_SIGNATURE, measures };
}

// 创建默认乐谱
export function createDefaultScore(): Score {
  return {
    meter: { count: 4, unit: 4 },
    staves: [createEmptyStaff()]
  };
}

// 创建音符（单音）
export function createNote(
  midiPitch: number,
  duration: number,
  dots: number = 0,
  alter: -1 | 0 | 1 = 0
): Note {
  return {
    type: 'note',
    pitches: [{ midiPitch, alter }],
    duration,
    dots,
    tieStart: false,
    tieEnd: false
  };
}

// 创建和弦（多音）
export function createChord(
  pitches: { midiPitch: number; alter: number }[],
  duration: number,
  dots: number = 0
): Note {
  return {
    type: 'note',
    pitches: pitches.map(p => ({ midiPitch: p.midiPitch, alter: p.alter as -2 | -1 | 0 | 1 | 2 })),
    duration,
    dots,
    tieStart: false,
    tieEnd: false
  };
}

// 创建休止符
export function createRest(duration: number, dots: number = 0): Rest {
  return { type: 'rest', duration, dots };
}

// MIDI音高转换为音名和八度
// 优先使用降号表示法（Eb 而不是 D#），符合常见音乐记谱习惯
export function midiToPitch(midi: number): { name: string; oct: number; alter: number } {
  const oct = Math.floor((midi - 12) / 12);
  const semitone = ((midi - 12) % 12 + 12) % 12;
  
  // 直接映射半音到音名和变音记号
  // 优先使用降号（如 Eb 而不是 D#）
  const semitoneToNote: Record<number, { name: string; alter: number }> = {
    0:  { name: 'c', alter: 0 },   // C
    1:  { name: 'd', alter: -1 },  // Db (优先于 C#)
    2:  { name: 'd', alter: 0 },   // D
    3:  { name: 'e', alter: -1 },  // Eb (优先于 D#)
    4:  { name: 'e', alter: 0 },   // E
    5:  { name: 'f', alter: 0 },   // F
    6:  { name: 'g', alter: -1 },  // Gb (优先于 F#)
    7:  { name: 'g', alter: 0 },   // G
    8:  { name: 'a', alter: -1 },  // Ab (优先于 G#)
    9:  { name: 'a', alter: 0 },   // A
    10: { name: 'b', alter: -1 },  // Bb (优先于 A#)
    11: { name: 'b', alter: 0 },   // B
  };
  
  const note = semitoneToNote[semitone];
  return { name: note.name, oct, alter: note.alter };
}

// 音名和八度转换为MIDI音高
export function pitchToMidi(name: string, oct: number, alter: number = 0): number {
  const safeOct = Math.max(0, Math.min(9, oct));
  return 12 + safeOct * 12 + SEMITONES[name] + alter;
}

// 智能八度推断
export function inferOctave(noteName: string, prevMidiPitch: number | null): number {
  if (prevMidiPitch === null) return 4; // 默认中央C所在八度
  
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

// 计算时值（以四分音符为单位）
export function durationValue(dur: number, dots: number): number {
  const base = BEATS_PER_MEASURE / dur;
  let value = base;
  
  for (let i = 0; i < dots; i++) {
    value += base / Math.pow(2, i + 1);
  }
  
  return value;
}

// 计算小节剩余空间
export function remainingInMeasure(measure: Measure): number {
  return Math.max(0, BEATS_PER_MEASURE - measure.durationUsed);
}

// 获取前一个音符的MIDI音高（返回最后一个音高，用于八度推断）
export function getLastMidiPitch(
  staffIndex: number,
  measureIndex: number,
  elementIndex: number,
  score: Score
): number | null {
  const staff = score.staves[staffIndex];
  
  for (let m = measureIndex; m >= 0; m--) {
    const measure = staff.measures[m];
    const startIdx = (m === measureIndex) ? elementIndex - 1 : measure.elements.length - 1;
    
    for (let e = startIdx; e >= 0; e--) {
      const el = measure.elements[e];
      if (el.type === 'note') {
        const note = el as Note;
        // 返回最高音高（和弦中最后一个）
        if (note.pitches.length > 0) {
          return note.pitches[note.pitches.length - 1].midiPitch;
        }
      }
    }
  }
  
  return null;
}

// 获取VexFlow时值字符串
// VexFlow 格式：基础时值 + 附点(d) + 休止符(r)
// 例如：附点八分休止符 = '8dr'
export function getVexFlowDuration(dur: number, dots: number, type: 'note' | 'rest'): string {
  const map: Record<number, string> = {
    1: 'w', 2: 'h', 4: 'q', 8: '8', 16: '16'
  };
  
  let vfd = map[dur] || 'q';
  
  // 先添加附点
  for (let i = 0; i < dots; i++) {
    vfd += 'd';
  }
  
  // 最后添加休止符标记
  if (type === 'rest') {
    vfd += 'r';
  }
  
  return vfd;
}

// 生成LilyPond代码
export function generateLilyPond(score: Score): string {
  let ly = '\\version "2.24.0"\n\\score {\n <<\n';
  
  for (let s = 0; s < score.staves.length; s++) {
    const staff = score.staves[s];
    ly += ` \\new Staff {\n \\clef ${staff.clef === 'treble' ? 'treble' : 'bass'}\n \\time 4/4\n`;
    
    for (let m = 0; m < staff.measures.length; m++) {
      const measure = staff.measures[m];
      
      if (measure.elements.length === 0) {
        ly += ' R1\n';
      } else {
        let measureStr = ' ';
        
        for (const el of measure.elements) {
          if (el.type === 'rest') {
            measureStr += 'r' + el.duration + '.'.repeat(el.dots) + ' ';
          } else {
            const note = el as Note;
            const pitches = note.pitches;
            
            // 辅助函数：转换单个音高为LilyPond格式
            const pitchToLily = (p: { midiPitch: number; alter: number }) => {
              const pitch = midiToPitch(p.midiPitch);
              let noteName = pitch.name;
              
              // 处理升降号
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
                noteName += 'isis'; // 重升
              } else if (p.alter === -2) {
                if (pitch.name === 'a') {
                  noteName = 'ases';
                } else if (pitch.name === 'e') {
                  noteName = 'eeses';
                } else {
                  noteName += 'eses'; // 重降
                }
              }
              
              // 处理八度
              const octDiff = pitch.oct - 3;
              const octaveStr = octDiff > 0 ? "'".repeat(octDiff) : ','.repeat(-octDiff);
              
              return noteName + octaveStr;
            };
            
            // 生成音符/和弦
            if (pitches.length === 1) {
              // 单音
              measureStr += pitchToLily(pitches[0]) + el.duration + '.'.repeat(el.dots) + ' ';
            } else {
              // 和弦：<c e g>4
              measureStr += '<' + pitches.map(pitchToLily).join(' ') + '>' + el.duration + '.'.repeat(el.dots) + ' ';
            }
          }
        }
        
        ly += measureStr.trim() + '\n';
      }
    }
    
    ly += ' }\n';
  }
  
  return ly + ' >>\n}\n';
}

// ==========================================
// 流式推拉函数 (Stream Push/Pull)
// ==========================================

/**
 * 计算小节实际时值
 */
export function calculateMeasureDuration(measure: Measure): number {
  let total = 0;
  for (const el of measure.elements) {
    total += durationValue(el.duration, el.dots);
  }
  return total;
}

/**
 * 时值表（拍数 -> 音符时值）
 * 从大到小排序，用于找不超过目标的最大值
 */
const BEATS_TO_DURATION: [number, number][] = [
  [4, 1],   // 4拍 = 全音符
  [2, 2],   // 2拍 = 二分音符
  [1, 4],   // 1拍 = 四分音符
  [0.5, 8], // 0.5拍 = 八分音符
  [0.25, 16], // 0.25拍 = 十六分音符
];

/**
 * 找到指定拍数对应的音符时值
 * 优先级：精确匹配 > 附点匹配 > 不超过的最大值
 * @returns [时值, 附点数]
 */
function findDurationForBeats(beats: number): [number, number] {
  // 1. 尝试精确匹配（标准音符）
  for (const [b, d] of BEATS_TO_DURATION) {
    if (Math.abs(beats - b) < 0.001) {
      return [d, 0];
    }
  }

  // 2. 尝试附点音符（基础时值 * 1.5）
  for (const [b, d] of BEATS_TO_DURATION) {
    const dottedBeats = b * 1.5;
    if (Math.abs(beats - dottedBeats) < 0.001) {
      return [d, 1];
    }
  }

  // 3. 找不超过 beats 的最大标准时值
  for (const [b, d] of BEATS_TO_DURATION) {
    if (b <= beats + 0.001) {
      return [d, 0];
    }
  }

  // 4. beats 比所有标准时值都小，返回十六分音符
  return [16, 0];
}

/**
 * 分割音符
 * 将音符分割为两部分，第一部分为指定拍数，第二部分为剩余拍数
 * 自动添加延音线
 * 
 * @param note 要分割的音符
 * @param beatsForFirst 第一部分的拍数
 * @returns [第一部分, 第二部分] 或 null（无法分割）
 */
export function splitNoteWithDuration(note: Note, beatsForFirst: number): [Note, Note] | null {
  const totalBeats = durationValue(note.duration, note.dots);
  
  // 无法分割：目标时值太大或太小
  if (beatsForFirst <= 0 || beatsForFirst >= totalBeats) {
    return null;
  }

  const beatsForSecond = totalBeats - beatsForFirst;

  // 找到对应的音符时值
  const [dur1, dots1] = findDurationForBeats(beatsForFirst);
  const [dur2, dots2] = findDurationForBeats(beatsForSecond);

  // 验证时值匹配
  const actualBeats1 = durationValue(dur1, dots1);
  const actualBeats2 = durationValue(dur2, dots2);

  if (Math.abs(actualBeats1 + actualBeats2 - totalBeats) > 0.01) {
    // 无法精确分割，返回 null
    return null;
  }

  // 创建两个音符
  const first: Note = {
    ...note,
    duration: dur1,
    dots: dots1,
    tieStart: true,
    tieEnd: note.tieEnd, // 保留原来的 tieEnd
  };

  const second: Note = {
    ...note,
    duration: dur2,
    dots: dots2,
    tieStart: note.tieStart, // 保留原来的 tieStart
    tieEnd: true,
  };

  return [first, second];
}

/**
 * 合并两个带延音线的音符
 * 
 * @param first 第一个音符（应该有 tieStart）
 * @param second 第二个音符（应该有 tieEnd）
 * @returns 合并后的音符，或 null（无法合并）
 */
export function mergeTiedNotes(first: Note, second: Note): Note | null {
  // 检查是否能合并
  if (!first.tieStart || !second.tieEnd) {
    return null;
  }

  // 音高必须相同（比较 pitches 数组）
  if (!pitchesEqual(first.pitches, second.pitches)) {
    return null;
  }

  // 计算合并后的时值
  const totalBeats = durationValue(first.duration, first.dots) + 
                     durationValue(second.duration, second.dots);

  const [dur, dots] = findDurationForBeats(totalBeats);

  // 验证
  const actualBeats = durationValue(dur, dots);
  if (Math.abs(actualBeats - totalBeats) > 0.01) {
    return null;
  }

  // 创建合并后的音符
  return {
    ...first,
    duration: dur,
    dots,
    tieStart: false,
    tieEnd: false,
  };
}

/**
 * 比较两个 pitches 数组是否相同
 */
function pitchesEqual(a: { midiPitch: number; alter: number }[], b: { midiPitch: number; alter: number }[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].midiPitch !== b[i].midiPitch || a[i].alter !== b[i].alter) {
      return false;
    }
  }
  return true;
}

/**
 * 将超出的音符推到下一小节
 */
export function pushOverflowToNextMeasure(staff: Staff): Staff {
  const newMeasures = [...staff.measures];
  
  for (let m = 0; m < newMeasures.length; m++) {
    const measure = newMeasures[m];
    
    // 计算当前小节的实际时值
    let actualDuration = calculateMeasureDuration(measure);
    
    // 如果超出，从末尾移除音符推到下一小节
    while (actualDuration > BEATS_PER_MEASURE && measure.elements.length > 0) {
      const lastElement = measure.elements[measure.elements.length - 1];
      const lastDuration = durationValue(lastElement.duration, lastElement.dots);
      
      // 检查是否有下一小节
      if (m + 1 >= newMeasures.length) {
        // 没有下一小节，创建新小节
        newMeasures.push(createEmptyMeasure());
      }
      
      // 移除最后一个元素
      measure.elements = measure.elements.slice(0, -1);
      actualDuration -= lastDuration;
      measure.durationUsed = actualDuration;
      
      // 添加到下一小节的开头
      const nextMeasure = newMeasures[m + 1];
      nextMeasure.elements = [lastElement, ...nextMeasure.elements];
      nextMeasure.durationUsed += lastDuration;
      
      // 更新数组引用
      newMeasures[m] = { ...measure };
      newMeasures[m + 1] = { ...nextMeasure };
    }
  }
  
  return { ...staff, measures: newMeasures };
}

/**
 * 从下一小节拉音符填补空位
 */
export function pullNotesFromNextMeasure(staff: Staff): Staff {
  const newMeasures = [...staff.measures];
  
  for (let m = 0; m < newMeasures.length; m++) {
    const measure = newMeasures[m];
    const remaining = BEATS_PER_MEASURE - calculateMeasureDuration(measure);
    
    // 如果有空位，从下一小节拉音符
    if (remaining > 0 && m + 1 < newMeasures.length) {
      const nextMeasure = newMeasures[m + 1];
      
      while (nextMeasure.elements.length > 0 && calculateMeasureDuration(measure) < BEATS_PER_MEASURE) {
        const firstElement = nextMeasure.elements[0];
        const firstDuration = durationValue(firstElement.duration, firstElement.dots);
        
        // 检查是否能放入当前小节
        if (calculateMeasureDuration(measure) + firstDuration <= BEATS_PER_MEASURE) {
          // 从下一小节移除第一个元素
          nextMeasure.elements = nextMeasure.elements.slice(1);
          nextMeasure.durationUsed -= firstDuration;
          
          // 添加到当前小节末尾
          measure.elements = [...measure.elements, firstElement];
          measure.durationUsed += firstDuration;
          
          // 更新数组引用
          newMeasures[m] = { ...measure };
          newMeasures[m + 1] = { ...nextMeasure };
        } else {
          // 第一个元素放不下，停止拉
          break;
        }
      }
    }
  }
  
  return { ...staff, measures: newMeasures };
}

export interface BalanceOptions {
  fillRestOnFinal?: boolean;  // 最后小节不满时是否填休止符
}

/**
 * 平衡小节
 * 确保每个小节都满时值
 * 
 * 处理规则：
 * 1. 溢出时：推完整音符到下一小节，或分割带延音线
 * 2. 不满时：从下一小节拉完整音符，或分割带延音线
 * 3. 合并：如果遇到可以合并的延音线音符，自动合并
 */
export function balanceMeasures(
  staff: Staff,
  startFromMeasure: number = 0,
  options: BalanceOptions = {}
): Staff {
  let newMeasures = [...staff.measures];

  // 确保有下一小节可以推拉
  if (newMeasures.every(m => m.elements.length === 0)) {
    // 所有都是空小节，无需平衡
    return staff;
  }

  let changed: boolean;
  do {
    changed = false;
    
    // 从起始小节开始处理
    for (let m = startFromMeasure; m < newMeasures.length; m++) {
      // 先尝试向前合并（如果当前小节开头是 tieEnd）
      const mergedMeasures = tryMergeFromPrevious(newMeasures, m);
      if (mergedMeasures !== newMeasures) {
        newMeasures = mergedMeasures;
        changed = true;
      }

      // 计算当前时值
      const measure = newMeasures[m];
      let currentDuration = calculateMeasureDuration(measure);

      // 溢出处理
      while (currentDuration > BEATS_PER_MEASURE && measure.elements.length > 0) {
        const result = pushElementToNext(newMeasures, m);
        if (!result) break;
        newMeasures = result;
        currentDuration = calculateMeasureDuration(newMeasures[m]);
        changed = true;
      }

      // 不满处理
      const remaining = BEATS_PER_MEASURE - currentDuration;
      if (remaining > 0) {
        if (m + 1 < newMeasures.length && newMeasures[m + 1].elements.length > 0) {
          // 有下一小节，尝试拉入
          const pulledMeasures = pullFromNext(newMeasures, m);
          if (pulledMeasures !== newMeasures) {
            newMeasures = pulledMeasures;
            changed = true;
          }
        } else if (options.fillRestOnFinal && m === newMeasures.length - 1) {
          // 最后一个小节，填充休止符
          const filledMeasures = fillWithRests(newMeasures, m, remaining);
          if (filledMeasures !== newMeasures) {
            newMeasures = filledMeasures;
            changed = true;
          }
        }
      }
    }
  } while (changed);

  return { ...staff, measures: newMeasures };
}

/**
 * 尝试从前一个小节合并（当前小节开头是 tieEnd）
 */
function tryMergeFromPrevious(measures: Measure[], m: number): Measure[] {
  if (m === 0) return measures;

  const currentMeasure = measures[m];
  if (currentMeasure.elements.length === 0) return measures;

  const firstElement = currentMeasure.elements[0];
  if (firstElement.type !== 'note' || !firstElement.tieEnd) return measures;

  const prevMeasure = measures[m - 1];
  if (prevMeasure.elements.length === 0) return measures;

  const lastElement = prevMeasure.elements[prevMeasure.elements.length - 1];
  if (lastElement.type !== 'note' || !lastElement.tieStart) return measures;

  // 尝试合并
  const merged = mergeTiedNotes(lastElement as Note, firstElement as Note);
  if (!merged) return measures;

  // 计算合并后前一个小节的时长
  const newPrevElements = [...prevMeasure.elements.slice(0, -1), merged];
  const newPrevDuration = calculateMeasureDuration({ ...prevMeasure, elements: newPrevElements });

  // 关键检查：如果合并后前一个小节会溢出，不执行合并
  if (newPrevDuration > BEATS_PER_MEASURE) {
    return measures;
  }

  // 执行合并
  const newCurrentElements = currentMeasure.elements.slice(1);

  const newMeasures = [...measures];
  newMeasures[m - 1] = {
    ...prevMeasure,
    elements: newPrevElements,
    durationUsed: newPrevDuration,
  };
  newMeasures[m] = {
    ...currentMeasure,
    elements: newCurrentElements,
    durationUsed: calculateMeasureDuration({ ...currentMeasure, elements: newCurrentElements }),
  };

  return newMeasures;
}

/**
 * 将当前小节最后一个元素推到下一小节
 */
function pushElementToNext(measures: Measure[], m: number): Measure[] | null {
  const measure = measures[m];

  if (measure.elements.length === 0) return null;

  let lastElement = measure.elements[measure.elements.length - 1];
  const lastDuration = durationValue(lastElement.duration, lastElement.dots);

  // 确保有下一小节
  if (m + 1 >= measures.length) {
    measures = [...measures, createEmptyMeasure()];
  }

  // 检查最后一个音符是否是 tieEnd（与前一个音符有延音线）
  if (lastElement.type === 'note' && lastElement.tieEnd && measure.elements.length >= 2) {
    const secondLast = measure.elements[measure.elements.length - 2];
    if (secondLast.type === 'note' && secondLast.tieStart) {
      // 尝试合并
      const merged = mergeTiedNotes(secondLast as Note, lastElement as Note);
      if (merged) {
        // 合并成功，移除最后两个，添加合并后的，再推
        const newElements = [...measure.elements.slice(0, -2), merged];
        const newMeasures = [...measures];
        newMeasures[m] = {
          ...measure,
          elements: newElements,
          durationUsed: calculateMeasureDuration({ ...measure, elements: newElements }),
        };
        measures = newMeasures;
        // 继续推合并后的音符
        return pushElementToNext(measures, m);
      }
    }
    // 无法合并，清除 tieEnd 标记
    lastElement = { ...lastElement, tieEnd: false };
  }

  // 计算当前小节去掉最后一个元素后的时值
  const newDuration = calculateMeasureDuration(measure) - lastDuration;

  // 如果去掉后还是超，直接推
  if (newDuration >= BEATS_PER_MEASURE) {
    const newCurrentElements = measure.elements.slice(0, -1);
    const nextMeasure = measures[m + 1];

    const newMeasures = [...measures];
    newMeasures[m] = {
      ...measure,
      elements: newCurrentElements,
      durationUsed: newDuration,
    };
    newMeasures[m + 1] = {
      ...nextMeasure,
      elements: [lastElement, ...nextMeasure.elements],
      durationUsed: calculateMeasureDuration(nextMeasure) + lastDuration,
    };

    return newMeasures;
  }

  // 需要分割
  const remaining = BEATS_PER_MEASURE - newDuration;
  if (lastElement.type === 'note') {
    const split = splitNoteWithDuration(lastElement as Note, remaining);
    if (split) {
      const [first, second] = split;
      const nextMeasure = measures[m + 1];

      const newMeasures = [...measures];
      newMeasures[m] = {
        ...measure,
        elements: [...measure.elements.slice(0, -1), first],
        durationUsed: BEATS_PER_MEASURE,
      };
      newMeasures[m + 1] = {
        ...nextMeasure,
        elements: [second, ...nextMeasure.elements],
        durationUsed: calculateMeasureDuration(nextMeasure) + durationValue(second.duration, second.dots),
      };

      return newMeasures;
    }
  }

  // 无法分割，直接推
  const newCurrentElements = measure.elements.slice(0, -1);
  const nextMeasure = measures[m + 1];

  const newMeasures = [...measures];
  newMeasures[m] = {
    ...measure,
    elements: newCurrentElements,
    durationUsed: newDuration,
  };
  newMeasures[m + 1] = {
    ...nextMeasure,
    elements: [lastElement, ...nextMeasure.elements],
    durationUsed: calculateMeasureDuration(nextMeasure) + lastDuration,
  };

  return newMeasures;
}

/**
 * 从下一小节拉入元素填补空位
 */
function pullFromNext(measures: Measure[], m: number): Measure[] {
  const measure = measures[m];
  const remaining = BEATS_PER_MEASURE - calculateMeasureDuration(measure);

  if (remaining <= 0 || m + 1 >= measures.length) return measures;

  const nextMeasure = measures[m + 1];
  if (nextMeasure.elements.length === 0) return measures;

  const firstElement = nextMeasure.elements[0];
  const firstDuration = durationValue(firstElement.duration, firstElement.dots);

  // 检查当前小节末尾是否是 tieStart，下一小节开头是 tieEnd
  if (measure.elements.length > 0) {
    const lastInCurrent = measure.elements[measure.elements.length - 1];
    if (lastInCurrent.type === 'note' && lastInCurrent.tieStart &&
        firstElement.type === 'note' && firstElement.tieEnd &&
        pitchesEqual((lastInCurrent as Note).pitches, (firstElement as Note).pitches)) {
      // 合并延音线音符
      const merged = mergeTiedNotes(lastInCurrent as Note, firstElement as Note);
      if (merged) {
        const mergedDuration = durationValue(merged.duration, merged.dots);
        const currentDuration = calculateMeasureDuration(measure);
        const durationAfterMerge = currentDuration - durationValue(lastInCurrent.duration, lastInCurrent.dots) + mergedDuration;

        if (durationAfterMerge <= BEATS_PER_MEASURE) {
          const newMeasures = [...measures];
          newMeasures[m] = {
            ...measure,
            elements: [...measure.elements.slice(0, -1), merged],
            durationUsed: durationAfterMerge,
          };
          newMeasures[m + 1] = {
            ...nextMeasure,
            elements: nextMeasure.elements.slice(1),
            durationUsed: calculateMeasureDuration(nextMeasure) - firstDuration,
          };
          return newMeasures;
        }
      }
    }
  }

  // 普通拉入逻辑
  if (firstDuration <= remaining) {
    const newMeasures = [...measures];
    newMeasures[m] = {
      ...measure,
      elements: [...measure.elements, firstElement],
      durationUsed: calculateMeasureDuration(measure) + firstDuration,
    };
    newMeasures[m + 1] = {
      ...nextMeasure,
      elements: nextMeasure.elements.slice(1),
      durationUsed: calculateMeasureDuration(nextMeasure) - firstDuration,
    };
    return newMeasures;
  }

  // 需要分割
  if (firstElement.type === 'note') {
    const split = splitNoteWithDuration(firstElement as Note, remaining);
    if (split) {
      const [first, second] = split;
      const newMeasures = [...measures];
      newMeasures[m] = {
        ...measure,
        elements: [...measure.elements, first],
        durationUsed: BEATS_PER_MEASURE,
      };
      newMeasures[m + 1] = {
        ...nextMeasure,
        elements: [second, ...nextMeasure.elements.slice(1)],
        durationUsed: calculateMeasureDuration(nextMeasure) - firstDuration + durationValue(second.duration, second.dots),
      };
      return newMeasures;
    }
  }

  // 无法分割，保持原状
  return measures;
}

/**
 * 用休止符填充小节
 */
function fillWithRests(measures: Measure[], m: number, beats: number): Measure[] {
  const measure = measures[m];
  const newElements = [...measure.elements];

  // 找到合适的休止符
  let remaining = beats;
  while (remaining > 0) {
    const [dur, dots] = findDurationForBeats(remaining);
    const actualBeats = durationValue(dur, dots);

    if (actualBeats <= remaining) {
      newElements.push(createRest(dur, dots));
      remaining -= actualBeats;
    } else {
      break;
    }
  }

  const newMeasures = [...measures];
  newMeasures[m] = {
    ...measure,
    elements: newElements,
    durationUsed: calculateMeasureDuration({ ...measure, elements: newElements }),
  };

  return newMeasures;
}
