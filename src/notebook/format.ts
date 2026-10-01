import type { JSONContent } from "@tiptap/core";

export const FILE_EXTENSION = "quaderno";
export const FORMAT_VERSION = 1;
const APP_ID = "quaderno-dsa";

export const EMPTY_DOCUMENT: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

const DAMAGED = "Il file è danneggiato o non è un quaderno.";

export type ParseResult = { ok: true; content: JSONContent } | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function serializeNotebook(content: JSONContent, now: Date = new Date()): string {
  return JSON.stringify(
    { app: APP_ID, formatVersion: FORMAT_VERSION, savedAt: now.toISOString(), content },
    null,
    2,
  );
}

export function parseNotebook(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: DAMAGED };
  }
  if (!isRecord(data) || data.app !== APP_ID) {
    return { ok: false, error: "Questo file non è un quaderno di Quaderno DSA." };
  }
  if (typeof data.formatVersion !== "number") return { ok: false, error: DAMAGED };
  if (data.formatVersion > FORMAT_VERSION) {
    return {
      ok: false,
      error: "Questo quaderno è stato creato con una versione più recente dell'app: aggiornala per aprirlo.",
    };
  }
  if (!isRecord(data.content) || data.content.type !== "doc") return { ok: false, error: DAMAGED };
  return { ok: true, content: data.content as JSONContent };
}

// Copia di ripristino: ricorda anche dove era salvato il quaderno e se aveva modifiche non salvate.
export interface Recovery {
  path: string | null;
  dirty: boolean;
  content: JSONContent;
}

export function serializeRecovery(recovery: Recovery): string {
  return JSON.stringify({
    path: recovery.path,
    dirty: recovery.dirty,
    notebook: serializeNotebook(recovery.content),
  });
}

export function parseRecovery(text: string): Recovery | null {
  try {
    const data: unknown = JSON.parse(text);
    if (!isRecord(data) || typeof data.notebook !== "string") return null;
    const notebook = parseNotebook(data.notebook);
    if (!notebook.ok) return null;
    return {
      path: typeof data.path === "string" ? data.path : null,
      dirty: data.dirty === true,
      content: notebook.content,
    };
  } catch {
    return null;
  }
}

export function displayName(path: string | null): string {
  if (!path) return "Quaderno senza nome";
  const base = path.split(/[\\/]/).pop() ?? path;
  return base.endsWith(`.${FILE_EXTENSION}`) ? base.slice(0, -FILE_EXTENSION.length - 1) : base;
}

export function withExtension(path: string): string {
  return path.endsWith(`.${FILE_EXTENSION}`) ? path : `${path}.${FILE_EXTENSION}`;
}
