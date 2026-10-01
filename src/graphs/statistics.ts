import { parseDecimal } from "./numbers";

export interface DataRow {
  label: string;
  value: string;
}

export interface Dataset {
  labels: string[];
  values: number[];
}

export type DatasetOutcome = { ok: true; data: Dataset } | { ok: false; error: string };

// Rows left completely empty are ignored; half-filled rows are reported.
export function readRows(rows: DataRow[]): DatasetOutcome {
  const labels: string[] = [];
  const values: number[] = [];
  for (const [i, row] of rows.entries()) {
    if (!row.label.trim() && !row.value.trim()) continue;
    const value = parseDecimal(row.value);
    if (value === null) {
      return { ok: false, error: `Riga ${i + 1}: scrivi un numero nel valore (per esempio 12 oppure 3,5).` };
    }
    labels.push(row.label.trim() || `Dato ${i + 1}`);
    values.push(value);
  }
  if (values.length === 0) return { ok: false, error: "Inserisci almeno un dato nella tabella." };
  return { ok: true, data: { labels, values } };
}

export interface Summary {
  count: number;
  sum: number;
  mean: number;
  median: number;
  modes: number[];
  min: number;
  max: number;
}

export function summarize(values: number[]): Summary {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const median = n % 2 === 1 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;

  const counts = new Map<number, number>();
  for (const v of sorted) counts.set(v, (counts.get(v) ?? 0) + 1);
  const top = Math.max(...counts.values());
  const modes = top > 1 ? [...counts].filter(([, c]) => c === top).map(([v]) => v) : [];

  return { count: n, sum, mean: sum / n, median, modes, min: sorted[0], max: sorted[n - 1] };
}
