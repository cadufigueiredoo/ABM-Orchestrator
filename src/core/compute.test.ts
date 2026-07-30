import { describe, it, expect } from "vitest";
import { scoreAccount, scoreAll, computeTerritory, computeBudget, playForTier, healthOf } from "./compute";
import { DEFAULT_SCORING, type Account, type FieldMarketer } from "./schema";

function acc(p: Partial<Account> & { id: string }): Account {
  return {
    name: "Acme",
    vertical: "AEC",
    country: "BR",
    employees: 6000,
    intent: 80,
    fitSignals: 5,
    _source: { file: "test", row: 0 },
    ...p,
  };
}

describe("scoreAccount", () => {
  it("scores a strong AEC enterprise account as tier 1", () => {
    const s = scoreAccount(acc({ id: "1" }));
    expect(s.fitScore).toBeGreaterThan(80);
    expect(s.composite).toBeGreaterThanOrEqual(DEFAULT_SCORING.tier1Min);
    expect(s.tier).toBe(1);
  });

  it("scores a weak small low-intent account as tier 3", () => {
    const s = scoreAccount(acc({ id: "2", vertical: "Utilities", employees: 60, intent: 20, fitSignals: 1 }));
    expect(s.composite).toBeLessThan(DEFAULT_SCORING.tier2Min);
    expect(s.tier).toBe(3);
  });

  it("clamps scores into 0..100", () => {
    const s = scoreAccount(acc({ id: "3", intent: 999 }));
    expect(s.intentScore).toBeLessThanOrEqual(100);
    expect(s.composite).toBeLessThanOrEqual(100);
  });

  it("is deterministic", () => {
    const a = acc({ id: "4" });
    expect(scoreAccount(a).composite).toBe(scoreAccount(a).composite);
  });
});

describe("scoreAll", () => {
  it("returns accounts sorted by composite desc", () => {
    const scored = scoreAll([
      acc({ id: "low", vertical: "Utilities", employees: 80, intent: 10, fitSignals: 0 }),
      acc({ id: "high", vertical: "AEC", employees: 8000, intent: 95, fitSignals: 5 }),
    ]);
    expect(scored[0].id).toBe("high");
  });
});

describe("computeTerritory", () => {
  it("groups by cluster and flags capacity imbalance", () => {
    const scored = scoreAll([
      acc({ id: "1", country: "BR" }),
      acc({ id: "2", country: "BR" }),
      acc({ id: "3", country: "MX" }),
    ]);
    const marketers: FieldMarketer[] = [
      { name: "BR-1", cluster: "BR", capacity: 1 },
      { name: "MX-1", cluster: "MX", capacity: 5 },
    ];
    const terr = computeTerritory(scored, marketers);
    const br = terr.find((t) => t.cluster === "BR")!;
    const mx = terr.find((t) => t.cluster === "MX")!;
    expect(br.accounts).toBe(2);
    expect(br.balanced).toBe(br.capacity >= br.tier1Load);
    expect(mx.accounts).toBe(1);
  });

  it("derives clusters from the data across LATAM, not a fixed BR/MX pair", () => {
    const scored = scoreAll([
      acc({ id: "1", country: "CO" }),
      acc({ id: "2", country: "AR" }),
      acc({ id: "3", country: "CL" }),
      acc({ id: "4", country: "PE" }),
    ]);
    const terr = computeTerritory(scored, []);
    expect(terr.map((t) => t.cluster).sort()).toEqual(["AR", "CL", "CO", "PE"]);
    // A country with accounts but no marketer still surfaces (capacity 0).
    const co = terr.find((t) => t.cluster === "CO")!;
    expect(co.accounts).toBe(1);
    expect(co.capacity).toBe(0);
  });

  it("includes a cluster that has marketers even with zero accounts", () => {
    const terr = computeTerritory([], [{ name: "CL-1", cluster: "CL", capacity: 4 }]);
    const cl = terr.find((t) => t.cluster === "CL")!;
    expect(cl.accounts).toBe(0);
    expect(cl.capacity).toBe(4);
  });

  it("preserves canonical COUNTRIES order in the output", () => {
    const scored = scoreAll([
      acc({ id: "1", country: "PE" }),
      acc({ id: "2", country: "BR" }),
      acc({ id: "3", country: "CL" }),
    ]);
    const order = computeTerritory(scored, []).map((t) => t.cluster);
    expect(order).toEqual(["BR", "CL", "PE"]);
  });
});

describe("computeBudget", () => {
  it("computes spend, projected pipeline and ROI deterministically", () => {
    const scored = scoreAll([
      acc({ id: "1", vertical: "AEC", employees: 9000, intent: 95, fitSignals: 5 }), // tier 1
      acc({ id: "2", vertical: "Utilities", employees: 90, intent: 15, fitSignals: 0 }), // tier 3
    ]);
    const b = computeBudget(scored);
    expect(b.totalSpendUSD).toBeGreaterThan(0);
    expect(b.projectedPipelineUSD).toBeGreaterThan(0);
    expect(b.roi).toBeCloseTo(b.projectedPipelineUSD / b.totalSpendUSD, 6);
  });
});

describe("playForTier", () => {
  it("returns the matching play per tier", () => {
    expect(playForTier(1).tier).toBe(1);
    expect(playForTier(3).tier).toBe(3);
  });
});

describe("healthOf", () => {
  it("bands values", () => {
    expect(healthOf(3, 2, 1)).toBe("good");
    expect(healthOf(1.5, 2, 1)).toBe("watch");
    expect(healthOf(0.5, 2, 1)).toBe("risk");
  });
});
