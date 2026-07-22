// Vimlypond 类型定义

// 常用拍号名称
export type MeterName = 
  | '2/4' | '3/4' | '4/4' | '5/4' | '6/4' | '7/4'
  | '2/2' | '3/2' | '4/2'
  | '3/8' | '6/8' | '9/8' | '12/8';

// 拍号
export interface Meter {
  count: number;  // 每小节拍数
  unit: number;   // 一拍的时值单位
}

// 调号类型（大调调号）
// 格式：调名 + 'major' 或 'minor'
export type KeySignatureName = 
  | 'C-major' | 'G-major' | 'D-major' | 'A-major' | 'E-major' | 'B-major' | 'F#-major' | 'C#-major'
  | 'F-major' | 'Bb-major' | 'Eb-major' | 'Ab-major' | 'Db-major' | 'Gb-major' | 'Cb-major'
  | 'A-minor' | 'E-minor' | 'B-minor' | 'F#-minor' | 'C#-minor' | 'G#-minor' | 'D#-minor' | 'A#-minor'
  | 'D-minor' | 'G-minor' | 'C-minor' | 'F-minor' | 'Bb-minor' | 'Eb-minor' | 'Ab-minor';

// 调号信息
export interface KeySignature {
  name: KeySignatureName;
  sharps: number;   // 升号数量 (0-7)
  flats: number;    // 降号数量 (0-7)
}

// 单个音高（用于和弦中的每个音）
export interface Pitch {
  midiPitch: number;        // MIDI音高编号 (60 = C4)
  alter: -2 | -1 | 0 | 1 | 2;   // 变音记号
}

// 音符（可包含多个音高，形成和弦）
export interface Note {
  type: 'note';
  pitches: Pitch[];         // 音高数组（单音为1个元素，和弦为多个）
  duration: number;         // 时值 (1, 2, 4, 8, 16)
  dots: number;             // 附点数量
  tieStart?: boolean;       // 连音线开始
  tieEnd?: boolean;         // 连音线结束
  tuplet?: {                // 连音 (三连音、五连音等)
    ratio: [number, number]; // 比例: [3, 2] 表示 3连音代替2个
  };
  dynamics?: string;        // 力度标记 (p, mp, mf, f 等)
  articulation?: string;     // 演奏法标记 (staccato, accent 等)
  ornament?: string;        // 装饰音 (trill, grace 等)
}

// 休止符
export interface Rest {
  type: 'rest';
  duration: number;
  dots: number;
}

// 小节线类型
export type BarLineType = 'single' | 'double' | 'final' | 'repeat-start' | 'repeat-end';

// 反复记号
export interface RepeatInfo {
  start?: boolean;    // 反复开始
  end?: boolean;      // 反复结束
  count?: number;     // 反复次数，默认 2
}

// 小节线标记（作为独立元素存在于小节边界）
export interface BarLine {
  type: 'barline';
  barType: BarLineType;
  repeat?: RepeatInfo;
}

// 所有可能的小节元素类型
// 使用标签联合(tagged union)方便扩展新类型
export type MeasureElement = Note | Rest | BarLine;

// 小节
export interface Measure {
  elements: MeasureElement[];
  durationUsed: number;  // 已占用时值
  barlineLeft?: BarLineType;   // 左侧小节线类型
  barlineRight?: BarLineType;  // 右侧小节线类型
  repeat?: RepeatInfo;          // 反复信息
}

// 谱号类型
export type ClefType = 'treble' | 'bass';

// 谱表
export interface Staff {
  clef: ClefType;
  keySignature: KeySignature;  // 调号
  measures: Measure[];
}

// 乐谱
export interface Score {
  version: number;       // 序列化版本号，用于数据迁移
  meter: Meter;
  staves: Staff[];
  title?: string;        // 乐谱标题
  composer?: string;     // 作曲者
}

// 光标位置
export interface CursorPosition {
  staffIndex: number;
  measureIndex: number;
  elementIndex: number;
  mode: 'normal' | 'insert';
}

// 历史记录
export interface History {
  past: string[];
  future: string[];
}

// 输入状态
export interface InputState {
  pendingNote: Note | null;
  lastDuration: number;
  lastDots: number;
}

// 音符矩形（用于光标定位）
export interface NoteRect {
  staffIndex: number;
  measureIndex: number;
  elementIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// 翻译字典类型
export interface Translations {
  [key: string]: string;
}

// 语言类型
export type Language = 'zh' | 'en';

// ========== Command 模式 ==========

// 命令接口 - 所有可执行操作都实现此接口
export interface Command {
  description: string;        // 命令描述（用于日志/调试）
  execute: (state: { score: Score; cursorPos: CursorPosition }) => {
    score: Score;
    cursorPos: CursorPosition;
  };
  // 命令是否可合并到历史（比如连续输入同一个音符的每个音高应该合并为一步）
  shouldMergeWith?: (prev: Command) => boolean;
}

// 可重复的操作类型（普通模式下可执行的修改操作）
// 保留用于兼容，后续逐步迁移到 Command 模式
export type RepeatableAction =
  | { type: 'deleteElement' }
  | { type: 'modifyDuration'; duration: number }
  | { type: 'addDot' }
  | { type: 'makeSharp' }
  | { type: 'makeFlat' }
  | { type: 'raiseOctave' }
  | { type: 'lowerOctave' }
  | { type: 'toggleClef' }
  | { type: 'insertRest'; duration: number; dots: number }
  | { type: 'insertNote'; noteName: string; duration: number; dots: number }
  | { type: 'addToChord'; noteName: string };
