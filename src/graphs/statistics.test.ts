import { describe, expect, it } from "vitest";
import { readRows, summarize } from "./statistics";

describe("tabella dei dati", () => {
  it("legge etichette e valori, ignorando le righe vuote", () => {
    const outcome = readRows([
      { label: "Lunedì", value: "3" },
      { label: "", value: "" },
      { label: "Martedì", value: "4,5" },
      { label: "", value: "2" },
    ]);
    expect(outcome).toEqual({ ok: true, data: { labels: ["Lunedì", "Martedì", "Dato 4"], values: [3, 4.5, 2] } });
  });

  it("segnala i valori non numerici e la tabella vuota", () => {
    expect(readRows([{ label: "A", value: "tre" }])).toMatchObject({ ok: false, error: expect.stringMatching(/Riga 1/) });
    expect(readRows([{ label: "", value: "" }])).toMatchObject({ ok: false, error: expect.stringMatching(/almeno un dato/) });
  });
});

describe("indici statistici", () => {
  it("media, mediana, moda, minimo e massimo", () => {
    expect(summarize([4, 1, 3, 3, 9])).toEqual({ count: 5, sum: 20, mean: 4, median: 3, modes: [3], min: 1, max: 9 });
  });

  it("mediana con un numero pari di dati e più mode", () => {
    const s = summarize([1, 1, 2, 2, 3, 7]);
    expect(s.median).toBe(2);
    expect(s.modes).toEqual([1, 2]);
  });

  it("nessuna moda se ogni valore compare una volta", () => {
    expect(summarize([1, 2, 3]).modes).toEqual([]);
  });
});
