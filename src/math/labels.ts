import { computeOperation, type OperationKind } from "./arithmetic";

export const TITLE: Record<OperationKind, string> = {
  addition: "Addizione",
  subtraction: "Sottrazione",
  multiplication: "Moltiplicazione",
  division: "Divisione",
};

export const SYMBOL: Record<OperationKind, string> = {
  addition: "+",
  subtraction: "−",
  multiplication: "×",
  division: ":",
};

const SPOKEN: Record<OperationKind, string> = {
  addition: "più",
  subtraction: "meno",
  multiplication: "per",
  division: "diviso",
};

export function spokenExpression(kind: OperationKind, operands: string[]): string {
  return operands.map((o) => o.trim()).join(` ${SPOKEN[kind]} `);
}

// One-sentence summary, used for screen readers and when reading the page aloud.
export function describeOperation(kind: OperationKind, operands: string[]): string {
  const filled = operands.every((o) => o.trim() !== "");
  const outcome = filled ? computeOperation(kind, operands) : null;
  if (!outcome?.ok) return `${TITLE[kind]} in colonna da completare.`;
  return `${TITLE[kind]} in colonna: ${spokenExpression(kind, operands)} uguale ${outcome.value.result}.`;
}
