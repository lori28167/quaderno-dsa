import type { Editor } from "@tiptap/core";
import type { OperationKind } from "../../math/arithmetic";
import "./Toolbar.css";

const OPERATIONS: { kind: OperationKind; label: string; symbol: string }[] = [
  { kind: "addition", label: "Addizione", symbol: "+" },
  { kind: "subtraction", label: "Sottrazione", symbol: "−" },
  { kind: "multiplication", label: "Moltiplicazione", symbol: "×" },
  { kind: "division", label: "Divisione", symbol: ":" },
];

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="toolbar" role="toolbar" aria-label="Strumenti del quaderno">
      <span className="toolbar__label">Calcolo in colonna</span>
      {OPERATIONS.map((op) => (
        <button
          key={op.kind}
          type="button"
          className="toolbar__button"
          onClick={() => editor.chain().focus().insertColumnOperation(op.kind).run()}
        >
          <span className="toolbar__symbol" aria-hidden="true">
            {op.symbol}
          </span>
          {op.label}
        </button>
      ))}
    </div>
  );
}

export default Toolbar;
