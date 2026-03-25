// Vimlypond 状态管理
import { create } from 'zustand';
import type { Score, CursorPosition, History, InputState, NoteRect, Language, Note, Measure, RepeatableAction, KeySignatureName, MeterName } from './types';
import {
  createDefaultScore,
  createEmptyStaff,
  createEmptyMeasure,
  createNote,
  createRest,
  inferOctave,
  pitchToMidi,
  durationValue,
  remainingInMeasure,
  getLastMidiPitch,
  getAlterForKey,
  getKeySignature,
  getMeter,
  BEATS_PER_MEASURE,
  INITIAL_MEASURES
} from './music';
import { generateLilyPond } from './music';

// 存储键
const STORAGE_KEY = 'vimlypond-score';
const LANG_KEY = 'vimlypond-lang';

interface VimlypondState {
  // 状态
  score: Score;
  cursorPos: CursorPosition;
  inputState: InputState;
  history: History;
  noteRects: NoteRect[];
  lang: Language;
  helpOpen: boolean;
  toastMessage: string;
  toastType: 'info' | 'success' | 'warning';
  toastVisible: boolean;
  lastAction: RepeatableAction | null;  // 上次可重复的操作
  
  // Actions
  setScore: (score: Score) => void;
  setCursorPos: (pos: Partial<CursorPosition>) => void;
  setInputState: (state: Partial<InputState>) => void;
  setNoteRects: (rects: NoteRect[]) => void;
  setLang: (lang: Language) => void;
  setHelpOpen: (open: boolean) => void;
  setLastAction: (action: RepeatableAction | null) => void;
  
  // 历史记录
  saveState: () => void;
  undo: () => boolean;
  redo: () => boolean;  // 新增重做
  
  // 存储
  saveToStorage: () => void;
  loadFromStorage: () => boolean;
  loadLanguage: () => void;
  
  // 乐谱操作
  addStaffBelow: () => void;
  addStaffAbove: () => void;
  toggleClef: () => void;
  changeKeySignature: (keyName: KeySignatureName) => void;  // 切换调号
  changeMeter: (meterName: MeterName) => void;  // 切换拍号
  deleteElement: () => void;
  moveToNextMeasure: () => void;
  clearScore: () => void;
  
  // 插入操作
  insertNote: (noteName: string) => void;
  addToChord: (noteName: string) => void;  // 添加音高到当前音符（构建和弦）
  insertRest: () => void;
  modifyDuration: (dur: number) => void;
  addDot: () => void;
  makeSharp: () => void;
  makeFlat: () => void;
  raiseOctave: () => void;  // 升八度
  lowerOctave: () => void;  // 降八度
  
  // 导航
  navigateUp: () => void;
  navigateDown: () => void;
  navigateLeft: () => void;   // 在当前小节内向左移动（选择前一个音符）
  navigateRight: () => void;  // 在当前小节内向右移动（选择后一个音符）
  navigatePrevMeasure: () => void;  // 跳转到上一小节
  navigateNextMeasure: () => void;  // 跳转到下一小节
  
  // 模式切换
  enterInsertMode: () => void;
  enterNormalMode: () => void;
  
  // 重复操作
  repeatLastAction: () => void;  // 重复上次操作（普通模式下 `.` 键）
  
  // Toast
  showToast: (message: string, type?: 'info' | 'success' | 'warning') => void;
  hideToast: () => void;
  
  // 导出
  exportLilyPond: () => void;
}

export const useVimlypondStore = create<VimlypondState>((set, get) => ({
  // 初始状态
  score: createDefaultScore(),
  cursorPos: {
    staffIndex: 0,
    measureIndex: 0,
    elementIndex: 0,
    mode: 'normal'
  },
  inputState: {
    pendingNote: null,
    lastDuration: 4,
    lastDots: 0
  },
  history: {
    past: [],
    future: []
  },
  noteRects: [],
  lang: 'zh',
  helpOpen: false,
  toastMessage: '',
  toastType: 'info',
  toastVisible: false,
  lastAction: null,
  
  // Setters
  setScore: (score) => set({ score }),
  setCursorPos: (pos) => set((state) => ({
    cursorPos: { ...state.cursorPos, ...pos }
  })),
  setInputState: (inputState) => set((state) => ({
    inputState: { ...state.inputState, ...inputState }
  })),
  setNoteRects: (rects) => set({ noteRects: rects }),
  setLang: (lang) => {
    localStorage.setItem(LANG_KEY, lang);
    set({ lang });
  },
  setHelpOpen: (open) => set({ helpOpen: open }),
  setLastAction: (action) => set({ lastAction: action }),
  
  // 历史记录
  saveState: () => {
    const { score, history } = get();
    const newPast = [...history.past, JSON.stringify(score)];
    if (newPast.length > 50) newPast.shift();
    set({ history: { past: newPast, future: [] } });
  },
  
  undo: () => {
    const { score, history } = get();
    if (history.past.length === 0) return false;
    
    const newFuture = [...history.future, JSON.stringify(score)];
    const newPast = [...history.past];
    const previousScore = JSON.parse(newPast.pop()!);
    
    set({
      score: previousScore,
      history: { past: newPast, future: newFuture }
    });
    return true;
  },
  
  redo: () => {
    const { score, history } = get();
    if (history.future.length === 0) return false;
    
    const newPast = [...history.past, JSON.stringify(score)];
    const newFuture = [...history.future];
    const nextScore = JSON.parse(newFuture.pop()!);
    
    set({
      score: nextScore,
      history: { past: newPast, future: newFuture }
    });
    return true;
  },
  
  // 存储
  saveToStorage: () => {
    try {
      const { score, cursorPos } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ score, cursorPos }));
    } catch (e) {
      // 忽略存储错误
    }
  },
  
  loadFromStorage: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.score && parsed.score.staves && parsed.score.staves.length > 0) {
          set({
            score: parsed.score,
            cursorPos: parsed.cursorPos || get().cursorPos
          });
          return true;
        }
      }
    } catch (e) {
      // 忽略加载错误
    }
    return false;
  },
  
  loadLanguage: () => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && (saved === 'zh' || saved === 'en')) {
      set({ lang: saved as Language });
    }
  },
  
  // 乐谱操作
  addStaffBelow: () => {
    get().saveState();
    const { score, cursorPos } = get();
    const newStaff = createEmptyStaff();
    const newStaves = [...score.staves];
    newStaves.splice(cursorPos.staffIndex + 1, 0, newStaff);
    
    set({
      score: { ...score, staves: newStaves },
      cursorPos: {
        ...cursorPos,
        staffIndex: cursorPos.staffIndex + 1,
        measureIndex: 0,
        elementIndex: 0
      }
    });
    get().showToast(`谱表 ${cursorPos.staffIndex + 2} 已添加`, 'success');
  },
  
  addStaffAbove: () => {
    get().saveState();
    const { score, cursorPos } = get();
    const newStaff = createEmptyStaff();
    const newStaves = [...score.staves];
    newStaves.splice(cursorPos.staffIndex, 0, newStaff);
    
    set({
      score: { ...score, staves: newStaves },
      cursorPos: { ...cursorPos, measureIndex: 0, elementIndex: 0 }
    });
    get().showToast(`谱表 ${cursorPos.staffIndex + 1} 已添加`, 'success');
  },
  
  toggleClef: () => {
    get().saveState();
    const { score, cursorPos, lang } = get();
    const staff = score.staves[cursorPos.staffIndex];
    const newClef = staff.clef === 'treble' ? 'bass' : 'treble';
    
    const newStaves = [...score.staves];
    newStaves[cursorPos.staffIndex] = { ...staff, clef: newClef };
    
    set({ score: { ...score, staves: newStaves }, lastAction: { type: 'toggleClef' } });
    get().showToast(
      newClef === 'treble' 
        ? (lang === 'zh' ? '谱号: 高音' : 'Clef: Treble (G)')
        : (lang === 'zh' ? '谱号: 低音' : 'Clef: Bass (F)'),
      'info'
    );
  },
  
  changeKeySignature: (keyName: KeySignatureName) => {
    get().saveState();
    const { score, cursorPos, lang } = get();
    const staff = score.staves[cursorPos.staffIndex];
    const newKeySignature = getKeySignature(keyName);
    
    const newStaves = [...score.staves];
    newStaves[cursorPos.staffIndex] = { ...staff, keySignature: newKeySignature };
    
    set({ score: { ...score, staves: newStaves } });
    
    // 格式化调号名称显示
    const displayName = keyName.replace('-', ' ');
    get().showToast(
      lang === 'zh' ? `调号: ${displayName}` : `Key: ${displayName}`,
      'info'
    );
  },
  
  changeMeter: (meterName: MeterName) => {
    get().saveState();
    const { score, lang } = get();
    const newMeter = getMeter(meterName);
    
    set({ score: { ...score, meter: newMeter } });
    get().showToast(
      lang === 'zh' ? `拍号: ${meterName}` : `Meter: ${meterName}`,
      'info'
    );
  },
  
  deleteElement: () => {
    const { score, cursorPos } = get();
    const measure = score.staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    
    if (cursorPos.elementIndex > 0 && measure.elements.length > 0) {
      get().saveState();
      const el = measure.elements[cursorPos.elementIndex - 1];
      const elDuration = durationValue(el.duration, el.dots);
      
      const newStaves = [...score.staves];
      const newMeasures = [...newStaves[cursorPos.staffIndex].measures];
      const newElements = [...newMeasures[cursorPos.measureIndex].elements];
      newElements.splice(cursorPos.elementIndex - 1, 1);
      
      newMeasures[cursorPos.measureIndex] = {
        elements: newElements,
        durationUsed: measure.durationUsed - elDuration
      };
      newStaves[cursorPos.staffIndex] = {
        ...newStaves[cursorPos.staffIndex],
        measures: newMeasures
      };
      
      set({
        score: { ...score, staves: newStaves },
        cursorPos: { ...cursorPos, elementIndex: cursorPos.elementIndex - 1 },
        lastAction: { type: 'deleteElement' }
      });
    }
  },
  
  moveToNextMeasure: () => {
    const { score, cursorPos } = get();
    const staff = score.staves[cursorPos.staffIndex];
    
    if (cursorPos.measureIndex < staff.measures.length - 1) {
      set({
        cursorPos: {
          ...cursorPos,
          measureIndex: cursorPos.measureIndex + 1,
          elementIndex: 0
        }
      });
    } else {
      get().saveState();
      const newStaves = score.staves.map(s => ({
        ...s,
        measures: [...s.measures, createEmptyMeasure()]
      }));
      
      set({
        score: { ...score, staves: newStaves },
        cursorPos: {
          ...cursorPos,
          measureIndex: cursorPos.measureIndex + 1,
          elementIndex: 0
        }
      });
    }
  },
  
  clearScore: () => {
    get().saveState();
    set({
      score: createDefaultScore(),
      cursorPos: {
        staffIndex: 0,
        measureIndex: 0,
        elementIndex: 0,
        mode: 'normal'
      }
    });
  },
  
  // 插入操作
  insertNote: (noteName: string) => {
    const { score, cursorPos, inputState } = get();
    const staff = score.staves[cursorPos.staffIndex];
    const measure = staff.measures[cursorPos.measureIndex];
    
    get().saveState();
    
    const lastPitch = getLastMidiPitch(
      cursorPos.staffIndex,
      cursorPos.measureIndex,
      cursorPos.elementIndex,
      score
    );
    const oct = inferOctave(noteName, lastPitch);
    
    // 获取调号中的默认升降号
    const alter = getAlterForKey(noteName, staff.keySignature);
    
    const note = createNote(
      pitchToMidi(noteName, oct, alter),
      inputState.lastDuration,
      inputState.lastDots,
      alter as -1 | 0 | 1
    );
    
    const noteValue = durationValue(note.duration, note.dots);
    
    if (noteValue <= remainingInMeasure(measure)) {
      const newStaves = [...score.staves];
      const newMeasures = [...newStaves[cursorPos.staffIndex].measures];
      const newElements = [...newMeasures[cursorPos.measureIndex].elements];
      newElements.splice(cursorPos.elementIndex, 0, note);
      
      newMeasures[cursorPos.measureIndex] = {
        elements: newElements,
        durationUsed: measure.durationUsed + noteValue
      };
      newStaves[cursorPos.staffIndex] = {
        ...newStaves[cursorPos.staffIndex],
        measures: newMeasures
      };
      
      const newElementIndex = cursorPos.elementIndex + 1;
      const shouldMoveToNext = newMeasures[cursorPos.measureIndex].durationUsed >= BEATS_PER_MEASURE;
      
      set({
        score: { ...score, staves: newStaves },
        cursorPos: { ...cursorPos, elementIndex: newElementIndex },
        inputState: { ...inputState, pendingNote: note, lastDots: 0 }
      });
      
      if (shouldMoveToNext) {
        get().moveToNextMeasure();
      }
    } else {
      get().showToast('小节空间不足', 'warning');
    }
  },
  
  addToChord: (noteName: string) => {
    // 添加音高到当前位置的前一个音符（构建和弦）
    const { score, cursorPos, inputState, lang } = get();
    
    // 需要在当前位置前面有音符
    if (cursorPos.elementIndex === 0) {
      get().showToast(lang === 'zh' ? '没有音符可添加音高' : 'No note to add pitch to', 'warning');
      return;
    }
    
    const measure = score.staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    const lastEl = measure.elements[cursorPos.elementIndex - 1];
    
    if (!lastEl || lastEl.type !== 'note') {
      get().showToast(lang === 'zh' ? '只能给音符添加音高' : 'Can only add pitch to notes', 'warning');
      return;
    }
    
    get().saveState();
    
    const note = lastEl as Note;
    
    // 获取最后一个音高作为参考（八度推断）
    const lastPitch = note.pitches.length > 0 ? note.pitches[note.pitches.length - 1].midiPitch : null;
    const oct = inferOctave(noteName, lastPitch);
    const newMidiPitch = pitchToMidi(noteName, oct, 0);
    
    // 检查是否已经存在相同音高
    if (note.pitches.some(p => p.midiPitch === newMidiPitch)) {
      get().showToast(lang === 'zh' ? '音高已存在于和弦中' : 'Pitch already in chord', 'warning');
      return;
    }
    
    // 添加新音高（保持排序：从低到高）
    const newPitches = [...note.pitches, { midiPitch: newMidiPitch, alter: 0 as const }]
      .sort((a, b) => a.midiPitch - b.midiPitch);
    
    const newStaves = [...score.staves];
    const newMeasures = [...newStaves[cursorPos.staffIndex].measures];
    const newElements = [...newMeasures[cursorPos.measureIndex].elements];
    newElements[cursorPos.elementIndex - 1] = {
      ...note,
      pitches: newPitches
    };
    
    newMeasures[cursorPos.measureIndex] = {
      ...newMeasures[cursorPos.measureIndex],
      elements: newElements
    };
    newStaves[cursorPos.staffIndex] = {
      ...newStaves[cursorPos.staffIndex],
      measures: newMeasures
    };
    
    set({
      score: { ...score, staves: newStaves },
      lastAction: { type: 'addToChord', noteName }
    });
  },
  
  insertRest: () => {
    const { score, cursorPos, inputState } = get();
    const staff = score.staves[cursorPos.staffIndex];
    const measure = staff.measures[cursorPos.measureIndex];
    
    get().saveState();
    
    const rest = createRest(inputState.lastDuration, inputState.lastDots);
    const restValue = durationValue(rest.duration, rest.dots);
    
    if (restValue <= remainingInMeasure(measure)) {
      const newStaves = [...score.staves];
      const newMeasures = [...newStaves[cursorPos.staffIndex].measures];
      const newElements = [...newMeasures[cursorPos.measureIndex].elements];
      newElements.splice(cursorPos.elementIndex, 0, rest);
      
      newMeasures[cursorPos.measureIndex] = {
        elements: newElements,
        durationUsed: measure.durationUsed + restValue
      };
      newStaves[cursorPos.staffIndex] = {
        ...newStaves[cursorPos.staffIndex],
        measures: newMeasures
      };
      
      const newElementIndex = cursorPos.elementIndex + 1;
      const shouldMoveToNext = newMeasures[cursorPos.measureIndex].durationUsed >= BEATS_PER_MEASURE;
      
      set({
        score: { ...score, staves: newStaves },
        cursorPos: { ...cursorPos, elementIndex: newElementIndex },
        inputState: { ...inputState, lastDots: 0 }
      });
      
      if (shouldMoveToNext) {
        get().moveToNextMeasure();
      }
    } else {
      get().showToast('小节空间不足', 'warning');
    }
  },
  
  modifyDuration: (dur: number) => {
    const { score, cursorPos, inputState } = get();
    const measure = score.staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    
    if (cursorPos.elementIndex > 0) {
      const lastEl = measure.elements[cursorPos.elementIndex - 1];
      if (lastEl && (lastEl.type === 'note' || lastEl.type === 'rest')) {
        get().saveState();
        
        const oldVal = durationValue(lastEl.duration, lastEl.dots);
        const newVal = durationValue(dur, lastEl.dots);
        
        if (newVal <= remainingInMeasure(measure) + oldVal) {
          const newStaves = [...score.staves];
          const newMeasures = [...newStaves[cursorPos.staffIndex].measures];
          const newElements = [...newMeasures[cursorPos.measureIndex].elements];
          newElements[cursorPos.elementIndex - 1] = { ...lastEl, duration: dur };
          
          newMeasures[cursorPos.measureIndex] = {
            elements: newElements,
            durationUsed: measure.durationUsed - oldVal + newVal
          };
          newStaves[cursorPos.staffIndex] = {
            ...newStaves[cursorPos.staffIndex],
            measures: newMeasures
          };
          
          set({
            score: { ...score, staves: newStaves },
            inputState: { ...inputState, lastDuration: dur },
            lastAction: { type: 'modifyDuration', duration: dur }
          });
        }
      }
    } else {
      set({ inputState: { ...inputState, lastDuration: dur } });
    }
  },
  
  addDot: () => {
    const { score, cursorPos, inputState } = get();
    const measure = score.staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    
    if (cursorPos.elementIndex > 0) {
      const lastEl = measure.elements[cursorPos.elementIndex - 1];
      if (lastEl && (lastEl.type === 'note' || lastEl.type === 'rest')) {
        get().saveState();
        
        const oldVal = durationValue(lastEl.duration, lastEl.dots);
        const newVal = durationValue(lastEl.duration, lastEl.dots + 1);
        
        if (newVal <= remainingInMeasure(measure) + oldVal) {
          const newStaves = [...score.staves];
          const newMeasures = [...newStaves[cursorPos.staffIndex].measures];
          const newElements = [...newMeasures[cursorPos.measureIndex].elements];
          newElements[cursorPos.elementIndex - 1] = { ...lastEl, dots: lastEl.dots + 1 };
          
          newMeasures[cursorPos.measureIndex] = {
            elements: newElements,
            durationUsed: measure.durationUsed - oldVal + newVal
          };
          newStaves[cursorPos.staffIndex] = {
            ...newStaves[cursorPos.staffIndex],
            measures: newMeasures
          };
          
          set({
            score: { ...score, staves: newStaves },
            inputState: { ...inputState, lastDots: lastEl.dots + 1 },
            lastAction: { type: 'addDot' }
          });
        }
      }
    }
  },
  
  makeSharp: () => {
    const { score, cursorPos } = get();
    const measure = score.staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    
    if (cursorPos.elementIndex > 0) {
      const lastEl = measure.elements[cursorPos.elementIndex - 1];
      if (lastEl && lastEl.type === 'note') {
        const note = lastEl as Note;
        // 修改最后一个音高
        const lastPitch = note.pitches[note.pitches.length - 1];
        if (lastPitch && lastPitch.alter < 1) {
          get().saveState();
          
          const newStaves = [...score.staves];
          const newMeasures = [...newStaves[cursorPos.staffIndex].measures];
          const newElements = [...newMeasures[cursorPos.measureIndex].elements];
          const newPitches = [...note.pitches];
          newPitches[newPitches.length - 1] = {
            midiPitch: lastPitch.midiPitch + 1,
            alter: (lastPitch.alter + 1) as -2 | -1 | 0 | 1 | 2
          };
          newElements[cursorPos.elementIndex - 1] = {
            ...note,
            pitches: newPitches
          };
          
          newMeasures[cursorPos.measureIndex] = {
            ...newMeasures[cursorPos.measureIndex],
            elements: newElements
          };
          newStaves[cursorPos.staffIndex] = {
            ...newStaves[cursorPos.staffIndex],
            measures: newMeasures
          };
          
          set({ score: { ...score, staves: newStaves }, lastAction: { type: 'makeSharp' } });
        }
      }
    }
  },
  
  makeFlat: () => {
    const { score, cursorPos } = get();
    const measure = score.staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    
    if (cursorPos.elementIndex > 0) {
      const lastEl = measure.elements[cursorPos.elementIndex - 1];
      if (lastEl && lastEl.type === 'note') {
        const note = lastEl as Note;
        // 修改最后一个音高
        const lastPitch = note.pitches[note.pitches.length - 1];
        if (lastPitch && lastPitch.alter > -1) {
          get().saveState();
          
          const newStaves = [...score.staves];
          const newMeasures = [...newStaves[cursorPos.staffIndex].measures];
          const newElements = [...newMeasures[cursorPos.measureIndex].elements];
          const newPitches = [...note.pitches];
          newPitches[newPitches.length - 1] = {
            midiPitch: lastPitch.midiPitch - 1,
            alter: (lastPitch.alter - 1) as -2 | -1 | 0 | 1 | 2
          };
          newElements[cursorPos.elementIndex - 1] = {
            ...note,
            pitches: newPitches
          };
          
          newMeasures[cursorPos.measureIndex] = {
            ...newMeasures[cursorPos.measureIndex],
            elements: newElements
          };
          newStaves[cursorPos.staffIndex] = {
            ...newStaves[cursorPos.staffIndex],
            measures: newMeasures
          };
          
          set({ score: { ...score, staves: newStaves }, lastAction: { type: 'makeFlat' } });
        }
      }
    }
  },
  
  raiseOctave: () => {
    // 升八度（LilyPond 语法中的 '）
    const { score, cursorPos, lang } = get();
    const measure = score.staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    
    if (cursorPos.elementIndex > 0) {
      const lastEl = measure.elements[cursorPos.elementIndex - 1];
      if (lastEl && lastEl.type === 'note') {
        const note = lastEl as Note;
        // 检查所有音高是否都能升八度
        const canRaise = note.pitches.every(p => p.midiPitch + 12 <= 127);
        if (canRaise && note.pitches.length > 0) {
          get().saveState();
          
          const newStaves = [...score.staves];
          const newMeasures = [...newStaves[cursorPos.staffIndex].measures];
          const newElements = [...newMeasures[cursorPos.measureIndex].elements];
          newElements[cursorPos.elementIndex - 1] = {
            ...note,
            pitches: note.pitches.map(p => ({ ...p, midiPitch: p.midiPitch + 12 }))
          };
          
          newMeasures[cursorPos.measureIndex] = {
            ...newMeasures[cursorPos.measureIndex],
            elements: newElements
          };
          newStaves[cursorPos.staffIndex] = {
            ...newStaves[cursorPos.staffIndex],
            measures: newMeasures
          };
          
          set({ score: { ...score, staves: newStaves }, lastAction: { type: 'raiseOctave' } });
          get().showToast(lang === 'zh' ? '升八度' : 'Octave up', 'info');
        }
      }
    }
  },
  
  lowerOctave: () => {
    // 降八度（LilyPond 语法中的 ,）
    const { score, cursorPos, lang } = get();
    const measure = score.staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    
    if (cursorPos.elementIndex > 0) {
      const lastEl = measure.elements[cursorPos.elementIndex - 1];
      if (lastEl && lastEl.type === 'note') {
        const note = lastEl as Note;
        // 检查所有音高是否都能降八度
        const canLower = note.pitches.every(p => p.midiPitch - 12 >= 0);
        if (canLower && note.pitches.length > 0) {
          get().saveState();
          
          const newStaves = [...score.staves];
          const newMeasures = [...newStaves[cursorPos.staffIndex].measures];
          const newElements = [...newMeasures[cursorPos.measureIndex].elements];
          newElements[cursorPos.elementIndex - 1] = {
            ...note,
            pitches: note.pitches.map(p => ({ ...p, midiPitch: p.midiPitch - 12 }))
          };
          
          newMeasures[cursorPos.measureIndex] = {
            ...newMeasures[cursorPos.measureIndex],
            elements: newElements
          };
          newStaves[cursorPos.staffIndex] = {
            ...newStaves[cursorPos.staffIndex],
            measures: newMeasures
          };
          
          set({ score: { ...score, staves: newStaves }, lastAction: { type: 'lowerOctave' } });
          get().showToast(lang === 'zh' ? '降八度' : 'Octave down', 'info');
        }
      }
    }
  },
  
  // 导航
  navigateUp: () => {
    const { score, cursorPos } = get();
    if (cursorPos.staffIndex > 0) {
      const newStaffIndex = cursorPos.staffIndex - 1;
      const targetStaff = score.staves[newStaffIndex];
      // 找到有音符的小节
      let newMeasureIndex = cursorPos.measureIndex;
      if (newMeasureIndex >= targetStaff.measures.length) {
        newMeasureIndex = targetStaff.measures.length - 1;
      }
      // 确保光标绑定到有效音符位置
      const targetMeasure = targetStaff.measures[newMeasureIndex];
      const newElementIndex = Math.min(cursorPos.elementIndex, targetMeasure.elements.length);
      set({
        cursorPos: { 
          ...cursorPos, 
          staffIndex: newStaffIndex, 
          measureIndex: newMeasureIndex,
          elementIndex: newElementIndex
        }
      });
    }
  },
  
  navigateDown: () => {
    const { score, cursorPos } = get();
    if (cursorPos.staffIndex < score.staves.length - 1) {
      const newStaffIndex = cursorPos.staffIndex + 1;
      const targetStaff = score.staves[newStaffIndex];
      // 找到有音符的小节
      let newMeasureIndex = cursorPos.measureIndex;
      if (newMeasureIndex >= targetStaff.measures.length) {
        newMeasureIndex = targetStaff.measures.length - 1;
      }
      // 确保光标绑定到有效音符位置
      const targetMeasure = targetStaff.measures[newMeasureIndex];
      const newElementIndex = Math.min(cursorPos.elementIndex, targetMeasure.elements.length);
      set({
        cursorPos: { 
          ...cursorPos, 
          staffIndex: newStaffIndex,
          measureIndex: newMeasureIndex,
          elementIndex: newElementIndex
        }
      });
    }
  },
  
  navigateLeft: () => {
    // 在当前小节内向左移动（选择前一个音符）
    const { cursorPos } = get();
    if (cursorPos.elementIndex > 0) {
      set({
        cursorPos: { ...cursorPos, elementIndex: cursorPos.elementIndex - 1 }
      });
    }
  },
  
  navigateRight: () => {
    // 在当前小节内向右移动（选择后一个音符）
    const { score, cursorPos } = get();
    const measure = score.staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    // 光标只能在 0 到 elements.length 之间移动，且要绑定到音符
    if (cursorPos.elementIndex < measure.elements.length) {
      set({
        cursorPos: { ...cursorPos, elementIndex: cursorPos.elementIndex + 1 }
      });
    }
  },
  
  navigatePrevMeasure: () => {
    // 跳转到上一小节的第一个音符
    const { score, cursorPos } = get();
    if (cursorPos.measureIndex > 0) {
      set({
        cursorPos: {
          ...cursorPos,
          measureIndex: cursorPos.measureIndex - 1,
          elementIndex: 0  // 跳转到第一个音符
        }
      });
    }
  },
  
  navigateNextMeasure: () => {
    // 跳转到下一小节的第一个音符
    const { score, cursorPos, lang } = get();
    const staff = score.staves[cursorPos.staffIndex];
    
    if (cursorPos.measureIndex < staff.measures.length - 1) {
      set({
        cursorPos: { ...cursorPos, measureIndex: cursorPos.measureIndex + 1, elementIndex: 0 }
      });
    } else {
      // 如果是最后一小节，自动添加新小节
      get().saveState();
      const newStaves = score.staves.map(s => ({
        ...s,
        measures: [...s.measures, createEmptyMeasure()]
      }));
      
      set({
        score: { ...score, staves: newStaves },
        cursorPos: { ...cursorPos, measureIndex: cursorPos.measureIndex + 1, elementIndex: 0 }
      });
      get().showToast(lang === 'zh' ? '新小节已添加' : 'New measure added', 'info');
    }
  },
  
  // 模式切换
  enterInsertMode: () => {
    const { cursorPos, inputState } = get();
    set({
      cursorPos: { ...cursorPos, mode: 'insert' },
      inputState: { ...inputState, pendingNote: null }
    });
  },
  
  enterNormalMode: () => {
    const { cursorPos, inputState } = get();
    set({
      cursorPos: { ...cursorPos, mode: 'normal' },
      inputState: { ...inputState, pendingNote: null }
    });
  },
  
  // 重复上次操作（普通模式下 `.` 键）
  repeatLastAction: () => {
    const { lastAction } = get();
    if (!lastAction) return;
    
    switch (lastAction.type) {
      case 'deleteElement':
        get().deleteElement();
        break;
      case 'modifyDuration':
        get().modifyDuration(lastAction.duration);
        break;
      case 'addDot':
        get().addDot();
        break;
      case 'makeSharp':
        get().makeSharp();
        break;
      case 'makeFlat':
        get().makeFlat();
        break;
      case 'raiseOctave':
        get().raiseOctave();
        break;
      case 'lowerOctave':
        get().lowerOctave();
        break;
      case 'toggleClef':
        get().toggleClef();
        break;
      case 'insertRest': {
        const { inputState } = get();
        // 临时设置时值和附点
        const prevDuration = inputState.lastDuration;
        const prevDots = inputState.lastDots;
        set({ inputState: { ...inputState, lastDuration: lastAction.duration, lastDots: lastAction.dots } });
        get().insertRest();
        // 恢复之前的状态
        set({ inputState: { ...get().inputState, lastDuration: prevDuration, lastDots: prevDots } });
        break;
      }
      case 'insertNote': {
        const { inputState } = get();
        const prevDuration = inputState.lastDuration;
        const prevDots = inputState.lastDots;
        set({ inputState: { ...inputState, lastDuration: lastAction.duration, lastDots: lastAction.dots } });
        get().insertNote(lastAction.noteName);
        set({ inputState: { ...get().inputState, lastDuration: prevDuration, lastDots: prevDots } });
        break;
      }
      case 'addToChord':
        get().addToChord(lastAction.noteName);
        break;
    }
  },
  
  // Toast
  showToast: (message, type = 'info') => {
    set({ toastMessage: message, toastType: type, toastVisible: true });
    setTimeout(() => {
      set({ toastVisible: false });
    }, 2000);
  },
  
  hideToast: () => set({ toastVisible: false }),
  
  // 导出
  exportLilyPond: () => {
    const { score, lang } = get();
    const ly = generateLilyPond(score);
    const blob = new Blob([ly], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'score.ly';
    a.click();
    URL.revokeObjectURL(a.href);
    get().showToast(lang === 'zh' ? '已导出至 score.ly' : 'Exported to score.ly', 'success');
  }
}));
