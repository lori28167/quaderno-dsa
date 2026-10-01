import { describe, expect, it } from "vitest";
import { parseFunction } from "./expression";

function valueAt(source: string, x: number): number {
  const outcome = parseFunction(source);
  if (!outcome.ok) throw new Error(`Errore inatteso per "${source}": ${outcome.error}`);
  return outcome.fn(x);
}

function errorOf(source: string): string {
  const outcome = parseFunction(source);
  if (outcome.ok) throw new Error(`Era atteso un errore per "${source}"`);
  return outcome.error;
}

describe("funzioni scritte come a scuola", () => {
  it.each([
    ["2x + 1", 3, 7],
    ["y = 2x + 1", 3, 7],
    ["f(x) = x^2 - 3", 2, 1],
    ["3x²", 2, 12],
    ["x³", 2, 8],
    ["0,5x", 4, 2],
    ["-x^2", 3, -9],
    ["2^-1", 0, 0.5],
    ["2(x + 1)", 1, 4],
    ["(x + 1)(x - 1)", 3, 8],
    ["x(x+1)", 2, 6],
    ["[2(x + 1)] : 2", 5, 6],
    ["1/2x", 4, 2],
    ["√(x + 5)", 4, 3],
    ["radice(x)", 9, 3],
    ["abs(x - 5)", 2, 3],
    ["2πx", 1, 2 * Math.PI],
    ["e^x", 0, 1],
    ["exp(x)", 0, 1],
    ["log(x)", 100, 2],
    ["3 × x − 1", 2, 5],
  ])("%s per x = %d fa %d", (source, x, expected) => {
    expect(valueAt(source, x)).toBeCloseTo(expected);
  });

  it("riconosce sen e tg italiani", () => {
    expect(valueAt("sen(x)", Math.PI / 2)).toBeCloseTo(1);
    expect(valueAt("tg(x)", Math.PI / 4)).toBeCloseTo(1);
    expect(valueAt("xsen(x)", Math.PI / 2)).toBeCloseTo(Math.PI / 2);
  });

  it("restituisce NaN fuori dal dominio, senza errori", () => {
    expect(valueAt("√x", -1)).toBeNaN();
  });
});

describe("messaggi di errore chiari", () => {
  it.each([
    ["", /Scrivi una funzione/],
    ["2x +", /incompleta/],
    ["(x + 1", /parentesi chiusa/],
    ["x + 1)", /di troppo/],
    ["2y + 1", /Non conosco "y"/],
    ["x # 2", /Non capisco il simbolo "#"/],
    ["sen", /serve un argomento/],
    ["f(1, 2)", /Non conosco "f"/],
    ["x, 2", /virgola solo nei numeri decimali/],
  ])("%j", (source, message) => {
    expect(errorOf(source)).toMatch(message);
  });
});
