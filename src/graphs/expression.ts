// A small, safe parser for functions of x as students write them:
// "2x + 1", "3x² - 0,5", "sen(x)", "√(x+1)", "y = x^2". Nothing is ever eval()'d.

export type Fn = (x: number) => number;
export type ParseOutcome = { ok: true; fn: Fn } | { ok: false; error: string };

type Token =
  | { type: "num"; value: number }
  | { type: "name"; value: string }
  | { type: "op"; value: "+" | "-" | "*" | "/" | "^" }
  | { type: "open" }
  | { type: "close" };

const FUNCTIONS: Record<string, (v: number) => number> = {
  sen: Math.sin,
  sin: Math.sin,
  cos: Math.cos,
  tg: Math.tan,
  tan: Math.tan,
  radice: Math.sqrt,
  sqrt: Math.sqrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  exp: Math.exp,
};

const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E };

// Longest names first, so that e.g. "exp" is not read as "e" times "xp".
const KNOWN_NAMES = [...Object.keys(FUNCTIONS), ...Object.keys(CONSTANTS), "x"].sort((a, b) => b.length - a.length);

class ParseError extends Error {}

// Words like "xsen" or "pix" are split into known names ("x sen", "pi x").
function splitWord(word: string): string[] {
  const parts: string[] = [];
  let rest = word.toLowerCase();
  while (rest) {
    const name = KNOWN_NAMES.find((n) => rest.startsWith(n));
    if (!name) throw new ParseError(`Non conosco "${word}". Usa x come variabile.`);
    parts.push(name);
    rest = rest.slice(name.length);
  }
  return parts;
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (/\s/.test(ch)) {
      i++;
    } else if (/\d/.test(ch)) {
      const match = /^\d+([.,]\d+)?/.exec(source.slice(i))!;
      tokens.push({ type: "num", value: Number(match[0].replace(",", ".")) });
      i += match[0].length;
    } else if (/[a-zA-Z]/.test(ch)) {
      const word = /^[a-zA-Z]+/.exec(source.slice(i))![0];
      for (const name of splitWord(word)) tokens.push({ type: "name", value: name });
      i += word.length;
    } else if (ch === "π") {
      tokens.push({ type: "name", value: "pi" });
      i++;
    } else if (ch === "√") {
      tokens.push({ type: "name", value: "sqrt" });
      i++;
    } else if (ch === "²" || ch === "³") {
      tokens.push({ type: "op", value: "^" }, { type: "num", value: ch === "²" ? 2 : 3 });
      i++;
    } else if ("+-−".includes(ch)) {
      tokens.push({ type: "op", value: ch === "+" ? "+" : "-" });
      i++;
    } else if ("*×·".includes(ch)) {
      tokens.push({ type: "op", value: "*" });
      i++;
    } else if ("/:÷".includes(ch)) {
      tokens.push({ type: "op", value: "/" });
      i++;
    } else if (ch === "^") {
      tokens.push({ type: "op", value: "^" });
      i++;
    } else if ("([{".includes(ch)) {
      tokens.push({ type: "open" });
      i++;
    } else if (")]}".includes(ch)) {
      tokens.push({ type: "close" });
      i++;
    } else if (ch === ",") {
      throw new ParseError("Usa la virgola solo nei numeri decimali, per esempio 0,5.");
    } else {
      throw new ParseError(`Non capisco il simbolo "${ch}".`);
    }
  }
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(private readonly tokens: Token[]) {}

  parse(): Fn {
    const fn = this.expression();
    const extra = this.peek();
    if (extra) {
      throw new ParseError(extra.type === "close" ? "C'è una parentesi chiusa di troppo." : "Controlla l'espressione: c'è qualcosa di troppo.");
    }
    return fn;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private next(): Token | undefined {
    return this.tokens[this.pos++];
  }

  private isOp(value: string): boolean {
    const t = this.peek();
    return t?.type === "op" && t.value === value;
  }

  private expression(): Fn {
    let left = this.term();
    while (this.isOp("+") || this.isOp("-")) {
      const op = (this.next() as { value: string }).value;
      const l = left;
      const r = this.term();
      left = op === "+" ? (x) => l(x) + r(x) : (x) => l(x) - r(x);
    }
    return left;
  }

  // Juxtaposition is multiplication: "2x", "3(x+1)", "x sen(x)".
  private startsOperand(): boolean {
    const t = this.peek();
    return t?.type === "num" || t?.type === "name" || t?.type === "open";
  }

  private term(): Fn {
    let left = this.unary();
    for (;;) {
      if (this.isOp("*") || this.isOp("/")) {
        const op = (this.next() as { value: string }).value;
        const l = left;
        const r = this.unary();
        left = op === "*" ? (x) => l(x) * r(x) : (x) => l(x) / r(x);
      } else if (this.startsOperand()) {
        const l = left;
        const r = this.power();
        left = (x) => l(x) * r(x);
      } else {
        return left;
      }
    }
  }

  private unary(): Fn {
    if (this.isOp("-")) {
      this.next();
      const operand = this.unary();
      return (x) => -operand(x);
    }
    if (this.isOp("+")) {
      this.next();
      return this.unary();
    }
    return this.power();
  }

  private power(): Fn {
    const base = this.primary();
    if (!this.isOp("^")) return base;
    this.next();
    const exponent = this.unary();
    return (x) => Math.pow(base(x), exponent(x));
  }

  private primary(): Fn {
    const t = this.next();
    if (!t) throw new ParseError("L'espressione è incompleta: manca qualcosa alla fine.");
    if (t.type === "num") {
      const value = t.value;
      return () => value;
    }
    if (t.type === "open") {
      const inner = this.expression();
      if (this.next()?.type !== "close") throw new ParseError("Manca una parentesi chiusa.");
      return inner;
    }
    if (t.type === "name") {
      if (t.value === "x") return (x) => x;
      if (t.value in CONSTANTS) {
        const value = CONSTANTS[t.value];
        return () => value;
      }
      const f = FUNCTIONS[t.value];
      if (!this.peek()) throw new ParseError(`Dopo "${t.value}" serve un argomento, per esempio ${t.value}(x).`);
      const arg = this.power();
      return (x) => f(arg(x));
    }
    if (t.type === "close") throw new ParseError("C'è una parentesi chiusa senza quella aperta.");
    throw new ParseError(`Manca un numero o la x prima di "${t.value}".`);
  }
}

export function parseFunction(source: string): ParseOutcome {
  const body = source.replace(/^\s*(y|f\s*\(\s*x\s*\))\s*=/i, "").trim();
  if (!body) return { ok: false, error: "Scrivi una funzione, per esempio 2x + 1." };
  try {
    return { ok: true, fn: new Parser(tokenize(body)).parse() };
  } catch (error) {
    if (error instanceof ParseError) return { ok: false, error: error.message };
    throw error;
  }
}
