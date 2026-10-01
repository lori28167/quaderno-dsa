import { getTextBetween, getTextSerializersFromSchema, type Editor } from "@tiptap/core";
import { speak, stopSpeaking } from "../../accessibility/speech";
import { updateSpeechSettings, useSpeechSettings } from "../../accessibility/speechSettings";
import type { OperationKind } from "../../math/arithmetic";
import { SYMBOL, TITLE } from "../../math/labels";
import { displayName } from "../../notebook/format";
import type { NotebookActions, NotebookState } from "../../notebook/useNotebook";
import "./Toolbar.css";

const OPERATIONS: OperationKind[] = ["addition", "subtraction", "multiplication", "division"];

const GRAPHS = [
  { type: "functionPlot", label: "Funzione" },
  { type: "cartesianPlane", label: "Piano cartesiano" },
  { type: "statChart", label: "Statistica" },
];

const SPEEDS = [
  { value: 0.7, label: "Lenta" },
  { value: 1, label: "Normale" },
  { value: 1.3, label: "Veloce" },
];

// Selected text if there is a selection, otherwise the whole page.
function textToRead(editor: Editor): string {
  const { from, to, empty } = editor.state.selection;
  if (empty) return editor.getText({ blockSeparator: "\n" });
  return getTextBetween(
    editor.state.doc,
    { from, to },
    { blockSeparator: "\n", textSerializers: getTextSerializersFromSchema(editor.schema) },
  );
}

interface Props {
  editor: Editor | null;
  notebook: NotebookState & NotebookActions;
}

function Toolbar({ editor, notebook }: Props) {
  const speech = useSpeechSettings();
  if (!editor) return null;

  const toggleSpeech = () => {
    if (speech.enabled) void stopSpeaking();
    updateSpeechSettings({ enabled: !speech.enabled, error: null });
  };

  return (
    <div className="toolbar" role="toolbar" aria-label="Strumenti del quaderno">
      <div className="toolbar__file">
        <span className="toolbar__file-name">{displayName(notebook.path)}</span>
        <span className={`toolbar__file-state${notebook.dirty ? " is-dirty" : ""}`}>
          {notebook.dirty ? "Modifiche non salvate" : notebook.path ? "Salvato" : "Non ancora salvato"}
        </span>
      </div>

      <div className="toolbar__group" role="group" aria-label="File">
        <button type="button" className="toolbar__button" title="Ctrl+N" onClick={notebook.newNotebook}>
          Nuovo
        </button>
        <button type="button" className="toolbar__button" title="Ctrl+O" onClick={notebook.openNotebook}>
          Apri…
        </button>
        <button type="button" className="toolbar__button" title="Ctrl+S" onClick={notebook.saveNotebook}>
          Salva
        </button>
        <button type="button" className="toolbar__button" title="Ctrl+Maiusc+S" onClick={notebook.saveNotebookAs}>
          Salva con nome…
        </button>
      </div>

      <div className="toolbar__group" role="group" aria-label="Calcolo in colonna">
        <span className="toolbar__label">Calcolo in colonna</span>
        {OPERATIONS.map((kind) => (
          <button
            key={kind}
            type="button"
            className="toolbar__button"
            onClick={() => editor.chain().focus().insertColumnOperation(kind).run()}
          >
            <span className="toolbar__symbol" aria-hidden="true">
              {SYMBOL[kind]}
            </span>
            {TITLE[kind]}
          </button>
        ))}
      </div>

      <div className="toolbar__group" role="group" aria-label="Grafici">
        <span className="toolbar__label">Grafici</span>
        {GRAPHS.map((graph) => (
          <button
            key={graph.type}
            type="button"
            className="toolbar__button"
            onClick={() => editor.chain().focus().insertBlock({ type: graph.type }).run()}
          >
            {graph.label}
          </button>
        ))}
      </div>

      <div className="toolbar__group" role="group" aria-label="Sintesi vocale">
        <button
          type="button"
          className={`toolbar__button toolbar__toggle${speech.enabled ? " is-on" : ""}`}
          aria-pressed={speech.enabled}
          onClick={toggleSpeech}
        >
          Sintesi vocale: {speech.enabled ? "attiva" : "spenta"}
        </button>
        {speech.enabled && (
          <>
            <button
              type="button"
              className="toolbar__button"
              title="Legge il testo selezionato, oppure tutta la pagina"
              onClick={() => speak(textToRead(editor))}
            >
              Leggi
            </button>
            <button type="button" className="toolbar__button" onClick={() => stopSpeaking()}>
              Ferma
            </button>
            <label className="toolbar__select">
              Velocità
              <select
                value={speech.speed}
                onChange={(e) => updateSpeechSettings({ speed: Number(e.target.value) })}
              >
                {SPEEDS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>

      {notebook.message && (
        <p className="toolbar__message" role="status">
          {notebook.message}
        </p>
      )}
      {speech.error && (
        <p className="toolbar__status" role="status">
          {speech.error}
        </p>
      )}
    </div>
  );
}

export default Toolbar;
