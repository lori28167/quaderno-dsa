import { describe, expect, it } from "vitest";
import { computeOperation } from "./index";
import type { OperationKind, OperationResult, Row } from "./types";

function ok(kind: OperationKind, operands: string[]): OperationResult {
  const outcome = computeOperation(kind, operands);
  if (!outcome.ok) throw new Error(`Errore inatteso: ${outcome.error}`);
  return outcome.value;
}

function errorOf(kind: OperationKind, operands: string[]): string {
  const outcome = computeOperation(kind, operands);
  if (outcome.ok) throw new Error("Era atteso un errore");
  return outcome.error;
}

const rowText = (row: Row) => row.cells.map((c) => c.text || " ").join("");
const numberRows = (r: OperationResult) => r.layout.rows.filter((row) => row.role === "number");
const carryRow = (r: OperationResult) => r.layout.rows.find((row) => row.role === "carry");

describe("addizione", () => {
  it("somma con riporto", () => {
    const r = ok("addition", ["25", "17"]);
    expect(r.result).toBe("42");
    expect(rowText(carryRow(r)!)).toBe(" 1 ");
    expect(r.steps[0]).toContain("riporto 1");
  });

  it("allinea i decimali sulla virgola e aggiunge gli zeri mancanti", () => {
    const r = ok("addition", ["12,5", "3,75"]);
    expect(r.result).toBe("16,25");
    const [first, second] = numberRows(r);
    expect(rowText(first)).toBe(" 1250");
    expect(first.cells[4]).toMatchObject({ text: "0", kind: "filler" });
    expect(rowText(second)).toBe("+ 375");
    expect(first.cells[2].commaAfter).toBe(true);
  });

  it("toglie gli zeri finali dal risultato", () => {
    expect(ok("addition", ["1,5", "1,5"]).result).toBe("3");
  });

  it("gestisce più di due addendi e il riporto finale", () => {
    const r = ok("addition", ["999", "1", "1"]);
    expect(r.result).toBe("1001");
    expect(r.layout.columns).toBe(5);
  });

  it("accetta anche il punto come separatore decimale", () => {
    expect(ok("addition", ["0.1", "0.2"]).result).toBe("0,3");
  });

  it("rifiuta testo non numerico", () => {
    expect(errorOf("addition", ["abc", "3"])).toMatch(/solo numeri/);
    expect(errorOf("addition", ["-3", "3"])).toMatch(/solo numeri/);
  });
});

describe("sottrazione", () => {
  it("prende in prestito anche attraverso lo zero", () => {
    const r = ok("subtraction", ["503", "178"]);
    expect(r.result).toBe("325");
    expect(carryRow(r)!.cells.map((c) => c.text)).toEqual(["", "4", "9", "13"]);
    const top = numberRows(r)[0];
    expect(top.cells.slice(1).every((c) => c.struck)).toBe(true);
    expect(r.steps[1]).toContain("lo 0 non ha niente da prestare");
  });

  it("senza prestiti non mostra la riga dei prestiti", () => {
    const r = ok("subtraction", ["58", "23"]);
    expect(r.result).toBe("35");
    expect(carryRow(r)).toBeUndefined();
  });

  it("funziona con i decimali", () => {
    expect(ok("subtraction", ["5", "0,25"]).result).toBe("4,75");
  });

  it("non mostra zeri iniziali nel risultato", () => {
    const r = ok("subtraction", ["105", "100"]);
    expect(r.result).toBe("5");
    expect(rowText(numberRows(r)[2])).toBe("   5");
  });

  it("rifiuta risultati negativi", () => {
    expect(errorOf("subtraction", ["3", "5"])).toMatch(/maggiore o uguale/);
  });
});

describe("moltiplicazione", () => {
  it("mostra i prodotti parziali spostati", () => {
    const r = ok("multiplication", ["234", "15"]);
    expect(r.result).toBe("3510");
    const rows = numberRows(r).map(rowText);
    expect(rows).toEqual(["  234", "×  15", " 1170", " 234-", " 3510"]);
  });

  it("con un fattore di una cifra scrive subito il risultato", () => {
    const r = ok("multiplication", ["12", "3"]);
    expect(r.result).toBe("36");
    expect(numberRows(r)).toHaveLength(3);
  });

  it("mette la virgola contando le cifre decimali", () => {
    const r = ok("multiplication", ["0,2", "0,3"]);
    expect(r.result).toBe("0,06");
    expect(r.steps[r.steps.length - 1]).toContain("2 cifre decimali");
  });

  it("toglie gli zeri decimali superflui", () => {
    expect(ok("multiplication", ["2,5", "4"]).result).toBe("10");
  });
});

describe("divisione", () => {
  it("divisione esatta", () => {
    const r = ok("division", ["846", "3"]);
    expect(r.result).toBe("282");
    expect(numberRows(r).map(rowText)).toEqual(["8463  ", "24 282", " 06   ", "  0   "]);
  });

  it("prende più cifre quando la prima non basta", () => {
    const r = ok("division", ["125", "5"]);
    expect(r.result).toBe("25");
    expect(r.steps[0]).toContain("prendo le prime 2 cifre");
  });

  it("gestisce gli zeri nel quoziente", () => {
    expect(ok("division", ["1005", "5"]).result).toBe("201");
  });

  it("riporta il resto", () => {
    expect(ok("division", ["7", "2"]).result).toBe("3 con resto 1");
  });

  it("dividendo più piccolo del divisore", () => {
    expect(ok("division", ["3", "5"]).result).toBe("0 con resto 3");
  });

  it("disegna la linea tra dividendo e divisore", () => {
    const [top, second] = numberRows(ok("division", ["846", "3"]));
    expect(top.cells[3]).toMatchObject({ borderLeft: true, borderBottom: true });
    expect(second.cells[3]).toMatchObject({ text: "2", kind: "result", borderLeft: true });
  });

  it("rifiuta la divisione per zero e i decimali", () => {
    expect(errorOf("division", ["5", "0"])).toMatch(/zero/);
    expect(errorOf("division", ["5,5", "2"])).toMatch(/interi/);
  });
});

describe("griglia", () => {
  const cases: [OperationKind, string[]][] = [
    ["addition", ["12,5", "3,75", "100"]],
    ["subtraction", ["1000", "1"]],
    ["multiplication", ["1,25", "0,4"]],
    ["division", ["98765", "43"]],
  ];

  it.each(cases)("%s: ogni riga ha esattamente `columns` celle", (kind, operands) => {
    const { layout } = ok(kind, operands);
    for (const row of layout.rows) {
      if (row.role !== "rule") expect(row.cells).toHaveLength(layout.columns);
    }
  });
});
