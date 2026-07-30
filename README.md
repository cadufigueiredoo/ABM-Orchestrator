# ABM Orchestrator

An account-based field marketing tool for Brazil + Mexico: import a target-account
list (CSV/XLSX), map the columns, and get ICP fit + intent scoring with tiering,
territory coverage vs capacity, a budget/ROI model, a team RACI, and an
AI-generated territory briefing. A Preset mode loads an already-run demo book.

Figures are computed deterministically in the client; the AI layer only narrates.

## Status

The UI is built and wired to the deterministic core — the app runs end-to-end.

- `src/main.tsx`, `src/App.tsx` — shell: view (import | board), PT/EN toggle, Light/Dark toggle, Load preset.
- `src/ingest/` — `parseFile` (CSV via PapaParse, XLSX via SheetJS), header/vertical/country auto-mapping, `applyMapping` (Zod-validated, provenance-tagged, surfaces `ValidationIssue[]`), and the upload dataset assembler.
- `src/components/` — `Board`, `ImportWizard`, panels (`KpiRow`, `AccountScoringPanel`, `TerritoryPanel`, `BudgetPanel`, `RaciPanel`, `BriefPanel`) and `ui/` atoms.
- `api/narrate.ts` — Vercel Node serverless narrator: env-configurable model, retry with backoff, upstream-error mapping (401/402/429/5xx), abort timeout, and tolerant JSON extraction for truncated responses.

`npm run typecheck`, `npm run test`, and `npm run build` are all green.

## Run

```bash
npm install
npm run test        # deterministic core suite
npm run dev         # board on the preset (import path also works)
```

The territory briefing (`/api/narrate`) only runs on Vercel's runtime. To exercise
it locally, use `vercel dev` instead of `npm run dev`; otherwise the panel shows a
graceful "endpoint not found" message and the rest of the app works offline.

## Deploy (Vercel)

1. Import the repo; the framework preset is detected as **Vite**.
2. Set env vars before the first deploy:
   - `ANTHROPIC_API_KEY` — your key from console.anthropic.com
   - `ANTHROPIC_MODEL` — optional model override (defaults to `claude-sonnet-4-6`)
3. Deploy. `vercel.json` sets `maxDuration: 60` for `api/narrate.ts`.

Developed by Carlos Eduardo · linkedin.com/in/carloseduardovf
