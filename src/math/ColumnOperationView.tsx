import { Fragment, useMemo } from "react";
import type { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { computeOperation, type ColumnLayout, type OperationKind } from "./arithmetic";
import ColumnGrid from "./ColumnGrid";
import "./ColumnOperation.css";

const TITLE: Record<OperationKind, string> = {
  addition: "Addizione",
  subtraction: "Sottrazione",
  multiplication: "Moltiplicazione",
  division: "Divisione",
};

const SYMBOL: Record<OperationKind, string> = {
  addition: "+",
  subtraction: "−",
  multiplication: "×",
  division: ":",
};

const SPOKEN: Record<OperationKind, string> = {
  addition: "più",
  subtraction: "meno",
  multiplication: "per",
  division: "diviso",
};

const EMPTY_COLUMNS = 8;
const EMPTY_LAYOUT: ColumnLayout = {
  columns: EMPTY_COLUMNS,
  rows: Array.from({ length: 4 }, () => ({
    role: "number" as const,
    cells: Array.from({ length: EMPTY_COLUMNS }, () => ({ text: "", kind: "blank" as const })),
  })),
};

function operandLabel(kind: OperationKind, index: number): string {
  switch (kind) {
    case "addition":
      return `Addendo ${index + 1}`;
    case "subtraction":
      return index === 0 ? "Minuendo" : "Sottraendo";
    case "multiplication":
      return index === 0 ? "Primo fattore" : "Secondo fattore";
    case "division":
      return index === 0 ? "Dividendo" : "Divisore";
  }
}

function ColumnOperationView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const kind = node.attrs.kind as OperationKind;
  const operands = node.attrs.operands as string[];
  const showCarries = node.attrs.showCarries as boolean;

  const outcome = useMemo(
    () => (operands.every((o) => o.trim() !== "") ? computeOperation(kind, operands) : null),
    [kind, operands],
  );

  const setOperand = (index: number, value: string) =>
    updateAttributes({ operands: operands.map((o, i) => (i === index ? value : o)) });

  return (
    <NodeViewWrapper className={`column-op${selected ? " is-selected" : ""}`}>
      <div className="column-op__header">
        <span className="column-op__title">{TITLE[kind]} in colonna</span>
        {(kind === "addition" || kind === "subtraction") && (
          <label className="column-op__toggle">
            <input
              type="checkbox"
              checked={showCarries}
              onChange={(e) => updateAttributes({ showCarries: e.target.checked })}
            />
            {kind === "addition" ? "Mostra i riporti" : "Mostra i prestiti"}
          </label>
        )}
        <button type="button" className="column-op__delete" onClick={deleteNode} aria-label="Elimina operazione">
          ✕
        </button>
      </div>

      <div className="column-op__inputs">
        {operands.map((value, i) => (
          <Fragment key={i}>
            {i > 0 && (
              <span className="column-op__symbol" aria-hidden="true">
                {SYMBOL[kind]}
              </span>
            )}
            <input
              className="column-op__input"
              inputMode="decimal"
              value={value}
              placeholder={operandLabel(kind, i)}
              aria-label={operandLabel(kind, i)}
              onChange={(e) => setOperand(i, e.target.value)}
            />
            {kind === "addition" && operands.length > 2 && (
              <button
                type="button"
                className="column-op__remove"
                onClick={() => updateAttributes({ operands: operands.filter((_, j) => j !== i) })}
                aria-label={`Togli ${operandLabel(kind, i).toLowerCase()}`}
              >
                −
              </button>
            )}
          </Fragment>
        ))}
        {kind === "addition" && (
          <button
            type="button"
            className="column-op__add"
            onClick={() => updateAttributes({ operands: [...operands, ""] })}
          >
            + Aggiungi un numero
          </button>
        )}
      </div>

      {!outcome && (
        <>
          <ColumnGrid layout={EMPTY_LAYOUT} showCarries={false} label="Quadretti vuoti" />
          <p className="column-op__hint">Scrivi i numeri qui sopra: il calcolo comparirà nei quadretti.</p>
        </>
      )}

      {outcome && !outcome.ok && (
        <p className="column-op__error" role="alert">
          {outcome.error}
        </p>
      )}

      {outcome?.ok && (
        <>
          <ColumnGrid
            layout={outcome.value.layout}
            showCarries={showCarries}
            label={`${operands.join(` ${SPOKEN[kind]} `)} uguale ${outcome.value.result}`}
          />
          <p className="column-op__result">
            Risultato: <strong>{outcome.value.result}</strong>
          </p>
          <details className="column-op__steps">
            <summary>Mostra i passaggi</summary>
            <ol>
              {outcome.value.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </details>
        </>
      )}
    </NodeViewWrapper>
  );
}

export default ColumnOperationView;
