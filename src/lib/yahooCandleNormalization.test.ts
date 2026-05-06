import { describe, expect, it } from "vitest";
import { getYahooChartError, normalizeYahooCandles, parseYahooChartPayload } from "@/lib/yahooCandleNormalization";

function yahooPayload(overrides: {
  timestamp?: unknown;
  open?: unknown;
  high?: unknown;
  low?: unknown;
  close?: unknown;
  volume?: unknown;
} = {}) {
  return {
    chart: {
      result: [
        {
          meta: {
            symbol: "^GSPC"
          },
          timestamp: overrides.timestamp ?? [1777469400, 1777471200],
          indicators: {
            quote: [
              {
                open: overrides.open ?? [7131.61, 7140.5],
                high: overrides.high ?? [7142.25, 7151.75],
                low: overrides.low ?? [7128.2, 7137.4],
                close: overrides.close ?? [7139.5, 7148.3],
                volume: overrides.volume ?? [123456, 234567]
              }
            ]
          }
        }
      ],
      error: null
    }
  };
}

describe("Yahoo candle normalization", () => {
  it("maps aligned Yahoo chart arrays to normalized market candles", () => {
    expect(normalizeYahooCandles(yahooPayload(), { symbol: "^GSPC", isProxy: false })).toEqual([
      {
        time: 1777469400,
        open: 7131.61,
        high: 7142.25,
        low: 7128.2,
        close: 7139.5,
        volume: 123456,
        source: "Yahoo Finance",
        symbol: "^GSPC",
        isProxy: false
      },
      {
        time: 1777471200,
        open: 7140.5,
        high: 7151.75,
        low: 7137.4,
        close: 7148.3,
        volume: 234567,
        source: "Yahoo Finance",
        symbol: "^GSPC",
        isProxy: false
      }
    ]);
  });

  it("preserves null volume while accepting valid OHLC rows", () => {
    expect(normalizeYahooCandles(
      yahooPayload({ volume: [null] }),
      { symbol: "SPY", isProxy: true }
    )[0]).toEqual({
      time: 1777469400,
      open: 7131.61,
      high: 7142.25,
      low: 7128.2,
      close: 7139.5,
      volume: null,
      source: "Yahoo Finance",
      symbol: "SPY",
      isProxy: true
    });
  });

  it("filters rows with missing timestamp or non-finite OHLC fields", () => {
    const candles = normalizeYahooCandles(
      yahooPayload({
        timestamp: [1777469400, null, 1777473000],
        open: [7131.61, 7140.5, "not-a-number"],
        high: [7142.25, 7151.75, 7160],
        low: [7128.2, 7137.4, 7144],
        close: [7139.5, 7148.3, 7152.2]
      }),
      { symbol: "^GSPC", isProxy: false }
    );

    expect(candles).toHaveLength(1);
    expect(candles[0].time).toBe(1777469400);
  });

  it("returns an empty array for malformed or empty Yahoo payloads", () => {
    expect(normalizeYahooCandles(null, { symbol: "^GSPC", isProxy: false })).toEqual([]);
    expect(normalizeYahooCandles({ chart: { result: [] } }, { symbol: "^GSPC", isProxy: false })).toEqual([]);
    expect(normalizeYahooCandles(
      yahooPayload({ timestamp: [] }),
      { symbol: "^GSPC", isProxy: false }
    )).toEqual([]);
  });

  it("extracts Yahoo chart result and provider errors", () => {
    const payload = yahooPayload();
    const errorPayload = {
      chart: {
        result: null,
        error: {
          code: "Not Found",
          description: "No data found"
        }
      }
    };

    expect(parseYahooChartPayload(payload)?.meta?.symbol).toBe("^GSPC");
    expect(getYahooChartError(errorPayload)).toBe("No data found");
  });
});
