import type { AccountEquitySnapshot } from "@/types/performanceSources";
import type { EquityImportSummary } from "@/types/accountEquityImport";

const ACCOUNT_EQUITY_HISTORY_STORAGE_KEY = "market-command:account-equity-history";
const ACCOUNT_EQUITY_IMPORT_SUMMARY_STORAGE_KEY =
  "market-command:account-equity-history:import-summary";

function canUseLocalStorage() {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function isAccountEquitySnapshot(value: unknown): value is AccountEquitySnapshot {
  return normalizeAccountEquitySnapshot(value) !== null;
}

function normalizeAccountEquitySnapshot(value: unknown): AccountEquitySnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const snapshot = value as Partial<AccountEquitySnapshot> & { percentChange?: unknown };
  const id = snapshot.id;
  const date = snapshot.date;
  const equity = snapshot.equity;
  const source = snapshot.source;
  const cumulativeReturnPercent =
    typeof snapshot.cumulativeReturnPercent === "number"
      ? snapshot.cumulativeReturnPercent
      : typeof snapshot.percentChange === "number"
        ? snapshot.percentChange
        : null;
  const isValid =
    typeof id === "string" &&
    typeof date === "string" &&
    typeof equity === "number" &&
    Number.isFinite(equity) &&
    typeof cumulativeReturnPercent === "number" &&
    Number.isFinite(cumulativeReturnPercent) &&
    source === "csv_import";

  if (!isValid) {
    return null;
  }

  return {
    id,
    date,
    equity,
    cumulativeReturnPercent,
    source,
    importedAt: snapshot.importedAt
  };
}

function isEquityImportSummary(value: unknown): value is EquityImportSummary {
  if (!value || typeof value !== "object") {
    return false;
  }

  const summary = value as Partial<EquityImportSummary>;

  return (
    typeof summary.rowsParsed === "number" &&
    typeof summary.rowsSkipped === "number" &&
    typeof summary.errorCount === "number" &&
    typeof summary.warningCount === "number" &&
    !!summary.dateRange &&
    typeof summary.importedAt === "string"
  );
}

export function saveImportedAccountEquityHistory(records: AccountEquitySnapshot[]) {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(ACCOUNT_EQUITY_HISTORY_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Local prototype storage should never block dashboard usage.
  }
}

export function loadImportedAccountEquityHistory() {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const rawHistory = window.localStorage.getItem(ACCOUNT_EQUITY_HISTORY_STORAGE_KEY);

    if (!rawHistory) {
      return null;
    }

    const parsedHistory: unknown = JSON.parse(rawHistory);

    if (!Array.isArray(parsedHistory) || !parsedHistory.every(isAccountEquitySnapshot)) {
      return null;
    }

    const normalizedHistory = parsedHistory.map(normalizeAccountEquitySnapshot);

    if (!normalizedHistory.every((snapshot): snapshot is AccountEquitySnapshot => snapshot !== null)) {
      return null;
    }

    return normalizedHistory.sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return null;
  }
}

export function saveImportedAccountEquityImportSummary(summary: EquityImportSummary) {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(ACCOUNT_EQUITY_IMPORT_SUMMARY_STORAGE_KEY, JSON.stringify(summary));
  } catch {
    // Local prototype storage should never block dashboard usage.
  }
}

export function loadImportedAccountEquityImportSummary() {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const rawSummary = window.localStorage.getItem(ACCOUNT_EQUITY_IMPORT_SUMMARY_STORAGE_KEY);

    if (!rawSummary) {
      return null;
    }

    const parsedSummary: unknown = JSON.parse(rawSummary);

    return isEquityImportSummary(parsedSummary) ? parsedSummary : null;
  } catch {
    return null;
  }
}

export function clearImportedAccountEquityHistory() {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(ACCOUNT_EQUITY_HISTORY_STORAGE_KEY);
    window.localStorage.removeItem(ACCOUNT_EQUITY_IMPORT_SUMMARY_STORAGE_KEY);
  } catch {
    // Local prototype storage should never block dashboard usage.
  }
}
