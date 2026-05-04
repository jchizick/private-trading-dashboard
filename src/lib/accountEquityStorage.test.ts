import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearImportedAccountEquityHistory,
  loadImportedAccountEquityHistory,
  loadImportedAccountEquityImportSummary,
  saveImportedAccountEquityHistory,
  saveImportedAccountEquityImportSummary
} from "@/lib/accountEquityStorage";
import { createLocalStorageMock, createWindowWithLocalStorage } from "@/test/localStorageMock";
import type { EquityImportSummary } from "@/types/accountEquityImport";
import type { AccountEquitySnapshot } from "@/types/performanceSources";

const ACCOUNT_EQUITY_HISTORY_STORAGE_KEY = "market-command:account-equity-history";
const ACCOUNT_EQUITY_IMPORT_SUMMARY_STORAGE_KEY = "market-command:account-equity-history:import-summary";

function accountEquity(overrides: Partial<AccountEquitySnapshot> = {}): AccountEquitySnapshot {
  return {
    id: "account-equity-2026-05-04",
    date: "2026-05-04",
    equity: 291.79,
    cumulativeReturnPercent: 191.79,
    source: "csv_import",
    importedAt: "2026-05-04T14:00:00.000Z",
    ...overrides
  };
}

function summary(overrides: Partial<EquityImportSummary> = {}): EquityImportSummary {
  return {
    rowsParsed: 2,
    rowsSkipped: 0,
    errorCount: 0,
    warningCount: 0,
    dateRange: {
      startDate: "2026-05-03",
      endDate: "2026-05-04"
    },
    latestEquity: 291.79,
    importedAt: "2026-05-04T14:00:00.000Z",
    sourceName: "account.csv",
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

describe("account equity localStorage", () => {
  it("saves and loads imported account equity history sorted by date", () => {
    const localStorage = setupLocalStorage();
    const latest = accountEquity();
    const earlier = accountEquity({
      id: "account-equity-2026-05-03",
      date: "2026-05-03",
      equity: 292.81,
      cumulativeReturnPercent: 192.81
    });

    saveImportedAccountEquityHistory([latest, earlier]);

    expect(localStorage.getItem(ACCOUNT_EQUITY_HISTORY_STORAGE_KEY)).toBe(JSON.stringify([latest, earlier]));
    expect(loadImportedAccountEquityHistory()).toEqual([earlier, latest]);
  });

  it("returns null for malformed history JSON", () => {
    setupLocalStorage({
      [ACCOUNT_EQUITY_HISTORY_STORAGE_KEY]: "{bad json"
    });

    expect(loadImportedAccountEquityHistory()).toBeNull();
  });

  it("normalizes old percentChange records to cumulativeReturnPercent", () => {
    const legacyRecord = {
      id: "account-equity-2026-05-04",
      date: "2026-05-04",
      equity: 291.79,
      percentChange: 191.79,
      source: "csv_import",
      importedAt: "2026-05-04T14:00:00.000Z"
    };
    setupLocalStorage({
      [ACCOUNT_EQUITY_HISTORY_STORAGE_KEY]: JSON.stringify([legacyRecord])
    });

    expect(loadImportedAccountEquityHistory()).toEqual([
      {
        id: "account-equity-2026-05-04",
        date: "2026-05-04",
        equity: 291.79,
        cumulativeReturnPercent: 191.79,
        source: "csv_import",
        importedAt: "2026-05-04T14:00:00.000Z"
      }
    ]);
  });

  it("saves and loads import summaries", () => {
    const localStorage = setupLocalStorage();
    const value = summary();

    saveImportedAccountEquityImportSummary(value);

    expect(localStorage.getItem(ACCOUNT_EQUITY_IMPORT_SUMMARY_STORAGE_KEY)).toBe(JSON.stringify(value));
    expect(loadImportedAccountEquityImportSummary()).toEqual(value);
  });

  it("returns null for malformed or invalid summaries", () => {
    setupLocalStorage({
      [ACCOUNT_EQUITY_IMPORT_SUMMARY_STORAGE_KEY]: "{bad json"
    });
    expect(loadImportedAccountEquityImportSummary()).toBeNull();

    setupLocalStorage({
      [ACCOUNT_EQUITY_IMPORT_SUMMARY_STORAGE_KEY]: JSON.stringify({ rowsParsed: 1 })
    });
    expect(loadImportedAccountEquityImportSummary()).toBeNull();
  });

  it("clears imported history and summary keys", () => {
    const localStorage = setupLocalStorage({
      [ACCOUNT_EQUITY_HISTORY_STORAGE_KEY]: JSON.stringify([accountEquity()]),
      [ACCOUNT_EQUITY_IMPORT_SUMMARY_STORAGE_KEY]: JSON.stringify(summary())
    });

    clearImportedAccountEquityHistory();

    expect(localStorage.getItem(ACCOUNT_EQUITY_HISTORY_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(ACCOUNT_EQUITY_IMPORT_SUMMARY_STORAGE_KEY)).toBeNull();
  });

  it("does not throw when localStorage is unavailable", () => {
    vi.unstubAllGlobals();

    expect(() => saveImportedAccountEquityHistory([accountEquity()])).not.toThrow();
    expect(loadImportedAccountEquityHistory()).toBeNull();
    expect(() => saveImportedAccountEquityImportSummary(summary())).not.toThrow();
    expect(loadImportedAccountEquityImportSummary()).toBeNull();
    expect(() => clearImportedAccountEquityHistory()).not.toThrow();
  });
});
