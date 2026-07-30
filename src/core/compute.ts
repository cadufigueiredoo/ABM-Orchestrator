import {
  type Account,
  type ScoredAccount,
  type Tier,
  type ScoringConfig,
  type FieldMarketer,
  type Play,
  type Country,
  type AbmDataset,
  DEFAULT_SCORING,
  COUNTRIES,
} from "./schema";

// ────────────────────────────────────────────────────────────────────────────
// Deterministic compute layer. Pure functions only — no randomness, no clock,
// no AI. Scores, tiers, territory load and ROI are all derived from the account
// records and the documented planning assumptions. The AI layer narrates these.
// ────────────────────────────────────────────────────────────────────────────

export const clamp = (v: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, v));
export const pct = (n: number, d: number): number => (d === 0 ? 0 : n / d);

function sizeBand(employees: number): number {
  if (employees >= 5000) return 1.0;
  if (employees >= 1000) return 0.85;
  if (employees >= 250) return 0.7;
  return 0.5;
}

export function scoreAccount(a: Account, cfg: ScoringConfig = DEFAULT_SCORING): ScoredAccount {
  const vWeight = cfg.verticalWeight[a.vertical] ?? 0.5;
  const signalRatio = Math.min(a.fitSignals, cfg.maxSignals) / cfg.maxSignals;
  const fitScore = clamp(100 * (0.5 * vWeight + 0.3 * sizeBand(a.employees) + 0.2 * signalRatio));
  const intentScore = clamp(a.intent);
  const composite = clamp(cfg.wFit * fitScore + cfg.wIntent * intentScore);
  const tier: Tier = composite >= cfg.tier1Min ? 1 : composite >= cfg.tier2Min ? 2 : 3;
  return { ...a, fitScore, intentScore, composite, tier };
}

export function scoreAll(accounts: Account[], cfg: ScoringConfig = DEFAULT_SCORING): ScoredAccount[] {
  return accounts.map((a) => scoreAccount(a, cfg)).sort((x, y) => y.composite - x.composite);
}

// ── Default play catalog (planning assumptions, transparent and editable) ────
export const PLAY_CATALOG: Play[] = [
  { name: "Executive roundtable", tier: 1, channel: "Field / 1:1 ABM", costPerAccountUSD: 8000, expectedPipelinePerAccountUSD: 240000 },
  { name: "Vertical field workshop", tier: 2, channel: "Field / 1:few ABM", costPerAccountUSD: 3000, expectedPipelinePerAccountUSD: 90000 },
  { name: "Digital ABM program", tier: 3, channel: "Programmatic / 1:many", costPerAccountUSD: 800, expectedPipelinePerAccountUSD: 22000 },
];

export function playForTier(tier: Tier, catalog: Play[] = PLAY_CATALOG): Play {
  return catalog.find((p) => p.tier === tier) ?? catalog[catalog.length - 1];
}

export interface ClusterView {
  cluster: Country;
  accounts: number;
  tier1: number;
  tier2: number;
  tier3: number;
  marketers: number;
  capacity: number; // combined tier-1 capacity of cluster marketers
  tier1Load: number; // tier-1 accounts to cover
  balanced: boolean; // capacity covers tier-1 load
}

export function computeTerritory(scored: ScoredAccount[], marketers: FieldMarketer[]): ClusterView[] {
  // Clusters are derived from the data, not hardcoded: any country that has at
  // least one account OR an assigned marketer becomes a cluster. Canonical
  // COUNTRIES order is preserved so the layout is stable across renders, and the
  // territory panel automatically covers whatever LATAM markets the book spans.
  const present = new Set<Country>([...scored.map((a) => a.country), ...marketers.map((m) => m.cluster)]);
  const clusters: Country[] = COUNTRIES.filter((c) => present.has(c));
  return clusters.map((cluster) => {
    const inCluster = scored.filter((a) => a.country === cluster);
    const mk = marketers.filter((m) => m.cluster === cluster);
    const tier1 = inCluster.filter((a) => a.tier === 1).length;
    const tier2 = inCluster.filter((a) => a.tier === 2).length;
    const tier3 = inCluster.filter((a) => a.tier === 3).length;
    const capacity = mk.reduce((s, m) => s + m.capacity, 0);
    return {
      cluster,
      accounts: inCluster.length,
      tier1, tier2, tier3,
      marketers: mk.length,
      capacity,
      tier1Load: tier1,
      balanced: capacity >= tier1,
    };
  });
}

export interface BudgetLine {
  tier: Tier;
  play: string;
  accounts: number;
  spendUSD: number;
  projectedPipelineUSD: number;
}
export interface BudgetResult {
  lines: BudgetLine[];
  totalSpendUSD: number;
  projectedPipelineUSD: number;
  roi: number; // projected pipeline / spend
}

export function computeBudget(scored: ScoredAccount[], catalog: Play[] = PLAY_CATALOG): BudgetResult {
  const tiers: Tier[] = [1, 2, 3];
  const lines: BudgetLine[] = tiers.map((tier) => {
    const play = playForTier(tier, catalog);
    const accounts = scored.filter((a) => a.tier === tier).length;
    return {
      tier,
      play: play.name,
      accounts,
      spendUSD: accounts * play.costPerAccountUSD,
      projectedPipelineUSD: accounts * play.expectedPipelinePerAccountUSD,
    };
  });
  const totalSpendUSD = lines.reduce((s, l) => s + l.spendUSD, 0);
  const projectedPipelineUSD = lines.reduce((s, l) => s + l.projectedPipelineUSD, 0);
  return { lines, totalSpendUSD, projectedPipelineUSD, roi: pct(projectedPipelineUSD, totalSpendUSD) };
}

export type Health = "good" | "watch" | "risk";
export function healthOf(v: number, good: number, watch: number): Health {
  return v >= good ? "good" : v >= watch ? "watch" : "risk";
}

export function computeSnapshot(ds: AbmDataset, cfg: ScoringConfig = DEFAULT_SCORING) {
  const scored = scoreAll(ds.accounts, cfg);
  const territory = computeTerritory(scored, ds.marketers);
  const budget = computeBudget(scored);
  return { scored, territory, budget };
}
