import { describe, expect, it } from "vitest";
import { describeOperation, spokenExpression } from "./labels";

describe("frasi per la sintesi vocale", () => {
  it("descrive un'operazione completa", () => {
    expect(describeOperation("addition", ["25", "17"])).toBe("Addizione in colonna: 25 più 17 uguale 42.");
    expect(describeOperation("division", ["7", "2"])).toBe("Divisione in colonna: 7 diviso 2 uguale 3 con resto 1.");
  });

  it("segnala un'operazione incompleta o non valida", () => {
    expect(describeOperation("multiplication", ["12", ""])).toBe("Moltiplicazione in colonna da completare.");
    expect(describeOperation("subtraction", ["3", "5"])).toBe("Sottrazione in colonna da completare.");
  });

  it("legge più addendi con la virgola dei decimali", () => {
    expect(spokenExpression("addition", ["1,5", " 2 ", "3"])).toBe("1,5 più 2 più 3");
  });
});
