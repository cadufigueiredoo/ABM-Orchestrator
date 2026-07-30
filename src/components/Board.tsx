import { useMemo } from "react";
import { computeSnapshot } from "../core/compute";
import type { AbmDataset } from "../core/schema";
import type { Lang } from "../i18n";
import { KpiRow } from "./panels/KpiRow";
import { AccountScoringPanel } from "./panels/AccountScoringPanel";
import { TerritoryPanel } from "./panels/TerritoryPanel";
import { BudgetPanel } from "./panels/BudgetPanel";
import { RaciPanel } from "./panels/RaciPanel";
import { BriefPanel, type BriefMetrics } from "./panels/BriefPanel";

export function Board({ dataset, lang }: { dataset: AbmDataset; lang: Lang }) {
  const snap = useMemo(() => computeSnapshot(dataset), [dataset]);

  // Compact, name-free metrics for the narrator (deterministic figures only).
  const metrics: BriefMetrics = useMemo(() => {
    const tierCount = (tier: 1 | 2 | 3) => snap.scored.filter((a) => a.tier === tier).length;
    return {
      label: dataset.label,
      region: dataset.region,
      currency: dataset.currency,
      accounts: snap.scored.length,
      tiers: [1, 2, 3].map((tier) => ({ tier, accounts: tierCount(tier as 1 | 2 | 3) })),
      territory: snap.territory.map((c) => ({
        cluster: c.cluster,
        accounts: c.accounts,
        tier1Load: c.tier1Load,
        capacity: c.capacity,
        balanced: c.balanced,
      })),
      budget: {
        totalSpendUSD: snap.budget.totalSpendUSD,
        projectedPipelineUSD: snap.budget.projectedPipelineUSD,
        roi: snap.budget.roi,
      },
    };
  }, [snap, dataset]);

  return (
    <div className="space-y-4">
      <KpiRow snap={snap} lang={lang} />
      <BriefPanel metrics={metrics} lang={lang} />
      <div className="grid gap-4 lg:grid-cols-2">
        <AccountScoringPanel accounts={snap.scored} lang={lang} />
        <div className="space-y-4">
          <TerritoryPanel clusters={snap.territory} lang={lang} />
          <BudgetPanel budget={snap.budget} lang={lang} />
        </div>
      </div>
      <RaciPanel raci={dataset.raci} lang={lang} />
    </div>
  );
}
