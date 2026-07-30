import { useMemo, useRef, useState } from "react";
import { Upload, FileSpreadsheet, ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  type ColumnMapping,
  type VerticalMapping,
  type CountryMapping,
  type AbmDataset,
  type ValidationIssue,
} from "../core/schema";
import { VERTICALS, COUNTRIES } from "../core/schema";
import { parseFile, type ParseResult } from "../ingest/parseFile";
import {
  guessColumnMapping,
  guessVerticalMapping,
  guessCountryMapping,
  distinctValues,
  isColumnMappingComplete,
} from "../ingest/guess";
import { applyMapping } from "../ingest/applyMapping";
import { buildUploadDataset } from "../ingest/dataset";
import { Panel } from "./ui/Panel";
import { t, type Lang, type DictKey } from "../i18n";

const FIELDS: { key: keyof ColumnMapping; labelKey: DictKey; required: boolean }[] = [
  { key: "name", labelKey: "field.name", required: true },
  { key: "id", labelKey: "field.id", required: true },
  { key: "vertical", labelKey: "field.vertical", required: true },
  { key: "country", labelKey: "field.country", required: true },
  { key: "employees", labelKey: "field.employees", required: true },
  { key: "intent", labelKey: "field.intent", required: true },
  { key: "fitSignals", labelKey: "field.fitSignals", required: true },
  { key: "annualRevenueUSD", labelKey: "field.annualRevenueUSD", required: false },
  { key: "currentARRUSD", labelKey: "field.currentARRUSD", required: false },
  { key: "owner", labelKey: "field.owner", required: false },
];

export function ImportWizard({
  lang,
  onLoad,
  onCancel,
}: {
  lang: Lang;
  onLoad: (dataset: AbmDataset, issues: ValidationIssue[]) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [verticalMap, setVerticalMap] = useState<VerticalMapping>({});
  const [countryMap, setCountryMap] = useState<CountryMapping>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const result = await parseFile(file);
      if (!result.rows.length || !result.headers.length) {
        setError(t(lang, "import.no_valid"));
        setBusy(false);
        return;
      }
      const guess = guessColumnMapping(result.headers);
      setParsed(result);
      setFileName(file.name);
      setMapping(guess);
      setVerticalMap(guessVerticalMapping(distinctValues(result.rows, guess.vertical)));
      setCountryMap(guessCountryMapping(distinctValues(result.rows, guess.country)));
    } catch {
      setError(t(lang, "import.file_error"));
    } finally {
      setBusy(false);
    }
  }

  function setColumn(field: keyof ColumnMapping, value: string) {
    if (!mapping || !parsed) return;
    const next = { ...mapping, [field]: value };
    setMapping(next);
    if (field === "vertical") setVerticalMap(guessVerticalMapping(distinctValues(parsed.rows, value)));
    if (field === "country") setCountryMap(guessCountryMapping(distinctValues(parsed.rows, value)));
  }

  const verticalValues = useMemo(
    () => (parsed && mapping ? distinctValues(parsed.rows, mapping.vertical) : []),
    [parsed, mapping]
  );
  const countryValues = useMemo(
    () => (parsed && mapping ? distinctValues(parsed.rows, mapping.country) : []),
    [parsed, mapping]
  );

  function load() {
    if (!parsed || !mapping) return;
    const { accounts, issues } = applyMapping(parsed.rows, mapping, verticalMap, countryMap, fileName);
    if (!accounts.length) {
      setError(t(lang, "import.no_valid"));
      return;
    }
    onLoad(buildUploadDataset(accounts, fileName), issues);
  }

  const ready = mapping ? isColumnMappingComplete(mapping) : false;

  // ── Drop screen ───────────────────────────────────────────────────────────
  if (!parsed || !mapping) {
    return (
      <Panel title={t(lang, "import.title")}>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
            dragging ? "border-signal bg-signal/5" : "border-line bg-panel2"
          }`}
        >
          <FileSpreadsheet size={30} className="text-faint" />
          <p className="text-sm text-dim">{busy ? t(lang, "import.parsing") : t(lang, "import.drop")}</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md bg-signal px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Upload size={15} />
            {t(lang, "import.browse")}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        {error ? (
          <div className="mt-3 flex items-start gap-2 text-sm text-risk">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
        <div className="mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs text-faint hover:text-text"
          >
            <ArrowLeft size={13} />
            {t(lang, "import.cancel")}
          </button>
        </div>
      </Panel>
    );
  }

  // ── Mapping screen ────────────────────────────────────────────────────────
  return (
    <Panel title={t(lang, "import.map")} kicker={`${fileName} · ${parsed.rows.length} ${t(lang, "import.rows_parsed")}`}>
      <p className="mb-4 text-sm text-dim">{t(lang, "import.map.blurb")}</p>
      <p className="mb-3 text-xs text-faint">{t(lang, "import.autodetected")}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 flex items-center gap-2 text-xs font-medium text-dim">
              {t(lang, f.labelKey)}
              <span className="text-[10px] uppercase text-faint">
                {f.required ? t(lang, "import.required") : t(lang, "import.optional")}
              </span>
            </span>
            <select
              value={mapping[f.key] ?? ""}
              onChange={(e) => setColumn(f.key, e.target.value)}
              className={`w-full rounded-md border bg-panel px-2.5 py-2 text-sm text-text ${
                f.required && !mapping[f.key] ? "border-risk/50" : "border-line"
              }`}
            >
              <option value="">{t(lang, "import.none")}</option>
              {parsed.headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {/* Vertical value mapping */}
      {mapping.vertical && verticalValues.length ? (
        <div className="mt-5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
            {t(lang, "import.vertical_map")}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {verticalValues.map((v) => (
              <div key={v} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate rounded bg-panel2 px-2 py-1.5 text-sm text-dim" title={v}>
                  {v}
                </span>
                <select
                  value={verticalMap[v] ?? "AEC"}
                  onChange={(e) =>
                    setVerticalMap((m) => ({ ...m, [v]: e.target.value as (typeof VERTICALS)[number] }))
                  }
                  className="rounded-md float-sm bg-panel px-2 py-1.5 text-sm text-text"
                >
                  {VERTICALS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Country value mapping */}
      {mapping.country && countryValues.length ? (
        <div className="mt-5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
            {t(lang, "import.country_map")}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {countryValues.map((v) => (
              <div key={v} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate rounded bg-panel2 px-2 py-1.5 text-sm text-dim" title={v}>
                  {v}
                </span>
                <select
                  value={countryMap[v] ?? "BR"}
                  onChange={(e) =>
                    setCountryMap((m) => ({ ...m, [v]: e.target.value as (typeof COUNTRIES)[number] }))
                  }
                  className="rounded-md float-sm bg-panel px-2 py-1.5 text-sm text-text"
                >
                  {COUNTRIES.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 flex items-start gap-2 text-sm text-risk">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setParsed(null);
            setMapping(null);
            setError(null);
          }}
          className="inline-flex items-center gap-1.5 text-sm text-faint hover:text-text"
        >
          <ArrowLeft size={14} />
          {t(lang, "import.back")}
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={load}
          className="inline-flex items-center gap-2 rounded-md bg-signal px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
        >
          <CheckCircle2 size={15} />
          {t(lang, "import.validate")}
        </button>
      </div>
    </Panel>
  );
}
