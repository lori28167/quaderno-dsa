import type { Cell, ColumnLayout, RowRole } from "./arithmetic";

function cellClassName(cell: Cell, role: RowRole): string {
  const classes = ["cg-cell", `cg-cell--${cell.kind}`];
  if (role === "carry") classes.push("cg-cell--carry-row");
  if (cell.struck) classes.push("cg-cell--struck");
  if (cell.borderLeft) classes.push("cg-cell--border-left");
  if (cell.borderBottom) classes.push("cg-cell--border-bottom");
  return classes.join(" ");
}

interface Props {
  layout: ColumnLayout;
  showCarries: boolean;
  label: string;
}

function ColumnGrid({ layout, showCarries, label }: Props) {
  const rows = showCarries ? layout.rows : layout.rows.filter((row) => row.role !== "carry");

  return (
    <div
      className="column-grid"
      style={{ gridTemplateColumns: `repeat(${layout.columns}, var(--cg-cell-size))` }}
      role="img"
      aria-label={label}
    >
      {rows.map((row, r) =>
        row.role === "rule" ? (
          <div key={r} className="cg-rule" style={{ gridColumn: `1 / span ${layout.columns}` }} />
        ) : (
          row.cells.map((cell, c) => (
            <div key={`${r}-${c}`} className={cellClassName(cell, row.role)}>
              {cell.text}
              {cell.commaAfter && <span className="cg-comma">,</span>}
            </div>
          ))
        ),
      )}
    </div>
  );
}

export default ColumnGrid;
