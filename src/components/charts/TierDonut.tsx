import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { ScoredAccount } from "../../core/schema";
import { fmtInt } from "../../format";
import { t, type Lang } from "../../i18n";

const COLORS = ["var(--signal)", "var(--cyan)", "var(--faint)"];

// Tier distribution donut with a centered total. Purely a view of the
// deterministic tier counts already computed by the core.
export function TierDonut({ accounts, lang }: { accounts: ScoredAccount[]; lang: Lang }) {
  const counts = [1, 2, 3].map((tier) => accounts.filter((a) => a.tier === tier).length);
  const total = accounts.length;
  const data = [
    { name: "T1", value: counts[0] },
    { name: "T2", value: counts[1] },
    { name: "T3", value: counts[2] },
  ].filter((d) => d.value > 0);

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-[132px] w-[132px] shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={44}
              outerRadius={62}
              paddingAngle={3}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="font-mono text-xl font-semibold leading-none text-text">{fmtInt(total, lang)}</div>
            <div className="text-[10px] uppercase tracking-wide text-faint">{t(lang, "kpi.accounts")}</div>
          </div>
        </div>
      </div>

      <div className="grid flex-1 gap-1.5">
        {[
          { label: `${t(lang, "common.tier")} 1`, value: counts[0], color: COLORS[0] },
          { label: `${t(lang, "common.tier")} 2`, value: counts[1], color: COLORS[1] },
          { label: `${t(lang, "common.tier")} 3`, value: counts[2], color: COLORS[2] },
        ].map((r) => (
          <div key={r.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
            <span className="flex-1 text-xs text-dim">{r.label}</span>
            <span className="font-mono text-sm tabular-nums text-text">{fmtInt(r.value, lang)}</span>
            <span className="w-12 text-right text-[11px] text-faint">
              {total ? Math.round((r.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
