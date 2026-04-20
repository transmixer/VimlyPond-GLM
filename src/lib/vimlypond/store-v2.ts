// Vimlypond v2 状态管理
import { create } from 'zustand';
import type {
  Score,
  CursorPosition,
  InputState,
  NoteRect,
  Language,
  Note,
  KeySignatureName,
  MeterName,
  Staff,
  Measure,
  Voice,
  MusicElement,
  BarlineType,
} from './types-v2';
import {
  createDefaultScore,
  createEmptyStaff,
  createEmptyMeasure,
  createSingleNote,
  createRest,
  createBarline,
  inferOctave,
  pitchToMidi,
  durationValue,
  remainingInMeasure,
  getAlterForKey,
  getKeySignature,
  getMeter,
  generateNoteId,
  elementBeats,
  BEATS_PER_MEASURE,
} from './music-v2';
import { generateLilyPond } from './music-v2';

const STORAGE_KEY = 'vimlypond-score-v2';
const LANG_KEY = 'vimlypond-lang';

export interface RepeatableAction {
  type: 'deleteElement' | 'modifyDuration' | 'addDot' | 'makeSharp' | 'makeFlat' |
        'raiseOctave' | 'lowerOctave' | 'toggleClef' | 'insertRest' |
        'insertNote' | 'addToChord' | 'setBarline';
  duration?: number;
  dots?: number;
  noteName?: string;
  barlineType?: BarlineType;
}

interface VimlypondStateV2 {
  score: Score;
  cursorPos: CursorPosition;
  inputState: InputState;
  history: { past: string[]; future: string[] };
  noteRects: NoteRect[];
  lang: Language;
  helpOpen: boolean;
  toastMessage: string;
  toastType: 'info' | 'success' | 'warning';
  toastVisible: boolean;
  lastAction: RepeatableAction | null;

  setScore: (score: Score) => void;
  setCursorPos: (pos: Partial<CursorPosition>) => void;
  setInputState: (state: Partial<InputState>) => void;
  setNoteRects: (rects: NoteRect[]) => void;
  setLang: (lang: Language) => void;
  setHelpOpen: (open: boolean) => void;
  setLastAction: (action: RepeatableAction | null) => void;

  saveState: () => void;
  undo: () => boolean;
  redo: () => boolean;

  saveToStorage: () => void;
  loadFromStorage: () => boolean;
  loadLanguage: () => void;

  addStaffBelow: () => void;
  addStaffAbove: () => void;
  toggleClef: () => void;
  changeKeySignature: (keyName: KeySignatureName) => void;
  changeMeter: (meterName: MeterName) => void;
  setBarlineType: (barType: BarlineType) => void;
  deleteElement: () => void;
  moveToNextMeasure: () => void;
  clearScore: () => void;

  insertNote: (noteName: string) => void;
  addToChord: (noteName: string) => void;
  insertRest: () => void;
  modifyDuration: (dur: number) => void;
  addDot: () => void;
  makeSharp: () => void;
  makeFlat: () => void;
  raiseOctave: () => void;
  lowerOctave: () => void;

  navigateUp: () => void;
  navigateDown: () => void;
  navigateLeft: () => void;
  navigateRight: () => void;
  navigatePrevMeasure: () => void;
  navigateNextMeasure: () => void;

  enterInsertMode: () => void;
  enterNormalMode: () => void;
  repeatLastAction: () => void;

  showToast: (message: string, type?: 'info' | 'success' | 'warning') => void;
  hideToast: () => void;

  exportLilyPond: () => void;
}

export const useVimlypondStoreV2 = create<VimlypondStateV2>((set, get) => ({
  score: createDefaultScore(),
  cursorPos: {
    staffIndex: 0,
    measureIndex: 0,
    voiceIndex: 0,
    elementIndex: 0,
    mode: 'normal'
  },
  inputState: {
    pendingNote: null,
    lastDuration: 4,
    lastDots: 0
  },
  history: { past: [], future: [] },
  noteRects: [],
  lang: 'zh',
  helpOpen: false,
  toastMessage: '',
  toastType: 'info',
  toastVisible: false,
  lastAction: null,

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
    set({ score: previousScore, history: { past: newPast, future: newFuture } });
    return true;
  },

  redo: () => {
    const { score, history } = get();
    if (history.future.length === 0) return false;
    const newPast = [...history.past, JSON.stringify(score)];
    const newFuture = [...history.future];
    const nextScore = JSON.parse(newFuture.pop()!);
    set({ score: nextScore, history: { past: newPast, future: newFuture } });
    return true;
  },

  saveToStorage: () => {
    try {
      const { score, cursorPos } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ score, cursorPos }));
    } catch (e) {}
  },

  loadFromStorage: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.score && parsed.score.groups && parsed.score.groups.length > 0) {
          set({ score: parsed.score, cursorPos: parsed.cursorPos || get().cursorPos });
          return true;
        }
      }
    } catch (e) {}
    return false;
  },

  loadLanguage: () => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && (saved === 'zh' || saved === 'en')) {
      set({ lang: saved as Language });
    }
  },

  addStaffBelow: () => {
    get().saveState();
    const { score, cursorPos } = get();
    const newStaff = createEmptyStaff();
    const newGroups = score.groups.map(g => ({
      ...g,
      staves: [...g.staves.slice(0, cursorPos.staffIndex + 1), newStaff, ...g.staves.slice(cursorPos.staffIndex + 1)]
    }));
    set({
      score: { ...score, groups: newGroups },
      cursorPos: { ...cursorPos, staffIndex: cursorPos.staffIndex + 1, measureIndex: 0, elementIndex: 0 }
    });
  },

  addStaffAbove: () => {
    get().saveState();
    const { score, cursorPos } = get();
    const newStaff = createEmptyStaff();
    const newGroups = score.groups.map(g => ({
      ...g,
      staves: [...g.staves.slice(0, cursorPos.staffIndex), newStaff, ...g.staves.slice(cursorPos.staffIndex)]
    }));
    set({
      score: { ...score, groups: newGroups },
      cursorPos: { ...cursorPos, measureIndex: 0, elementIndex: 0 }
    });
  },

  toggleClef: () => {
    get().saveState();
    const { score, cursorPos, lang } = get();
    const staff = score.groups[0].staves[cursorPos.staffIndex];
    const newClef = staff.clef === 'treble' ? 'bass' : 'treble';
    const newGroups = score.groups.map((g, gi) =>
      gi === 0 ? { ...g, staves: g.staves.map((s, si) => si === cursorPos.staffIndex ? { ...s, clef: newClef } : s) } : g
    );
    set({ score: { ...score, groups: newGroups }, lastAction: { type: 'toggleClef' } });
    get().showToast(newClef === 'treble' ? (lang === 'zh' ? '谱号: 高音' : 'Clef: Treble') : (lang === 'zh' ? '谱号: 低音' : 'Clef: Bass'), 'info');
  },

  changeKeySignature: (keyName: KeySignatureName) => {
    get().saveState();
    const { score, cursorPos, lang } = get();
    const staff = score.groups[0].staves[cursorPos.staffIndex];
    const newKeySignature = getKeySignature(keyName);
    const newGroups = score.groups.map((g, gi) =>
      gi === 0 ? { ...g, staves: g.staves.map((s, si) => si === cursorPos.staffIndex ? { ...s, keySignature: newKeySignature } : s) } : g
    );
    set({ score: { ...score, groups: newGroups } });
    get().showToast(lang === 'zh' ? `调号: ${keyName}` : `Key: ${keyName}`, 'info');
  },

  changeMeter: (meterName: MeterName) => {
    get().saveState();
    const { score, lang } = get();
    const newMeter = getMeter(meterName);
    set({ score: { ...score, meter: newMeter } });
    get().showToast(lang === 'zh' ? `拍号: ${meterName}` : `Meter: ${meterName}`, 'info');
  },

  setBarlineType: (barType: BarlineType) => {
    get().saveState();
    const { score, cursorPos } = get();
    const measure = score.groups[0].staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    const voice = measure.voices[cursorPos.voiceIndex];

    if (cursorPos.elementIndex > 0 && cursorPos.elementIndex <= voice.elements.length) {
      const newElements = voice.elements.map((el, i) =>
        i === cursorPos.elementIndex - 1 ? createBarline(barType) : el
      );
      const newVoice = { ...voice, elements: newElements };
      const newMeasure = { ...measure, voices: [newVoice] };
      const newStaff = { ...score.groups[0].staves[cursorPos.staffIndex], measures: score.groups[0].staves[cursorPos.staffIndex].measures.map((m, mi) => mi === cursorPos.measureIndex ? newMeasure : m) };
      const newGroup = { ...score.groups[0], staves: score.groups[0].staves.map((s, si) => si === cursorPos.staffIndex ? newStaff : s) };
      set({ score: { ...score, groups: [newGroup] }, lastAction: { type: 'setBarline', barlineType: barType } });
    }
  },

  deleteElement: () => {
    const { score, cursorPos } = get();
    const measure = score.groups[0].staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    const voice = measure.voices[cursorPos.voiceIndex];

    if (cursorPos.elementIndex > 0 && voice.elements.length > 0) {
      get().saveState();
      const el = voice.elements[cursorPos.elementIndex - 1];
      const elDuration = elementBeats(el);
      const newElements = voice.elements.filter((_, i) => i !== cursorPos.elementIndex - 1);
      const newVoice = { ...voice, elements: newElements };
      const newMeasure = { ...measure, voices: [newVoice], durationUsed: measure.durationUsed - elDuration };
      const newStaff = { ...score.groups[0].staves[cursorPos.staffIndex], measures: score.groups[0].staves[cursorPos.staffIndex].measures.map((m, mi) => mi === cursorPos.measureIndex ? newMeasure : m) };
      const newGroup = { ...score.groups[0], staves: score.groups[0].staves.map((s, si) => si === cursorPos.staffIndex ? newStaff : s) };
      set({
        score: { ...score, groups: [newGroup] },
        cursorPos: { ...cursorPos, elementIndex: cursorPos.elementIndex - 1 },
        lastAction: { type: 'deleteElement' }
      });
    }
  },

  moveToNextMeasure: () => {
    const { score, cursorPos } = get();
    const staff = score.groups[0].staves[cursorPos.staffIndex];
    if (cursorPos.measureIndex < staff.measures.length - 1) {
      set({ cursorPos: { ...cursorPos, measureIndex: cursorPos.measureIndex + 1, elementIndex: 0 } });
    } else {
      get().saveState();
      const newStaffs = score.groups[0].staves.map(s => ({ ...s, measures: [...s.measures, createEmptyMeasure()] }));
      set({
        score: { ...score, groups: [{ ...score.groups[0], staves: newStaffs }] },
        cursorPos: { ...cursorPos, measureIndex: cursorPos.measureIndex + 1, elementIndex: 0 }
      });
    }
  },

  clearScore: () => {
    get().saveState();
    set({ score: createDefaultScore(), cursorPos: { staffIndex: 0, measureIndex: 0, voiceIndex: 0, elementIndex: 0, mode: 'normal' } });
  },

  insertNote: (noteName: string) => {
    const state = get();
    const { score, cursorPos, inputState } = state;
    const staff = score.groups[0].staves[cursorPos.staffIndex];
    const measure = staff.measures[cursorPos.measureIndex];
    const voice = measure.voices[cursorPos.voiceIndex];

    get().saveState();

    let lastPitch: number | null = null;
    for (let i = voice.elements.length - 1; i >= 0; i--) {
      const el = voice.elements[i];
      if (el.type === 'note') {
        lastPitch = (el as Note).pitches[(el as Note).pitches.length - 1].midiPitch;
        break;
      }
    }

    const oct = inferOctave(noteName, lastPitch);
    const alter = getAlterForKey(noteName, staff.keySignature);
    const midiPitch = pitchToMidi(noteName, oct, alter);
    const note = createSingleNote(midiPitch, inputState.lastDuration, inputState.lastDots, alter as -2 | -1 | 0 | 1 | 2);
    note.id = generateNoteId();

    const noteValue = durationValue(note.duration, note.dots);

    if (noteValue <= remainingInMeasure(measure)) {
      const newElements = [...voice.elements];
      newElements.splice(cursorPos.elementIndex, 0, note);
      const newVoice = { ...voice, elements: newElements };
      const newMeasure = { ...measure, voices: [newVoice], durationUsed: measure.durationUsed + noteValue };
      const newStaff = { ...staff, measures: staff.measures.map((m, mi) => mi === cursorPos.measureIndex ? newMeasure : m) };
      const newGroup = { ...score.groups[0], staves: score.groups[0].staves.map((s, si) => si === cursorPos.staffIndex ? newStaff : s) };
      const newElementIndex = cursorPos.elementIndex + 1;
      const shouldMoveToNext = newMeasure.durationUsed >= BEATS_PER_MEASURE;

      set({
        score: { ...score, groups: [newGroup] },
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
    const state = get();
    const { score, cursorPos, lang } = state;

    if (cursorPos.elementIndex === 0) {
      get().showToast(lang === 'zh' ? '没有音符可添加音高' : 'No note to add pitch to', 'warning');
      return;
    }

    const measure = score.groups[0].staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    const voice = measure.voices[cursorPos.voiceIndex];
    const lastEl = voice.elements[cursorPos.elementIndex - 1];

    if (!lastEl || lastEl.type !== 'note') {
      get().showToast(lang === 'zh' ? '只能给音符添加音高' : 'Can only add pitch to notes', 'warning');
      return;
    }

    get().saveState();

    const note = lastEl as Note;
    const lastPitch = note.pitches.length > 0 ? note.pitches[note.pitches.length - 1].midiPitch : null;
    const oct = inferOctave(noteName, lastPitch);
    const newMidiPitch = pitchToMidi(noteName, oct, 0);

    if (note.pitches.some(p => p.midiPitch === newMidiPitch)) {
      get().showToast(lang === 'zh' ? '音高已存在于和弦中' : 'Pitch already in chord', 'warning');
      return;
    }

    const newPitches = [...note.pitches, { midiPitch: newMidiPitch, alter: 0 as const }]
      .sort((a, b) => a.midiPitch - b.midiPitch);
    const newElements = voice.elements.map((el, i) =>
      i === cursorPos.elementIndex - 1 ? { ...note, pitches: newPitches } : el
    );
    const newVoice = { ...voice, elements: newElements };
    const newMeasure = { ...measure, voices: [newVoice] };
    const newStaff = { ...score.groups[0].staves[cursorPos.staffIndex], measures: score.groups[0].staves[cursorPos.staffIndex].measures.map((m, mi) => mi === cursorPos.measureIndex ? newMeasure : m) };
    const newGroup = { ...score.groups[0], staves: score.groups[0].staves.map((s, si) => si === cursorPos.staffIndex ? newStaff : s) };

    set({ score: { ...score, groups: [newGroup] }, lastAction: { type: 'addToChord', noteName } });
  },

  insertRest: () => {
    const state = get();
    const { score, cursorPos, inputState } = state;
    const measure = score.groups[0].staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    const voice = measure.voices[cursorPos.voiceIndex];

    get().saveState();

    const rest = createRest(inputState.lastDuration, inputState.lastDots);
    const restValue = durationValue(rest.duration, rest.dots);

    if (restValue <= remainingInMeasure(measure)) {
      const newElements = [...voice.elements];
      newElements.splice(cursorPos.elementIndex, 0, rest);
      const newVoice = { ...voice, elements: newElements };
      const newMeasure = { ...measure, voices: [newVoice], durationUsed: measure.durationUsed + restValue };
      const newStaff = { ...score.groups[0].staves[cursorPos.staffIndex], measures: score.groups[0].staves[cursorPos.staffIndex].measures.map((m, mi) => mi === cursorPos.measureIndex ? newMeasure : m) };
      const newGroup = { ...score.groups[0], staves: score.groups[0].staves.map((s, si) => si === cursorPos.staffIndex ? newStaff : s) };
      const newElementIndex = cursorPos.elementIndex + 1;
      const shouldMoveToNext = newMeasure.durationUsed >= BEATS_PER_MEASURE;

      set({
        score: { ...score, groups: [newGroup] },
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
    const state = get();
    const { cursorPos, inputState } = state;
    const measure = score.groups[0].staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    const voice = measure.voices[cursorPos.voiceIndex];

    if (cursorPos.elementIndex > 0) {
      const lastEl = voice.elements[cursorPos.elementIndex - 1];
      if (lastEl && (lastEl.type === 'note' || lastEl.type === 'rest')) {
        get().saveState();
        const oldVal = durationValue(lastEl.duration, lastEl.dots);
        const newVal = durationValue(dur, lastEl.dots);
        if (newVal <= remainingInMeasure(measure) + oldVal) {
          const newElements = voice.elements.map((el, i) =>
            i === cursorPos.elementIndex - 1 ? { ...lastEl, duration: dur } : el
          );
          const newVoice = { ...voice, elements: newElements };
          const newMeasure = { ...measure, voices: [newVoice], durationUsed: measure.durationUsed - oldVal + newVal };
          const newStaff = { ...score.groups[0].staves[cursorPos.staffIndex], measures: score.groups[0].staves[cursorPos.staffIndex].measures.map((m, mi) => mi === cursorPos.measureIndex ? newMeasure : m) };
          const newGroup = { ...state.score.groups[0], staves: state.score.groups[0].staves.map((s, si) => si === cursorPos.staffIndex ? newStaff : s) };
          set({
            score: { ...state.score, groups: [newGroup] },
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
    const state = get();
    const { cursorPos, inputState } = state;
    const measure = score.groups[0].staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    const voice = measure.voices[cursorPos.voiceIndex];

    if (cursorPos.elementIndex > 0) {
      const lastEl = voice.elements[cursorPos.elementIndex - 1];
      if (lastEl && (lastEl.type === 'note' || lastEl.type === 'rest')) {
        get().saveState();
        const oldVal = durationValue(lastEl.duration, lastEl.dots);
        const newVal = durationValue(lastEl.duration, lastEl.dots + 1);
        if (newVal <= remainingInMeasure(measure) + oldVal) {
          const newElements = voice.elements.map((el, i) =>
            i === cursorPos.elementIndex - 1 ? { ...lastEl, dots: lastEl.dots + 1 } : el
          );
          const newVoice = { ...voice, elements: newElements };
          const newMeasure = { ...measure, voices: [newVoice], durationUsed: measure.durationUsed - oldVal + newVal };
          const newStaff = { ...score.groups[0].staves[cursorPos.staffIndex], measures: score.groups[0].staves[cursorPos.staffIndex].measures.map((m, mi) => mi === cursorPos.measureIndex ? newMeasure : m) };
          const newGroup = { ...state.score.groups[0], staves: state.score.groups[0].staves.map((s, si) => si === cursorPos.staffIndex ? newStaff : s) };
          set({
            score: { ...state.score, groups: [newGroup] },
            inputState: { ...inputState, lastDots: lastEl.dots + 1 },
            lastAction: { type: 'addDot' }
          });
        }
      }
    }
  },

  makeSharp: () => {
    const state = get();
    const { cursorPos } = state;
    const measure = score.groups[0].staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    const voice = measure.voices[cursorPos.voiceIndex];

    if (cursorPos.elementIndex > 0) {
      const lastEl = voice.elements[cursorPos.elementIndex - 1];
      if (lastEl && lastEl.type === 'note') {
        const note = lastEl as Note;
        const lastPitch = note.pitches[note.pitches.length - 1];
        if (lastPitch && lastPitch.alter < 1) {
          get().saveState();
          const newPitches = note.pitches.map((p, i) =>
            i === note.pitches.length - 1 ? { midiPitch: p.midiPitch + 1, alter: (p.alter + 1) as -2 | -1 | 0 | 1 | 2 } : p
          );
          const newElements = voice.elements.map((el, i) =>
            i === cursorPos.elementIndex - 1 ? { ...note, pitches: newPitches } : el
          );
          const newVoice = { ...voice, elements: newElements };
          const newMeasure = { ...measure, voices: [newVoice] };
          const newStaff = { ...score.groups[0].staves[cursorPos.staffIndex], measures: score.groups[0].staves[cursorPos.staffIndex].measures.map((m, mi) => mi === cursorPos.measureIndex ? newMeasure : m) };
          const newGroup = { ...state.score.groups[0], staves: state.score.groups[0].staves.map((s, si) => si === cursorPos.staffIndex ? newStaff : s) };
          set({ score: { ...state.score, groups: [newGroup] }, lastAction: { type: 'makeSharp' } });
        }
      }
    }
  },

  makeFlat: () => {
    const state = get();
    const { cursorPos } = state;
    const measure = score.groups[0].staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    const voice = measure.voices[cursorPos.voiceIndex];

    if (cursorPos.elementIndex > 0) {
      const lastEl = voice.elements[cursorPos.elementIndex - 1];
      if (lastEl && lastEl.type === 'note') {
        const note = lastEl as Note;
        const lastPitch = note.pitches[note.pitches.length - 1];
        if (lastPitch && lastPitch.alter > -1) {
          get().saveState();
          const newPitches = note.pitches.map((p, i) =>
            i === note.pitches.length - 1 ? { midiPitch: p.midiPitch - 1, alter: (p.alter - 1) as -2 | -1 | 0 | 1 | 2 } : p
          );
          const newElements = voice.elements.map((el, i) =>
            i === cursorPos.elementIndex - 1 ? { ...note, pitches: newPitches } : el
          );
          const newVoice = { ...voice, elements: newElements };
          const newMeasure = { ...measure, voices: [newVoice] };
          const newStaff = { ...score.groups[0].staves[cursorPos.staffIndex], measures: score.groups[0].staves[cursorPos.staffIndex].measures.map((m, mi) => mi === cursorPos.measureIndex ? newMeasure : m) };
          const newGroup = { ...state.score.groups[0], staves: state.score.groups[0].staves.map((s, si) => si === cursorPos.staffIndex ? newStaff : s) };
          set({ score: { ...state.score, groups: [newGroup] }, lastAction: { type: 'makeFlat' } });
        }
      }
    }
  },

  raiseOctave: () => {
    const state = get();
    const { cursorPos, lang } = state;
    const measure = score.groups[0].staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    const voice = measure.voices[cursorPos.voiceIndex];

    if (cursorPos.elementIndex > 0) {
      const lastEl = voice.elements[cursorPos.elementIndex - 1];
      if (lastEl && lastEl.type === 'note') {
        const note = lastEl as Note;
        const canRaise = note.pitches.every(p => p.midiPitch + 12 <= 127);
        if (canRaise && note.pitches.length > 0) {
          get().saveState();
          const newElements = voice.elements.map((el, i) =>
            i === cursorPos.elementIndex - 1 ? { ...note, pitches: note.pitches.map(p => ({ ...p, midiPitch: p.midiPitch + 12 })) } : el
          );
          const newVoice = { ...voice, elements: newElements };
          const newMeasure = { ...measure, voices: [newVoice] };
          const newStaff = { ...score.groups[0].staves[cursorPos.staffIndex], measures: score.groups[0].staves[cursorPos.staffIndex].measures.map((m, mi) => mi === cursorPos.measureIndex ? newMeasure : m) };
          const newGroup = { ...state.score.groups[0], staves: state.score.groups[0].staves.map((s, si) => si === cursorPos.staffIndex ? newStaff : s) };
          set({ score: { ...state.score, groups: [newGroup] }, lastAction: { type: 'raiseOctave' } });
          get().showToast(lang === 'zh' ? '升八度' : 'Octave up', 'info');
        }
      }
    }
  },

  lowerOctave: () => {
    const state = get();
    const { cursorPos, lang } = state;
    const measure = score.groups[0].staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    const voice = measure.voices[cursorPos.voiceIndex];

    if (cursorPos.elementIndex > 0) {
      const lastEl = voice.elements[cursorPos.elementIndex - 1];
      if (lastEl && lastEl.type === 'note') {
        const note = lastEl as Note;
        const canLower = note.pitches.every(p => p.midiPitch - 12 >= 0);
        if (canLower && note.pitches.length > 0) {
          get().saveState();
          const newElements = voice.elements.map((el, i) =>
            i === cursorPos.elementIndex - 1 ? { ...note, pitches: note.pitches.map(p => ({ ...p, midiPitch: p.midiPitch - 12 })) } : el
          );
          const newVoice = { ...voice, elements: newElements };
          const newMeasure = { ...measure, voices: [newVoice] };
          const newStaff = { ...score.groups[0].staves[cursorPos.staffIndex], measures: score.groups[0].staves[cursorPos.staffIndex].measures.map((m, mi) => mi === cursorPos.measureIndex ? newMeasure : m) };
          const newGroup = { ...state.score.groups[0], staves: state.score.groups[0].staves.map((s, si) => si === cursorPos.staffIndex ? newStaff : s) };
          set({ score: { ...state.score, groups: [newGroup] }, lastAction: { type: 'lowerOctave' } });
          get().showToast(lang === 'zh' ? '降八度' : 'Octave down', 'info');
        }
      }
    }
  },

  navigateUp: () => {
    const { score, cursorPos } = get();
    if (cursorPos.staffIndex > 0) {
      const newStaffIndex = cursorPos.staffIndex - 1;
      const targetStaff = score.groups[0].staves[newStaffIndex];
      let newMeasureIndex = cursorPos.measureIndex;
      if (newMeasureIndex >= targetStaff.measures.length) {
        newMeasureIndex = targetStaff.measures.length - 1;
      }
      const targetMeasure = targetStaff.measures[newMeasureIndex];
      const newElementIndex = Math.min(cursorPos.elementIndex, targetMeasure.voices[0].elements.length);
      set({ cursorPos: { ...cursorPos, staffIndex: newStaffIndex, measureIndex: newMeasureIndex, elementIndex: newElementIndex } });
    }
  },

  navigateDown: () => {
    const { score, cursorPos } = get();
    if (cursorPos.staffIndex < score.groups[0].staves.length - 1) {
      const newStaffIndex = cursorPos.staffIndex + 1;
      const targetStaff = score.groups[0].staves[newStaffIndex];
      let newMeasureIndex = cursorPos.measureIndex;
      if (newMeasureIndex >= targetStaff.measures.length) {
        newMeasureIndex = targetStaff.measures.length - 1;
      }
      const targetMeasure = targetStaff.measures[newMeasureIndex];
      const newElementIndex = Math.min(cursorPos.elementIndex, targetMeasure.voices[0].elements.length);
      set({ cursorPos: { ...cursorPos, staffIndex: newStaffIndex, measureIndex: newMeasureIndex, elementIndex: newElementIndex } });
    }
  },

  navigateLeft: () => {
    const { cursorPos } = get();
    if (cursorPos.elementIndex > 0) {
      set({ cursorPos: { ...cursorPos, elementIndex: cursorPos.elementIndex - 1 } });
    }
  },

  navigateRight: () => {
    const { score, cursorPos } = get();
    const measure = score.groups[0].staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    if (cursorPos.elementIndex < measure.voices[0].elements.length) {
      set({ cursorPos: { ...cursorPos, elementIndex: cursorPos.elementIndex + 1 } });
    }
  },

  navigatePrevMeasure: () => {
    const { cursorPos } = get();
    if (cursorPos.measureIndex > 0) {
      set({ cursorPos: { ...cursorPos, measureIndex: cursorPos.measureIndex - 1, elementIndex: 0 } });
    }
  },

  navigateNextMeasure: () => {
    const { score, cursorPos, lang } = get();
    const staff = score.groups[0].staves[cursorPos.staffIndex];
    if (cursorPos.measureIndex < staff.measures.length - 1) {
      set({ cursorPos: { ...cursorPos, measureIndex: cursorPos.measureIndex + 1, elementIndex: 0 } });
    } else {
      get().saveState();
      const newStaffs = score.groups[0].staves.map(s => ({ ...s, measures: [...s.measures, createEmptyMeasure()] }));
      set({
        score: { ...score, groups: [{ ...score.groups[0], staves: newStaffs }] },
        cursorPos: { ...cursorPos, measureIndex: cursorPos.measureIndex + 1, elementIndex: 0 }
      });
      get().showToast(lang === 'zh' ? '新小节已添加' : 'New measure added', 'info');
    }
  },

  enterInsertMode: () => {
    const { cursorPos, inputState } = get();
    set({ cursorPos: { ...cursorPos, mode: 'insert' }, inputState: { ...inputState, pendingNote: null } });
  },

  enterNormalMode: () => {
    const { cursorPos, inputState } = get();
    set({ cursorPos: { ...cursorPos, mode: 'normal' }, inputState: { ...inputState, pendingNote: null } });
  },

  repeatLastAction: () => {
    const { lastAction } = get();
    if (!lastAction) return;
    switch (lastAction.type) {
      case 'deleteElement': get().deleteElement(); break;
      case 'modifyDuration': get().modifyDuration(lastAction.duration!); break;
      case 'addDot': get().addDot(); break;
      case 'makeSharp': get().makeSharp(); break;
      case 'makeFlat': get().makeFlat(); break;
      case 'raiseOctave': get().raiseOctave(); break;
      case 'lowerOctave': get().lowerOctave(); break;
      case 'toggleClef': get().toggleClef(); break;
      case 'insertRest': {
        const { inputState } = get();
        const prevDuration = inputState.lastDuration;
        const prevDots = inputState.lastDots;
        set({ inputState: { ...inputState, lastDuration: lastAction.duration!, lastDots: lastAction.dots! } });
        get().insertRest();
        set({ inputState: { ...get().inputState, lastDuration: prevDuration, lastDots: prevDots } });
        break;
      }
      case 'insertNote': {
        const { inputState } = get();
        const prevDuration = inputState.lastDuration;
        const prevDots = inputState.lastDots;
        set({ inputState: { ...inputState, lastDuration: lastAction.duration!, lastDots: lastAction.dots! } });
        get().insertNote(lastAction.noteName!);
        set({ inputState: { ...get().inputState, lastDuration: prevDuration, lastDots: prevDots } });
        break;
      }
      case 'addToChord': get().addToChord(lastAction.noteName!); break;
      case 'setBarline': get().setBarlineType(lastAction.barlineType!); break;
    }
  },

  showToast: (message, type = 'info') => {
    set({ toastMessage: message, toastType: type, toastVisible: true });
    setTimeout(() => { set({ toastVisible: false }); }, 2000);
  },

  hideToast: () => set({ toastVisible: false }),

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
