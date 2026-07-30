import { useState } from "react";
import { Sparkles, Copy, Check, RefreshCw, AlertTriangle } from "lucide-react";
import { Panel } from "../ui/Panel";
import { Eyebrow } from "../ui/Eyebrow";
import { postNarrate, type Brief, type Priority } from "../../narrate";
import { t, type Lang } from "../../i18n";

const PRIORITY_STYLE: Record<Priority, string> = {
  P1: "bg-risk/15 text-risk border-risk/30",
  P2: "bg-watch/15 text-watch border-watch/30",
  P3: "bg-panel2 text-dim border-line",
};

// The metrics the narrator receives — already-computed figures only, never raw
// accounts. Owner/account names are omitted; the AI narrates the shape.
export interface BriefMetrics {
  label: string;
  region: string;
  currency: string;
  accounts: number;
  tiers: { tier: number; accounts: number }[];
  territory: {
    cluster: string;
    accounts: number;
    tier1Load: number;
    capacity: number;
    balanced: boolean;
  }[];
  budget: { totalSpendUSD: number; projectedPipelineUSD: number; roi: number };
}

export function BriefPanel({ metrics, lang }: { metrics: BriefMetrics; lang: Lang }) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const result = await postNarrate(metrics, lang);
      setBrief(result);
    } catch {
      setError(t(lang, "brief.error"));
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!brief) return;
    const text = [
      brief.headline,
      "",
      brief.summary,
      "",
      ...brief.actions.map((a) => `[${a.priority}] ${a.title} — ${a.detail}`),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  const action = (
    <div className="flex items-center gap-2">
      {brief ? (
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md float-sm bg-panel2 px-2.5 py-1.5 text-xs text-dim hover:text-text"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? t(lang, "brief.copied") : t(lang, "brief.copy")}
        </button>
      ) : null}
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-md bg-signal px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {brief ? <RefreshCw size={13} /> : <Sparkles size={13} />}
        {loading
          ? t(lang, "brief.loading")
          : brief
            ? t(lang, "brief.regenerate")
            : t(lang, "brief.cta")}
      </button>
    </div>
  );

  return (
    <Panel title={t(lang, "panel.brief")} kicker={t(lang, "panel.brief.kicker")} icon={Sparkles} right={action}>
      {!brief && !loading && !error ? (
        <p className="max-w-2xl text-sm leading-relaxed text-dim">{t(lang, "brief.blurb")}</p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-dim">
          <RefreshCw size={15} className="animate-spin" />
          {t(lang, "brief.loading")}
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-risk/30 bg-risk/10 px-3 py-2 text-sm text-risk">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {brief && !loading ? (
        <div className="space-y-4">
          <div>
            <Eyebrow>{t(lang, "brief.headline")}</Eyebrow>
            <h3 className="text-lg font-semibold leading-snug text-text">{brief.headline}</h3>
            {brief.summary ? (
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-dim">{brief.summary}</p>
            ) : null}
          </div>

          {brief.actions.length ? (
            <div>
              <Eyebrow>{t(lang, "brief.actions")}</Eyebrow>
              <ul className="mt-1 space-y-2">
                {brief.actions.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-lg float-sm bg-panel2 px-3 py-2.5"
                  >
                    <span
                      className={`mt-0.5 inline-flex h-5 shrink-0 items-center rounded border px-1.5 font-mono text-[11px] font-semibold ${
                        PRIORITY_STYLE[a.priority] ?? PRIORITY_STYLE.P3
                      }`}
                    >
                      {a.priority}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-text">{a.title}</div>
                      <div className="text-sm text-dim">{a.detail}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
}
