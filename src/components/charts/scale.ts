// Scale and wording for BeforeAfterChart: where a value sits on a row's axis and how a result reads as text.
export interface Result {
  label: string;
  before: number;
  after: number;
  unit?: string | undefined;
  note?: string | undefined;
}

export const AXIS = { width: 300, height: 20, pad: 8 } as const;

// Each row has its own axis, from 0 to 100 for a percentage and otherwise to the larger of its two values.
export function xFor(value: number, result: Result): number {
  const max = result.unit === "%" ? 100 : Math.max(result.before, result.after);
  return AXIS.pad + (value / max) * (AXIS.width - 2 * AXIS.pad);
}

function withUnit(value: number, unit: string | undefined, decimals: number): string {
  const text = value.toFixed(decimals);
  if (!unit) return text;
  return unit === "%" ? `${text}%` : `${text} ${unit}`;
}

// "66% → 1%": the visible line and the spoken summary. The note, when given, replaces it (source wording).
export function changeText(result: Result): string {
  if (result.note) return result.note;
  const decimals = Number.isInteger(result.before) && Number.isInteger(result.after) ? 0 : 1;
  return `${withUnit(result.before, result.unit, decimals)} → ${withUnit(result.after, result.unit, decimals)}`;
}
