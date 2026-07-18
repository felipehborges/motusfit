import { describe, expect, it } from 'vitest';
import { isoWeekOf, isoWeekStart } from './iso-week';

describe('isoWeekOf', () => {
  it('casos conhecidos, incluindo fronteiras de ano', () => {
    expect(isoWeekOf('2026-07-18')).toEqual({ year: 2026, week: 29 });
    // 2026-01-01 é quinta → semana 1 de 2026
    expect(isoWeekOf('2026-01-01')).toEqual({ year: 2026, week: 1 });
    // 2027-01-01 é sexta → ainda semana 53 de 2026
    expect(isoWeekOf('2027-01-01')).toEqual({ year: 2026, week: 53 });
    // 2024-12-30 é segunda → semana 1 de 2025
    expect(isoWeekOf('2024-12-30')).toEqual({ year: 2025, week: 1 });
  });

  it('domingo pertence à mesma semana da segunda anterior', () => {
    expect(isoWeekOf('2026-07-19')).toEqual(isoWeekOf('2026-07-13'));
    expect(isoWeekOf('2026-07-20')).not.toEqual(isoWeekOf('2026-07-19'));
  });

  it('rejeita formato inválido', () => {
    expect(() => isoWeekOf('18/07/2026')).toThrow(RangeError);
  });
});

describe('isoWeekStart', () => {
  it('retorna a segunda-feira da semana', () => {
    expect(isoWeekStart('2026-07-18')).toBe('2026-07-13'); // sábado → segunda anterior
    expect(isoWeekStart('2026-07-13')).toBe('2026-07-13'); // segunda → ela mesma
    expect(isoWeekStart('2026-07-19')).toBe('2026-07-13'); // domingo → segunda anterior
  });
});
