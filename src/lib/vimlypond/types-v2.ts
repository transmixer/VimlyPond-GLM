// Vimlypond v2 类型定义
// 参考 MusicXML 设计理念，但针对实时编辑场景优化

// ========== 核心类型 ==========

// 单个音高（用于和弦中的每个音）
export interface Pitch {
  midiPitch: number;        // MIDI音高编号 (60 = C4)
  alter: -2 | -1 | 0 | 1 | 2;   // 变音记号
}

// 力度类型
export type DynamicsType = 'pp' | 'p' | 'mp' | 'mf' | 'f' | 'ff' | 'ppp' | 'fff' | 'sf' | 'fp' | 'sfz';

// 演奏法类型
export type ArticulationType = 'staccato' | 'marcato' | 'accent' | 'tenuto' | 'staccatissimo';

// 装饰音类型
export type OrnamentType = 'trill' | 'mordent' | 'turn' | 'grace';

// 演奏法
export interface Articulation {
  type: ArticulationType;
  position: 'above' | 'below';
}

// 装饰音
export interface Ornament {
  type: OrnamentType;
  isAcciaccatura?: boolean;  // 小倚音（true = \, false = 普通倚音）
}

// 音符元素（叶子节点）
export interface Note {
  type: 'note';
  id: string;                              // 唯一标识，用于引用（如延音线）
  pitches: Pitch[];                        // 音高数组（单音为1个元素，和弦为多个）
  duration: number;                        // 时值 (1, 2, 4, 8, 16)
  dots: number;                            // 附点数量
  tieStart?: string;                       // 指向结束音符的 id
  tieEnd?: string;                         // 指向开始音符的 id
  articulations: Articulation[];            // 演奏法数组
  dynamics?: DynamicsType;                  // 力度标记
  ornaments?: Ornament[];                   // 装饰音数组
}

// 休止符
export interface Rest {
  type: 'rest';
  duration: number;
  dots: number;
}

// 连音组
export interface Tuplet {
  type: 'tuplet';
  id: string;
  actualNotes: number;      // 实际时值数量（如 3 表示三连音）
  normalNotes: number;      // 占用时值（如 2 表示当成 2 个音符）
  elements: MusicElement[]; // 连音内的音符
}

// 装饰音组（倚音等）
export interface GraceNote {
  type: 'grace';
  isAcciaccatura: boolean;  // true = 小倚音 \，false = 普通倚音
  notes: Note[];
}

// 小节线
export interface Barline {
  type: 'barline';
  barType: BarlineType;
}

// 小节线类型
export type BarlineType = 'single' | 'double' | 'end' | 'repeat-start' | 'repeat-end';

// 音乐元素联合类型（支持嵌套）
export type MusicElement = Note | Rest | Tuplet | GraceNote | Barline;

// ========== 声部系统 ==========

// 单个声部
export interface Voice {
  id: string;
  name?: string;                        // "Voice 1", "Bass"
  elements: MusicElement[];
}

// 小节级属性（可覆盖谱表级）
export interface MeasureAttributes {
  keySignature?: KeySignature;
  meter?: Meter;
  clef?: ClefType;
}

// 小节（支持多声部）
export interface Measure {
  voices: Voice[];                       // 多声部数组
  durationUsed: number;                  // 已占用时值
  attributes?: MeasureAttributes;        // 小节级属性
}

// ========== 谱表系统 ==========

// 谱号类型
export type ClefType = 'treble' | 'bass';

// 调号类型（大调调号）
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

// 拍号
export interface Meter {
  count: number;  // 每小节拍数
  unit: number;   // 一拍的时值单位
}

// 常用拍号名称
export type MeterName =
  | '2/4' | '3/4' | '4/4' | '5/4' | '6/4' | '7/4'
  | '2/2' | '3/2' | '4/2'
  | '3/8' | '6/8' | '9/8' | '12/8';

// 谱表
export interface Staff {
  id: string;
  clef: ClefType;
  keySignature: KeySignature;
  measures: Measure[];
}

// 谱表组类型
export type StaffGroupType = 'staffGroup' | 'pianoGrand' | 'orchestra';

// 谱表组（钢琴谱、乐队总谱）
export interface StaffGroup {
  type: StaffGroupType;
  staves: Staff[];
  bracket?: boolean;                   // 是否用大括号连接
  brace?: boolean;                     // 是否用花括号
}

// ========== 乐谱 ==========

// 乐谱头信息
export interface ScoreHeader {
  title?: string;
  composer?: string;
  arranger?: string;
  copyright?: string;
}

// 乐谱
export interface Score {
  header: ScoreHeader;
  tempo?: number;                       // BPM
  meter: Meter;
  groups: StaffGroup[];                 // 谱表组数组
}

// ========== 光标和状态 ==========

// 光标位置
export interface CursorPosition {
  staffIndex: number;
  measureIndex: number;
  voiceIndex: number;
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
  voiceIndex: number;
  elementIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ========== v1 兼容类型（迁移用）==========

// v1 的 MeasureElement
export type V1MeasureElement = Note | Rest;

// v1 的 Measure
export interface V1Measure {
  elements: V1MeasureElement[];
  durationUsed: number;
}

// v1 的 Staff
export interface V1Staff {
  clef: ClefType;
  keySignature: KeySignature;
  measures: V1Measure[];
}

// v1 的 Score
export interface V1Score {
  meter: Meter;
  staves: V1Staff[];
}
