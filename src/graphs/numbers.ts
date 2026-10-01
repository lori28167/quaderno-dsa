// Numbers as written in Italian schools: comma for decimals.

export function formatNumber(value: number, maxDecimals = 2): string {
  if (!Number.isFinite(value)) return "non definito";
  const factor = 10 ** maxDecimals;
  const rounded = Math.round(value * factor) / factor;
  const text = (Object.is(rounded, -0) ? 0 : rounded).toString();
  return text.replace(".", ",");
}

export function parseDecimal(text: string): number | null {
  const normalized = text.trim().replace(/\s+/g, "").replace("−", "-").replace(",", ".");
  if (!/^[-+]?\d+(\.\d+)?$/.test(normalized)) return null;
  return Number(normalized);
}

// Shows simple fractions (as obtained from integer coordinates) instead of long decimals.
export function formatRational(value: number): string {
  if (Number.isInteger(value)) return formatNumber(value);
  for (let den = 2; den <= 12; den++) {
    const num = Math.round(value * den);
    if (Math.abs(value * den - num) < 1e-9) {
      const g = gcd(Math.abs(num), den);
      return `${num / g}/${den / g}`;
    }
  }
  return formatNumber(value);
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
