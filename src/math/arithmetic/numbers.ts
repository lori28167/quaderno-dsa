import type { Outcome } from "./types";

export interface ParsedNumber {
  int: string;
  frac: string;
}

const NUMBER_RE = /^\d+([.,]\d+)?$/;

export const INVALID_NUMBER =
  "Scrivi solo numeri positivi, usando la virgola per i decimali (per esempio 12,5).";

export function stripLeadingZeros(digits: string): string {
  const stripped = digits.replace(/^0+/, "");
  return stripped === "" ? "0" : stripped;
}

export function parseNumber(raw: string): ParsedNumber | null {
  const text = raw.trim();
  if (!NUMBER_RE.test(text)) return null;
  const [int, frac = ""] = text.split(/[.,]/);
  return { int: stripLeadingZeros(int), frac };
}

export function parseAll(raw: string[]): ParsedNumber[] | null {
  const parsed = raw.map(parseNumber);
  return parsed.every((n): n is ParsedNumber => n !== null) ? parsed : null;
}

export function formatNumber(int: string, frac: string): string {
  const trimmedFrac = frac.replace(/0+$/, "");
  const trimmedInt = stripLeadingZeros(int);
  return trimmedFrac ? `${trimmedInt},${trimmedFrac}` : trimmedInt;
}

export function fail(error: string): Outcome {
  return { ok: false, error };
}
