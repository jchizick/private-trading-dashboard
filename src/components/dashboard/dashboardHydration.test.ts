/**
 * @vitest-environment jsdom
 */

import React, { act } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { dashboardData } from "@/data/mockDashboardData";
import { createDailySnapshotForDate } from "@/lib/dailySnapshotFactory";
import { getDailySnapshotStorageKey, getLocalTradingDate } from "@/lib/dailySnapshotStorage";
import { createLocalStorageMock, type LocalStorageMock } from "@/test/localStorageMock";
import type { FearGreedFetchResult } from "@/types/fearGreed";
import type { MarketQuotesFetchResult } from "@/types/marketQuotes";
import type { AccountEquitySnapshot, ExchangeTradeRecord } from "@/types/performanceSources";

const ACCOUNT_EQUITY_HISTORY_STORAGE_KEY = "market-command:account-equity-history";
const EXCHANGE_TRADE_LEDGER_STORAGE_KEY = "market-command:exchange-trade-ledger";

const marketQuotesResult: MarketQuotesFetchResult = {
  ok: true,
  stale: false,
  source: "Financial Modeling Prep + Twelve Data",
  updatedAt: "2026-05-04T14:30:00.000Z",
  quotes: {
    SPX500: {
      displaySymbol: "SPX500",
      providerSymbol: "ESUSD",
      provider: "fmp",
      price: 6012.34,
      change: 22.15,
      changePercent: 0.37,
      volume: 2345678,
      asOf: "2026-05-04T14:29:00.000Z",
      status: "live",
      label: "SPX futures",
      sourceLabel: "Hydration SPX feed"
    },
    XAUUSD: {
      displaySymbol: "XAUUSD",
      providerSymbol: "XAU/USD",
      provider: "twelve",
      price: 2444.4,
      change: -7.1,
      changePercent: -0.29,
      volume: 12000,
      asOf: "2026-05-04T14:29:00.000Z",
      status: "live",
      label: "Gold spot",
      sourceLabel: "Gold spot"
    },
    VIX: {
      displaySymbol: "VIX",
      providerSymbol: "^VIX",
      provider: "fmp",
      price: 16.75,
      change: -0.25,
      changePercent: -1.47,
      volume: 0,
      asOf: "2026-05-04T14:29:00.000Z",
      status: "live",
      label: "VIX",
      sourceLabel: "CBOE Volatility Index"
    },
    EURUSD: {
      displaySymbol: "EURUSD",
      providerSymbol: "EURUSD",
      provider: "fmp",
      price: 1.1842,
      change: 0.0031,
      changePercent: 0.26,
      volume: 51000,
      asOf: "2026-05-04T14:29:00.000Z",
      status: "live",
      label: "EUR/USD",
      sourceLabel: "EUR/USD forex"
    },
    CADUSD: {
      displaySymbol: "CADUSD",
      providerSymbol: "CAD/USD",
      provider: "twelve",
      price: 0.7421,
      change: 0.0015,
      changePercent: 0.2,
      volume: 32000,
      asOf: "2026-05-04T14:29:00.000Z",
      status: "live",
      label: "CAD/USD",
      sourceLabel: "CAD/USD forex"
    },
    BTCUSDT: {
      displaySymbol: "BTCUSDT",
      providerSymbol: "BTCUSD",
      provider: "fmp",
      price: 71234.56,
      change: 1001.25,
      changePercent: 1.43,
      volume: 98000,
      asOf: "2026-05-04T14:29:00.000Z",
      status: "live",
      label: "Bitcoin",
      sourceLabel: "Bitcoin proxy"
    }
  }
};

const fearGreedResult: FearGreedFetchResult = {
  ok: true,
  snapshot: {
    source: "CMC Crypto Fear and Greed Index",
    value: 82,
    label: "Extreme Greed",
    lastWeek: 74,
    lastMonth: 58,
    yearHigh: 91,
    yearLow: 22,
    lastUpdatedAt: "2026-05-04T14:30:00.000Z"
  },
  stale: false,
  source: "CMC Crypto Fear and Greed Index",
  updatedAt: "2026-05-04T14:30:00.000Z"
};

const importedEquityHistory: AccountEquitySnapshot[] = [
  {
    id: "equity-2026-05-01",
    date: "2026-05-01",
    equity: 100000,
    cumulativeReturnPercent: 0,
    source: "csv_import",
    importedAt: "2026-05-04T14:00:00.000Z"
  },
  {
    id: "equity-2026-05-02",
    date: "2026-05-02",
    equity: 101500,
    cumulativeReturnPercent: 1.5,
    source: "csv_import",
    importedAt: "2026-05-04T14:00:00.000Z"
  },
  {
    id: "equity-2026-05-04",
    date: "2026-05-04",
    equity: 103250,
    cumulativeReturnPercent: 3.25,
    source: "csv_import",
    importedAt: "2026-05-04T14:00:00.000Z"
  }
];

const importedTradeLedger: ExchangeTradeRecord[] = [
  {
    id: "trade-1",
    futures: "BTCUSDT",
    time: "2026-05-04T13:00:00.000Z",
    direction: "Close Long",
    closingPnl: 450,
    fee: -12,
    status: "Filled",
    importedAt: "2026-05-04T14:00:00.000Z"
  }
];

function setupLocalStorage(initialStore: Record<string, string> = {}) {
  const localStorage = createLocalStorageMock(initialStore);

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: localStorage
  });

  return localStorage;
}

function createStoredSnapshot() {
  const tradingDate = getLocalTradingDate();
  const snapshot = createDailySnapshotForDate(tradingDate);
  const now = "2026-05-04T14:00:00.000Z";

  return {
    ...snapshot,
    status: "saved" as const,
    updatedAt: now,
    synthesis: {
      ...snapshot.synthesis,
      primaryBias: "short selective" as const,
      whatMattersToday: "Hydration saved synthesis is loaded from local storage.",
      conditionsToWatch: "Stored breadth and volatility context stay in focus.",
      invalidation: "Stored invalidation below the opening range.",
      operatorNote: "Hydration operator note survived the client mount.",
      updatedAt: now
    },
    gamma: {
      ...snapshot.gamma,
      status: "checked" as const,
      source: "manual" as const,
      sourceName: "Hydration Gamma Source",
      majorPositiveGamma: 7311,
      majorNegativeGamma: 7199,
      zeroGamma: 7255.25,
      capturedAt: now,
      updatedAt: now
    }
  };
}

function createFetchMock() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;

    if (url === "/api/market-quotes") {
      return {
        ok: true,
        json: async () => marketQuotesResult
      } as Response;
    }

    if (url === "/api/fear-greed") {
      return {
        ok: true,
        json: async () => fearGreedResult
      } as Response;
    }

    throw new Error(`Unexpected fetch call: ${url}`);
  });
}

function getHydrationMessages(spy: ReturnType<typeof vi.spyOn>) {
  const hydrationPattern =
    /hydration|hydrate|server rendered html|did not match|text content does not match|hydration failed|a tree hydrated/i;

  return (spy.mock.calls as unknown[][])
    .map((call) => call.map((part) => String(part)).join(" "))
    .filter((message) => hydrationPattern.test(message));
}

async function flushClientEffects() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("DashboardShell hydration", () => {
  let localStorage: LocalStorageMock;
  let root: Root | null;
  let container: HTMLDivElement;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let fetchMock: ReturnType<typeof createFetchMock>;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    root = null;
    container = document.createElement("div");
    document.body.replaceChildren(container);

    const storedSnapshot = createStoredSnapshot();
    localStorage = setupLocalStorage({
      [getDailySnapshotStorageKey(storedSnapshot.tradingDate)]: JSON.stringify(storedSnapshot),
      [ACCOUNT_EQUITY_HISTORY_STORAGE_KEY]: JSON.stringify(importedEquityHistory),
      [EXCHANGE_TRADE_LEDGER_STORAGE_KEY]: JSON.stringify(importedTradeLedger)
    });

    fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }

    document.body.replaceChildren();
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("hydrates mock markup without mismatch warnings and applies client data sources", async () => {
    const serverMarkup = renderToString(React.createElement(DashboardShell, { data: dashboardData }));
    container.innerHTML = serverMarkup;

    expect(container.textContent).toContain("5,148.21");
    expect(container.textContent).toContain("45");
    expect(container.textContent).toContain("Source: Mock Equity History");

    await act(async () => {
      root = hydrateRoot(container, React.createElement(DashboardShell, { data: dashboardData }));
    });
    await flushClientEffects();
    await flushClientEffects();

    const text = container.textContent ?? "";

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/market-quotes",
      expect.objectContaining({ cache: "no-store" })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/fear-greed",
      expect.objectContaining({ cache: "no-store" })
    );
    expect(text).toContain("Hydration SPX feed");
    expect(text).toContain("6,012.34");
    expect(text).toContain("quotes: live");
    expect(text).toContain("82");
    expect(text).toContain("Extreme Greed");
    expect(text).toContain("Hydration saved synthesis is loaded from local storage.");
    expect(text).toContain("Hydration operator note survived the client mount.");
    expect(text).toContain("7,311");
    expect(text).toContain("7,199");
    expect(text).toContain("7,255.25");
    expect(text).toContain("Source: Imported CSV");
    expect(text).toContain("Local CSV");
    expect(text).toContain("Trade Ledger: imported");
    expect(getHydrationMessages(consoleErrorSpy)).toEqual([]);
    expect(getHydrationMessages(consoleWarnSpy)).toEqual([]);
  });
});
