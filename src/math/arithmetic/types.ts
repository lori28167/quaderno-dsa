export type OperationKind = "addition" | "subtraction" | "multiplication" | "division";

export type CellKind = "digit" | "filler" | "carry" | "sign" | "blank" | "result" | "remainder";

export interface Cell {
  text: string;
  kind: CellKind;
  commaAfter?: boolean;
  struck?: boolean;
  borderLeft?: boolean;
  borderBottom?: boolean;
}

export type RowRole = "carry" | "number" | "rule";

export interface Row {
  role: RowRole;
  cells: Cell[];
}

export interface ColumnLayout {
  columns: number;
  rows: Row[];
}

export interface OperationResult {
  layout: ColumnLayout;
  result: string;
  steps: string[];
}

export type Outcome = { ok: true; value: OperationResult } | { ok: false; error: string };
