import { describe, expect, it } from "vitest";
import {
  normalizeTwelveQuote,
  parseTwelveQuotePayload
} from "@/lib/twelveQuoteNormalization";

const BASE_OPTIONS = {
  displaySymbol: "XAUUSD",
  providerSymbol: "XAU/USD",
  label: "Gold",
  sourceLabel: "Gold spot"
};
const MAY_4_2026_NOON_UTC_SECONDS = Date.parse("2026-05-04T12:00:00.000Z") / 1000;

describe("Twelve Data quote normalization", () => {
  it("parses object payloads and rejects non-object payloads", () => {
    const row = { symbol: "XAU/USD", close: "2335.5" };

    expect(parseTwelveQuotePayload(row)).toBe(row);
    expect(parseTwelveQuotePayload(null)).toBeNull();
    expect(parseTwelveQuotePayload("bad")).toBeNull();
  });

  it("maps a valid Twelve Data quote response to a normalized live MarketQuote", () => {
    const quote = normalizeTwelveQuote(
      {
        symbol: "XAU/USD",
        close: "2335.50",
        change: "12.25",
        percent_change: "0.53",
        volume: "98765",
        timestamp: MAY_4_2026_NOON_UTC_SECONDS
      },
      BASE_OPTIONS
    );

    expect(quote).toEqual({
      displaySymbol: "XAUUSD",
      providerSymbol: "XAU/USD",
      provider: "twelve",
      price: 2335.5,
      change: 12.25,
      changePercent: 0.53,
      volume: 98765,
      asOf: "2026-05-04T12:00:00.000Z",
      status: "live",
      label: "Gold",
      sourceLabel: "Gold spot"
    });
  });

  it("accepts percentChange alias and passed-through labels for CAD/USD and BTC/USD", () => {
    const cadQuote = normalizeTwelveQuote(
      {
        symbol: "CAD/USD",
        close: 0.73,
        percentChange: -0.12
      },
      {
        displaySymbol: "CADUSD",
        providerSymbol: "CAD/USD",
        label: "CAD/USD",
        sourceLabel: "CAD/USD forex"
      }
    );
    const btcQuote = normalizeTwelveQuote(
      {
        symbol: "BTC/USD",
        close: "65000",
        percent_change: "1.2"
      },
      {
        displaySymbol: "BTCUSDT",
        providerSymbol: "BTC/USD",
        label: "BTC",
        sourceLabel: "BTC/USD proxy"
      }
    );

    expect(cadQuote).toMatchObject({
      displaySymbol: "CADUSD",
      providerSymbol: "CAD/USD",
      sourceLabel: "CAD/USD forex",
      changePercent: -0.12
    });
    expect(btcQuote).toMatchObject({
      displaySymbol: "BTCUSDT",
      providerSymbol: "BTC/USD",
      sourceLabel: "BTC/USD proxy",
      changePercent: 1.2
    });
  });

  it("handles missing optional volume and timestamp/date fields as null fields", () => {
    const quote = normalizeTwelveQuote(
      {
        symbol: "XAU/USD",
        close: "2335.50",
        datetime: "2026-05-04"
      },
      BASE_OPTIONS
    );

    expect(quote).toMatchObject({
      price: 2335.5,
      volume: null,
      asOf: null,
      status: "live"
    });
  });

  it("returns safe error quotes for provider error payloads", () => {
    expect(
      normalizeTwelveQuote(
        {
          status: "error",
          code: 400,
          message: "symbol not found"
        },
        BASE_OPTIONS
      )
    ).toMatchObject({
      provider: "twelve",
      status: "error",
      price: null,
      error: "symbol not found"
    });
    expect(
      normalizeTwelveQuote(
        {
          code: 429
        },
        BASE_OPTIONS
      )
    ).toMatchObject({
      status: "error",
      error: "twelve_request_failed_429"
    });
  });

  it("returns safe error quotes for missing rows and missing required close price", () => {
    expect(normalizeTwelveQuote(null, BASE_OPTIONS)).toMatchObject({
      provider: "twelve",
      status: "error",
      error: "missing_twelve_quote_row"
    });
    expect(normalizeTwelveQuote({ symbol: "XAU/USD", close: "not-a-price" }, BASE_OPTIONS)).toMatchObject({
      provider: "twelve",
      status: "error",
      error: "missing_twelve_quote_price"
    });
  });
});
