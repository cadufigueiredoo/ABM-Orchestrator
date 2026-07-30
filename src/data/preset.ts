import {
  VERTICALS, COUNTRIES, type AbmDataset, type Account, type Vertical, type Country,
} from "../core/schema";

// ────────────────────────────────────────────────────────────────────────────
// Preset: a fully pre-filled, already-run book of target accounts across the
// Autodesk verticals (AEC, Manufacturing, Design, Utilities) and the LATAM-6
// clusters (BR, MX, CO, AR, CL, PE). Deterministic (seeded), labelled as
// demonstration data.
// ────────────────────────────────────────────────────────────────────────────

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Portuguese naming pool for Brazil; Spanish pool for the Spanish-speaking
// LATAM markets. Account names come from the data in real books — this only
// makes the seeded demo read like a regional target list.
const BR_NAMES = ["Construtora", "Engenharia", "Indústria", "Projetos", "Metalúrgica", "Arquitetura", "Energia", "Fábrica"];
const ES_NAMES = ["Constructora", "Ingeniería", "Industrias", "Proyectos", "Metalúrgica", "Arquitectura", "Energía", "Manufactura"];
const SUFFIX = ["Andrade", "Delta", "Norte", "Global", "Prime", "Vertex", "Horizonte", "Central", "Pacífico", "Atlas"];

function pick<T>(arr: readonly T[], r: number): T {
  return arr[Math.floor(r * arr.length)];
}

// Realistic LATAM weighting: Brazil and Mexico dominate B2B volume; the Andean
// and Southern Cone markets trail. Weights sum to 1 and only bias the seeded
// demo book so the territory view reads like a real regional footprint (real
// uploads carry their own country distribution).
const COUNTRY_WEIGHTS: Record<Country, number> = {
  BR: 0.30, MX: 0.25, CO: 0.15, AR: 0.12, CL: 0.1, PE: 0.08,
};

function pickCountry(r: number): Country {
  let acc = 0;
  for (const c of COUNTRIES) {
    acc += COUNTRY_WEIGHTS[c];
    if (r <= acc) return c;
  }
  return COUNTRIES[COUNTRIES.length - 1];
}

export function buildPreset(): AbmDataset {
  const rnd = seeded(42);
  const accounts: Account[] = [];
  const N = 60;

  for (let i = 0; i < N; i++) {
    const country: Country = pickCountry(rnd());
    const vertical: Vertical = pick(VERTICALS, rnd());
    const base = country === "BR" ? BR_NAMES : ES_NAMES;
    const name = `${pick(base, rnd())} ${pick(SUFFIX, rnd())}`;
    // AEC/Manufacturing skew larger; strong verticals get a small intent lift.
    const strong = vertical === "AEC" || vertical === "Manufacturing";
    const employees = Math.round((strong ? 800 : 300) + rnd() * (strong ? 9000 : 4000));
    const intent = Math.round(clampN(30 + rnd() * 70 + (strong ? 8 : 0), 0, 100));
    const fitSignals = Math.floor(rnd() * 6);
    const account: Account = {
      id: `ACC-${2000 + i}`,
      name,
      vertical,
      country,
      employees,
      annualRevenueUSD: Math.round((employees * (120 + rnd() * 260)) / 1000) * 1000,
      intent,
      fitSignals,
      _source: { file: "preset", row: i },
    };
    if (rnd() < 0.35) account.currentARRUSD = Math.round((30000 + rnd() * 220000) / 1000) * 1000;
    accounts.push(account);
  }

  return {
    label: "Preset · LATAM ABM book (demonstration data)",
    region: "LATAM · BR, MX, CO, AR, CL, PE",
    currency: "USD",
    avgDealUSD: 60000,
    accounts,
    // One or two field marketers per LATAM-6 cluster. Capacity is the number of
    // tier-1 accounts each can cover — a documented planning assumption.
    marketers: [
      { name: "Marina Alves", cluster: "BR", capacity: 8 },
      { name: "Rafael Lima", cluster: "BR", capacity: 8 },
      { name: "Valeria Ortiz", cluster: "MX", capacity: 7 },
      { name: "Sergio Peña", cluster: "MX", capacity: 7 },
      { name: "Camila Restrepo", cluster: "CO", capacity: 6 },
      { name: "Diego Fernández", cluster: "AR", capacity: 6 },
      { name: "Josefa Muñoz", cluster: "CL", capacity: 5 },
      { name: "Mateo Quispe", cluster: "PE", capacity: 5 },
    ],
    raci: [
      { activity: "Tier-1 account plan", responsible: "Field Marketer", accountable: "ABM Lead", consulted: "Account Director", informed: "Regional Marketing" },
      { activity: "Executive roundtable", responsible: "Field Marketer", accountable: "ABM Lead", consulted: "Sales", informed: "Ops" },
      { activity: "Budget allocation", responsible: "ABM Lead", accountable: "Marketing Director", consulted: "Finance", informed: "Field Marketers" },
      { activity: "Pipeline review", responsible: "ABM Lead", accountable: "ABM Lead", consulted: "RevOps", informed: "Sales Leadership" },
    ],
    source: "preset",
  };
}

function clampN(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export const PRESET_VERTICALS = VERTICALS;
