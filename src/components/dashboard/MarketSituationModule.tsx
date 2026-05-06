"use client";

import { useEffect, useMemo, useState } from "react";
import { useDailySnapshot } from "@/components/dashboard/DailySnapshotProvider";
import { getSessionTone } from "@/lib/marketStatus";
import { SectionPanel } from "@/components/ui/SectionPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PlaceholderFrame } from "@/components/ui/PlaceholderFrame";
import { MarketOverviewCandlesChart } from "@/components/dashboard/MarketOverviewCandlesChart";
import { formatPrice } from "@/lib/formatters";
import { createMarketCaptureCandidate } from "@/lib/dailyMarketSnapshotCapture";
import {
  isMarketQuotesFetchResult,
  loadMarketQuotesCache,
  saveMarketQuotesCache
} from "@/lib/marketQuoteStorage";
import type { MarketSituation } from "@/types/dashboard";
import type { CapturedMarketQuoteRow, MarketQuoteSourceState } from "@/types/dailySnapshot";
import type { MarketQuote, MarketQuotesFetchResult } from "@/types/marketQuotes";

type BadgeTone = "positive" | "negative" | "neutral" | "warning";

interface MarketSituationModuleProps {
  market: MarketSituation;
}

const marketWatchlist = [
  { symbol: "SPX500", last: "5,148.21", change: "+18.40", changePercent: "+0.36%", volume: "2.1B" },
  { symbol: "XAUUSD", last: "2,331.80", change: "-6.20", changePercent: "-0.27%", volume: "184K" },
  { symbol: "VIX", last: "17.43", change: "+0.44", changePercent: "+2.59%", volume: "0" },
  { symbol: "EURUSD", last: "1.1713", change: "-0.0008", changePercent: "-0.07%", volume: "108K" },
  { symbol: "CADUSD", last: "0.7312", change: "+0.0018", changePercent: "+0.25%", volume: "41K" },
  { symbol: "BTCUSDT", last: "64,820.50", change: "+410.20", changePercent: "+0.64%", volume: "38K" }
] as const;

const externalTools = [
  { label: "MMT Terminal", href: "https://app.mmt.gg/" },
  { label: "TradingView", href: "https://www.tradingview.com/chart/wtsoA1en/?symbol=SP%3ASPX" },
  { label: "Coinalyze", href: "https://coinalyze.net/bitcoin/usd/binance/btcusd_perp/price-chart-live/" },
  { label: "Deribit Options", href: "https://www.deribit.com/statistics/BTC/metrics/options" }
] as const;

function getChangeTone(change: string) {
  return change.startsWith("-") ? "negative" : "positive";
}

function parseFallbackNumber(value: string) {
  const normalizedValue = value.replace(/[%,$,\s]/g, "");
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
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

function getQuoteSourceState(result: MarketQuotesFetchResult | null): MarketQuoteSourceState {
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

function getSourceStateTone(state: MarketQuoteSourceState): BadgeTone {
  if (state === "live" || state === "partial") {
    return "positive";
  }

  if (state === "cached") {
    return "warning";
  }

  return "neutral";
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

export function MarketSituationModule({ market }: MarketSituationModuleProps) {
  const [quotesResult, setQuotesResult] = useState<MarketQuotesFetchResult | null>(null);
  const { publishMarketCaptureCandidate } = useDailySnapshot();

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
  const marketCaptureRows = useMemo<CapturedMarketQuoteRow[]>(() => (
    marketWatchlist.map((item) => {
      const quote = quotesResult?.quotes[item.symbol];

      if (quote) {
        return {
          displaySymbol: item.symbol,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          provider: quote.provider,
          providerSymbol: quote.providerSymbol,
          status: quote.status,
          sourceLabel: quote.sourceLabel,
          asOf: quote.asOf
        };
      }

      return {
        displaySymbol: item.symbol,
        price: parseFallbackNumber(item.last),
        change: parseFallbackNumber(item.change),
        changePercent: parseFallbackNumber(item.changePercent),
        provider: "mock",
        providerSymbol: null,
        status: "mock",
        sourceLabel: "mock",
        asOf: null
      };
    })
  ), [quotesResult]);
  const marketCaptureCandidate = useMemo(
    () => createMarketCaptureCandidate(market, sourceState, marketCaptureRows),
    [market, sourceState, marketCaptureRows]
  );
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
        volume: quote ? formatVolume(quote.volume, item.volume) : item.volume
      };
    })
  ), [quotesResult]);

  useEffect(() => {
    publishMarketCaptureCandidate(marketCaptureCandidate);

    return () => {
      publishMarketCaptureCandidate(null);
    };
  }, [marketCaptureCandidate, publishMarketCaptureCandidate]);

  return (
    <SectionPanel
      title="Market Overview"
      description="Primary market read for risk context."
      action={
        <div className="marketSourceState">
          <StatusBadge tone={getSessionTone(market.sessionStatus)}>{market.sessionStatus}</StatusBadge>
          <StatusBadge tone={getSourceStateTone(sourceState)}>quotes {sourceState}</StatusBadge>
        </div>
      }
      className="sectionPanel--marketAnchor"
    >
      <div className="marketGrid">
        <PlaceholderFrame hideLabel label={`${market.symbol} candlestick chart`} variant="chart">
          <MarketOverviewCandlesChart
            fallback={(
              <>
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
              </>
            )}
          />
        </PlaceholderFrame>
      </div>

      <div className="marketWatchlistDivider" aria-hidden="true">
        <span>WATCHLIST</span>
      </div>

      <table className="marketWatchlist" aria-label="Supporting market watchlist">
        <thead>
          <tr className="marketWatchlist__header">
            <th scope="col">Symbol</th>
            <th scope="col">Last</th>
            <th scope="col">Chg</th>
            <th scope="col">Chg%</th>
            <th scope="col">Vol</th>
          </tr>
        </thead>
        <tbody>
          {watchlistRows.map((item) => (
            <tr key={item.symbol} className="marketWatchlist__row">
              <th scope="row" className="marketWatchlist__symbol">
                {item.symbol}
              </th>
              <td>{item.last}</td>
              <td className={`marketWatchlist__value marketWatchlist__value--${getChangeTone(item.change)}`}>
                {item.change}
              </td>
              <td className={`marketWatchlist__value marketWatchlist__value--${getChangeTone(item.changePercent)}`}>
                {item.changePercent}
              </td>
              <td>
                {item.volume}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <footer className="externalToolsStrip" aria-label="External trading tools">
        <div className="externalToolsStrip__label">External Tools</div>
        <nav className="externalToolsStrip__links" aria-label="External trading tools">
          {externalTools.map((tool) => (
            <a href={tool.href} key={tool.label} aria-label={tool.label} target="_blank" rel="noreferrer noopener">
              <strong>{tool.label}</strong>
            </a>
          ))}
        </nav>
      </footer>

    </SectionPanel>
  );
}
