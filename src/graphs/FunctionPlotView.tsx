import { useMemo } from "react";
import type { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import BlockHeader from "./BlockHeader";
import { parseFunction, type Fn } from "./expression";
import { formatNumber, parseDecimal } from "./numbers";
import { GRAPH_COLORS, useJsxBoard, type BoundingBox } from "./useJsxBoard";
import "./Graphs.css";

const MAX_FUNCTIONS = GRAPH_COLORS.length;
const MAX_TABLE_ROWS = 21;

type Bounds = { ok: true; box: BoundingBox; xMin: number; xMax: number } | { ok: false; error: string };

function readBounds(xMin: string, xMax: string, yMin: string, yMax: string): Bounds {
  const [x1, x2, y1, y2] = [xMin, xMax, yMin, yMax].map(parseDecimal);
  if (x1 === null || x2 === null || y1 === null || y2 === null) {
    return { ok: false, error: "Scrivi dei numeri negli intervalli di x e di y." };
  }
  if (x1 >= x2 || y1 >= y2) return { ok: false, error: "In ogni intervallo il primo numero deve essere più piccolo del secondo." };
  return { ok: true, box: [x1, y2, x2, y1], xMin: x1, xMax: x2 };
}

function tableXs(xMin: number, xMax: number): number[] {
  const first = Math.ceil(xMin);
  const count = Math.floor(xMax) - first + 1;
  const step = Math.max(1, Math.ceil(count / MAX_TABLE_ROWS));
  const xs: number[] = [];
  for (let x = first; x <= xMax; x += step) xs.push(x);
  return xs;
}

export function describeFunctionPlot(attrs: Record<string, unknown>): string {
  const functions = (attrs.functions as string[]).map((f) => f.trim()).filter(Boolean);
  if (functions.length === 0) return "Grafico di funzione vuoto.";
  const list = functions.map((f) => (/^\s*(y|f\s*\(\s*x\s*\))\s*=/i.test(f) ? f : `y = ${f}`));
  return functions.length === 1 ? `Grafico della funzione ${list[0]}.` : `Grafico delle funzioni: ${list.join("; ")}.`;
}

function FunctionPlotView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const functions = node.attrs.functions as string[];
  const { xMin, xMax, yMin, yMax } = node.attrs as Record<string, string>;

  const parsed = useMemo(() => functions.map((f) => (f.trim() ? parseFunction(f) : null)), [functions]);
  const bounds = readBounds(xMin, xMax, yMin, yMax);
  const curves = parsed.flatMap((p, i) => (p?.ok ? [{ fn: p.fn, color: GRAPH_COLORS[i], index: i }] : []));

  const boardRef = useJsxBoard(
    (board) => {
      if (!bounds.ok) return;
      for (const curve of curves) {
        board.create("functiongraph", [curve.fn, bounds.xMin, bounds.xMax], {
          strokeColor: curve.color,
          strokeWidth: 3,
          highlight: false,
        });
      }
    },
    { boundingbox: bounds.ok ? bounds.box : [-10, 10, 10, -10], keepAspectRatio: false },
    [functions.join("\n")],
  );

  const setFunction = (index: number, value: string) =>
    updateAttributes({ functions: functions.map((f, i) => (i === index ? value : f)) });

  const value = (fn: Fn, x: number) => {
    const y = fn(x);
    return Number.isFinite(y) ? formatNumber(y) : "non definita";
  };

  return (
    <NodeViewWrapper className={`graph-block${selected ? " is-selected" : ""}`}>
      <BlockHeader title="Grafico di funzione" onDelete={deleteNode} />

      <div className="graph-block__fields">
        {functions.map((source, i) => {
          const outcome = parsed[i];
          return (
            <div key={i} className="graph-function">
              <span className="graph-swatch" style={{ background: GRAPH_COLORS[i] }} aria-hidden="true" />
              <label className="graph-function__label">
                y =
                <input
                  className="graph-input graph-input--wide"
                  value={source}
                  placeholder="per esempio 2x + 1"
                  aria-label={`Funzione ${i + 1}`}
                  onChange={(e) => setFunction(i, e.target.value)}
                />
              </label>
              {functions.length > 1 && (
                <button
                  type="button"
                  aria-label={`Togli la funzione ${i + 1}`}
                  onClick={() => updateAttributes({ functions: functions.filter((_, j) => j !== i) })}
                >
                  −
                </button>
              )}
              {outcome && !outcome.ok && (
                <p className="graph-block__error" role="alert">
                  {outcome.error}
                </p>
              )}
            </div>
          );
        })}
        {functions.length < MAX_FUNCTIONS && (
          <button type="button" onClick={() => updateAttributes({ functions: [...functions, ""] })}>
            + Aggiungi una funzione
          </button>
        )}
      </div>

      <div className="graph-range">
        <span>x da</span>
        <input className="graph-input graph-input--small" inputMode="decimal" aria-label="x minimo" value={xMin} onChange={(e) => updateAttributes({ xMin: e.target.value })} />
        <span>a</span>
        <input className="graph-input graph-input--small" inputMode="decimal" aria-label="x massimo" value={xMax} onChange={(e) => updateAttributes({ xMax: e.target.value })} />
        <span className="graph-range__gap">y da</span>
        <input className="graph-input graph-input--small" inputMode="decimal" aria-label="y minimo" value={yMin} onChange={(e) => updateAttributes({ yMin: e.target.value })} />
        <span>a</span>
        <input className="graph-input graph-input--small" inputMode="decimal" aria-label="y massimo" value={yMax} onChange={(e) => updateAttributes({ yMax: e.target.value })} />
      </div>
      {!bounds.ok && (
        <p className="graph-block__error" role="alert">
          {bounds.error}
        </p>
      )}

      {/* JSXGraph overwrites the board's own aria-label, so the description sits on a wrapper. */}
      <div role="img" aria-label={describeFunctionPlot(node.attrs)}>
        <div ref={boardRef} className="graph-surface graph-board" />
      </div>
      <p className="graph-block__hint">Trascina per spostarti nel grafico; tieni premuto Maiusc e usa la rotellina per lo zoom.</p>

      {curves.length > 0 && bounds.ok && (
        <details className="graph-block__details">
          <summary>Tabella dei valori</summary>
          <table className="graph-table">
            <thead>
              <tr>
                <th scope="col">x</th>
                {curves.map((c) => (
                  <th key={c.index} scope="col">
                    <span className="graph-swatch" style={{ background: c.color }} aria-hidden="true" /> y = {functions[c.index]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableXs(bounds.xMin, bounds.xMax).map((x) => (
                <tr key={x}>
                  <th scope="row">{formatNumber(x)}</th>
                  {curves.map((c) => (
                    <td key={c.index}>{value(c.fn, x)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </NodeViewWrapper>
  );
}

export default FunctionPlotView;
