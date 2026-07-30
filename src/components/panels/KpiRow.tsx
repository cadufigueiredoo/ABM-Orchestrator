import { Building2, Crown, TrendingUp, Gauge } from "lucide-react";
import { Tile } from "../ui/Tile";
import { healthOf } from "../../core/compute";
import type { computeSnapshot } from "../../core/compute";
import { fmtInt, fmtUSD, fmtMultiple } from "../../format";
import { t, type Lang } from "../../i18n";

type Snapshot = ReturnType<typeof computeSnapshot>;

export function KpiRow({ snap, lang }: { snap: Snapshot; lang: Lang }) {
  const tier1 = snap.scored.filter((a) => a.tier === 1).length;
  const roiHealth = healthOf(snap.budget.roi, 15, 8);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile label={t(lang, "kpi.accounts")} value={fmtInt(snap.scored.length, lang)} icon={Building2} />
      <Tile label={t(lang, "kpi.tier1")} value={fmtInt(tier1, lang)} icon={Crown} />
      <Tile
        label={t(lang, "kpi.pipeline")}
        value={fmtUSD(snap.budget.projectedPipelineUSD, lang)}
        sub={fmtUSD(snap.budget.totalSpendUSD, lang) + " " + t(lang, "budget.spend").toLowerCase()}
        icon={TrendingUp}
      />
      <Tile
        label={t(lang, "kpi.roi")}
        value={fmtMultiple(snap.budget.roi, lang)}
        health={roiHealth}
        icon={Gauge}
      />
    </div>
  );
}
