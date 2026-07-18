export type IsoWeek = { year: number; week: number };

/**
 * Semana ISO-8601 (segunda a domingo) de uma data local `YYYY-MM-DD`.
 * Opera sobre a data-calendário (sem fuso): quem resolve o fuso do usuário
 * é a borda que produz a string de data.
 */
export function isoWeekOf(localDate: string): IsoWeek {
  const parsed = parseLocalDate(localDate);
  // Algoritmo ISO: a semana é a do "quinta-feira mais próxima".
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  const dayOfWeek = date.getUTCDay() === 0 ? 7 : date.getUTCDay(); // 1=seg ... 7=dom
  date.setUTCDate(date.getUTCDate() + 4 - dayOfWeek);
  const isoYear = date.getUTCFullYear();
  const yearStart = Date.UTC(isoYear, 0, 1);
  const week = Math.ceil(((date.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return { year: isoYear, week };
}

/** Segunda-feira (YYYY-MM-DD) da semana ISO da data dada. */
export function isoWeekStart(localDate: string): string {
  const parsed = parseLocalDate(localDate);
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  const dayOfWeek = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - (dayOfWeek - 1));
  return date.toISOString().slice(0, 10);
}

function parseLocalDate(value: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new RangeError(`data inválida: ${value} (esperado YYYY-MM-DD)`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}
