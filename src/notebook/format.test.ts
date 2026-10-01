import { describe, expect, it } from "vitest";
import {
  EMPTY_DOCUMENT,
  displayName,
  parseNotebook,
  parseRecovery,
  serializeNotebook,
  serializeRecovery,
  withExtension,
} from "./format";

const doc = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Ciao" }] },
    { type: "columnOperation", attrs: { kind: "addition", operands: ["25", "17"], showCarries: true } },
  ],
};

describe("file .quaderno", () => {
  it("salva e riapre lo stesso contenuto", () => {
    const parsed = parseNotebook(serializeNotebook(doc));
    expect(parsed).toEqual({ ok: true, content: doc });
  });

  it("rifiuta file non validi con un messaggio chiaro", () => {
    expect(parseNotebook("non è json")).toMatchObject({ ok: false, error: expect.stringMatching(/danneggiato/) });
    expect(parseNotebook('{"hello": 1}')).toMatchObject({ ok: false, error: expect.stringMatching(/non è un quaderno/) });
    expect(parseNotebook('{"app":"quaderno-dsa","formatVersion":1,"content":{"type":"paragraph"}}')).toMatchObject({
      ok: false,
    });
  });

  it("avvisa se il quaderno viene da una versione più recente", () => {
    const future = JSON.stringify({ app: "quaderno-dsa", formatVersion: 99, content: EMPTY_DOCUMENT });
    expect(parseNotebook(future)).toMatchObject({ ok: false, error: expect.stringMatching(/più recente/) });
  });
});

describe("copia di ripristino", () => {
  it("ricorda percorso, modifiche e contenuto", () => {
    const recovery = { path: "/home/lori/Matematica.quaderno", dirty: true, content: doc };
    expect(parseRecovery(serializeRecovery(recovery))).toEqual(recovery);
  });

  it("ignora una copia danneggiata", () => {
    expect(parseRecovery("{")).toBeNull();
    expect(parseRecovery('{"notebook":"{}"}')).toBeNull();
  });
});

describe("nomi dei file", () => {
  it("mostra il nome senza estensione", () => {
    expect(displayName("/home/lori/Matematica.quaderno")).toBe("Matematica");
    expect(displayName(null)).toBe("Quaderno senza nome");
  });

  it("aggiunge l'estensione se manca", () => {
    expect(withExtension("/tmp/compiti")).toBe("/tmp/compiti.quaderno");
    expect(withExtension("/tmp/compiti.quaderno")).toBe("/tmp/compiti.quaderno");
  });
});
