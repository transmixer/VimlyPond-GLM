import { describe, it, expect } from 'vitest';
import type {
  Pitch,
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
  DynamicsType,
  ArticulationType,
} from './types-v2';

describe('types-v2 基本结构测试', () => {
  describe('Pitch', () => {
    it('应该创建一个基本的 Pitch', () => {
      const pitch: Pitch = {
        midiPitch: 60,
        alter: 0,
      };
      expect(pitch.midiPitch).toBe(60);
      expect(pitch.alter).toBe(0);
    });

    it('应该支持升降号', () => {
      const sharp: Pitch = { midiPitch: 61, alter: 1 };
      const flat: Pitch = { midiPitch: 59, alter: -1 };
      expect(sharp.alter).toBe(1);
      expect(flat.alter).toBe(-1);
    });
  });

  describe('Note', () => {
    it('应该创建一个基本的 Note', () => {
      const note: Note = {
        type: 'note',
        id: 'n1',
        pitches: [{ midiPitch: 60, alter: 0 }],
        duration: 4,
        dots: 0,
        articulations: [],
      };
      expect(note.type).toBe('note');
      expect(note.id).toBe('n1');
      expect(note.pitches.length).toBe(1);
    });

    it('应该支持和弦（多个 pitches）', () => {
      const chord: Note = {
        type: 'note',
        id: 'n2',
        pitches: [
          { midiPitch: 60, alter: 0 },
          { midiPitch: 64, alter: 0 },
          { midiPitch: 67, alter: 0 },
        ],
        duration: 4,
        dots: 0,
        articulations: [],
      };
      expect(chord.pitches.length).toBe(3);
    });

    it('应该支持延音线', () => {
      const note: Note = {
        type: 'note',
        id: 'n1',
        pitches: [{ midiPitch: 60, alter: 0 }],
        duration: 4,
        dots: 0,
        articulations: [],
        tieStart: 'n2',
      };
      expect(note.tieStart).toBe('n2');
    });

    it('应该支持力度标记', () => {
      const note: Note = {
        type: 'note',
        id: 'n1',
        pitches: [{ midiPitch: 60, alter: 0 }],
        duration: 4,
        dots: 0,
        articulations: [],
        dynamics: 'ff',
      };
      expect(note.dynamics).toBe('ff');
    });

    it('应该支持演奏法', () => {
      const note: Note = {
        type: 'note',
        id: 'n1',
        pitches: [{ midiPitch: 60, alter: 0 }],
        duration: 4,
        dots: 0,
        articulations: [{ type: 'staccato', position: 'below' }],
      };
      expect(note.articulations.length).toBe(1);
      expect(note.articulations[0].type).toBe('staccato');
    });
  });

  describe('Rest', () => {
    it('应该创建一个基本的 Rest', () => {
      const rest: Rest = {
        type: 'rest',
        duration: 4,
        dots: 0,
      };
      expect(rest.type).toBe('rest');
      expect(rest.duration).toBe(4);
    });
  });

  describe('Tuplet', () => {
    it('应该创建一个三连音', () => {
      const tuplet: Tuplet = {
        type: 'tuplet',
        id: 't1',
        actualNotes: 3,
        normalNotes: 2,
        elements: [
          {
            type: 'note',
            id: 'n1',
            pitches: [{ midiPitch: 60, alter: 0 }],
            duration: 4,
            dots: 0,
            articulations: [],
          },
        ],
      };
      expect(tuplet.type).toBe('tuplet');
      expect(tuplet.actualNotes).toBe(3);
      expect(tuplet.normalNotes).toBe(2);
    });
  });

  describe('GraceNote', () => {
    it('应该创建一个倚音', () => {
      const grace: GraceNote = {
        type: 'grace',
        isAcciaccatura: true,
        notes: [
          {
            type: 'note',
            id: 'gn1',
            pitches: [{ midiPitch: 72, alter: 0 }],
            duration: 16,
            dots: 0,
            articulations: [],
          },
        ],
      };
      expect(grace.type).toBe('grace');
      expect(grace.isAcciaccatura).toBe(true);
    });
  });

  describe('Barline', () => {
    it('应该创建一个终止线', () => {
      const barline: Barline = {
        type: 'barline',
        barType: 'end',
      };
      expect(barline.type).toBe('barline');
      expect(barline.barType).toBe('end');
    });

    it('应该支持反复记号', () => {
      const repeatStart: Barline = {
        type: 'barline',
        barType: 'repeat-start',
      };
      expect(repeatStart.barType).toBe('repeat-start');
    });
  });

  describe('Voice', () => {
    it('应该创建一个声部', () => {
      const voice: Voice = {
        id: 'v1',
        name: 'Treble',
        elements: [],
      };
      expect(voice.id).toBe('v1');
      expect(voice.name).toBe('Treble');
    });
  });

  describe('Measure', () => {
    it('应该创建一个支持多声部的小节', () => {
      const measure: Measure = {
        voices: [
          {
            id: 'v1',
            elements: [],
          },
          {
            id: 'v2',
            elements: [],
          },
        ],
        durationUsed: 0,
      };
      expect(measure.voices.length).toBe(2);
    });
  });

  describe('Staff', () => {
    it('应该创建一个谱表', () => {
      const staff: Staff = {
        id: 's1',
        clef: 'treble',
        keySignature: { name: 'C-major', sharps: 0, flats: 0 },
        measures: [],
      };
      expect(staff.id).toBe('s1');
      expect(staff.clef).toBe('treble');
    });
  });

  describe('StaffGroup', () => {
    it('应该创建一个钢琴谱组', () => {
      const group: StaffGroup = {
        type: 'pianoGrand',
        staves: [
          {
            id: 's1',
            clef: 'treble',
            keySignature: { name: 'C-major', sharps: 0, flats: 0 },
            measures: [],
          },
          {
            id: 's2',
            clef: 'bass',
            keySignature: { name: 'C-major', sharps: 0, flats: 0 },
            measures: [],
          },
        ],
        bracket: true,
        brace: true,
      };
      expect(group.type).toBe('pianoGrand');
      expect(group.staves.length).toBe(2);
      expect(group.brace).toBe(true);
    });
  });

  describe('Score', () => {
    it('应该创建一个完整的乐谱', () => {
      const score: Score = {
        header: {
          title: 'Test Score',
          composer: 'Test Composer',
        },
        tempo: 120,
        meter: { count: 4, unit: 4 },
        groups: [],
      };
      expect(score.header.title).toBe('Test Score');
      expect(score.tempo).toBe(120);
    });
  });
});

describe('types-v2 MusicElement 联合类型测试', () => {
  it('应该接受 Note 作为 MusicElement', () => {
    const element: MusicElement = {
      type: 'note',
      id: 'n1',
      pitches: [{ midiPitch: 60, alter: 0 }],
      duration: 4,
      dots: 0,
      articulations: [],
    };
    expect(element.type).toBe('note');
  });

  it('应该接受 Rest 作为 MusicElement', () => {
    const element: MusicElement = {
      type: 'rest',
      duration: 4,
      dots: 0,
    };
    expect(element.type).toBe('rest');
  });

  it('应该接受 Tuplet 作为 MusicElement', () => {
    const element: MusicElement = {
      type: 'tuplet',
      id: 't1',
      actualNotes: 3,
      normalNotes: 2,
      elements: [],
    };
    expect(element.type).toBe('tuplet');
  });

  it('应该接受 GraceNote 作为 MusicElement', () => {
    const element: MusicElement = {
      type: 'grace',
      isAcciaccatura: false,
      notes: [],
    };
    expect(element.type).toBe('grace');
  });

  it('应该接受 Barline 作为 MusicElement', () => {
    const element: MusicElement = {
      type: 'barline',
      barType: 'double',
    };
    expect(element.type).toBe('barline');
  });
});

describe('types-v2 DynamicsType 测试', () => {
  const dynamicsTypes: DynamicsType[] = ['pp', 'p', 'mp', 'mf', 'f', 'ff', 'ppp', 'fff', 'sf', 'fp', 'sfz'];

  dynamicsTypes.forEach((dyn) => {
    it(`应该支持力度类型: ${dyn}`, () => {
      const note: Note = {
        type: 'note',
        id: 'n1',
        pitches: [{ midiPitch: 60, alter: 0 }],
        duration: 4,
        dots: 0,
        articulations: [],
        dynamics: dyn,
      };
      expect(note.dynamics).toBe(dyn);
    });
  });
});

describe('types-v2 ArticulationType 测试', () => {
  const articulationTypes: ArticulationType[] = ['staccato', 'marcato', 'accent', 'tenuto', 'staccatissimo'];

  articulationTypes.forEach((art) => {
    it(`应该支持演奏法类型: ${art}`, () => {
      const note: Note = {
        type: 'note',
        id: 'n1',
        pitches: [{ midiPitch: 60, alter: 0 }],
        duration: 4,
        dots: 0,
        articulations: [{ type: art, position: 'above' }],
      };
      expect(note.articulations[0].type).toBe(art);
    });
  });
});
