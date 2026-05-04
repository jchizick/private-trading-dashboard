import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearImportedExchangeTradeLedger,
  loadExchangeTradeLedgerImportSummary,
  loadImportedExchangeTradeLedger,
  saveExchangeTradeLedgerImportSummary,
  saveImportedExchangeTradeLedger
} from "@/lib/exchangeTradeLedgerStorage";
import { createLocalStorageMock, createWindowWithLocalStorage } from "@/test/localStorageMock";
import type { ExchangeTradeRecord } from "@/types/performanceSources";
import type { TradeLedgerImportSummary } from "@/types/tradeLedgerImport";

const EXCHANGE_TRADE_LEDGER_STORAGE_KEY = "market-command:exchange-trade-ledger";
const EXCHANGE_TRADE_LEDGER_IMPORT_SUMMARY_STORAGE_KEY =
  "market-command:exchange-trade-ledger:import-summary";

function trade(overrides: Partial<ExchangeTradeRecord> = {}): ExchangeTradeRecord {
  return {
    id: "trade-2026-05-04-2",
    futures: "SOLUSDT",
    time: "2026-05-04T14:30:00.000Z",
    direction: "Close Long",
    closingPnl: 24.5,
    fee: 1.25,
    status: "Filled",
    importedAt: "2026-05-04T15:00:00.000Z",
    ...overrides
  };
}

function summary(overrides: Partial<TradeLedgerImportSummary> = {}): TradeLedgerImportSummary {
  return {
    rowsParsed: 4,
    rowsSkipped: 1,
    errorCount: 0,
    warningCount: 1,
    acceptedClosedTrades: 2,
    ignoredOpenOrNonFilledRows: 1,
    dateRange: {
      startTime: "2026-05-04T13:00:00.000Z",
      endTime: "2026-05-04T14:30:00.000Z"
    },
    symbolsDetected: ["SOLUSDT"],
    grossClosingPnl: 34.5,
    totalFees: 2.25,
    netRealizedPnl: 32.25,
    importedAt: "2026-05-04T15:00:00.000Z",
    sourceName: "trades.csv",
    ...overrides
  };
}

function setupLocalStorage(initialStore: Record<string, string> = {}) {
  const localStorage = createLocalStorageMock(initialStore);

  vi.stubGlobal("window", createWindowWithLocalStorage(localStorage));

  return localStorage;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("exchange trade ledger localStorage", () => {
  it("saves and loads imported exchange trade ledger records sorted by time", () => {
    const localStorage = setupLocalStorage();
    const later = trade();
    const earlier = trade({
      id: "trade-2026-05-04-1",
      time: "2026-05-04T13:00:00.000Z",
      direction: "Close Short",
      closingPnl: 10
    });

    saveImportedExchangeTradeLedger([later, earlier]);

    expect(localStorage.getItem(EXCHANGE_TRADE_LEDGER_STORAGE_KEY)).toBe(JSON.stringify([later, earlier]));
    expect(loadImportedExchangeTradeLedger()).toEqual([earlier, later]);
  });

  it("returns null for malformed ledger JSON", () => {
    setupLocalStorage({
      [EXCHANGE_TRADE_LEDGER_STORAGE_KEY]: "{bad json"
    });

    expect(loadImportedExchangeTradeLedger()).toBeNull();
  });

  it("returns null for invalid ledger record shapes", () => {
    setupLocalStorage({
      [EXCHANGE_TRADE_LEDGER_STORAGE_KEY]: JSON.stringify([{ ...trade(), direction: "Open Long" }])
    });

    expect(loadImportedExchangeTradeLedger()).toBeNull();
  });

  it("saves and loads import summaries", () => {
    const localStorage = setupLocalStorage();
    const value = summary();

    saveExchangeTradeLedgerImportSummary(value);

    expect(localStorage.getItem(EXCHANGE_TRADE_LEDGER_IMPORT_SUMMARY_STORAGE_KEY)).toBe(JSON.stringify(value));
    expect(loadExchangeTradeLedgerImportSummary()).toEqual(value);
  });

  it("returns null for malformed or invalid summaries", () => {
    setupLocalStorage({
      [EXCHANGE_TRADE_LEDGER_IMPORT_SUMMARY_STORAGE_KEY]: "{bad json"
    });
    expect(loadExchangeTradeLedgerImportSummary()).toBeNull();

    setupLocalStorage({
      [EXCHANGE_TRADE_LEDGER_IMPORT_SUMMARY_STORAGE_KEY]: JSON.stringify({ rowsParsed: 1 })
    });
    expect(loadExchangeTradeLedgerImportSummary()).toBeNull();
  });

  it("clears imported ledger and summary keys", () => {
    const localStorage = setupLocalStorage({
      [EXCHANGE_TRADE_LEDGER_STORAGE_KEY]: JSON.stringify([trade()]),
      [EXCHANGE_TRADE_LEDGER_IMPORT_SUMMARY_STORAGE_KEY]: JSON.stringify(summary())
    });

    clearImportedExchangeTradeLedger();

    expect(localStorage.getItem(EXCHANGE_TRADE_LEDGER_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(EXCHANGE_TRADE_LEDGER_IMPORT_SUMMARY_STORAGE_KEY)).toBeNull();
  });

  it("does not throw when localStorage is unavailable", () => {
    vi.unstubAllGlobals();

    expect(() => saveImportedExchangeTradeLedger([trade()])).not.toThrow();
    expect(loadImportedExchangeTradeLedger()).toBeNull();
    expect(() => saveExchangeTradeLedgerImportSummary(summary())).not.toThrow();
    expect(loadExchangeTradeLedgerImportSummary()).toBeNull();
    expect(() => clearImportedExchangeTradeLedger()).not.toThrow();
  });
});
