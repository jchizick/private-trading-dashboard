import type { MarketCandle, MarketCandlesFetchResult } from "@/types/marketCandles";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value);
}

function isMarketCandle(value: unknown): value is MarketCandle {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candle = value as Partial<MarketCandle>;

  return (
    isFiniteNumber(candle.time) &&
    isFiniteNumber(candle.open) &&
    isFiniteNumber(candle.high) &&
    isFiniteNumber(candle.low) &&
    isFiniteNumber(candle.close) &&
    isNullableFiniteNumber(candle.volume) &&
    candle.source === "Yahoo Finance" &&
    (candle.symbol === "^GSPC" || candle.symbol === "SPY" || candle.symbol === "ES=F") &&
    typeof candle.isProxy === "boolean"
  );
}

export function isMarketCandlesFetchResult(value: unknown): value is MarketCandlesFetchResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const result = value as Partial<MarketCandlesFetchResult>;

  return (
    typeof result.ok === "boolean" &&
    result.displaySymbol === "SPX500" &&
    result.requestedSymbol === "SPX500" &&
    (result.displaySource === "index" || result.displaySource === "futures") &&
    (result.providerSymbol === "^GSPC" || result.providerSymbol === "SPY" || result.providerSymbol === "ES=F" || result.providerSymbol === null) &&
    typeof result.sourceLabel === "string" &&
    typeof result.sessionLabel === "string" &&
    result.source === "Yahoo Finance" &&
    result.interval === "30m" &&
    typeof result.range === "string" &&
    Array.isArray(result.candles) &&
    result.candles.every(isMarketCandle) &&
    typeof result.stale === "boolean" &&
    typeof result.updatedAt === "string" &&
    typeof result.isProxy === "boolean" &&
    (typeof result.proxyFor === "undefined" || result.proxyFor === "^GSPC") &&
    (typeof result.error === "undefined" || typeof result.error === "string")
  );
}
