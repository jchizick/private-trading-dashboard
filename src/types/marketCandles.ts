export type MarketCandleSource = "Yahoo Finance";

export type MarketCandleProviderSymbol = "^GSPC" | "SPY" | "ES=F";

export type MarketCandleDisplaySymbol = "SPX500";

export type MarketCandleDisplaySource = "index" | "futures";

export type MarketCandleInterval = "30m";

export interface MarketCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
  source: MarketCandleSource;
  symbol: MarketCandleProviderSymbol;
  isProxy: boolean;
}

export interface MarketCandlesFetchResult {
  ok: boolean;
  displaySymbol: MarketCandleDisplaySymbol;
  requestedSymbol: MarketCandleDisplaySymbol;
  displaySource: MarketCandleDisplaySource;
  providerSymbol: MarketCandleProviderSymbol | null;
  sourceLabel: string;
  sessionLabel: string;
  source: MarketCandleSource;
  interval: MarketCandleInterval;
  range: string;
  candles: MarketCandle[];
  stale: boolean;
  updatedAt: string;
  isProxy: boolean;
  proxyFor?: "^GSPC";
  error?: string;
}

export interface YahooChartQuotePayload {
  open?: Array<number | string | null> | null;
  high?: Array<number | string | null> | null;
  low?: Array<number | string | null> | null;
  close?: Array<number | string | null> | null;
  volume?: Array<number | string | null> | null;
}

export interface YahooChartResultPayload {
  meta?: {
    symbol?: string;
    [key: string]: unknown;
  };
  timestamp?: Array<number | string | null> | null;
  indicators?: {
    quote?: YahooChartQuotePayload[] | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface YahooChartPayload {
  chart?: {
    result?: YahooChartResultPayload[] | null;
    error?: {
      code?: string;
      description?: string;
      [key: string]: unknown;
    } | null;
    [key: string]: unknown;
  };
}
