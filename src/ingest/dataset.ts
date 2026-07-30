import type { Account, AbmDataset, FieldMarketer, Country, RaciEntry } from "../core/schema";
import { COUNTRIES } from "../core/schema";

// Org-level constants (not file data): the ABM motion's ownership matrix and a
// default marketer roster used when the upload carries no owner column.
export const DEFAULT_RACI: RaciEntry[] = [
  { activity: "Tier-1 account plan", responsible: "Field Marketer", accountable: "ABM Lead", consulted: "Account Director", informed: "Regional Marketing" },
  { activity: "Executive roundtable", responsible: "Field Marketer", accountable: "ABM Lead", consulted: "Sales", informed: "Ops" },
  { activity: "Budget allocation", responsible: "ABM Lead", accountable: "Marketing Director", consulted: "Finance", informed: "Field Marketers" },
  { activity: "Pipeline review", responsible: "ABM Lead", accountable: "ABM Lead", consulted: "RevOps", informed: "Sales Leadership" },
];

const DEFAULT_CAPACITY = 8;

const emptyCounts = (): Record<Country, number> =>
  Object.fromEntries(COUNTRIES.map((c) => [c, 0])) as Record<Country, number>;

// Clusters that actually appear in the book, in canonical order.
const clustersPresent = (accounts: Account[]): Country[] =>
  COUNTRIES.filter((c) => accounts.some((a) => a.country === c));

// Build a marketer roster from the accounts' owner column. Each distinct owner
// is placed in the cluster where they own the most accounts. When no owners are
// present, fall back to two marketers per cluster that actually has accounts (a
// documented planning default) so the territory view stays meaningful without
// inventing empty LATAM clusters.
export function buildMarketers(accounts: Account[]): FieldMarketer[] {
  const byOwner = new Map<string, Record<Country, number>>();
  for (const a of accounts) {
    const owner = a.owner?.trim();
    if (!owner) continue;
    const rec = byOwner.get(owner) ?? emptyCounts();
    rec[a.country] += 1;
    byOwner.set(owner, rec);
  }

  if (byOwner.size === 0) {
    return clustersPresent(accounts).flatMap((cluster) => [
      { name: `${cluster} Marketer 1`, cluster, capacity: DEFAULT_CAPACITY },
      { name: `${cluster} Marketer 2`, cluster, capacity: DEFAULT_CAPACITY },
    ]);
  }

  return [...byOwner.entries()].map(([name, counts]) => {
    // Highest-count cluster wins; ties fall to the earliest canonical country.
    const cluster = COUNTRIES.reduce((best, c) => (counts[c] > counts[best] ? c : best), COUNTRIES[0]);
    return { name, cluster, capacity: DEFAULT_CAPACITY };
  });
}

export function buildUploadDataset(accounts: Account[], fileName: string): AbmDataset {
  const present = clustersPresent(accounts);
  return {
    label: `Uploaded · ${fileName}`,
    region: present.length ? `LATAM · ${present.join(", ")}` : "LATAM",
    currency: "USD",
    avgDealUSD: 60000,
    accounts,
    marketers: buildMarketers(accounts),
    raci: DEFAULT_RACI,
    source: "upload",
  };
}
