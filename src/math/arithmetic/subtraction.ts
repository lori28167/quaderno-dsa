import { alignedByComma, blank, rule, sign } from "./layout";
import { INVALID_NUMBER, fail, formatNumber, parseAll, stripLeadingZeros } from "./numbers";
import { article, capitalize, columnOf, fromColumn } from "./spoken";
import type { Cell, Outcome, Row } from "./types";

export function subtraction(raw: string[]): Outcome {
  if (raw.length !== 2) return fail("La sottrazione ha bisogno di due numeri.");
  const nums = parseAll(raw);
  if (!nums) return fail(INVALID_NUMBER);
  const [a, b] = nums;

  const maxInt = Math.max(a.int.length, b.int.length);
  const maxFrac = Math.max(a.frac.length, b.frac.length);
  const len = maxInt + maxFrac;
  const top = a.int.padStart(maxInt, "0") + a.frac.padEnd(maxFrac, "0");
  const bottom = b.int.padStart(maxInt, "0") + b.frac.padEnd(maxFrac, "0");
  if (top < bottom) {
    return fail("Il primo numero deve essere maggiore o uguale al secondo: per ora i risultati negativi non sono gestiti.");
  }

  const resultDigits: number[] = new Array(len);
  // Value the top digit really has after loans, shown above it (null = unchanged).
  const annotation: (number | null)[] = new Array(len).fill(null);
  const steps: string[] = [];
  let lent = 0;

  for (let j = len - 1; j >= 0; j--) {
    const original = Number(top[j]);
    const sub = Number(bottom[j]);
    let value = original - lent;
    let borrowed = false;
    if (value < sub) {
      value += 10;
      borrowed = true;
    }
    const digit = value - sub;
    if (lent || borrowed) annotation[j] = value;
    resultDigits[j] = digit;

    const offset = maxInt - 1 - j;
    let text = `${capitalize(columnOf(offset))}: `;
    if (lent && original === 0) {
      text += `lo 0 non ha niente da prestare: prende 1 ${fromColumn(offset + 1)} e diventa 10, poi ne presta 1 e diventa 9. `;
    } else {
      if (lent) text += `${article(original)}${original} ha prestato 1 e diventa ${original - 1}. `;
      if (borrowed) {
        const before = value - 10;
        text += `${before} meno ${sub} non si può: prendo in prestito 1 ${fromColumn(offset + 1)}, ${article(before)}${before} diventa ${value}. `;
      }
    }
    text += `${value} meno ${sub} fa ${digit}.`;
    steps.push(text);
    lent = borrowed ? 1 : 0;
  }

  const resultStr = resultDigits.join("");
  const resultInt = stripLeadingZeros(resultStr.slice(0, maxInt));
  const resultFrac = resultStr.slice(maxInt);

  const rows: Row[] = [];
  if (annotation.some((v) => v !== null)) {
    rows.push({
      role: "carry",
      cells: [blank(), ...annotation.map((v): Cell => (v === null ? blank() : { text: String(v), kind: "carry" }))],
    });
  }
  const topCells = alignedByComma(a.int, a.frac, maxInt, maxFrac, "digit").map((cell, j) =>
    annotation[j] === null ? cell : { ...cell, struck: true },
  );
  rows.push({ role: "number", cells: [blank(), ...topCells] });
  rows.push({ role: "number", cells: [sign("−"), ...alignedByComma(b.int, b.frac, maxInt, maxFrac, "digit")] });
  rows.push(rule());
  rows.push({ role: "number", cells: [blank(), ...alignedByComma(resultInt, resultFrac, maxInt, maxFrac, "result")] });

  return {
    ok: true,
    value: {
      layout: { columns: 1 + len, rows },
      result: formatNumber(resultInt, resultFrac),
      steps,
    },
  };
}
