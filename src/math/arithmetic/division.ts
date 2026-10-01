import { blank, emptyCells } from "./layout";
import { INVALID_NUMBER, fail, parseAll } from "./numbers";
import { article } from "./spoken";
import type { Cell, CellKind, Outcome, Row } from "./types";

interface WorkLine {
  text: string;
  endPos: number;
}

// Italian layout: dividend | divisor on top, quotient under the divisor,
// partial remainders (with the brought-down digit) written under the dividend.
export function division(raw: string[]): Outcome {
  if (raw.length !== 2) return fail("La divisione ha bisogno di due numeri.");
  const nums = parseAll(raw);
  if (!nums) return fail(INVALID_NUMBER);
  const [a, b] = nums;
  if (a.frac || b.frac) return fail("Per ora la divisione in colonna funziona solo con numeri interi.");

  const dividend = a.int;
  const divisor = BigInt(b.int);
  if (divisor === 0n) return fail("Non si può dividere per zero.");

  const steps: string[] = [];
  const work: WorkLine[] = [];
  let quotient: string;
  let remainder: bigint;

  if (BigInt(dividend) < divisor) {
    quotient = "0";
    remainder = BigInt(dividend);
    work.push({ text: dividend, endPos: dividend.length - 1 });
    steps.push(`${dividend} è più piccolo di ${divisor}: il quoziente è 0 e il resto è ${dividend}.`);
  } else {
    let k = 1;
    while (BigInt(dividend.slice(0, k)) < divisor) k++;
    let current = BigInt(dividend.slice(0, k));
    let pos = k - 1;
    if (k > 1) {
      steps.push(`${dividend.slice(0, k - 1)} è più piccolo di ${divisor}, quindi prendo le prime ${k} cifre: ${current}.`);
    }

    const qDigits: string[] = [];
    for (;;) {
      const q = current / divisor;
      const r = current - q * divisor;
      qDigits.push(q.toString());
      steps.push(
        q > 0n
          ? `${current} diviso ${divisor} fa ${q}: ${q} per ${divisor} fa ${q * divisor}, e ${current} meno ${q * divisor} fa ${r}.`
          : `${current} è più piccolo di ${divisor}: scrivo 0 nel quoziente.`,
      );
      if (pos === dividend.length - 1) {
        remainder = r;
        work.push({ text: r.toString(), endPos: pos });
        steps.push(`Non ci sono altre cifre da abbassare: il resto è ${r}.`);
        break;
      }
      pos++;
      const digit = dividend[pos];
      const text = r.toString() + digit;
      current = BigInt(text);
      work.push({ text, endPos: pos });
      steps.push(`Abbasso ${article(Number(digit))}${digit}: ottengo ${text}.`);
    }
    quotient = qDigits.join("");
  }

  const divisorStr = divisor.toString();
  const leftW = dividend.length;
  const rightW = Math.max(divisorStr.length, quotient.length);

  const left = (text: string, endPos: number, kind: CellKind): Cell[] => {
    const cells = emptyCells(leftW);
    for (let i = 0; i < text.length; i++) cells[endPos - text.length + 1 + i] = { text: text[i], kind };
    return cells;
  };
  const right = (text: string, kind: CellKind, borderLeft: boolean, borderBottom: boolean): Cell[] =>
    Array.from({ length: rightW }, (_, i) => ({
      ...(i < text.length ? { text: text[i], kind } : blank()),
      borderLeft: borderLeft && i === 0,
      borderBottom,
    }));

  const last = work.length - 1;
  const rows: Row[] = [
    { role: "number", cells: [...left(dividend, leftW - 1, "digit"), ...right(divisorStr, "digit", true, true)] },
    {
      role: "number",
      cells: [...left(work[0].text, work[0].endPos, last === 0 ? "remainder" : "digit"), ...right(quotient, "result", true, false)],
    },
    ...work.slice(1).map((w, i): Row => ({
      role: "number",
      cells: [...left(w.text, w.endPos, i + 1 === last ? "remainder" : "digit"), ...emptyCells(rightW)],
    })),
  ];

  steps.push(remainder === 0n ? `Il risultato è ${quotient}.` : `Il risultato è ${quotient} con resto ${remainder}.`);

  return {
    ok: true,
    value: {
      layout: { columns: leftW + rightW, rows },
      result: remainder === 0n ? quotient : `${quotient} con resto ${remainder}`,
      steps,
    },
  };
}
