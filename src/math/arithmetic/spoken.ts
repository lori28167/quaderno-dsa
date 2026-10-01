interface Place {
  name: string;
  feminine: boolean;
}

const INT_PLACES: Place[] = [
  { name: "unità", feminine: true },
  { name: "decine", feminine: true },
  { name: "centinaia", feminine: true },
  { name: "migliaia", feminine: true },
  { name: "decine di migliaia", feminine: true },
  { name: "centinaia di migliaia", feminine: true },
  { name: "milioni", feminine: false },
];

const FRAC_PLACES: Place[] = [
  { name: "decimi", feminine: false },
  { name: "centesimi", feminine: false },
  { name: "millesimi", feminine: false },
];

// offset: 0 = unità, 1 = decine, ..., -1 = decimi, -2 = centesimi
function place(offset: number): Place | undefined {
  return offset >= 0 ? INT_PLACES[offset] : FRAC_PLACES[-offset - 1];
}

export function columnOf(offset: number): string {
  const p = place(offset);
  if (p) return `colonna ${p.feminine ? "delle" : "dei"} ${p.name}`;
  return offset >= 0 ? `colonna ${offset + 1} da destra` : `cifra decimale ${-offset}`;
}

export function fromColumn(offset: number): string {
  const p = place(offset);
  if (p) return `${p.feminine ? "dalle" : "dai"} ${p.name}`;
  return offset >= 0 ? `dalla colonna ${offset + 1} da destra` : `dalla cifra decimale ${-offset}`;
}

export function article(n: number): string {
  if (n === 0) return "lo ";
  if (n === 1 || n === 8 || n === 11) return "l'";
  return "il ";
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
