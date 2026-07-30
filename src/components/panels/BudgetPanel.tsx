import { Wallet } from "lucide-react";
import { Panel } from "../ui/Panel";
import { BudgetBars } from "../charts/BudgetBars";
import type { BudgetResult } from "../../core/compute";
import { fmtInt, fmtUSD, fmtMultiple } from "../../format";
import { t, type Lang } from "../../i18n";

export function BudgetPanel({ budget, lang }: { budget: BudgetResult; lang: Lang }) {
  return (
    <Panel title={t(lang, "panel.budget")} kicker={t(lang, "panel.budget.kicker")} icon={Wallet}>
      <div className="float-sm mb-4 rounded-2xl px-2 py-3">
        <BudgetBars budget={budget} lang={lang} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-faint">
              <th className="py-1.5 pr-2 font-medium">{t(lang, "budget.tier")}</th>
              <th className="py-1.5 pr-2 font-medium">{t(lang, "budget.play")}</th>
              <th className="py-1.5 pr-2 text-right font-medium">{t(lang, "budget.accounts")}</th>
              <th className="py-1.5 pr-2 text-right font-medium">{t(lang, "budget.spend")}</th>
              <th className="py-1.5 text-right font-medium">{t(lang, "budget.pipeline")}</th>
            </tr>
          </thead>
          <tbody>
            {budget.lines.map((l) => (
              <tr key={l.tier} className="border-t border-line">
                <td className="py-2 pr-2 font-mono text-text">T{l.tier}</td>
                <td className="max-w-[12rem] truncate py-2 pr-2 text-dim">{l.play}</td>
                <td className="py-2 pr-2 text-right font-mono tabular-nums text-text">
                  {fmtInt(l.accounts, lang)}
                </td>
                <td className="py-2 pr-2 text-right font-mono tabular-nums text-text">
                  {fmtUSD(l.spendUSD, lang)}
                </td>
                <td className="py-2 text-right font-mono tabular-nums text-text">
                  {fmtUSD(l.projectedPipelineUSD, lang)}
                </td>
              </tr>
            ))}
            <tr className="border-t border-line font-semibold">
              <td className="py-2 pr-2 text-text" colSpan={3}>
                {t(lang, "budget.total")}
              </td>
              <td className="py-2 pr-2 text-right font-mono tabular-nums text-text">
                {fmtUSD(budget.totalSpendUSD, lang)}
              </td>
              <td className="py-2 text-right font-mono tabular-nums text-text">
                {fmtUSD(budget.projectedPipelineUSD, lang)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-faint">{t(lang, "budget.assumptions")}</span>
        <span className="rounded float-sm bg-panel2 px-2 py-1 font-mono text-signal">
          {t(lang, "kpi.roi")} {fmtMultiple(budget.roi, lang)}
        </span>
      </div>
    </Panel>
  );
}
