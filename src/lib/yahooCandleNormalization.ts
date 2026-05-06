import type { MarketCandle, MarketCandleProviderSymbol, YahooChartPayload, YahooChartResultPayload } from "@/types/marketCandles";

interface NormalizeYahooCandlesOptions {
  symbol: MarketCandleProviderSymbol;
  isProxy: boolean;
}

function parseFiniteNumber(value: number | string | null | undefined) {
  if (value === null || typeof value === "undefined" || value === "") {
    return null;
  }

  const numericValue = typeof value === "number" ? value : Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

export function parseYahooChartPayload(payload: unknown): YahooChartResultPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const chartPayload = payload as YahooChartPayload;
  const firstResult = chartPayload.chart?.result?.[0];

  return firstResult && typeof firstResult === "object" ? firstResult : null;
}

export function getYahooChartError(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const chartPayload = payload as YahooChartPayload;
  const error = chartPayload.chart?.error;

  if (!error) {
    return null;
  }

  return error.description ?? error.code ?? "yahoo_chart_error";
}

export function normalizeYahooCandles(
  payload: unknown,
  {
    symbol,
    isProxy
  }: NormalizeYahooCandlesOptions
): MarketCandle[] {
  const result = parseYahooChartPayload(payload);
  const timestamps = result?.timestamp;
  const quote = result?.indicators?.quote?.[0];

  if (!Array.isArray(timestamps) || !quote) {
    return [];
  }

  const candles: MarketCandle[] = [];

  for (let index = 0; index < timestamps.length; index += 1) {
    const time = parseFiniteNumber(timestamps[index]);
    const open = parseFiniteNumber(quote.open?.[index]);
    const high = parseFiniteNumber(quote.high?.[index]);
    const low = parseFiniteNumber(quote.low?.[index]);
    const close = parseFiniteNumber(quote.close?.[index]);

    if (time === null || open === null || high === null || low === null || close === null) {
      continue;
    }

    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume: parseFiniteNumber(quote.volume?.[index]),
      source: "Yahoo Finance",
      symbol,
      isProxy
    });
  }

  return candles;
}
