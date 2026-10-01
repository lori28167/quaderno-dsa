import { alignedByComma, blank, rule, sign } from "./layout";
import { INVALID_NUMBER, fail, formatNumber, parseAll } from "./numbers";
import { capitalize, columnOf } from "./spoken";
import type { Cell, Outcome, Row } from "./types";

export function addition(raw: string[]): Outcome {
  if (raw.length < 2) return fail("Servono almeno due numeri da sommare.");
  const nums = parseAll(raw);
  if (!nums) return fail(INVALID_NUMBER);

  const maxInt = Math.max(...nums.map((n) => n.int.length));
  const maxFrac = Math.max(...nums.map((n) => n.frac.length));
  const len = maxInt + maxFrac;
  const padded = nums.map((n) => n.int.padStart(maxInt, "0") + n.frac.padEnd(maxFrac, "0"));

  const resultDigits: number[] = new Array(len);
  const carryInto: number[] = new Array(len).fill(0);
  const steps: string[] = [];
  let carry = 0;

  for (let j = len - 1; j >= 0; j--) {
    const digits = padded.map((p) => Number(p[j]));
    carryInto[j] = carry;
    const sum = digits.reduce((a, b) => a + b, 0) + carry;
    const digit = sum % 10;
    const nextCarry = Math.floor(sum / 10);
    resultDigits[j] = digit;

    let text = `${capitalize(columnOf(maxInt - 1 - j))}: ${digits.join(" più ")}`;
    if (carry > 0) text += ` più ${carry} di riporto`;
    text += ` fa ${sum}`;
    text += nextCarry > 0 && j > 0 ? `: scrivo ${digit} e riporto ${nextCarry}.` : `: scrivo ${sum}.`;
    steps.push(text);
    carry = nextCarry;
  }

  const resultStr = (carry > 0 ? String(carry) : "") + resultDigits.join("");
  const resultInt = resultStr.slice(0, resultStr.length - maxFrac);
  const resultFrac = resultStr.slice(resultStr.length - maxFrac);
  const intCols = resultInt.length;
  const offset = intCols - maxInt;

  const rows: Row[] = [];
  if (carryInto.some((c) => c > 0)) {
    const cells: Cell[] = [blank()];
    for (let col = 0; col < intCols + maxFrac; col++) {
      const c = carryInto[col - offset] ?? 0;
      cells.push(c > 0 ? { text: String(c), kind: "carry" } : blank());
    }
    rows.push({ role: "carry", cells });
  }
  nums.forEach((n, i) => {
    rows.push({
      role: "number",
      cells: [i === 0 ? blank() : sign("+"), ...alignedByComma(n.int, n.frac, intCols, maxFrac, "digit")],
    });
  });
  rows.push(rule());
  rows.push({
    role: "number",
    cells: [blank(), ...alignedByComma(resultInt, resultFrac, intCols, maxFrac, "result")],
  });

  return {
    ok: true,
    value: {
      layout: { columns: 1 + intCols + maxFrac, rows },
      result: formatNumber(resultInt, resultFrac),
      steps,
    },
  };
}
