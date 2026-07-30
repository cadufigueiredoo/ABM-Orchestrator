import { useEffect, useRef, useState } from "react";
import { Upload, Rocket, Info, X, Save, FolderOpen, Printer, Trash2, CheckCircle2 } from "lucide-react";
import { useTheme } from "./theme";
import { t, type Lang } from "./i18n";
import type { AbmDataset, ValidationIssue } from "./core/schema";
import { buildPreset } from "./data/preset";
import { listSaves, saveBook, removeSave, type SavedBook } from "./storage";
import { Board } from "./components/Board";
import { ImportWizard } from "./components/ImportWizard";
import { ThemeToggle } from "./components/ui/ThemeToggle";
import { Signature } from "./components/ui/Signature";

type View = "board" | "import";

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const [lang, setLang] = useState<Lang>("pt");
  const [dataset, setDataset] = useState<AbmDataset>(() => buildPreset());
  const [view, setView] = useState<View>("board");
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [showIssues, setShowIssues] = useState(false);
  const [saves, setSaves] = useState<SavedBook[]>([]);
  const [savedOpen, setSavedOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setSaves(listSaves()), []);

  function notify(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  function loadPreset() {
    setDataset(buildPreset());
    setIssues([]);
    setShowIssues(false);
    setView("board");
  }

  function onLoad(ds: AbmDataset, foundIssues: ValidationIssue[]) {
    setDataset(ds);
    setIssues(foundIssues);
    setShowIssues(foundIssues.length > 0);
    setView("board");
  }

  function doSave() {
    const { mode } = saveBook(dataset, dataset.label);
    setSaves(listSaves());
    notify(mode === "durable" ? t(lang, "save.done") : t(lang, "save.session"));
  }

  function openSaved(s: SavedBook) {
    setDataset(s.dataset);
    setIssues([]);
    setShowIssues(false);
    setView("board");
    setSavedOpen(false);
  }

  function deleteSaved(id: string) {
    removeSave(id);
    setSaves(listSaves());
  }

  const isDemo = dataset.source === "preset";

  return (
    <div className="min-h-full">
      <header className="no-print sticky top-0 z-20">
        <div className="float rounded-none">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-5 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden
                className="brand-glow grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-signal to-cyanx"
              >
                <span className="h-3 w-3 rotate-45 rounded-[3px] bg-white/95" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold tracking-tight text-text">{t(lang, "brand.name")}</span>
                  <span className="hidden text-xs text-dim sm:inline">· {t(lang, "brand.tagline")}</span>
                </div>
                <div className="text-[11px] text-faint">{t(lang, "app.subtitle")}</div>
              </div>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <span
                className="brand-glow hidden items-center gap-1.5 rounded-xl bg-signal/10 px-2.5 py-1.5 text-[11px] font-medium text-signal lg:inline-flex"
                title={t(lang, "integrity.tooltip")}
              >
                <Info size={12} />
                {t(lang, "integrity.badge")}
              </span>

              <div className="float-sm inline-flex overflow-hidden rounded-xl">
                {(["board", "import"] as View[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    className={`px-3 py-1.5 text-xs transition-colors ${
                      view === v ? "bg-signal text-white" : "text-dim hover:text-text"
                    }`}
                  >
                    {v === "board" ? t(lang, "nav.board") : t(lang, "nav.import")}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={doSave}
                className="float-sm inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs text-dim hover:text-text"
              >
                <Save size={13} />
                <span className="hidden sm:inline">{t(lang, "nav.save")}</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSavedOpen((o) => !o)}
                  className="float-sm inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs text-dim hover:text-text"
                >
                  <FolderOpen size={13} />
                  <span className="hidden sm:inline">{t(lang, "nav.saved")}</span>
                  {saves.length ? (
                    <span className="rounded-full bg-signal/20 px-1.5 text-[10px] font-semibold text-signal">
                      {saves.length}
                    </span>
                  ) : null}
                </button>
                {savedOpen ? (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSavedOpen(false)} />
                    <div className="float-raised absolute right-0 z-20 mt-2 w-72 rounded-2xl p-2">
                      {saves.length === 0 ? (
                        <div className="px-3 py-4 text-xs text-dim">{t(lang, "save.empty")}</div>
                      ) : (
                        saves.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-panel2"
                          >
                            <button
                              type="button"
                              onClick={() => openSaved(s)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <div className="truncate text-xs font-medium text-text">{s.label}</div>
                              <div className="text-[10px] text-faint">
                                {new Date(s.savedAt).toLocaleString()} · {s.dataset.accounts.length}{" "}
                                {t(lang, "save.accounts")}
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSaved(s.id)}
                              className="shrink-0 text-faint hover:text-risk"
                              aria-label={t(lang, "save.remove")}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              <button
                type="button"
                onClick={loadPreset}
                className="float-sm inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs text-dim hover:text-text"
              >
                <Rocket size={13} />
                <span className="hidden md:inline">{t(lang, "nav.preset")}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="float-sm inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs text-dim hover:text-text"
              >
                <Printer size={13} />
                <span className="hidden md:inline">{t(lang, "nav.export")}</span>
              </button>

              {/* Segmented PT | EN control: the active language is highlighted so
                  switching is unambiguous (a single toggle read as showing the
                  target vs. the current language, which confused users). */}
              <div className="float-sm inline-flex overflow-hidden rounded-xl" role="group" aria-label="Language">
                {(["pt", "en"] as Lang[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    aria-pressed={lang === l}
                    className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      lang === l ? "bg-signal text-white" : "text-dim hover:text-text"
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>

              <ThemeToggle theme={theme} toggle={toggleTheme} lang={lang} />
            </div>
          </div>
          <div className="hairline" />
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-6">
        {view === "import" ? (
          <ImportWizard lang={lang} onLoad={onLoad} onCancel={() => setView("board")} />
        ) : (
          <>
            {showIssues && issues.length ? (
              <div className="no-print float-sm mb-4 flex items-start justify-between gap-3 rounded-2xl px-4 py-3 text-sm text-watch">
                <div className="flex items-start gap-2">
                  <Info size={15} className="mt-0.5 shrink-0" />
                  <span>
                    {issues.length} {t(lang, "import.issues")}.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIssues(false)}
                  className="shrink-0 text-watch/80 hover:text-watch"
                  aria-label="Dismiss"
                >
                  <X size={15} />
                </button>
              </div>
            ) : null}

            {dataset.accounts.length ? (
              <Board dataset={dataset} lang={lang} />
            ) : (
              <div className="float flex flex-col items-center gap-3 rounded-3xl py-16 text-center">
                <Upload size={28} className="text-faint" />
                <p className="text-sm text-dim">{t(lang, "import.no_valid")}</p>
                <button
                  type="button"
                  onClick={() => setView("import")}
                  className="rounded-xl bg-signal px-3 py-1.5 text-sm font-semibold text-white"
                >
                  {t(lang, "nav.import")}
                </button>
              </div>
            )}
          </>
        )}

        <Signature lang={lang} demo={isDemo} />
      </main>

      {toast ? (
        <div className="no-print float-raised fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-text">
          <CheckCircle2 size={16} className="text-good" />
          {toast}
        </div>
      ) : null}
    </div>
  );
}
