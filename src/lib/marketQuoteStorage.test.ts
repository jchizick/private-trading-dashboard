import { describe, expect, it } from "vitest";
import { isMarketQuotesFetchResult } from "@/lib/marketQuoteStorage";
import type { MarketQuote, MarketQuotesFetchResult } from "@/types/marketQuotes";

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
