import { Network } from "lucide-react";
import { Panel } from "../ui/Panel";
import type { RaciEntry } from "../../core/schema";
import { t, type Lang } from "../../i18n";

// R / A / C / I columns. The letters are localized via the dictionary, but the
// activity and role names come from the data.
export function RaciPanel({ raci, lang }: { raci: RaciEntry[]; lang: Lang }) {
  const cols: { key: keyof RaciEntry; label: string; tone: string }[] = [
    { key: "responsible", label: t(lang, "raci.responsible"), tone: "text-signal" },
    { key: "accountable", label: t(lang, "raci.accountable"), tone: "text-good" },
    { key: "consulted", label: t(lang, "raci.consulted"), tone: "text-cyanx" },
    { key: "informed", label: t(lang, "raci.informed"), tone: "text-dim" },
  ];

  return (
    <Panel title={t(lang, "panel.raci")} kicker={t(lang, "panel.raci.kicker")} icon={Network}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-faint">
              <th className="py-1.5 pr-3 font-medium">·</th>
              {cols.map((c) => (
                <th key={c.key} className={`py-1.5 pr-3 font-medium ${c.tone}`} title={String(c.key)}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {raci.map((r, i) => (
              <tr key={i} className="border-t border-line">
                <td className="py-2 pr-3 font-medium text-text">{r.activity}</td>
                {cols.map((c) => (
                  <td key={c.key} className="py-2 pr-3 text-dim">
                    {r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
