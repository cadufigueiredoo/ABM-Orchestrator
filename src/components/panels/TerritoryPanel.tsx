import { Map } from "lucide-react";
import { Panel } from "../ui/Panel";
import { StatusDot } from "../ui/StatusDot";
import type { ClusterView } from "../../core/compute";
import { COUNTRY_LABELS, type Country } from "../../core/schema";
import { fmtInt } from "../../format";
import { t, type Lang } from "../../i18n";

// Cluster names follow the active language (Brazil/Brasil, Mexico/México, …).
// Falls back to the raw code if an unknown cluster ever slips through.
const clusterLabel = (code: string, lang: Lang): string =>
  COUNTRY_LABELS[code as Country]?.[lang] ?? code;

function CoverageBar({ capacity, load }: { capacity: number; load: number }) {
  // How much of the tier-1 load the cluster's capacity can cover.
  const ratio = load === 0 ? 1 : Math.min(1, capacity / load);
  const tone = capacity >= load ? "bg-good" : "bg-risk";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-panel2">
      <div className={`h-full ${tone}`} style={{ width: `${ratio * 100}%` }} />
    </div>
  );
}

export function TerritoryPanel({ clusters, lang }: { clusters: ClusterView[]; lang: Lang }) {
  return (
    <Panel title={t(lang, "panel.territory")} kicker={t(lang, "panel.territory.kicker")} icon={Map}>
      <div className="grid gap-3 sm:grid-cols-2">
        {clusters.map((c) => (
          <div key={c.cluster} className="rounded-lg float-sm bg-panel2 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-text">
                {clusterLabel(c.cluster, lang)}
              </span>
              <StatusDot
                health={c.balanced ? "good" : "risk"}
                label={c.balanced ? t(lang, "terr.balanced") : t(lang, "terr.imbalanced")}
              />
            </div>

            <CoverageBar capacity={c.capacity} load={c.tier1Load} />

            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-faint">{t(lang, "terr.accounts")}</dt>
                <dd className="font-mono text-sm text-text">{fmtInt(c.accounts, lang)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-faint">{t(lang, "terr.load")}</dt>
                <dd className="font-mono text-sm text-text">{fmtInt(c.tier1Load, lang)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-faint">{t(lang, "terr.capacity")}</dt>
                <dd className="font-mono text-sm text-text">{fmtInt(c.capacity, lang)}</dd>
              </div>
            </dl>

            <div className="mt-2 flex items-center justify-between text-[11px] text-faint">
              <span>
                T1 {fmtInt(c.tier1, lang)} · T2 {fmtInt(c.tier2, lang)} · T3 {fmtInt(c.tier3, lang)}
              </span>
              <span>
                {fmtInt(c.marketers, lang)} {t(lang, "terr.marketers").toLowerCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
