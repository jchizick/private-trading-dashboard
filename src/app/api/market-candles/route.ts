import { NextResponse } from "next/server";
import { getYahooChartError, normalizeYahooCandles } from "@/lib/yahooCandleNormalization";
import type {
  MarketCandle,
  MarketCandleDisplaySymbol,
  MarketCandleInterval,
  MarketCandleProviderSymbol,
  MarketCandlesFetchResult
} from "@/types/marketCandles";

const YAHOO_CHART_ENDPOINT = "https://query1.finance.yahoo.com/v8/finance/chart";
const MARKET_CANDLES_SOURCE = "Yahoo Finance" as const;
const DISPLAY_SYMBOL = "SPX500" as const;
const PRIMARY_PROVIDER_SYMBOL = "^GSPC" as const;
const PROXY_PROVIDER_SYMBOL = "SPY" as const;
const DEFAULT_INTERVAL: MarketCandleInterval = "30m";
const DEFAULT_RANGE = "5d";

export const dynamic = "force-dynamic";

function createResult({
  ok,
  providerSymbol,
  range,
  candles,
  stale,
  isProxy,
  proxyFor,
  error
}: {
  ok: boolean;
  providerSymbol: MarketCandleProviderSymbol | null;
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
    providerSymbol,
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
  const range = DEFAULT_RANGE;

  if (!isSupportedDisplaySymbol(requestedSymbol)) {
    return NextResponse.json(
      createResult({
        ok: false,
        providerSymbol: null,
        range,
        candles: [],
        stale: false,
        isProxy: false,
        error: "unsupported_market_candle_symbol"
      }),
      { status: 400 }
    );
  }

  const primaryResult = await fetchYahooCandles({
    providerSymbol: PRIMARY_PROVIDER_SYMBOL,
    range,
    isProxy: false
  });

  if (primaryResult.ok) {
    return NextResponse.json(createResult({
      ok: true,
      providerSymbol: PRIMARY_PROVIDER_SYMBOL,
      range,
      candles: primaryResult.candles,
      stale: false,
      isProxy: false
    }));
  }

  if (isSpyProxyEnabled()) {
    const proxyResult = await fetchYahooCandles({
      providerSymbol: PROXY_PROVIDER_SYMBOL,
      range,
      isProxy: true
    });

    if (proxyResult.ok) {
      return NextResponse.json(createResult({
        ok: true,
        providerSymbol: PROXY_PROVIDER_SYMBOL,
        range,
        candles: proxyResult.candles,
        stale: false,
        isProxy: true,
        proxyFor: PRIMARY_PROVIDER_SYMBOL
      }));
    }

    return NextResponse.json(
      createResult({
        ok: false,
        providerSymbol: null,
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
      providerSymbol: null,
      range,
      candles: [],
      stale: false,
      isProxy: false,
      error: primaryResult.error ?? "yahoo_chart_unavailable"
    }),
    { status: 502 }
  );
}
