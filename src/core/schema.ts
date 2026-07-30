import { z } from "zod";

// ────────────────────────────────────────────────────────────────────────────
// ABM Orchestrator — canonical data model. Real target-account exports vary by
// column name; everything is normalized here before any score is computed.
// The deterministic core only ever reads validated, provenance-tagged records.
// ────────────────────────────────────────────────────────────────────────────

export const VERTICALS = ["AEC", "Manufacturing", "Design", "Utilities"] as const;
export type Vertical = (typeof VERTICALS)[number];

// LATAM-6: the six largest B2B markets in the region. Country stays a canonical
// enum (like Tier) so scoring/territory logic is closed over a known set; the
// display name is localized via COUNTRY_LABELS, never hardcoded in a component.
export const COUNTRIES = ["BR", "MX", "CO", "AR", "CL", "PE"] as const;
export type Country = (typeof COUNTRIES)[number];

// Locale-aware display names for the country codes. Kept here (one source of
// truth) rather than in the dictionary because the set of countries is data —
// panels read COUNTRY_LABELS[code][lang] so a new market is added in one place.
export const COUNTRY_LABELS: Record<Country, { en: string; pt: string }> = {
  BR: { en: "Brazil", pt: "Brasil" },
  MX: { en: "Mexico", pt: "México" },
  CO: { en: "Colombia", pt: "Colômbia" },
  AR: { en: "Argentina", pt: "Argentina" },
  CL: { en: "Chile", pt: "Chile" },
  PE: { en: "Peru", pt: "Peru" },
};

export type Tier = 1 | 2 | 3;

export interface Account {
  id: string;
  name: string;
  vertical: Vertical;
  country: Country;
  employees: number;
  annualRevenueUSD?: number;
  intent: number; // 0..100 buying-intent signal strength (6sense-style)
  fitSignals: number; // count of positive ICP signals present
  currentARRUSD?: number;
  owner?: string; // assigned field marketer
  _source: { file: string; row: number };
}

export interface ScoredAccount extends Account {
  fitScore: number; // 0..100
  intentScore: number; // 0..100
  composite: number; // 0..100
  tier: Tier;
}

export interface FieldMarketer {
  name: string;
  cluster: Country;
  capacity: number; // number of tier-1 accounts they can cover
}

export interface Play {
  name: string;
  tier: Tier;
  channel: string;
  costPerAccountUSD: number;
  expectedPipelinePerAccountUSD: number; // documented planning assumption, not invented
}

export interface ScoringConfig {
  verticalWeight: Record<Vertical, number>; // 0..1 ICP priority by vertical
  maxSignals: number;
  wFit: number; // composite weight on fit
  wIntent: number; // composite weight on intent
  tier1Min: number; // composite thresholds
  tier2Min: number;
}

export const DEFAULT_SCORING: ScoringConfig = {
  verticalWeight: { AEC: 1.0, Manufacturing: 0.95, Design: 0.85, Utilities: 0.7 },
  maxSignals: 5,
  wFit: 0.6,
  wIntent: 0.4,
  tier1Min: 75,
  tier2Min: 55,
};

export interface RaciEntry {
  activity: string;
  responsible: string;
  accountable: string;
  consulted: string;
  informed: string;
}

export interface AbmDataset {
  label: string;
  region: string;
  currency: string;
  avgDealUSD: number;
  accounts: Account[];
  marketers: FieldMarketer[];
  raci: RaciEntry[];
  source: "preset" | "upload";
}

// ── Zod ingestion boundary ──────────────────────────────────────────────────
export const RawRowSchema = z.record(z.string(), z.string());
export type RawRow = z.infer<typeof RawRowSchema>;

export const ColumnMappingSchema = z.object({
  id: z.string(),
  name: z.string(),
  vertical: z.string(),
  country: z.string(),
  employees: z.string(),
  intent: z.string(),
  fitSignals: z.string(),
  annualRevenueUSD: z.string().optional(),
  currentARRUSD: z.string().optional(),
  owner: z.string().optional(),
});
export type ColumnMapping = z.infer<typeof ColumnMappingSchema>;

export const VerticalMappingSchema = z.record(z.string(), z.enum(VERTICALS));
export type VerticalMapping = z.infer<typeof VerticalMappingSchema>;
export const CountryMappingSchema = z.record(z.string(), z.enum(COUNTRIES));
export type CountryMapping = z.infer<typeof CountryMappingSchema>;

export interface ValidationIssue {
  row: number;
  field: string;
  message: string;
}
