export type MarketQuoteProvider = "fmp" | "twelve" | "mock";

export type MarketQuoteStatus = "live" | "cached" | "mock" | "unavailable" | "error";

export interface MarketQuote {
  displaySymbol: string;
  providerSymbol: string | null;
  provider: MarketQuoteProvider;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  asOf: string | null;
  status: MarketQuoteStatus;
  label: string;
  sourceLabel: string;
  error?: string;
  message?: string;
}

export interface MarketQuotesFetchResult {
  ok: boolean;
  quotes: Record<string, MarketQuote>;
  stale: boolean;
  source: "Financial Modeling Prep" | "Financial Modeling Prep + Twelve Data";
  updatedAt: string;
  error?: string;
}

export interface FmpQuoteRow {
  symbol?: string;
  name?: string;
  price?: number | string | null;
  change?: number | string | null;
  changePercentage?: number | string | null;
  changesPercentage?: number | string | null;
  volume?: number | string | null;
  timestamp?: number | string | null;
}

export interface TwelveQuoteRow {
  symbol?: string;
  name?: string;
  exchange?: string;
  close?: number | string | null;
  change?: number | string | null;
  percent_change?: number | string | null;
  percentChange?: number | string | null;
  volume?: number | string | null;
  timestamp?: number | string | null;
  datetime?: string | null;
  status?: string;
  message?: string;
  code?: number;
}
