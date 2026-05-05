import type { MarketSituation } from "@/types/dashboard";
import type {
  CapturedMarketQuoteRow,
  FearGreedLabel,
  FearGreedSnapshot,
  MarketQuoteSourceState,
  SpxSnapshot
} from "@/types/dailySnapshot";

export const DAILY_MARKET_CAPTURE_SYMBOLS = [
  "SPX500",
  "XAUUSD",
  "VIX",
  "EURUSD",
  "CADUSD",
  "BTCUSDT"
] as const;

export interface MarketCaptureCandidate {
  symbol: SpxSnapshot["symbol"];
  latestClose: number | null;
  dailyTrend: SpxSnapshot["dailyTrend"];
  weeklyTrend: SpxSnapshot["weeklyTrend"];
  marketStatus: SpxSnapshot["marketStatus"];
  keyLevels: SpxSnapshot["keyLevels"];
  quoteSourceState: MarketQuoteSourceState;
  watchlist: CapturedMarketQuoteRow[];
  source: SpxSnapshot["source"];
}

export interface FearGreedCaptureCandidate {
  source: string;
  value: number | null;
  label: FearGreedLabel;
  lastWeek: number | null;
  lastMonth: number | null;
  yearHigh: number | null;
  yearLow: number | null;
  updatedAt: string | null;
}

function isDailyCaptureSymbol(symbol: string): symbol is (typeof DAILY_MARKET_CAPTURE_SYMBOLS)[number] {
  return DAILY_MARKET_CAPTURE_SYMBOLS.includes(symbol as (typeof DAILY_MARKET_CAPTURE_SYMBOLS)[number]);
}

export function sortDailyMarketCaptureRows(rows: CapturedMarketQuoteRow[]) {
  const rowsBySymbol = new Map(rows.map((row) => [row.displaySymbol, row]));

  return DAILY_MARKET_CAPTURE_SYMBOLS
    .map((symbol) => rowsBySymbol.get(symbol))
    .filter((row): row is CapturedMarketQuoteRow => !!row);
}

export function buildSpxSnapshotFromCaptureCandidate(
  candidate: MarketCaptureCandidate,
  capturedAt: string
): SpxSnapshot {
  const watchlist = sortDailyMarketCaptureRows(candidate.watchlist.filter((row) => isDailyCaptureSymbol(row.displaySymbol)));
  const primaryQuote = watchlist.find((row) => row.displaySymbol === "SPX500") ?? null;

  return {
    symbol: candidate.symbol,
    latestClose: primaryQuote?.price ?? candidate.latestClose,
    dailyTrend: candidate.dailyTrend,
    weeklyTrend: candidate.weeklyTrend,
    marketStatus: candidate.marketStatus,
    keyLevels: candidate.keyLevels,
    primaryQuote,
    quoteSourceState: candidate.quoteSourceState,
    watchlist,
    source: candidate.source,
    capturedAt
  };
}

export function buildFearGreedSnapshotFromCaptureCandidate(
  candidate: FearGreedCaptureCandidate,
  capturedAt: string
): FearGreedSnapshot {
  return {
    source: candidate.source,
    value: candidate.value,
    label: candidate.label,
    lastWeek: candidate.lastWeek,
    lastMonth: candidate.lastMonth,
    yearHigh: candidate.yearHigh,
    yearLow: candidate.yearLow,
    updatedAt: candidate.updatedAt,
    capturedAt
  };
}

export function getMarketCaptureSource(quoteSourceState: MarketQuoteSourceState): SpxSnapshot["source"] {
  return quoteSourceState === "mock" ? "mock" : "market_data";
}

export function createMarketCaptureCandidate(
  market: MarketSituation,
  quoteSourceState: MarketQuoteSourceState,
  watchlist: CapturedMarketQuoteRow[]
): MarketCaptureCandidate {
  const orderedWatchlist = sortDailyMarketCaptureRows(watchlist);
  const spxQuote = orderedWatchlist.find((row) => row.displaySymbol === "SPX500");

  return {
    symbol: market.symbol,
    latestClose: spxQuote?.price ?? market.latestDailyClose,
    dailyTrend: market.dailyTrend,
    weeklyTrend: market.weeklyTrend,
    marketStatus: market.marketStatus,
    keyLevels: market.keyTechnicalLevels,
    quoteSourceState,
    watchlist: orderedWatchlist,
    source: getMarketCaptureSource(quoteSourceState)
  };
}
