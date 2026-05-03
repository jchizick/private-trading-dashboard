"use client";

import { useEffect, useMemo, useState } from "react";
import { getSessionTone, getTrendTone } from "@/lib/marketStatus";
import { SectionPanel } from "@/components/ui/SectionPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PlaceholderFrame } from "@/components/ui/PlaceholderFrame";
import { formatPrice } from "@/lib/formatters";
import {
  isMarketQuotesFetchResult,
  loadMarketQuotesCache,
  saveMarketQuotesCache
} from "@/lib/marketQuoteStorage";
import type { MarketSituation } from "@/types/dashboard";
import type { MarketQuote, MarketQuotesFetchResult } from "@/types/marketQuotes";

type BadgeTone = "positive" | "negative" | "neutral" | "warning";

interface MarketSituationModuleProps {
  market: MarketSituation;
}

const marketWatchlist = [
  { symbol: "SPX500", last: "5,148.21", change: "+18.40", changePercent: "+0.36%", volume: "2.1B" },
  { symbol: "XAUUSD", last: "2,331.80", change: "-6.20", changePercent: "-0.27%", volume: "184K" },
  { symbol: "WTI", last: "78.42", change: "+0.54", changePercent: "+0.69%", volume: "312K" },
  { symbol: "DXY", last: "104.68", change: "-0.12", changePercent: "-0.11%", volume: "96K" },
  { symbol: "CADUSD", last: "0.7312", change: "+0.0018", changePercent: "+0.25%", volume: "41K" },
  { symbol: "BTCUSDT", last: "64,820.50", change: "+410.20", changePercent: "+0.64%", volume: "38K" }
] as const;

type QuoteSourceState = "live" | "cached" | "partial" | "mock";

function getChangeTone(change: string) {
  return change.startsWith("-") ? "negative" : "positive";
}

function formatSignedPrice(value: number | null, fallback: string) {
  if (value === null) {
    return fallback;
  }

  const sign = value > 0 ? "+" : "";

  return `${sign}${formatPrice(value)}`;
}

function formatSignedPercent(value: number | null, fallback: string) {
  if (value === null) {
    return fallback;
  }

  const sign = value > 0 ? "+" : "";

  return `${sign}${value.toFixed(2)}%`;
}

function formatVolume(value: number | null, fallback: string) {
  if (value === null) {
    return fallback;
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function getStatusTone(status: MarketQuote["status"]): BadgeTone {
  if (status === "live" || status === "cached") {
    return "positive";
  }

  if (status === "unavailable" || status === "error") {
    return "warning";
  }

  return "neutral";
}

function getQuoteSourceState(result: MarketQuotesFetchResult | null): QuoteSourceState {
  if (!result) {
    return "mock";
  }

  const quotes = Object.values(result.quotes);
  const hasCached = result.stale || quotes.some((quote) => quote.status === "cached");
  const hasLive = quotes.some((quote) => quote.status === "live");
  const hasUnavailable = quotes.some((quote) => quote.status === "unavailable" || quote.status === "error");

  if (hasCached) {
    return "cached";
  }

  if (hasLive && hasUnavailable) {
    return "partial";
  }

  return hasLive ? "live" : "mock";
}

function getSourceStateTone(state: QuoteSourceState): BadgeTone {
  if (state === "live" || state === "partial") {
    return "positive";
  }

  if (state === "cached") {
    return "warning";
  }

  return "neutral";
}

function getCompactSourceLabel(quote: MarketQuote | undefined) {
  if (!quote) {
    return "mock";
  }

  if (quote.provider === "mock") {
    return "mock";
  }

  if (quote.displaySymbol === "XAUUSD") {
    return quote.provider === "twelve" ? "spot" : "futures";
  }

  if (quote.displaySymbol === "CADUSD") {
    return "forex";
  }

  if (quote.displaySymbol === "SPX500" && quote.providerSymbol === "^GSPC") {
    return "fallback";
  }

  return "proxy";
}

function markResultAsCached(result: MarketQuotesFetchResult): MarketQuotesFetchResult {
  return {
    ...result,
    stale: true,
    quotes: Object.fromEntries(
      Object.entries(result.quotes).map(([symbol, quote]) => [
        symbol,
        quote.status === "live" ? { ...quote, status: "cached" as const } : quote
      ])
    )
  };
}

function getQuotePrice(quote: MarketQuote | undefined, fallback: number) {
  return quote?.price ?? fallback;
}

export function MarketSituationModule({ market }: MarketSituationModuleProps) {
  const [quotesResult, setQuotesResult] = useState<MarketQuotesFetchResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadQuotes() {
      try {
        const response = await fetch("/api/market-quotes", {
          cache: "no-store",
          signal: controller.signal
        });
        const payload: unknown = await response.json();

        if (!isMounted) {
          return;
        }

        if (response.ok && isMarketQuotesFetchResult(payload) && payload.ok) {
          setQuotesResult(payload);
          saveMarketQuotesCache(payload);
          return;
        }

        const cachedResult = loadMarketQuotesCache();

        if (cachedResult) {
          setQuotesResult(markResultAsCached(cachedResult));
        }
      } catch (error) {
        if (!isMounted || error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        const cachedResult = loadMarketQuotesCache();

        if (cachedResult) {
          setQuotesResult(markResultAsCached(cachedResult));
        }
      }
    }

    loadQuotes();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const sourceState = getQuoteSourceState(quotesResult);
  const spxQuote = quotesResult?.quotes.SPX500;
  const displayedSpxPrice = getQuotePrice(spxQuote, market.latestDailyClose);
  const hasSpxChange = typeof spxQuote?.change === "number" && typeof spxQuote.changePercent === "number";
  const watchlistRows = useMemo(() => (
    marketWatchlist.map((item) => {
      const quote = quotesResult?.quotes[item.symbol];

      return {
        symbol: item.symbol,
        last: quote?.price !== null && typeof quote?.price !== "undefined"
          ? formatPrice(quote.price)
          : item.last,
        change: quote ? formatSignedPrice(quote.change, item.change) : item.change,
        changePercent: quote ? formatSignedPercent(quote.changePercent, item.changePercent) : item.changePercent,
        volume: quote ? formatVolume(quote.volume, item.volume) : item.volume,
        status: quote?.status ?? "mock",
        metadata: `${getCompactSourceLabel(quote)} / ${quote?.status ?? "mock"}`
      };
    })
  ), [quotesResult]);

  return (
    <SectionPanel
      title="SPX Situation"
      description="Primary macro market read for risk context."
      action={
        <div className="marketSourceState">
          <StatusBadge tone={getSourceStateTone(sourceState)}>quotes: {sourceState}</StatusBadge>
          <StatusBadge tone={getSessionTone(market.sessionStatus)}>{market.sessionStatus}</StatusBadge>
        </div>
      }
      className="sectionPanel--marketAnchor"
    >
      <div className="marketHero">
        <div>
          <span className="moduleKicker">{spxQuote?.sourceLabel ?? `${market.symbol} latest close`}</span>
          <strong>{formatPrice(displayedSpxPrice)}</strong>
          {hasSpxChange ? (
            <small className={`marketHero__change marketWatchlist__value--${getChangeTone(formatSignedPrice(spxQuote.change, ""))}`}>
              {formatSignedPrice(spxQuote.change, "")} / {formatSignedPercent(spxQuote.changePercent, "")}
            </small>
          ) : null}
        </div>
        <div className="marketHero__badges">
          <StatusBadge tone={getTrendTone(market.dailyTrend)}>Daily {market.dailyTrend}</StatusBadge>
          <StatusBadge tone={getTrendTone(market.weeklyTrend)}>Weekly {market.weeklyTrend}</StatusBadge>
          <StatusBadge tone="neutral">{market.riskState} risk</StatusBadge>
        </div>
      </div>

      <div className="marketGrid">
        <PlaceholderFrame label={market.chartPlaceholderLabel} variant="chart">
          <div className="tradingChart__quote">
            <span>{market.symbol}</span>
            <strong>{formatPrice(displayedSpxPrice)}</strong>
          </div>
          <svg className="tradingChart" viewBox="0 0 360 210" role="img">
            <g className="tradingChart__grid">
              <path d="M34 24H328M34 68H328M34 112H328M34 156H328" />
              <path d="M74 18V172M124 18V172M174 18V172M224 18V172M274 18V172" />
            </g>
            <path className="placeholderFrame__baseline" d="M0 116H320" />
            <path
              className="placeholderFrame__path"
              d="M34 126 C58 120 66 96 92 102 C118 108 126 56 158 64 C190 72 198 130 230 116 C264 100 284 64 328 70"
            />
            <g className="tradingChart__candles">
              <path d="M55 94V130" /><rect x="51" y="104" width="8" height="18" />
              <path d="M72 82V118" /><rect x="68" y="88" width="8" height="22" />
              <path d="M89 100V138" /><rect x="85" y="108" width="8" height="20" />
              <path d="M128 70V108" /><rect x="124" y="78" width="8" height="20" />
              <path d="M146 56V98" /><rect x="142" y="64" width="8" height="24" />
              <path d="M166 62V112" /><rect x="162" y="74" width="8" height="28" />
              <path d="M206 104V142" /><rect x="202" y="112" width="8" height="22" />
              <path d="M246 88V126" /><rect x="242" y="96" width="8" height="20" />
              <path d="M286 72V112" /><rect x="282" y="82" width="8" height="20" />
              <path d="M312 66V102" /><rect x="308" y="74" width="8" height="18" />
            </g>
            <g className="tradingChart__volume">
              <rect x="36" y="180" width="5" height="18" />
              <rect x="48" y="176" width="5" height="22" />
              <rect x="60" y="184" width="5" height="14" />
              <rect x="72" y="170" width="5" height="28" />
              <rect x="84" y="188" width="5" height="10" />
              <rect x="96" y="182" width="5" height="16" />
              <rect x="108" y="174" width="5" height="24" />
              <rect x="120" y="180" width="5" height="18" />
              <rect x="132" y="168" width="5" height="30" />
              <rect x="144" y="172" width="5" height="26" />
              <rect x="156" y="176" width="5" height="22" />
              <rect x="168" y="184" width="5" height="14" />
              <rect x="180" y="188" width="5" height="10" />
              <rect x="192" y="178" width="5" height="20" />
              <rect x="204" y="186" width="5" height="12" />
              <rect x="216" y="181" width="5" height="17" />
              <rect x="228" y="174" width="5" height="24" />
              <rect x="240" y="179" width="5" height="19" />
              <rect x="252" y="184" width="5" height="14" />
              <rect x="264" y="172" width="5" height="26" />
              <rect x="276" y="186" width="5" height="12" />
              <rect x="288" y="176" width="5" height="22" />
              <rect x="300" y="182" width="5" height="16" />
              <rect x="312" y="170" width="5" height="28" />
            </g>
            <g className="tradingChart__axis">
              <text x="332" y="27">5,360</text>
              <text x="332" y="71">5,320</text>
              <text x="332" y="115">5,280</text>
              <text x="40" y="207">09:30</text>
              <text x="150" y="207">12:30</text>
              <text x="274" y="207">15:30</text>
            </g>
          </svg>
        </PlaceholderFrame>
      </div>

      <div className="marketWatchlist" aria-label="Supporting market watchlist">
        <div className="marketWatchlist__header">
          <span>Symbol</span>
          <span>Last</span>
          <span>Chg</span>
          <span>Chg%</span>
          <span>Vol</span>
        </div>
        {watchlistRows.map((item) => (
          <div key={item.symbol} className="marketWatchlist__row">
            <strong className="marketWatchlist__symbol">
              {item.symbol}
              <small>{item.metadata}</small>
            </strong>
            <span>{item.last}</span>
            <span className={`marketWatchlist__value marketWatchlist__value--${getChangeTone(item.change)}`}>
              {item.change}
            </span>
            <span className={`marketWatchlist__value marketWatchlist__value--${getChangeTone(item.changePercent)}`}>
              {item.changePercent}
            </span>
            <span>
              {item.volume}
              <small className={`marketWatchlist__status marketWatchlist__status--${getStatusTone(item.status)}`}>
                {item.status}
              </small>
            </span>
          </div>
        ))}
      </div>

    </SectionPanel>
  );
}
