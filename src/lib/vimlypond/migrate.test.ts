import { describe, it, expect } from 'vitest';
import { migrateV1ToV2, migrateV2ToV1, migrateToV2, isV1Score, isV2Score } from './migrate';

describe('migrate v1 到 v2', () => {
  const v1Score = {
    meter: { count: 4, unit: 4 },
    staves: [{
      clef: 'treble' as const,
      keySignature: { name: 'C-major' as const, sharps: 0, flats: 0 },
      measures: [{
        elements: [
          {
            type: 'note' as const,
            pitches: [{ midiPitch: 60, alter: 0 }],
            duration: 4,
            dots: 0,
          },
          {
            type: 'rest' as const,
            duration: 4,
            dots: 0,
          }
        ],
        durationUsed: 2,
      }]
    }]
  };

  it('应该将 v1 Score 迁移到 v2 格式', () => {
    const v2Score = migrateV1ToV2(v1Score);

    expect(v2Score.header).toEqual({});
    expect(v2Score.meter).toEqual({ count: 4, unit: 4 });
    expect(v2Score.groups.length).toBe(1);
    expect(v2Score.groups[0].staves.length).toBe(1);
    expect(v2Score.groups[0].staves[0].clef).toBe('treble');
  });

  it('v2 应该有 Voice 结构', () => {
    const v2Score = migrateV1ToV2(v1Score);
    const measure = v2Score.groups[0].staves[0].measures[0];

    expect(measure.voices.length).toBe(1);
    expect(measure.voices[0].elements.length).toBe(2);
  });

  it('v2 Note 应该有 id 和 articulations 字段', () => {
    const v2Score = migrateV1ToV2(v1Score);
    const note = v2Score.groups[0].staves[0].measures[0].voices[0].elements[0] as any;

    expect(note.type).toBe('note');
    expect(note.id).toBeDefined();
    expect(note.articulations).toEqual([]);
  });
});

describe('migrate v2 到 v1', () => {
  it('应该将 v2 Score 转换回 v1 格式', () => {
    const v2Score = migrateV1ToV2({
      meter: { count: 4, unit: 4 },
      staves: [{
        clef: 'treble',
        keySignature: { name: 'C-major', sharps: 0, flats: 0 },
        measures: [{
          elements: [
            {
              type: 'note',
              pitches: [{ midiPitch: 60, alter: 0 }],
              duration: 4,
              dots: 0,
            }
          ],
          durationUsed: 1,
        }]
      }]
    });

    const v1Score = migrateV2ToV1(v2Score);

    expect(v1Score.meter).toEqual({ count: 4, unit: 4 });
    expect(v1Score.staves.length).toBe(1);
    expect(v1Score.staves[0].measures[0].elements[0].type).toBe('note');
  });
});

describe('isV1Score 和 isV2Score 检测', () => {
  it('isV1Score 应该正确检测 v1 格式', () => {
    expect(isV1Score({ meter: { count: 4, unit: 4 }, staves: [] })).toBe(true);
    expect(isV1Score({ groups: [] })).toBe(false);
  });

  it('isV2Score 应该正确检测 v2 格式', () => {
    expect(isV2Score({ header: {}, meter: { count: 4, unit: 4 }, groups: [] })).toBe(true);
    expect(isV2Score({ meter: { count: 4, unit: 4 }, staves: [] })).toBe(false);
  });
});

describe('migrateToV2 智能迁移', () => {
  it('v2 数据应该直接返回', () => {
    const v2Data = { header: {}, meter: { count: 4, unit: 4 }, groups: [] };
    const result = migrateToV2(v2Data);
    expect(result).toBe(v2Data);
  });

  it('v1 数据应该被迁移', () => {
    const v1Data = { meter: { count: 4, unit: 4 }, staves: [] };
    const result = migrateToV2(v1Data);
    expect(result).not.toBeNull();
    expect(result?.groups).toBeDefined();
  });

  it('无效数据应该返回 null', () => {
    expect(migrateToV2(null)).toBeNull();
    expect(migrateToV2(undefined)).toBeNull();
    expect(migrateToV2({})).toBeNull();
  });
});
