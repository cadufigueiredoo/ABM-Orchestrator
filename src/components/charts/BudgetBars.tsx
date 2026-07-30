import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { BudgetResult } from "../../core/compute";
import { fmtUSD } from "../../format";
import { t, type Lang } from "../../i18n";

const TIER_COLORS = ["var(--signal)", "var(--cyan)", "var(--faint)"];

// Projected pipeline by tier — a view of the deterministic budget lines.
export function BudgetBars({ budget, lang }: { budget: BudgetResult; lang: Lang }) {
  const data = budget.lines.map((l) => ({
    name: `T${l.tier}`,
    pipeline: l.projectedPipelineUSD,
    spend: l.spendUSD,
  }));

  return (
    <div className="h-[168px] w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barSize={38}>
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--dim)", fontSize: 12, fontFamily: "ui-monospace" }}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "var(--panel3)", opacity: 0.5 }}
            formatter={(v: number, key) => [
              fmtUSD(v, lang, false),
              key === "pipeline" ? t(lang, "chart.pipeline") : t(lang, "chart.spend"),
            ]}
            contentStyle={{
              background: "var(--panel3)",
              border: "none",
              borderRadius: 12,
              boxShadow: "var(--shadow-md)",
              color: "var(--text)",
            }}
            labelStyle={{ color: "var(--faint)" }}
          />
          <Bar dataKey="pipeline" radius={[8, 8, 8, 8]}>
            {data.map((_, i) => (
              <Cell key={i} fill={TIER_COLORS[i % TIER_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
