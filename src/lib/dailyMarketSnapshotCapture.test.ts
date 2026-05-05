import { describe, expect, it } from "vitest";
import {
  DAILY_MARKET_CAPTURE_SYMBOLS,
  buildFearGreedSnapshotFromCaptureCandidate,
  buildSpxSnapshotFromCaptureCandidate,
  createMarketCaptureCandidate,
  type FearGreedCaptureCandidate,
  type MarketCaptureCandidate
} from "@/lib/dailyMarketSnapshotCapture";
import type { CapturedMarketQuoteRow } from "@/types/dailySnapshot";
import type { MarketSituation } from "@/types/dashboard";

const capturedAt = "2026-05-04T14:30:00.000Z";

const market: MarketSituation = {
  symbol: "SPX",
  dailyTrend: "bullish",
  weeklyTrend: "neutral",
  latestDailyClose: 5148.21,
  sessionStatus: "positive",
  marketStatus: "sideways consolidation",
  riskState: "balanced",
  keyTechnicalLevels: [
    { label: "Prior high", price: 5185, bias: "resistance" }
  ],
  chartPlaceholderLabel: "SPX daily chart embed placeholder",
  notes: "Mock context"
};

function quote(overrides: Partial<CapturedMarketQuoteRow> = {}): CapturedMarketQuoteRow {
  return {
    displaySymbol: "SPX500",
    price: 6012.34,
    change: 22.15,
    changePercent: 0.37,
    provider: "fmp",
    providerSymbol: "ESUSD",
    status: "live",
    sourceLabel: "E-Mini S&P 500 proxy",
    asOf: "2026-05-04T14:29:00.000Z",
    ...overrides
  };
}

function allRows(overrides: Partial<CapturedMarketQuoteRow> = {}) {
  return DAILY_MARKET_CAPTURE_SYMBOLS.map((symbol) => quote({
    displaySymbol: symbol,
    providerSymbol: symbol,
    ...overrides
  }));
}

function marketCandidate(overrides: Partial<MarketCaptureCandidate> = {}): MarketCaptureCandidate {
  return {
    symbol: "SPX",
    latestClose: 5148.21,
    dailyTrend: "bullish",
    weeklyTrend: "neutral",
    marketStatus: "sideways consolidation",
    keyLevels: market.keyTechnicalLevels,
    quoteSourceState: "live",
    watchlist: allRows(),
    source: "market_data",
    ...overrides
  };
}

describe("daily market snapshot capture helpers", () => {
  it("captures all six quote rows in daily watchlist order and selects SPX500 as primary", () => {
    const snapshot = buildSpxSnapshotFromCaptureCandidate(
      marketCandidate({
        watchlist: [
          quote({ displaySymbol: "BTCUSDT", providerSymbol: "BTCUSD" }),
          quote({ displaySymbol: "SPX500", providerSymbol: "ESUSD", price: 6033.21 }),
          quote({ displaySymbol: "CADUSD", providerSymbol: "CAD/USD" }),
          quote({ displaySymbol: "VIX", providerSymbol: "^VIX" }),
          quote({ displaySymbol: "EURUSD", providerSymbol: "EURUSD" }),
          quote({ displaySymbol: "XAUUSD", providerSymbol: "XAU/USD" })
        ]
      }),
      capturedAt
    );

    expect(snapshot.watchlist.map((row) => row.displaySymbol)).toEqual([...DAILY_MARKET_CAPTURE_SYMBOLS]);
    expect(snapshot.primaryQuote?.displaySymbol).toBe("SPX500");
    expect(snapshot.latestClose).toBe(6033.21);
    expect(snapshot.capturedAt).toBe(capturedAt);
  });

  it("preserves quote source state and row provider/status/source labels", () => {
    const snapshot = buildSpxSnapshotFromCaptureCandidate(
      marketCandidate({
        quoteSourceState: "partial",
        watchlist: [
          quote({ displaySymbol: "SPX500", status: "live", provider: "fmp", sourceLabel: "SPX live" }),
          quote({ displaySymbol: "XAUUSD", status: "cached", provider: "twelve", sourceLabel: "Gold cached" }),
          quote({
            displaySymbol: "VIX",
            status: "unavailable",
            provider: "fmp",
            providerSymbol: "^VIX",
            price: null,
            change: null,
            changePercent: null,
            asOf: null,
            sourceLabel: "CBOE Volatility Index"
          }),
          quote({ displaySymbol: "EURUSD", status: "mock", provider: "mock", providerSymbol: null, sourceLabel: "mock" }),
          quote({ displaySymbol: "CADUSD", status: "cached", provider: "twelve", sourceLabel: "CAD cached" }),
          quote({ displaySymbol: "BTCUSDT", status: "live", provider: "fmp", sourceLabel: "Bitcoin proxy" })
        ]
      }),
      capturedAt
    );

    expect(snapshot.quoteSourceState).toBe("partial");
    expect(snapshot.watchlist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ displaySymbol: "SPX500", status: "live", provider: "fmp", sourceLabel: "SPX live" }),
        expect.objectContaining({ displaySymbol: "XAUUSD", status: "cached", provider: "twelve", sourceLabel: "Gold cached" }),
        expect.objectContaining({ displaySymbol: "VIX", status: "unavailable", provider: "fmp", price: null, asOf: null }),
        expect.objectContaining({ displaySymbol: "EURUSD", status: "mock", provider: "mock", providerSymbol: null })
      ])
    );
  });

  it("does not fabricate missing quote data", () => {
    const snapshot = buildSpxSnapshotFromCaptureCandidate(
      marketCandidate({
        latestClose: null,
        watchlist: [
          quote({
            displaySymbol: "SPX500",
            price: null,
            change: null,
            changePercent: null,
            provider: "mock",
            providerSymbol: null,
            status: "mock",
            sourceLabel: "mock",
            asOf: null
          })
        ]
      }),
      capturedAt
    );

    expect(snapshot.primaryQuote).toMatchObject({
      displaySymbol: "SPX500",
      price: null,
      change: null,
      changePercent: null,
      provider: "mock",
      providerSymbol: null,
      status: "mock",
      asOf: null
    });
    expect(snapshot.latestClose).toBeNull();
  });

  it("builds a market candidate from static market context and current quote rows", () => {
    const candidate = createMarketCaptureCandidate(market, "cached", allRows({ status: "cached" }));

    expect(candidate).toMatchObject({
      symbol: "SPX",
      latestClose: 6012.34,
      dailyTrend: "bullish",
      weeklyTrend: "neutral",
      marketStatus: "sideways consolidation",
      quoteSourceState: "cached",
      source: "market_data"
    });
  });

  it("captures Fear & Greed current and historical source fields", () => {
    const candidate: FearGreedCaptureCandidate = {
      source: "CMC Crypto Fear and Greed Index",
      value: 82,
      label: "Extreme Greed",
      lastWeek: 74,
      lastMonth: 58,
      yearHigh: 91,
      yearLow: 22,
      updatedAt: "2026-05-04T14:25:00.000Z"
    };

    expect(buildFearGreedSnapshotFromCaptureCandidate(candidate, capturedAt)).toEqual({
      ...candidate,
      capturedAt
    });
  });
});
