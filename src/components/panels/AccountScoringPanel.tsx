import { useState } from "react";
import { Building2 } from "lucide-react";
import { Panel } from "../ui/Panel";
import { TierDonut } from "../charts/TierDonut";
import type { ScoredAccount, Tier } from "../../core/schema";
import { fmtInt, fmtPct } from "../../format";
import { t, type Lang } from "../../i18n";

const TIER_STYLE: Record<Tier, string> = {
  1: "bg-signal/20 text-signal",
  2: "bg-cyanx/20 text-cyanx",
  3: "bg-panel3 text-dim",
};

function TierChip({ tier }: { tier: Tier }) {
  return (
    <span
      className={`inline-flex h-5 min-w-[2.4rem] items-center justify-center rounded-md px-1 font-mono text-[11px] font-semibold ${TIER_STYLE[tier]}`}
    >
      T{tier}
    </span>
  );
}

function Meter({ value, tone }: { value: number; tone: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel2">
      <div className={`h-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function AccountScoringPanel({
  accounts,
  lang,
}: {
  accounts: ScoredAccount[];
  lang: Lang;
}) {
  const [limit, setLimit] = useState(12);
  const shown = accounts.slice(0, limit);

  return (
    <Panel title={t(lang, "panel.accounts")} kicker={t(lang, "panel.accounts.kicker")} icon={Building2}>
      <div className="float-sm mb-4 rounded-2xl px-4 py-3.5">
        <TierDonut accounts={accounts} lang={lang} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-faint">
              <th className="py-1.5 pr-2 font-medium">{t(lang, "acct.account")}</th>
              <th className="py-1.5 pr-2 font-medium">{t(lang, "field.vertical")}</th>
              <th className="hidden py-1.5 pr-2 font-medium sm:table-cell">{t(lang, "field.country")}</th>
              <th className="hidden py-1.5 pr-2 font-medium md:table-cell">{t(lang, "acct.fit")}</th>
              <th className="hidden py-1.5 pr-2 font-medium md:table-cell">{t(lang, "acct.intent")}</th>
              <th className="py-1.5 pr-2 text-right font-medium">{t(lang, "acct.composite")}</th>
              <th className="py-1.5 text-right font-medium">{t(lang, "acct.tier")}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((a) => (
              <tr
                key={a.id}
                className="border-t border-line align-middle"
                title={`${t(lang, "prov.source")}: ${a._source.file} · ${t(lang, "prov.row")} ${a._source.row}`}
              >
                <td className="max-w-[12rem] truncate py-2 pr-2 font-medium text-text">{a.name}</td>
                <td className="py-2 pr-2 text-dim">{a.vertical}</td>
                <td className="hidden py-2 pr-2 text-dim sm:table-cell">{a.country}</td>
                <td className="hidden w-24 py-2 pr-2 md:table-cell">
                  <Meter value={a.fitScore} tone="bg-cyanx" />
                </td>
                <td className="hidden w-24 py-2 pr-2 md:table-cell">
                  <Meter value={a.intentScore} tone="bg-signal" />
                </td>
                <td className="py-2 pr-2 text-right font-mono tabular-nums text-text">
                  {Math.round(a.composite)}
                </td>
                <td className="py-2 text-right">
                  <TierChip tier={a.tier} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-faint">
        <span>
          {t(lang, "acct.showing")} {fmtInt(shown.length, lang)} {t(lang, "acct.of")}{" "}
          {fmtInt(accounts.length, lang)}
        </span>
        {limit < accounts.length ? (
          <button
            type="button"
            onClick={() => setLimit((n) => n + 12)}
            className="rounded float-sm px-2 py-1 text-dim hover:text-text"
          >
            +12
          </button>
        ) : (
          <span className="text-faint">
            {t(lang, "acct.tier")} 1 ·{" "}
            {fmtPct(
              accounts.length ? accounts.filter((a) => a.tier === 1).length / accounts.length : 0,
              lang
            )}
          </span>
        )}
      </div>
    </Panel>
  );
}
