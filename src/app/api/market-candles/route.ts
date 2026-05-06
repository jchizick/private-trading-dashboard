import { NextResponse } from "next/server";
import { getYahooChartError, normalizeYahooCandles } from "@/lib/yahooCandleNormalization";
import type {
  MarketCandle,
  MarketCandleDisplaySource,
  MarketCandleDisplaySymbol,
  MarketCandleInterval,
  MarketCandleProviderSymbol,
  MarketCandlesFetchResult
} from "@/types/marketCandles";

const YAHOO_CHART_ENDPOINT = "https://query1.finance.yahoo.com/v8/finance/chart";
const MARKET_CANDLES_SOURCE = "Yahoo Finance" as const;
const DISPLAY_SYMBOL = "SPX500" as const;
const DEFAULT_DISPLAY_SOURCE: MarketCandleDisplaySource = "index";
const PROXY_PROVIDER_SYMBOL = "SPY" as const;
const DEFAULT_INTERVAL: MarketCandleInterval = "30m";
const DEFAULT_RANGE = "5d";

const marketCandleSourceConfig = {
  index: {
    providerSymbol: "^GSPC",
    sourceLabel: "S&P 500 Index",
    sessionLabel: "Regular session"
  },
  futures: {
    providerSymbol: "ES=F",
    sourceLabel: "E-Mini S&P 500 Futures",
    sessionLabel: "CME delayed / extended hours"
  }
} satisfies Record<MarketCandleDisplaySource, {
  providerSymbol: MarketCandleProviderSymbol;
  sourceLabel: string;
  sessionLabel: string;
}>;

export const dynamic = "force-dynamic";

function createResult({
  ok,
  displaySource,
  providerSymbol,
  sourceLabel,
  sessionLabel,
  range,
  candles,
  stale,
  isProxy,
  proxyFor,
  error
}: {
  ok: boolean;
  displaySource: MarketCandleDisplaySource;
  providerSymbol: MarketCandleProviderSymbol | null;
  sourceLabel: string;
  sessionLabel: string;
  range: string;
  candles: MarketCandle[];
  stale: boolean;
  isProxy: boolean;
  proxyFor?: "^GSPC";
  error?: string;
}): MarketCandlesFetchResult {
  return {
    ok,
    displaySymbol: DISPLAY_SYMBOL,
    requestedSymbol: DISPLAY_SYMBOL,
    displaySource,
    providerSymbol,
    sourceLabel,
    sessionLabel,
    source: MARKET_CANDLES_SOURCE,
    interval: DEFAULT_INTERVAL,
    range,
    candles,
    stale,
    updatedAt: new Date().toISOString(),
    isProxy,
    proxyFor,
    error
  };
}

function isSupportedDisplaySymbol(symbol: string | null): symbol is MarketCandleDisplaySymbol {
  return symbol === null || symbol === DISPLAY_SYMBOL;
}

function parseDisplaySource(source: string | null) {
  if (source === null || source === "") {
    return DEFAULT_DISPLAY_SOURCE;
  }

  return source === "index" || source === "futures" ? source : null;
}

function isSpyProxyEnabled() {
  return process.env.MARKET_CANDLES_ENABLE_SPY_PROXY?.trim().toLowerCase() === "true";
}

function createYahooChartUrl({
  providerSymbol,
  range
}: {
  providerSymbol: MarketCandleProviderSymbol;
  range: string;
}) {
  const url = new URL(`${YAHOO_CHART_ENDPOINT}/${encodeURIComponent(providerSymbol)}`);

  url.searchParams.set("interval", DEFAULT_INTERVAL);
  url.searchParams.set("range", range);

  return url;
}

async function fetchYahooCandles({
  providerSymbol,
  range,
  isProxy
}: {
  providerSymbol: MarketCandleProviderSymbol;
  range: string;
  isProxy: boolean;
}) {
  const url = createYahooChartUrl({ providerSymbol, range });

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });
    const payload: unknown = await response.json();
    const providerError = getYahooChartError(payload);

    if (!response.ok) {
      return {
        ok: false,
        candles: [],
        error: response.status === 429
          ? "yahoo_chart_rate_limited"
          : `yahoo_chart_request_failed_${response.status}`
      };
    }

    if (providerError) {
      return {
        ok: false,
        candles: [],
        error: `yahoo_chart_provider_error_${providerError}`
      };
    }

    const candles = normalizeYahooCandles(payload, {
      symbol: providerSymbol,
      isProxy
    });

    return candles.length > 0
      ? { ok: true, candles }
      : { ok: false, candles: [], error: "yahoo_chart_empty_candles" };
  } catch {
    return {
      ok: false,
      candles: [],
      error: "yahoo_chart_fetch_failed"
    };
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestedSymbol = requestUrl.searchParams.get("symbol");
  const displaySource = parseDisplaySource(requestUrl.searchParams.get("source"));
  const range = DEFAULT_RANGE;

  if (!isSupportedDisplaySymbol(requestedSymbol)) {
    return NextResponse.json(
      createResult({
        ok: false,
        displaySource: DEFAULT_DISPLAY_SOURCE,
        providerSymbol: null,
        sourceLabel: marketCandleSourceConfig.index.sourceLabel,
        sessionLabel: marketCandleSourceConfig.index.sessionLabel,
        range,
        candles: [],
        stale: false,
        isProxy: false,
        error: "unsupported_market_candle_symbol"
      }),
      { status: 400 }
    );
  }

  if (!displaySource) {
    return NextResponse.json(
      createResult({
        ok: false,
        displaySource: DEFAULT_DISPLAY_SOURCE,
        providerSymbol: null,
        sourceLabel: marketCandleSourceConfig.index.sourceLabel,
        sessionLabel: marketCandleSourceConfig.index.sessionLabel,
        range,
        candles: [],
        stale: false,
        isProxy: false,
        error: "unsupported_market_candle_source"
      }),
      { status: 400 }
    );
  }

  const sourceConfig = marketCandleSourceConfig[displaySource];
  const primaryResult = await fetchYahooCandles({
    providerSymbol: sourceConfig.providerSymbol,
    range,
    isProxy: false
  });

  if (primaryResult.ok) {
    return NextResponse.json(createResult({
      ok: true,
      displaySource,
      providerSymbol: sourceConfig.providerSymbol,
      sourceLabel: sourceConfig.sourceLabel,
      sessionLabel: sourceConfig.sessionLabel,
      range,
      candles: primaryResult.candles,
      stale: false,
      isProxy: false
    }));
  }

  if (displaySource === "index" && isSpyProxyEnabled()) {
    const proxyResult = await fetchYahooCandles({
      providerSymbol: PROXY_PROVIDER_SYMBOL,
      range,
      isProxy: true
    });

    if (proxyResult.ok) {
      return NextResponse.json(createResult({
        ok: true,
        displaySource,
        providerSymbol: PROXY_PROVIDER_SYMBOL,
        sourceLabel: "SPY ETF proxy",
        sessionLabel: sourceConfig.sessionLabel,
        range,
        candles: proxyResult.candles,
        stale: false,
        isProxy: true,
        proxyFor: "^GSPC"
      }));
    }

    return NextResponse.json(
      createResult({
        ok: false,
        displaySource,
        providerSymbol: null,
        sourceLabel: sourceConfig.sourceLabel,
        sessionLabel: sourceConfig.sessionLabel,
        range,
        candles: [],
        stale: false,
        isProxy: false,
        error: proxyResult.error ?? primaryResult.error ?? "yahoo_chart_unavailable"
      }),
      { status: 502 }
    );
  }

  return NextResponse.json(
    createResult({
      ok: false,
      displaySource,
      providerSymbol: null,
      sourceLabel: sourceConfig.sourceLabel,
      sessionLabel: sourceConfig.sessionLabel,
      range,
      candles: [],
      stale: false,
      isProxy: false,
      error: primaryResult.error ?? "yahoo_chart_unavailable"
    }),
    { status: 502 }
  );
}
