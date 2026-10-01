import { describe, expect, it } from "vitest";
import { circleEquation, describeShape, lineEquation, nextPointName, pointLabel, type PlanePoint } from "./geometry";
import { formatNumber, formatRational, parseDecimal } from "./numbers";

const P = (name: string, x: number, y: number): PlanePoint => ({ name, x, y });

describe("numeri all'italiana", () => {
  it("usa la virgola e arrotonda", () => {
    expect(formatNumber(3.14159)).toBe("3,14");
    expect(formatNumber(-0.0001)).toBe("0");
    expect(formatNumber(5)).toBe("5");
  });

  it("legge virgola, punto e segno meno tipografico", () => {
    expect(parseDecimal("2,5")).toBe(2.5);
    expect(parseDecimal("−3")).toBe(-3);
    expect(parseDecimal("abc")).toBeNull();
  });

  it("mostra le frazioni semplici", () => {
    expect(formatRational(1 / 3)).toBe("1/3");
    expect(formatRational(-1.5)).toBe("-3/2");
    expect(formatRational(Math.SQRT2)).toBe("1,41");
  });
});

describe("geometria analitica", () => {
  it("equazione della retta", () => {
    expect(lineEquation(P("A", 0, 1), P("B", 1, 3))).toBe("y = 2x + 1");
    expect(lineEquation(P("A", 0, 0), P("B", 3, 1))).toBe("y = 1/3 x");
    expect(lineEquation(P("A", 1, 2), P("B", 3, 0))).toBe("y = -x + 3");
    expect(lineEquation(P("A", 2, 1), P("B", 2, 5))).toBe("x = 2");
    expect(lineEquation(P("A", 1, 4), P("B", 5, 4))).toBe("y = 4");
    expect(lineEquation(P("A", 0, -2), P("B", 1, -1))).toBe("y = x - 2");
  });

  it("equazione della circonferenza", () => {
    expect(circleEquation(P("C", 2, -1), P("D", 5, 3))).toBe("(x - 2)² + (y + 1)² = 25");
    expect(circleEquation(P("O", 0, 0), P("A", 0, 3))).toBe("x² + y² = 9");
  });

  it("descrive segmenti, rette e circonferenze", () => {
    const points = [P("A", 0, 0), P("B", 3, 4)];
    expect(describeShape({ kind: "segment", a: "A", b: "B" }, points)).toEqual([
      "lunghezza 5",
      "punto medio (1,5; 2)",
    ]);
    expect(describeShape({ kind: "line", a: "A", b: "B" }, points)).toEqual(["y = 4/3 x", "pendenza 4/3"]);
    expect(describeShape({ kind: "circle", a: "A", b: "B" }, points)[0]).toBe("raggio 5");
    expect(describeShape({ kind: "line", a: "A", b: "A" }, points)).toEqual(["i due punti coincidono"]);
  });

  it("dà nomi ai punti in ordine", () => {
    expect(nextPointName([])).toBe("A");
    expect(nextPointName([P("A", 0, 0), P("C", 0, 0)])).toBe("B");
    expect(pointLabel(P("A", 2.5, -1))).toBe("A(2,5; -1)");
  });
});
