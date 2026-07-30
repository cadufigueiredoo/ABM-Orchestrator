import {
  VERTICALS,
  COUNTRIES,
  type ColumnMapping,
  type Vertical,
  type Country,
  type VerticalMapping,
  type CountryMapping,
  type RawRow,
} from "../core/schema";

// ── Column auto-mapping ─────────────────────────────────────────────────────
// Fuzzy header match: each canonical field carries a list of substrings that
// commonly appear in real exports (EN + PT). First matching header wins.
const HINTS: Record<keyof ColumnMapping, string[]> = {
  id: ["account id", "id", "código", "codigo"],
  name: ["account name", "account", "company", "name", "conta", "empresa", "nome"],
  vertical: ["vertical", "industry", "segment", "setor", "indústria", "industria"],
  country: ["country", "region", "market", "país", "pais", "geo"],
  employees: ["employees", "headcount", "size", "funcionários", "funcionarios", "porte"],
  intent: ["intent", "buying signal", "6sense", "intenção", "intencao"],
  fitSignals: ["fit", "signals", "icp", "sinais"],
  annualRevenueUSD: ["revenue", "annual revenue", "receita", "faturamento"],
  currentARRUSD: ["arr", "current arr", "recurring"],
  owner: ["owner", "marketer", "rep", "assigned", "responsável", "responsavel"],
};

const norm = (s: string) => s.trim().toLowerCase();

function guessOne(field: keyof ColumnMapping, headers: string[]): string {
  const hs = headers.map((h) => ({ h, n: norm(h) }));
  for (const hint of HINTS[field]) {
    // Prefer exact match, then contains.
    const exact = hs.find((x) => x.n === hint);
    if (exact) return exact.h;
  }
  for (const hint of HINTS[field]) {
    const partial = hs.find((x) => x.n.includes(hint));
    if (partial) return partial.h;
  }
  return "";
}

export function guessColumnMapping(headers: string[]): ColumnMapping {
  return {
    id: guessOne("id", headers),
    name: guessOne("name", headers),
    vertical: guessOne("vertical", headers),
    country: guessOne("country", headers),
    employees: guessOne("employees", headers),
    intent: guessOne("intent", headers),
    fitSignals: guessOne("fitSignals", headers),
    annualRevenueUSD: guessOne("annualRevenueUSD", headers),
    currentARRUSD: guessOne("currentARRUSD", headers),
    owner: guessOne("owner", headers),
  };
}

// ── Distinct value collection + vertical/country auto-mapping ────────────────
export function distinctValues(rows: RawRow[], column: string): string[] {
  if (!column) return [];
  const set = new Set<string>();
  for (const r of rows) {
    const v = (r[column] ?? "").trim();
    if (v) set.add(v);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

const VERTICAL_HINTS: Record<Vertical, string[]> = {
  AEC: ["aec", "construction", "engineering", "architecture", "construção", "construcao", "engenharia", "arquitetura"],
  Manufacturing: ["manufactur", "industry", "industrial", "manufatura", "indústria", "industria", "fábrica", "fabrica"],
  Design: ["design", "media", "entertainment", "criativo", "mídia", "midia"],
  Utilities: ["utilit", "energy", "power", "water", "energia", "utilidade"],
};

const COUNTRY_HINTS: Record<Country, string[]> = {
  BR: ["br", "bra", "brazil", "brasil"],
  MX: ["mx", "mex", "mexico", "méxico"],
  CO: ["co", "col", "colombia", "colômbia"],
  AR: ["ar", "arg", "argentina"],
  CL: ["cl", "chl", "chile"],
  PE: ["pe", "per", "peru", "perú"],
};

function classify<T extends string>(
  value: string,
  hints: Record<T, string[]>,
  canon: readonly T[]
): T | "" {
  const n = norm(value);
  // exact canonical value?
  const direct = canon.find((c) => norm(c) === n);
  if (direct) return direct;
  for (const c of canon) {
    if (hints[c].some((h) => n.includes(h))) return c;
  }
  return "";
}

export function guessVerticalMapping(values: string[]): VerticalMapping {
  const out: VerticalMapping = {};
  for (const v of values) {
    const g = classify(v, VERTICAL_HINTS, VERTICALS);
    // Fall back to the strongest ICP vertical so the field is always valid;
    // the user can correct it in the wizard before loading.
    out[v] = g || "AEC";
  }
  return out;
}

export function guessCountryMapping(values: string[]): CountryMapping {
  const out: CountryMapping = {};
  for (const v of values) {
    const g = classify(v, COUNTRY_HINTS, COUNTRIES);
    out[v] = g || "BR";
  }
  return out;
}

export function isColumnMappingComplete(m: ColumnMapping): boolean {
  return Boolean(m.id && m.name && m.vertical && m.country && m.employees && m.intent && m.fitSignals);
}
