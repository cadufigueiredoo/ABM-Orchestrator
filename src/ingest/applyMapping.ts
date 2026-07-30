import {
  type Account,
  type ColumnMapping,
  type VerticalMapping,
  type CountryMapping,
  type RawRow,
  type ValidationIssue,
  type Vertical,
  type Country,
  VERTICALS,
  COUNTRIES,
} from "../core/schema";

export interface MappingResult {
  accounts: Account[];
  issues: ValidationIssue[];
}

// Locale-aware number parse. Real exports mix "1,234", "1.234", "R$ 1.234,50".
// The rightmost separator is treated as the decimal separator.
export function toNum(raw: string): number | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  const negative = /^\(.*\)$/.test(s) || s.trim().startsWith("-");
  s = s.replace(/[^\d.,]/g, "");
  if (!s) return null;
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot > -1 && lastComma > -1) {
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (lastComma > -1) {
    // Comma as thousands (e.g. 1,234) vs decimal (e.g. 12,5).
    const parts = s.split(",");
    const looksThousands = parts.slice(1).every((g) => g.length === 3) && parts[0].length <= 3;
    s = looksThousands ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if (lastDot > -1) {
    const parts = s.split(".");
    const looksThousands = parts.length > 1 && parts.slice(1).every((g) => g.length === 3) && parts[0].length <= 3;
    if (looksThousands) s = s.replace(/\./g, "");
  }
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -Math.abs(n) : n;
}

const cell = (row: RawRow, col?: string): string => (col ? (row[col] ?? "").trim() : "");

export function applyMapping(
  rows: RawRow[],
  mapping: ColumnMapping,
  verticalMap: VerticalMapping,
  countryMap: CountryMapping,
  file: string
): MappingResult {
  const accounts: Account[] = [];
  const issues: ValidationIssue[] = [];
  const seenId = new Set<string>();

  rows.forEach((row, i) => {
    const rowNum = i + 2; // 1-based + header, matches spreadsheet row numbers
    const push = (field: string, message: string) => issues.push({ row: rowNum, field, message });

    const rawName = cell(row, mapping.name);
    const rawId = cell(row, mapping.id);
    // A row with neither id nor name is empty noise, not a validation error.
    if (!rawName && !rawId) return;

    const name = rawName || rawId;
    if (!rawName) push("name", "Missing account name");

    let id = rawId || `ROW-${rowNum}`;
    if (seenId.has(id)) {
      push("id", `Duplicate id "${id}" — suffixed to keep it unique`);
      id = `${id}#${rowNum}`;
    }
    seenId.add(id);

    const rawVertical = cell(row, mapping.vertical);
    let vertical = verticalMap[rawVertical] as Vertical | undefined;
    if (!vertical || !VERTICALS.includes(vertical)) {
      push("vertical", `Unmapped vertical "${rawVertical}" — defaulted to AEC`);
      vertical = "AEC";
    }

    const rawCountry = cell(row, mapping.country);
    let country = countryMap[rawCountry] as Country | undefined;
    if (!country || !COUNTRIES.includes(country)) {
      push("country", `Unmapped country "${rawCountry}" — defaulted to BR`);
      country = "BR";
    }

    const employees = toNum(cell(row, mapping.employees));
    if (employees == null || employees < 0) {
      push("employees", "Missing or invalid employee count — treated as 0");
    }

    const intentNum = toNum(cell(row, mapping.intent));
    if (intentNum == null) push("intent", "Missing intent — treated as 0");
    const intent = Math.max(0, Math.min(100, intentNum ?? 0));

    const fitNum = toNum(cell(row, mapping.fitSignals));
    if (fitNum == null) push("fitSignals", "Missing fit signals — treated as 0");
    const fitSignals = Math.max(0, fitNum ?? 0);

    const account: Account = {
      id,
      name,
      vertical,
      country,
      employees: Math.max(0, employees ?? 0),
      intent,
      fitSignals,
      _source: { file, row: rowNum },
    };

    const rev = toNum(cell(row, mapping.annualRevenueUSD));
    if (rev != null && rev >= 0) account.annualRevenueUSD = rev;
    const arr = toNum(cell(row, mapping.currentARRUSD));
    if (arr != null && arr >= 0) account.currentARRUSD = arr;
    const owner = cell(row, mapping.owner);
    if (owner) account.owner = owner;

    accounts.push(account);
  });

  return { accounts, issues };
}
