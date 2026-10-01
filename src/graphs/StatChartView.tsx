import { useEffect, useMemo, useRef } from "react";
import type { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PieController,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import BlockHeader from "./BlockHeader";
import { formatNumber } from "./numbers";
import { readRows, summarize, type DataRow } from "./statistics";
import { GRAPH_COLORS } from "./useJsxBoard";
import "./Graphs.css";

Chart.register(BarController, BarElement, LineController, LineElement, PointElement, PieController, ArcElement, CategoryScale, LinearScale, Title, Tooltip, Legend);
Chart.defaults.font.size = 16;

export type ChartType = "bar" | "pie" | "line";

const CHART_NAMES: Record<ChartType, string> = {
  bar: "Grafico a barre",
  pie: "Grafico a torta",
  line: "Grafico a linee",
};

export function describeStatChart(attrs: Record<string, unknown>): string {
  const outcome = readRows(attrs.rows as DataRow[]);
  const title = (attrs.title as string).trim();
  const name = `${CHART_NAMES[attrs.chartType as ChartType]}${title ? ` "${title}"` : ""}`;
  if (!outcome.ok) return `${name} senza dati.`;
  const { labels, values } = outcome.data;
  const items = labels.map((label, i) => `${label} ${formatNumber(values[i])}`).join(", ");
  return `${name}: ${items}. Media ${formatNumber(summarize(values).mean)}.`;
}

function StatChartView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const rows = node.attrs.rows as DataRow[];
  const chartType = node.attrs.chartType as ChartType;
  const title = node.attrs.title as string;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const outcome = useMemo(() => readRows(rows), [rows]);
  const summary = outcome.ok ? summarize(outcome.data.values) : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !outcome.ok) return;
    const { labels, values } = outcome.data;
    const perItemColors = labels.map((_, i) => GRAPH_COLORS[i % GRAPH_COLORS.length]);
    const chart = new Chart(canvas, {
      type: chartType,
      data: {
        labels,
        datasets: [
          {
            label: title.trim() || "Valori",
            data: values,
            backgroundColor: chartType === "pie" ? perItemColors : GRAPH_COLORS[0],
            borderColor: chartType === "pie" ? "#ffffff" : GRAPH_COLORS[0],
            borderWidth: chartType === "line" ? 3 : 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        locale: "it-IT",
        plugins: {
          legend: { display: chartType === "pie" },
          title: { display: Boolean(title.trim()), text: title.trim() },
        },
      },
    });
    return () => chart.destroy();
  }, [outcome, chartType, title]);

  const setRow = (index: number, patch: Partial<DataRow>) =>
    updateAttributes({ rows: rows.map((r, i) => (i === index ? { ...r, ...patch } : r)) });

  return (
    <NodeViewWrapper className={`graph-block${selected ? " is-selected" : ""}`}>
      <BlockHeader title="Grafico statistico" onDelete={deleteNode}>
        <select
          aria-label="Tipo di grafico"
          value={chartType}
          onChange={(e) => updateAttributes({ chartType: e.target.value as ChartType })}
        >
          {(Object.keys(CHART_NAMES) as ChartType[]).map((type) => (
            <option key={type} value={type}>
              {CHART_NAMES[type]}
            </option>
          ))}
        </select>
      </BlockHeader>

      <label className="graph-title-field">
        Titolo
        <input
          className="graph-input graph-input--wide"
          value={title}
          placeholder="per esempio Ore di studio nella settimana"
          onChange={(e) => updateAttributes({ title: e.target.value })}
        />
      </label>

      <div className="graph-columns">
        <section className="graph-panel" aria-label="Dati">
          <table className="graph-table graph-table--edit">
            <thead>
              <tr>
                <th scope="col">Etichetta</th>
                <th scope="col">Valore</th>
                <th scope="col">
                  <span className="sr-only">Azioni</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td>
                    <input className="graph-input" aria-label={`Etichetta riga ${i + 1}`} value={row.label} onChange={(e) => setRow(i, { label: e.target.value })} />
                  </td>
                  <td>
                    <input className="graph-input graph-input--small" inputMode="decimal" aria-label={`Valore riga ${i + 1}`} value={row.value} onChange={(e) => setRow(i, { value: e.target.value })} />
                  </td>
                  <td>
                    {rows.length > 1 && (
                      <button type="button" aria-label={`Elimina riga ${i + 1}`} onClick={() => updateAttributes({ rows: rows.filter((_, j) => j !== i) })}>
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={() => updateAttributes({ rows: [...rows, { label: "", value: "" }] })}>
            + Aggiungi una riga
          </button>
        </section>

        <section className="graph-panel" aria-label="Indici statistici">
          {summary ? (
            <dl className="graph-summary">
              <dt>Numero di dati</dt>
              <dd>{summary.count}</dd>
              <dt>Somma</dt>
              <dd>{formatNumber(summary.sum)}</dd>
              <dt>Media</dt>
              <dd>{formatNumber(summary.mean)}</dd>
              <dt>Mediana</dt>
              <dd>{formatNumber(summary.median)}</dd>
              <dt>Moda</dt>
              <dd>{summary.modes.length ? summary.modes.map((m) => formatNumber(m)).join(", ") : "nessuna"}</dd>
              <dt>Minimo</dt>
              <dd>{formatNumber(summary.min)}</dd>
              <dt>Massimo</dt>
              <dd>{formatNumber(summary.max)}</dd>
            </dl>
          ) : (
            <p className="graph-block__hint">{!outcome.ok && outcome.error}</p>
          )}
        </section>
      </div>

      {outcome.ok && (
        <div className="graph-surface graph-chart">
          <canvas ref={canvasRef} role="img" aria-label={describeStatChart(node.attrs)} />
        </div>
      )}
    </NodeViewWrapper>
  );
}

export default StatChartView;
