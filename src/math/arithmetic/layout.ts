import type { Cell, CellKind, Row } from "./types";

export const blank = (): Cell => ({ text: "", kind: "blank" });

export const sign = (text: string): Cell => ({ text, kind: "sign" });

export const rule = (): Row => ({ role: "rule", cells: [] });

export function emptyCells(count: number): Cell[] {
  return Array.from({ length: count }, blank);
}

// Integer part right-aligned, decimal part left-aligned: columns line up on the comma.
export function alignedByComma(
  int: string,
  frac: string,
  intCols: number,
  fracCols: number,
  kind: CellKind,
): Cell[] {
  const cells = emptyCells(intCols);
  for (let i = 0; i < int.length; i++) {
    cells[intCols - int.length + i] = { text: int[i], kind };
  }
  if (fracCols > 0) cells[intCols - 1] = { ...cells[intCols - 1], commaAfter: true };
  for (let f = 0; f < fracCols; f++) {
    cells.push(f < frac.length ? { text: frac[f], kind } : { text: "0", kind: "filler" });
  }
  return cells;
}

// Digits right-aligned, ignoring the comma (as in multiplication); `shift` leaves
// placeholder dashes on the right for partial products.
export function alignedRight(
  digits: string,
  width: number,
  kind: CellKind,
  { fracLen = 0, shift = 0 }: { fracLen?: number; shift?: number } = {},
): Cell[] {
  const cells = emptyCells(width);
  const end = width - 1 - shift;
  for (let i = 0; i < digits.length; i++) {
    cells[end - digits.length + 1 + i] = { text: digits[i], kind };
  }
  if (fracLen > 0) cells[end - fracLen] = { ...cells[end - fracLen], commaAfter: true };
  for (let s = 0; s < shift; s++) cells[width - 1 - s] = { text: "-", kind: "filler" };
  return cells;
}
