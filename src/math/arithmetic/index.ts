import { addition } from "./addition";
import { division } from "./division";
import { multiplication } from "./multiplication";
import { subtraction } from "./subtraction";
import type { OperationKind, Outcome } from "./types";

export type * from "./types";

const OPERATIONS: Record<OperationKind, (operands: string[]) => Outcome> = {
  addition,
  subtraction,
  multiplication,
  division,
};

export function computeOperation(kind: OperationKind, operands: string[]): Outcome {
  return OPERATIONS[kind](operands);
}
