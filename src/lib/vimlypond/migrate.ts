// v1 到 v2 数据迁移脚本
import type {
  Score as V2Score,
  Staff as V2Staff,
  Measure as V2Measure,
  Voice as V2Voice,
  MusicElement as V2MusicElement,
  Note as V2Note,
  Rest as V2Rest,
  KeySignature,
  Meter,
  ClefType,
} from './types-v2';

import type {
  Score as V1Score,
  Staff as V1Staff,
  Measure as V1Measure,
  Note as V1Note,
  Rest as V1Rest,
} from './types';

interface V1Score {
  meter: Meter;
  staves: V1Staff[];
}

interface V1Staff {
  clef: ClefType;
  keySignature: KeySignature;
  measures: V1Measure[];
}

interface V1Measure {
  elements: (V1Note | V1Rest)[];
  durationUsed: number;
}

interface V1Note {
  type: 'note';
  pitches: { midiPitch: number; alter: number }[];
  duration: number;
  dots: number;
  tieStart?: boolean;
  tieEnd?: boolean;
}

interface V1Rest {
  type: 'rest';
  duration: number;
  dots: number;
}

function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function migrateNote(v1Note: V1Note): V2Note {
  return {
    type: 'note',
    id: generateId(),
    pitches: v1Note.pitches.map(p => ({
      midiPitch: p.midiPitch,
      alter: p.alter as -2 | -1 | 0 | 1 | 2
    })),
    duration: v1Note.duration,
    dots: v1Note.dots,
    tieStart: v1Note.tieStart ? generateId() : undefined,
    tieEnd: v1Note.tieEnd ? generateId() : undefined,
    articulations: [],
  };
}

function migrateRest(v1Rest: V1Rest): V2Rest {
  return {
    type: 'rest',
    duration: v1Rest.duration,
    dots: v1Rest.dots,
  };
}

function migrateElement(v1Element: V1Note | V1Rest): V2MusicElement {
  if (v1Element.type === 'note') {
    return migrateNote(v1Element);
  }
  return migrateRest(v1Element);
}

function migrateMeasure(v1Measure: V1Measure): V2Measure {
  const voice: V2Voice = {
    id: generateId(),
    elements: v1Measure.elements.map(migrateElement),
  };

  return {
    voices: [voice],
    durationUsed: v1Measure.durationUsed,
  };
}

function migrateStaff(v1Staff: V1Staff): V2Staff {
  return {
    id: generateId(),
    clef: v1Staff.clef,
    keySignature: v1Staff.keySignature,
    measures: v1Staff.measures.map(migrateMeasure),
  };
}

export function migrateV1ToV2(v1Score: V1Score): V2Score {
  return {
    header: {},
    meter: v1Score.meter,
    groups: [{
      type: 'staffGroup',
      staves: v1Score.staves.map(migrateStaff),
    }],
  };
}

export function migrateV2ToV1(v2Score: V2Score): V1Score {
  const firstStaff = v2Score.groups[0]?.staves[0];

  return {
    meter: v2Score.meter,
    staves: v2Score.groups.flatMap(group =>
      group.staves.map(staff => ({
        clef: staff.clef,
        keySignature: staff.keySignature,
        measures: staff.measures.map(measure => ({
          elements: measure.voices.flatMap(voice =>
            voice.elements
              .filter((el): el is V2Note | V2Rest => el.type === 'note' || el.type === 'rest')
              .map(el => {
                if (el.type === 'note') {
                  return {
                    type: 'note' as const,
                    pitches: el.pitches.map(p => ({
                      midiPitch: p.midiPitch,
                      alter: p.alter
                    })),
                    duration: el.duration,
                    dots: el.dots,
                    tieStart: !!el.tieStart,
                    tieEnd: !!el.tieEnd,
                  };
                }
                return {
                  type: 'rest' as const,
                  duration: el.duration,
                  dots: el.dots,
                };
              })
          ),
          durationUsed: measure.durationUsed,
        })),
      }))
    ),
  };
}

export function isV1Score(data: unknown): data is V1Score {
  if (!data || typeof data !== 'object') return false;
  const score = data as Record<string, unknown>;
  return (
    'meter' in score &&
    'staves' in score &&
    Array.isArray((score as { staves: unknown }).staves)
  );
}

export function isV2Score(data: unknown): data is V2Score {
  if (!data || typeof data !== 'object') return false;
  const score = data as Record<string, unknown>;
  return 'groups' in score && Array.isArray((score as { groups: unknown }).groups);
}

export function migrateToV2(data: unknown): V2Score | null {
  if (isV2Score(data)) {
    return data;
  }

  if (isV1Score(data)) {
    return migrateV1ToV2(data);
  }

  return null;
}
