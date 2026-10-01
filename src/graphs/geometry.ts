import { formatNumber, formatRational } from "./numbers";

export interface PlanePoint {
  name: string;
  x: number;
  y: number;
}

export type ShapeKind = "segment" | "line" | "circle";

// For a circle, `a` is the centre and `b` a point on the circumference.
export interface Shape {
  kind: ShapeKind;
  a: string;
  b: string;
}

export const SHAPE_NAMES: Record<ShapeKind, string> = {
  segment: "Segmento",
  line: "Retta",
  circle: "Circonferenza",
};

export function pointLabel(p: PlanePoint): string {
  return `${p.name}(${formatNumber(p.x)}; ${formatNumber(p.y)})`;
}

export function distance(p: PlanePoint, q: PlanePoint): number {
  return Math.hypot(q.x - p.x, q.y - p.y);
}

export function midpoint(p: PlanePoint, q: PlanePoint): { x: number; y: number } {
  return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
}

// "+ 3", "- 1/2": the sign is written apart, as in "y = 2x - 1".
function signed(value: number): string {
  return value < 0 ? `- ${formatRational(-value)}` : `+ ${formatRational(value)}`;
}

function coefficient(m: number): string {
  if (m === 1) return "x";
  if (m === -1) return "-x";
  const text = formatRational(m);
  return text.includes("/") ? `${text} x` : `${text}x`;
}

export function slope(p: PlanePoint, q: PlanePoint): number | null {
  return p.x === q.x ? null : (q.y - p.y) / (q.x - p.x);
}

export function lineEquation(p: PlanePoint, q: PlanePoint): string {
  const m = slope(p, q);
  if (m === null) return `x = ${formatRational(p.x)}`;
  const intercept = p.y - m * p.x;
  if (m === 0) return `y = ${formatRational(intercept)}`;
  return intercept === 0 ? `y = ${coefficient(m)}` : `y = ${coefficient(m)} ${signed(intercept)}`;
}

function squaredTerm(variable: string, centre: number): string {
  if (centre === 0) return `${variable}²`;
  return `(${variable} ${signed(-centre)})²`;
}

export function circleEquation(centre: PlanePoint, through: PlanePoint): string {
  const r2 = (through.x - centre.x) ** 2 + (through.y - centre.y) ** 2;
  return `${squaredTerm("x", centre.x)} + ${squaredTerm("y", centre.y)} = ${formatRational(r2)}`;
}

export function shapeName(shape: Shape): string {
  return shape.kind === "circle"
    ? `Circonferenza di centro ${shape.a} passante per ${shape.b}`
    : `${SHAPE_NAMES[shape.kind]} ${shape.a}${shape.b}`;
}

export function describeShape(shape: Shape, points: PlanePoint[]): string[] {
  const a = points.find((p) => p.name === shape.a);
  const b = points.find((p) => p.name === shape.b);
  if (!a || !b) return [];
  if (a.x === b.x && a.y === b.y) return ["i due punti coincidono"];
  switch (shape.kind) {
    case "segment": {
      const m = midpoint(a, b);
      return [`lunghezza ${formatNumber(distance(a, b))}`, `punto medio (${formatNumber(m.x)}; ${formatNumber(m.y)})`];
    }
    case "line": {
      const m = slope(a, b);
      return [lineEquation(a, b), m === null ? "retta verticale" : `pendenza ${formatRational(m)}`];
    }
    case "circle":
      return [`raggio ${formatNumber(distance(a, b))}`, circleEquation(a, b)];
  }
}

export function nextPointName(points: PlanePoint[]): string {
  const used = new Set(points.map((p) => p.name));
  for (let round = 0; ; round++) {
    for (let c = 0; c < 26; c++) {
      const name = String.fromCharCode(65 + c) + (round === 0 ? "" : String(round));
      if (!used.has(name)) return name;
    }
  }
}
