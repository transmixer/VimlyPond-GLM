/**
 * VexFlow 类型定义
 * 用于替代运行时的 `as unknown as` 断言
 */

// ===== 核心类型 =====

export interface VexFlowBoundingBox {
  getX: () => number;
  getY: () => number;
  getW: () => number;
  getH: () => number;
}

export interface VexFlowNote {
  addModifier: (modifier: VexFlowModifier) => void;
  addDotToAll: () => void;
  getBoundingBox: () => VexFlowBoundingBox | null;
}

export type VexFlowModifier = object; // Accidental, Articulation 等的基类

export type VexFlowAccidental = VexFlowModifier;

export interface VexFlowStave {
  addClef: (clef: string) => VexFlowStave;
  addTimeSignature: (time: string) => VexFlowStave;
  setContext: (context: VexFlowContext) => VexFlowStave;
  draw: () => void;
  clef: string;
}

export interface VexFlowVoice {
  setStrict: (strict: boolean) => VexFlowVoice;
  addTickables: (notes: VexFlowNote[]) => VexFlowVoice;
  draw: (context: VexFlowContext, stave: VexFlowStave) => void;
}

export interface VexFlowFormatter {
  joinVoices: (voices: VexFlowVoice[]) => VexFlowFormatter;
  format: (voices: VexFlowVoice[], width: number) => VexFlowFormatter;
}

export interface VexFlowStaveTie {
  setContext: (context: VexFlowContext) => VexFlowStaveTie;
  draw: () => void;
}

export interface VexFlowContext {
  setFont: (font: string, size: number) => VexFlowContext;
}

export interface VexFlowRenderer {
  resize: (width: number, height: number) => void;
  getContext: () => VexFlowContext;
}

// ===== 构造函数类型 =====

export interface VexFlowStaveConstructor {
  new (x: number, y: number, width: number): VexFlowStave;
}

export interface VexFlowStaveNoteConstructor {
  new (options: {
    keys: string[];
    duration: string;
    auto_stem?: boolean;
    clef?: string;
  }): VexFlowNote;
}

export interface VexFlowVoiceConstructor {
  new (options: { num_beats: number; beat_value: number }): VexFlowVoice;
}

export interface VexFlowFormatterConstructor {
  new (): VexFlowFormatter;
}

export interface VexFlowAccidentalConstructor {
  new (type: string): VexFlowAccidental;
}

export interface VexFlowStaveTieConstructor {
  new (options: { notes: VexFlowNote[] }): VexFlowStaveTie;
}

export interface VexFlowRendererConstructor {
  new (container: HTMLElement, backend: number): VexFlowRenderer;
  Backends: { SVG: number };
}

// ===== Vex.Flow 命名空间 =====

export interface VexFlowAPI {
  Renderer: VexFlowRendererConstructor & { Backends: { SVG: number } };
  Stave: VexFlowStaveConstructor;
  StaveNote: VexFlowStaveNoteConstructor;
  Voice: VexFlowVoiceConstructor;
  Formatter: VexFlowFormatterConstructor;
  Accidental: VexFlowAccidentalConstructor;
  StaveTie: VexFlowStaveTieConstructor;
}

export interface VexGlobal {
  Flow: VexFlowAPI;
}

// ===== Window 扩展 =====

declare global {
  interface Window {
    Vex?: VexGlobal;
  }
}

// ===== 辅助函数 =====

/**
 * 安全获取 VexFlow API
 */
export function getVexFlow(): VexFlowAPI | null {
  if (typeof window === 'undefined') return null;
  return window.Vex?.Flow ?? null;
}

/**
 * 检查 VexFlow 是否已加载
 */
export function isVexFlowReady(): boolean {
  return typeof window !== 'undefined' && !!window.Vex?.Flow;
}
