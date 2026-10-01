import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor, JSONContent } from "@tiptap/core";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ask, open, save } from "@tauri-apps/plugin-dialog";
import {
  EMPTY_DOCUMENT,
  FILE_EXTENSION,
  displayName,
  parseNotebook,
  parseRecovery,
  serializeNotebook,
  serializeRecovery,
  withExtension,
} from "./format";

const FILTERS = [{ name: "Quaderno DSA", extensions: [FILE_EXTENSION] }];
const RECOVERY_DELAY_MS = 1000;

export interface NotebookState {
  path: string | null;
  dirty: boolean;
  message: string | null;
}

export interface NotebookActions {
  newNotebook: () => Promise<void>;
  openNotebook: () => Promise<void>;
  saveNotebook: () => Promise<void>;
  saveNotebookAs: () => Promise<void>;
}

const errorText = (error: unknown) => (typeof error === "string" ? error : "Qualcosa è andato storto.");

function loadContent(editor: Editor, content: JSONContent): void {
  editor.chain().setMeta("addToHistory", false).setContent(content, { emitUpdate: false }).run();
}

export function useNotebook(editor: Editor | null): NotebookState & NotebookActions {
  const [state, setState] = useState<NotebookState>({ path: null, dirty: false, message: null });
  const stateRef = useRef(state);
  stateRef.current = state;
  // The recovery copy must not be overwritten before the previous session has been restored.
  const restored = useRef(false);
  const recoveryTimer = useRef<number | undefined>(undefined);

  const writeRecovery = useCallback(
    (path: string | null, dirty: boolean) => {
      if (!editor || !restored.current) return;
      window.clearTimeout(recoveryTimer.current);
      invoke("save_recovery", {
        contents: serializeRecovery({ path, dirty, content: editor.getJSON() }),
      }).catch(() => {
        // Best effort: a failed recovery copy must not interrupt the student.
      });
    },
    [editor],
  );

  useEffect(() => {
    if (!editor) return;
    let cancelled = false;
    invoke<string | null>("load_recovery")
      .then((raw) => {
        const recovery = raw ? parseRecovery(raw) : null;
        if (cancelled || !recovery) return;
        loadContent(editor, recovery.content);
        setState({
          path: recovery.path,
          dirty: recovery.dirty,
          message: recovery.dirty ? "Ho ripristinato le modifiche non salvate dell'ultima volta." : null,
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) restored.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => {
      setState((s) => (s.dirty ? s : { ...s, dirty: true }));
      window.clearTimeout(recoveryTimer.current);
      recoveryTimer.current = window.setTimeout(
        () => writeRecovery(stateRef.current.path, true),
        RECOVERY_DELAY_MS,
      );
    };
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
      window.clearTimeout(recoveryTimer.current);
    };
  }, [editor, writeRecovery]);

  useEffect(() => {
    const title = `${state.dirty ? "● " : ""}${displayName(state.path)} – Quaderno DSA`;
    getCurrentWindow()
      .setTitle(title)
      .catch(() => {});
  }, [state.path, state.dirty]);

  const confirmDiscard = useCallback(async () => {
    if (!stateRef.current.dirty) return true;
    return ask("Ci sono modifiche non salvate in questo quaderno. Vuoi continuare e perderle?", {
      title: "Modifiche non salvate",
      kind: "warning",
      okLabel: "Continua senza salvare",
      cancelLabel: "Annulla",
    });
  }, []);

  const writeTo = useCallback(
    async (path: string) => {
      if (!editor) return;
      try {
        await invoke("write_notebook", { path, contents: serializeNotebook(editor.getJSON()) });
        const time = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
        setState({ path, dirty: false, message: `Salvato alle ${time}.` });
        writeRecovery(path, false);
      } catch (error) {
        setState((s) => ({ ...s, message: errorText(error) }));
      }
    },
    [editor, writeRecovery],
  );

  const saveNotebookAs = useCallback(async () => {
    const target = await save({
      defaultPath: stateRef.current.path ?? `Quaderno.${FILE_EXTENSION}`,
      filters: FILTERS,
    });
    if (target) await writeTo(withExtension(target));
  }, [writeTo]);

  const saveNotebook = useCallback(async () => {
    const { path } = stateRef.current;
    if (path) await writeTo(path);
    else await saveNotebookAs();
  }, [writeTo, saveNotebookAs]);

  const newNotebook = useCallback(async () => {
    if (!editor || !(await confirmDiscard())) return;
    loadContent(editor, EMPTY_DOCUMENT);
    setState({ path: null, dirty: false, message: null });
    writeRecovery(null, false);
    editor.commands.focus("start");
  }, [editor, confirmDiscard, writeRecovery]);

  const openNotebook = useCallback(async () => {
    if (!editor || !(await confirmDiscard())) return;
    const selected = await open({ multiple: false, directory: false, filters: FILTERS });
    if (typeof selected !== "string") return;
    try {
      const parsed = parseNotebook(await invoke<string>("read_notebook", { path: selected }));
      if (!parsed.ok) {
        setState((s) => ({ ...s, message: parsed.error }));
        return;
      }
      loadContent(editor, parsed.content);
      setState({ path: selected, dirty: false, message: null });
      writeRecovery(selected, false);
    } catch (error) {
      setState((s) => ({ ...s, message: errorText(error) }));
    }
  }, [editor, confirmDiscard, writeRecovery]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      const action =
        key === "s" ? (event.shiftKey ? saveNotebookAs : saveNotebook)
        : key === "o" ? openNotebook
        : key === "n" ? newNotebook
        : null;
      if (!action) return;
      event.preventDefault();
      void action();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [newNotebook, openNotebook, saveNotebook, saveNotebookAs]);

  return { ...state, newNotebook, openNotebook, saveNotebook, saveNotebookAs };
}
