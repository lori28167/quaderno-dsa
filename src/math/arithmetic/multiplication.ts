import { alignedRight, blank, rule, sign } from "./layout";
import { INVALID_NUMBER, fail, formatNumber, parseAll, stripLeadingZeros } from "./numbers";
import type { Outcome, Row } from "./types";

const decimals = (n: number) => `${n} ${n === 1 ? "cifra decimale" : "cifre decimali"}`;

export function multiplication(raw: string[]): Outcome {
  if (raw.length !== 2) return fail("La moltiplicazione ha bisogno di due numeri.");
  const nums = parseAll(raw);
  if (!nums) return fail(INVALID_NUMBER);
  const [a, b] = nums;

  const aDisplay = a.int + a.frac;
  const bDisplay = b.int + b.frac;
  const aCalc = stripLeadingZeros(aDisplay);
  const bCalc = stripLeadingZeros(bDisplay);
  const A = BigInt(aCalc);

  const partials = [...bCalc].reverse().map((d, k) => ({ k, digit: d, value: (A * BigInt(d)).toString() }));
  const product = A * BigInt(bCalc);
  const fracTotal = a.frac.length + b.frac.length;
  const productStr = product.toString().padStart(fracTotal + 1, "0");
  const resultInt = productStr.slice(0, productStr.length - fracTotal);
  const resultFrac = productStr.slice(productStr.length - fracTotal);

  const width = Math.max(
    aDisplay.length,
    bDisplay.length,
    productStr.length,
    ...partials.map((p) => p.value.length + p.k),
  );

  const steps: string[] = [];
  if (fracTotal > 0) steps.push(`Per ora ignoro le virgole e moltiplico ${aCalc} per ${bCalc}.`);

  const rows: Row[] = [
    { role: "number", cells: [blank(), ...alignedRight(aDisplay, width, "digit", { fracLen: a.frac.length })] },
    { role: "number", cells: [sign("×"), ...alignedRight(bDisplay, width, "digit", { fracLen: b.frac.length })] },
    rule(),
  ];

  if (partials.length > 1) {
    for (const p of partials) {
      rows.push({ role: "number", cells: [blank(), ...alignedRight(p.value, width, "digit", { shift: p.k })] });
      const shift = p.k > 0 ? `; lo scrivo spostato di ${p.k} ${p.k === 1 ? "posto" : "posti"} verso sinistra.` : ".";
      steps.push(`${aCalc} per ${p.digit} fa ${p.value}${shift}`);
    }
    rows.push(rule());
    steps.push(`Sommo i prodotti parziali: fa ${product}.`);
  } else {
    steps.push(`${aCalc} per ${bCalc} fa ${product}.`);
  }

  rows.push({
    role: "number",
    cells: [blank(), ...alignedRight(productStr, width, "result", { fracLen: fracTotal })],
  });

  const result = formatNumber(resultInt, resultFrac);
  if (fracTotal > 0) {
    steps.push(
      `I due numeri hanno in tutto ${decimals(fracTotal)}, quindi nel risultato conto ${decimals(fracTotal)} da destra e metto la virgola: ${result}.`,
    );
  }

  return { ok: true, value: { layout: { columns: 1 + width, rows }, result, steps } };
}
