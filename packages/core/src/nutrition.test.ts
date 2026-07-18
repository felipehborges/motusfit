import { describe, expect, it } from 'vitest';
import { roundMacrosForDisplay, scaleMacros, sumMacros } from './nutrition';

const chicken = {
  servingSize: 100,
  macros: { kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6 },
};

describe('scaleMacros', () => {
  it('escala proporcionalmente à quantidade', () => {
    const scaled = scaleMacros(chicken, 150);
    expect(scaled.kcal).toBeCloseTo(247.5);
    expect(scaled.proteinG).toBeCloseTo(46.5);
    expect(scaled.carbsG).toBe(0);
    expect(scaled.fatG).toBeCloseTo(5.4);
  });

  it('quantidade zero zera tudo', () => {
    expect(scaleMacros(chicken, 0)).toEqual({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  });

  it('aceita quantidade fracionária', () => {
    expect(scaleMacros(chicken, 33.5).proteinG).toBeCloseTo(10.385);
  });

  it('rejeita porção base inválida e quantidade negativa', () => {
    expect(() => scaleMacros({ ...chicken, servingSize: 0 }, 100)).toThrow(RangeError);
    expect(() => scaleMacros(chicken, -1)).toThrow(RangeError);
  });
});

describe('sumMacros', () => {
  it('soma entradas e retorna zero para lista vazia', () => {
    expect(sumMacros([])).toEqual({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
    const total = sumMacros([scaleMacros(chicken, 100), scaleMacros(chicken, 50)]);
    expect(total.kcal).toBeCloseTo(247.5);
    expect(total.proteinG).toBeCloseTo(46.5);
  });
});

describe('roundMacrosForDisplay', () => {
  it('kcal inteiro, gramas com 1 casa', () => {
    expect(
      roundMacrosForDisplay({ kcal: 247.5, proteinG: 46.55, carbsG: 0.04, fatG: 5.3999 }),
    ).toEqual({ kcal: 248, proteinG: 46.6, carbsG: 0, fatG: 5.4 });
  });
});
