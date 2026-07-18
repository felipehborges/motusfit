/** Macros por porção base de um alimento. */
export type Macros = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type FoodPortion = {
  /** Tamanho da porção base do alimento (ex.: 100 para "100 g"). */
  servingSize: number;
  macros: Macros;
};

/**
 * Macros de uma quantidade consumida, escalando a partir da porção base.
 * Ex.: alimento com 20 g proteína / 100 g, quantidade 150 → 30 g.
 */
export function scaleMacros(portion: FoodPortion, quantity: number): Macros {
  if (portion.servingSize <= 0) {
    throw new RangeError('servingSize deve ser > 0');
  }
  if (quantity < 0) {
    throw new RangeError('quantity deve ser >= 0');
  }
  const factor = quantity / portion.servingSize;
  return {
    kcal: portion.macros.kcal * factor,
    proteinG: portion.macros.proteinG * factor,
    carbsG: portion.macros.carbsG * factor,
    fatG: portion.macros.fatG * factor,
  };
}

/** Soma macros de várias entradas (totais do dia ou de uma refeição). */
export function sumMacros(entries: readonly Macros[]): Macros {
  return entries.reduce<Macros>(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      proteinG: acc.proteinG + m.proteinG,
      carbsG: acc.carbsG + m.carbsG,
      fatG: acc.fatG + m.fatG,
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

/**
 * Arredondamento de apresentação (docs/domain-model.md): gramas com 1 casa, kcal inteiro.
 * O arredondamento acontece SÓ na borda de exibição — nunca antes de somar.
 */
export function roundMacrosForDisplay(m: Macros): Macros {
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    kcal: Math.round(m.kcal),
    proteinG: round1(m.proteinG),
    carbsG: round1(m.carbsG),
    fatG: round1(m.fatG),
  };
}
