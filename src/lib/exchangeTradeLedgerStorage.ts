import type { ExchangeTradeRecord } from "@/types/performanceSources";
import type { TradeLedgerImportSummary } from "@/types/tradeLedgerImport";

const EXCHANGE_TRADE_LEDGER_STORAGE_KEY = "market-command:exchange-trade-ledger";
const EXCHANGE_TRADE_LEDGER_IMPORT_SUMMARY_STORAGE_KEY =
  "market-command:exchange-trade-ledger:import-summary";

function canUseLocalStorage() {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function isExchangeTradeRecord(value: unknown): value is ExchangeTradeRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<ExchangeTradeRecord>;

  return (
    typeof record.id === "string" &&
    typeof record.futures === "string" &&
    typeof record.time === "string" &&
    (record.direction === "Close Long" || record.direction === "Close Short") &&
    typeof record.closingPnl === "number" &&
    Number.isFinite(record.closingPnl) &&
    typeof record.fee === "number" &&
    Number.isFinite(record.fee) &&
    typeof record.status === "string"
  );
}

function isTradeLedgerImportSummary(value: unknown): value is TradeLedgerImportSummary {
  if (!value || typeof value !== "object") {
    return false;
  }

  const summary = value as Partial<TradeLedgerImportSummary>;

  return (
    typeof summary.rowsParsed === "number" &&
    typeof summary.rowsSkipped === "number" &&
    typeof summary.errorCount === "number" &&
    typeof summary.warningCount === "number" &&
    typeof summary.acceptedClosedTrades === "number" &&
    typeof summary.ignoredOpenOrNonFilledRows === "number" &&
    !!summary.dateRange &&
    Array.isArray(summary.symbolsDetected) &&
    typeof summary.grossClosingPnl === "number" &&
    typeof summary.totalFees === "number" &&
    typeof summary.netRealizedPnl === "number" &&
    typeof summary.importedAt === "string"
  );
}

export function saveImportedExchangeTradeLedger(records: ExchangeTradeRecord[]) {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(EXCHANGE_TRADE_LEDGER_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Local prototype storage should never block dashboard usage.
  }
}

export function loadImportedExchangeTradeLedger() {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const rawLedger = window.localStorage.getItem(EXCHANGE_TRADE_LEDGER_STORAGE_KEY);

    if (!rawLedger) {
      return null;
    }

    const parsedLedger: unknown = JSON.parse(rawLedger);

    if (!Array.isArray(parsedLedger) || !parsedLedger.every(isExchangeTradeRecord)) {
      return null;
    }

    return [...parsedLedger].sort((a, b) => a.time.localeCompare(b.time));
  } catch {
    return null;
  }
}

export function saveExchangeTradeLedgerImportSummary(summary: TradeLedgerImportSummary) {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      EXCHANGE_TRADE_LEDGER_IMPORT_SUMMARY_STORAGE_KEY,
      JSON.stringify(summary)
    );
  } catch {
    // Local prototype storage should never block dashboard usage.
  }
}

export function loadExchangeTradeLedgerImportSummary() {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const rawSummary = window.localStorage.getItem(EXCHANGE_TRADE_LEDGER_IMPORT_SUMMARY_STORAGE_KEY);

    if (!rawSummary) {
      return null;
    }

    const parsedSummary: unknown = JSON.parse(rawSummary);

    return isTradeLedgerImportSummary(parsedSummary) ? parsedSummary : null;
  } catch {
    return null;
  }
}

export function clearImportedExchangeTradeLedger() {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(EXCHANGE_TRADE_LEDGER_STORAGE_KEY);
    window.localStorage.removeItem(EXCHANGE_TRADE_LEDGER_IMPORT_SUMMARY_STORAGE_KEY);
  } catch {
    // Local prototype storage should never block dashboard usage.
  }
}
