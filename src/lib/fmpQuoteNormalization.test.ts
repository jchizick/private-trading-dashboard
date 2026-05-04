import { describe, expect, it } from "vitest";
import {
  createUnavailableMarketQuote,
  isUsableMarketQuote,
  normalizeFmpQuote,
  parseFmpQuotePayload
} from "@/lib/fmpQuoteNormalization";

const BASE_OPTIONS = {
  displaySymbol: "SPX500",
  providerSymbol: "ESUSD",
  label: "SPX",
  sourceLabel: "E-Mini S&P 500 proxy"
};
const MAY_4_2026_NOON_UTC_SECONDS = Date.parse("2026-05-04T12:00:00.000Z") / 1000;
const MAY_4_2026_NOON_UTC_MS = Date.parse("2026-05-04T12:00:00.000Z");

describe("FMP quote normalization", () => {
  it("parses FMP array and object payloads", () => {
    const row = { symbol: "ESUSD", price: 5200 };

    expect(parseFmpQuotePayload([row])).toBe(row);
    expect(parseFmpQuotePayload(row)).toBe(row);
    expect(parseFmpQuotePayload([])).toBeNull();
    expect(parseFmpQuotePayload(null)).toBeNull();
  });

  it("maps a valid FMP quote row to a normalized live MarketQuote", () => {
    const quote = normalizeFmpQuote(
      {
        symbol: "ESUSD",
        price: "5234.56",
        change: "-12.34",
        changesPercentage: "-0.24",
        volume: "123456",
        timestamp: MAY_4_2026_NOON_UTC_SECONDS
      },
      BASE_OPTIONS
    );

    expect(quote).toEqual({
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
      sourceLabel: "E-Mini S&P 500 proxy"
    });
    expect(isUsableMarketQuote(quote)).toBe(true);
  });

  it("accepts changePercentage and custom cached status", () => {
    const quote = normalizeFmpQuote(
      {
        symbol: "^GSPC",
        price: 5201,
        changePercentage: 0.45,
        timestamp: String(MAY_4_2026_NOON_UTC_MS)
      },
      {
        displaySymbol: "SPX500",
        providerSymbol: "^GSPC",
        label: "SPX",
        sourceLabel: "S&P 500 index fallback",
        status: "cached"
      }
    );

    expect(quote).toMatchObject({
      providerSymbol: "^GSPC",
      changePercent: 0.45,
      volume: null,
      asOf: "2026-05-04T12:00:00.000Z",
      status: "cached",
      sourceLabel: "S&P 500 index fallback"
    });
  });

  it("handles missing optional volume and timestamp as null fields", () => {
    const quote = normalizeFmpQuote({ symbol: "ESUSD", price: 5234.56 }, BASE_OPTIONS);

    expect(quote).toMatchObject({
      price: 5234.56,
      change: null,
      changePercent: null,
      volume: null,
      asOf: null,
      status: "live"
    });
  });

  it("returns safe error quotes for missing or invalid required price", () => {
    expect(normalizeFmpQuote(null, BASE_OPTIONS)).toMatchObject({
      status: "error",
      provider: "fmp",
      price: null,
      error: "missing_fmp_quote_row"
    });
    expect(normalizeFmpQuote({ symbol: "ESUSD", price: "not-a-price" }, BASE_OPTIONS)).toMatchObject({
      status: "error",
      provider: "fmp",
      price: null,
      error: "missing_fmp_quote_price"
    });
  });

  it("creates unavailable mock fallback quotes", () => {
    const quote = createUnavailableMarketQuote({
      displaySymbol: "WTI",
      label: "WTI Crude",
      message: "Provider unavailable"
    });

    expect(quote).toEqual({
      displaySymbol: "WTI",
      providerSymbol: null,
      provider: "mock",
      price: null,
      change: null,
      changePercent: null,
      volume: null,
      asOf: null,
      status: "unavailable",
      label: "WTI Crude",
      sourceLabel: "Mock fallback",
      message: "Provider unavailable"
    });
    expect(isUsableMarketQuote(quote)).toBe(false);
  });
});
