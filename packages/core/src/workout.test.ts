import { describe, expect, it } from 'vitest';
import { estimateSessionKcal, sessionVolumeKg } from './workout';

describe('sessionVolumeKg', () => {
  it('soma carga × reps apenas das séries completas', () => {
    const sets = [
      { weightKg: 100, reps: 8, completed: true },
      { weightKg: 100, reps: 8, completed: false },
      { weightKg: 60.5, reps: 12, completed: true },
    ];
    expect(sessionVolumeKg(sets)).toBeCloseTo(100 * 8 + 60.5 * 12);
  });

  it('retorna 0 sem séries', () => {
    expect(sessionVolumeKg([])).toBe(0);
  });
});

describe('estimateSessionKcal', () => {
  it('aplica kcal = MET × peso × horas com MET default 5.0', () => {
    expect(estimateSessionKcal({ bodyWeightKg: 80, durationMinutes: 60 })).toBeCloseTo(400);
    expect(estimateSessionKcal({ bodyWeightKg: 80, durationMinutes: 45 })).toBeCloseTo(300);
  });

  it('aceita MET customizado e valida entradas', () => {
    expect(estimateSessionKcal({ bodyWeightKg: 70, durationMinutes: 30, met: 6 })).toBeCloseTo(210);
    expect(() => estimateSessionKcal({ bodyWeightKg: 0, durationMinutes: 30 })).toThrow(RangeError);
    expect(() => estimateSessionKcal({ bodyWeightKg: 70, durationMinutes: -1 })).toThrow(
      RangeError,
    );
  });
});
