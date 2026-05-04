import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearMarketQuotesCache,
  isMarketQuotesFetchResult,
  loadMarketQuotesCache,
  saveMarketQuotesCache
} from "@/lib/marketQuoteStorage";
import { createLocalStorageMock, createWindowWithLocalStorage } from "@/test/localStorageMock";
import type { MarketQuote, MarketQuotesFetchResult } from "@/types/marketQuotes";

const MARKET_QUOTES_CACHE_STORAGE_KEY = "market-command:market-quotes-cache";

function quote(overrides: Partial<MarketQuote> = {}): MarketQuote {
  return {
    displaySymbol: "SPX500",
    providerSymbol: "ESUSD",
    provider: "fmp",
    price: 5234.56,
    change: -12.34,
    changePercent: -0.24,
    volume: 123456,
    asOf: "2026-05-04T12:00:00.000Z",
    status: "live",
    label: "SPX",
    sourceLabel: "E-Mini S&P 500 proxy",
    ...overrides
  };
}

function result(overrides: Partial<MarketQuotesFetchResult> = {}): MarketQuotesFetchResult {
  return {
    ok: true,
    quotes: {
      SPX500: quote()
    },
    stale: false,
    source: "Financial Modeling Prep + Twelve Data",
    updatedAt: "2026-05-04T12:00:00.000Z",
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

describe("market quote fetch result validation", () => {
  it("accepts valid normalized route payloads", () => {
    expect(isMarketQuotesFetchResult(result())).toBe(true);
    expect(
      isMarketQuotesFetchResult(
        result({
          quotes: {
            SPX500: quote(),
            CADUSD: quote({
              displaySymbol: "CADUSD",
              providerSymbol: "CAD/USD",
              provider: "twelve",
              price: 0.73,
              sourceLabel: "CAD/USD forex"
            })
          }
        })
      )
    ).toBe(true);
  });

  it("rejects malformed successful route payloads and missing quote maps", () => {
    expect(isMarketQuotesFetchResult(null)).toBe(false);
    expect(isMarketQuotesFetchResult({ ok: true, stale: false })).toBe(false);
    expect(
      isMarketQuotesFetchResult({
        ...result(),
        quotes: undefined
      })
    ).toBe(false);
    expect(
      isMarketQuotesFetchResult({
        ...result(),
        quotes: [quote()]
      })
    ).toBe(false);
  });

  it("rejects invalid statuses and bad numeric fields", () => {
    expect(
      isMarketQuotesFetchResult(
        result({
          quotes: {
            SPX500: quote({ status: "stuck" as MarketQuote["status"] })
          }
        })
      )
    ).toBe(false);
    expect(
      isMarketQuotesFetchResult(
        result({
          quotes: {
            SPX500: quote({ price: Number.NaN })
          }
        })
      )
    ).toBe(false);
    expect(
      isMarketQuotesFetchResult(
        result({
          quotes: {
            SPX500: {
              ...quote(),
              changePercent: "0.12"
            }
          } as unknown as MarketQuotesFetchResult["quotes"]
        })
      )
    ).toBe(false);
  });

  it("rejects invalid providers, sources, and updatedAt values", () => {
    expect(
      isMarketQuotesFetchResult(
        result({
          quotes: {
            SPX500: quote({ provider: "other" as MarketQuote["provider"] })
          }
        })
      )
    ).toBe(false);
    expect(
      isMarketQuotesFetchResult({
        ...result(),
        source: "Other Provider"
      })
    ).toBe(false);
    expect(
      isMarketQuotesFetchResult({
        ...result(),
        updatedAt: null
      })
    ).toBe(false);
  });
});

describe("market quote browser cache storage", () => {
  it("saves and loads a valid route result under the expected cache key", () => {
    const localStorage = setupLocalStorage();
    const value = result();

    saveMarketQuotesCache(value);

    expect(localStorage.getItem(MARKET_QUOTES_CACHE_STORAGE_KEY)).toBe(JSON.stringify(value));
    expect(loadMarketQuotesCache()).toEqual(value);
  });

  it("returns null when the cache key is missing", () => {
    setupLocalStorage();

    expect(loadMarketQuotesCache()).toBeNull();
  });

  it("rejects quote arrays because route payloads must be symbol-keyed", () => {
    setupLocalStorage({
      [MARKET_QUOTES_CACHE_STORAGE_KEY]: JSON.stringify({
        ...result(),
        quotes: [quote()]
      })
    });

    expect(loadMarketQuotesCache()).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    setupLocalStorage({
      [MARKET_QUOTES_CACHE_STORAGE_KEY]: "{bad json"
    });

    expect(loadMarketQuotesCache()).toBeNull();
  });

  it("returns null for invalid route payload shapes", () => {
    setupLocalStorage({
      [MARKET_QUOTES_CACHE_STORAGE_KEY]: JSON.stringify({
        ok: true,
        stale: false
      })
    });

    expect(loadMarketQuotesCache()).toBeNull();
  });

  it("rejects unsupported quote status values", () => {
    setupLocalStorage({
      [MARKET_QUOTES_CACHE_STORAGE_KEY]: JSON.stringify(
        result({
          quotes: {
            SPX500: quote({ status: "stuck" as MarketQuote["status"] })
          }
        })
      )
    });

    expect(loadMarketQuotesCache()).toBeNull();
  });

  it("clears the cached quote result", () => {
    const localStorage = setupLocalStorage({
      [MARKET_QUOTES_CACHE_STORAGE_KEY]: JSON.stringify(result())
    });

    clearMarketQuotesCache();

    expect(localStorage.getItem(MARKET_QUOTES_CACHE_STORAGE_KEY)).toBeNull();
  });

  it("does not throw when localStorage is unavailable", () => {
    vi.unstubAllGlobals();

    expect(() => saveMarketQuotesCache(result())).not.toThrow();
    expect(loadMarketQuotesCache()).toBeNull();
    expect(() => clearMarketQuotesCache()).not.toThrow();
  });
});
