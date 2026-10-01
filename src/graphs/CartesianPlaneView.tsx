import { useEffect, useState } from "react";
import type { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import JXG from "jsxgraph";
import BlockHeader from "./BlockHeader";
import {
  SHAPE_NAMES,
  describeShape,
  nextPointName,
  pointLabel,
  shapeName,
  type PlanePoint,
  type Shape,
  type ShapeKind,
} from "./geometry";
import { formatNumber, parseDecimal } from "./numbers";
import { GRAPH_COLORS, useJsxBoard } from "./useJsxBoard";
import "./Graphs.css";

const CLICK_TOLERANCE_PX = 5;

export function describeCartesianPlane(attrs: Record<string, unknown>): string {
  const points = attrs.points as PlanePoint[];
  const shapes = attrs.shapes as Shape[];
  if (points.length === 0) return "Piano cartesiano vuoto.";
  const parts = [`Piano cartesiano con ${points.length === 1 ? "il punto" : "i punti"} ${points.map(pointLabel).join(", ")}.`];
  for (const shape of shapes) parts.push(`${shapeName(shape)}: ${describeShape(shape, points).join(", ")}.`);
  return parts.join(" ");
}

function CoordinateField({ value, label, onCommit }: { value: number; label: string; onCommit: (v: number) => void }) {
  const [text, setText] = useState(formatNumber(value));
  useEffect(() => setText(formatNumber(value)), [value]);
  return (
    <input
      className="graph-input graph-input--small"
      inputMode="decimal"
      aria-label={label}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const parsed = parseDecimal(e.target.value);
        if (parsed !== null && parsed !== value) onCommit(parsed);
      }}
    />
  );
}

function CartesianPlaneView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const points = node.attrs.points as PlanePoint[];
  const shapes = node.attrs.shapes as Shape[];
  const [newShape, setNewShape] = useState<Shape>({ kind: "segment", a: "", b: "" });

  const setPoints = (next: PlanePoint[]) => updateAttributes({ points: next });
  const addPoint = (x: number, y: number) => setPoints([...points, { name: nextPointName(points), x, y }]);

  const boardRef = useJsxBoard(
    (board) => {
      const created = new Map<string, JXG.Point>();
      for (const p of points) {
        const point = board.create("point", [p.x, p.y], {
          name: p.name,
          size: 5,
          strokeColor: GRAPH_COLORS[0],
          fillColor: GRAPH_COLORS[0],
          snapToGrid: true,
          snapSizeX: 1,
          snapSizeY: 1,
          label: { fontSize: 20, offset: [8, 12] },
        }) as JXG.Point;
        point.on("up", () => {
          const x = point.X();
          const y = point.Y();
          if (x !== p.x || y !== p.y) setPoints(points.map((q) => (q.name === p.name ? { ...q, x, y } : q)));
        });
        created.set(p.name, point);
      }

      shapes.forEach((shape, i) => {
        const a = created.get(shape.a);
        const b = created.get(shape.b);
        if (!a || !b) return;
        const color = GRAPH_COLORS[(i + 1) % GRAPH_COLORS.length];
        const style = { strokeColor: color, strokeWidth: 3, highlight: false, fixed: true };
        if (shape.kind === "segment") board.create("segment", [a, b], style);
        else if (shape.kind === "line") board.create("line", [a, b], style);
        else board.create("circle", [a, b], style);
      });

      // A click on an empty spot adds a point; a drag moves the view instead.
      let down: { x: number; y: number; onPoint: boolean } | null = null;
      board.on("down", (e: PointerEvent) => {
        const onPoint = (board.getAllObjectsUnderMouse(e) as JXG.GeometryElement[]).some((o) => o.elType === "point");
        down = { x: e.clientX, y: e.clientY, onPoint };
      });
      board.on("up", (e: PointerEvent) => {
        if (!down || down.onPoint) return;
        if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > CLICK_TOLERANCE_PX) return;
        const [x, y] = board.getUsrCoordsOfMouse(e);
        addPoint(Math.round(x), Math.round(y));
      });
    },
    { boundingbox: [-10, 10, 10, -10], keepAspectRatio: true },
    [JSON.stringify(points), JSON.stringify(shapes)],
  );

  const removePoint = (name: string) =>
    updateAttributes({
      points: points.filter((p) => p.name !== name),
      shapes: shapes.filter((s) => s.a !== name && s.b !== name),
    });

  const shapeA = newShape.a || points[0]?.name || "";
  const shapeB = newShape.b || points[1]?.name || "";
  const canAddShape = points.length >= 2 && shapeA !== shapeB;

  return (
    <NodeViewWrapper className={`graph-block${selected ? " is-selected" : ""}`}>
      <BlockHeader title="Piano cartesiano" onDelete={deleteNode} />

      {/* JSXGraph overwrites the board's own aria-label, so the description sits on a wrapper. */}
      <div role="img" aria-label={describeCartesianPlane(node.attrs)}>
        <div ref={boardRef} className="graph-surface graph-board graph-board--square" />
      </div>
      <p className="graph-block__hint">
        Clicca sul piano per aggiungere un punto e trascina i punti per spostarli. Trascina il fondo per muoverti nel piano.
      </p>

      <div className="graph-columns">
        <section className="graph-panel" aria-label="Punti">
          <h4>Punti</h4>
          {points.length === 0 && <p className="graph-block__hint">Nessun punto ancora.</p>}
          <ul className="graph-list">
            {points.map((p) => (
              <li key={p.name} className="graph-list__row">
                <strong>{p.name}</strong>
                <span>(</span>
                <CoordinateField value={p.x} label={`Ascissa di ${p.name}`} onCommit={(x) => setPoints(points.map((q) => (q.name === p.name ? { ...q, x } : q)))} />
                <span>;</span>
                <CoordinateField value={p.y} label={`Ordinata di ${p.name}`} onCommit={(y) => setPoints(points.map((q) => (q.name === p.name ? { ...q, y } : q)))} />
                <span>)</span>
                <button type="button" aria-label={`Elimina il punto ${p.name}`} onClick={() => removePoint(p.name)}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => addPoint(0, 0)}>
            + Aggiungi un punto
          </button>
        </section>

        <section className="graph-panel" aria-label="Figure">
          <h4>Segmenti, rette e circonferenze</h4>
          <div className="graph-shape-form">
            <select
              aria-label="Tipo di figura"
              value={newShape.kind}
              onChange={(e) => setNewShape({ ...newShape, kind: e.target.value as ShapeKind })}
            >
              {(Object.keys(SHAPE_NAMES) as ShapeKind[]).map((kind) => (
                <option key={kind} value={kind}>
                  {SHAPE_NAMES[kind]}
                </option>
              ))}
            </select>
            <label>
              {newShape.kind === "circle" ? "centro" : "da"}
              <select aria-label="Primo punto" value={shapeA} onChange={(e) => setNewShape({ ...newShape, a: e.target.value })}>
                {points.map((p) => (
                  <option key={p.name}>{p.name}</option>
                ))}
              </select>
            </label>
            <label>
              {newShape.kind === "circle" ? "passa per" : "a"}
              <select aria-label="Secondo punto" value={shapeB} onChange={(e) => setNewShape({ ...newShape, b: e.target.value })}>
                {points.map((p) => (
                  <option key={p.name}>{p.name}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!canAddShape}
              onClick={() => updateAttributes({ shapes: [...shapes, { kind: newShape.kind, a: shapeA, b: shapeB }] })}
            >
              Aggiungi
            </button>
          </div>
          {points.length < 2 && <p className="graph-block__hint">Servono almeno due punti.</p>}
          <ul className="graph-list">
            {shapes.map((shape, i) => (
              <li key={i} className="graph-list__shape">
                <span className="graph-swatch" style={{ background: GRAPH_COLORS[(i + 1) % GRAPH_COLORS.length] }} aria-hidden="true" />
                <div>
                  <strong>{shapeName(shape)}</strong>
                  <ul className="graph-list__details">
                    {describeShape(shape, points).map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  aria-label={`Elimina ${shapeName(shape)}`}
                  onClick={() => updateAttributes({ shapes: shapes.filter((_, j) => j !== i) })}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </NodeViewWrapper>
  );
}

export default CartesianPlaneView;
