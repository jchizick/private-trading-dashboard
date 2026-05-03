import { NextResponse } from "next/server";
import {
  createErrorMarketQuote,
  createUnavailableMarketQuote,
  isUsableMarketQuote,
  normalizeFmpQuote,
  parseFmpQuotePayload
} from "@/lib/fmpQuoteNormalization";
import {
  createTwelveErrorMarketQuote,
  normalizeTwelveQuote,
  parseTwelveQuotePayload
} from "@/lib/twelveQuoteNormalization";
import type { MarketQuote, MarketQuotesFetchResult } from "@/types/marketQuotes";

const FMP_QUOTE_ENDPOINT = "https://financialmodelingprep.com/stable/quote";
const TWELVE_QUOTE_ENDPOINT = "https://api.twelvedata.com/quote";
const MARKET_QUOTES_SOURCE = "Financial Modeling Prep + Twelve Data" as const;
const ACTIVE_MARKET_CACHE_TTL_MS = 5 * 60 * 1000;
const OFF_HOURS_CACHE_TTL_MS = 30 * 60 * 1000;

export const dynamic = "force-dynamic";

let cachedResult: MarketQuotesFetchResult | null = null;
let cachedAt = 0;

function createResult({
  ok,
  quotes,
  stale,
  error
}: {
  ok: boolean;
  quotes: Record<string, MarketQuote>;
  stale: boolean;
  error?: string;
}): MarketQuotesFetchResult {
  return {
    ok,
    quotes,
    stale,
    source: MARKET_QUOTES_SOURCE,
    updatedAt: new Date().toISOString(),
    error
  };
}

function getTorontoDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  return {
    weekday: parts.find((part) => part.type === "weekday")?.value ?? "",
    hour: Number(parts.find((part) => part.type === "hour")?.value ?? "0"),
    minute: Number(parts.find((part) => part.type === "minute")?.value ?? "0")
  };
}

function isActiveWeekdayMarketHours(date = new Date()) {
  const { weekday, hour, minute } = getTorontoDateParts(date);

  if (weekday === "Sat" || weekday === "Sun") {
    return false;
  }

  const minutes = hour * 60 + minute;

  return minutes >= 9 * 60 + 30 && minutes <= 16 * 60;
}

function getCacheTtlMs() {
  return isActiveWeekdayMarketHours() ? ACTIVE_MARKET_CACHE_TTL_MS : OFF_HOURS_CACHE_TTL_MS;
}

function getFreshCachedResult() {
  if (!cachedResult || Date.now() - cachedAt > getCacheTtlMs()) {
    return null;
  }

  return {
    ...cachedResult,
    stale: false,
    updatedAt: new Date().toISOString()
  };
}

function getStaticUnavailableQuotes() {
  return {
    WTI: createUnavailableMarketQuote({
      displaySymbol: "WTI",
      label: "WTI",
      message: "Live WTI is unavailable on the current FMP and Twelve Data plans."
    }),
    DXY: createUnavailableMarketQuote({
      displaySymbol: "DXY",
      label: "DXY",
      message: "Live DXY is unavailable on the current FMP and Twelve Data plans."
    })
  };
}

function getAllUnavailableQuotes(message: string) {
  return {
    SPX500: createUnavailableMarketQuote({
      displaySymbol: "SPX500",
      label: "SPX500",
      message
    }),
    XAUUSD: createUnavailableMarketQuote({
      displaySymbol: "XAUUSD",
      label: "XAU/USD",
      message
    }),
    BTCUSDT: createUnavailableMarketQuote({
      displaySymbol: "BTCUSDT",
      label: "BTC/USDT",
      message
    }),
    CADUSD: createUnavailableMarketQuote({
      displaySymbol: "CADUSD",
      label: "CAD/USD",
      message
    }),
    ...getStaticUnavailableQuotes()
  };
}

function createErrorOrStaleResult(error: string) {
  if (cachedResult) {
    return createResult({
      ok: true,
      quotes: Object.fromEntries(
        Object.entries(cachedResult.quotes).map(([symbol, quote]) => [
          symbol,
          quote.status === "live" ? { ...quote, status: "cached" as const } : quote
        ])
      ),
      stale: true,
      error
    });
  }

  return createResult({
    ok: false,
    quotes: getAllUnavailableQuotes("Live market quotes are unavailable."),
    stale: false,
    error
  });
}

async function fetchFmpQuote({
  apiKey,
  displaySymbol,
  providerSymbol,
  label,
  sourceLabel
}: {
  apiKey: string;
  displaySymbol: string;
  providerSymbol: string;
  label: string;
  sourceLabel: string;
}) {
  const url = new URL(FMP_QUOTE_ENDPOINT);
  url.searchParams.set("symbol", providerSymbol);
  url.searchParams.set("apikey", apiKey);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return createErrorMarketQuote({
        displaySymbol,
        providerSymbol,
        label,
        sourceLabel,
        error: response.status === 429
          ? "fmp_rate_limited"
          : `fmp_request_failed_${response.status}`
      });
    }

    return normalizeFmpQuote(parseFmpQuotePayload(await response.json()), {
      displaySymbol,
      providerSymbol,
      label,
      sourceLabel
    });
  } catch {
    return createErrorMarketQuote({
      displaySymbol,
      providerSymbol,
      label,
      sourceLabel,
      error: "fmp_fetch_failed"
    });
  }
}

async function fetchTwelveQuote({
  apiKey,
  displaySymbol,
  providerSymbol,
  label,
  sourceLabel
}: {
  apiKey: string;
  displaySymbol: string;
  providerSymbol: string;
  label: string;
  sourceLabel: string;
}) {
  const url = new URL(TWELVE_QUOTE_ENDPOINT);
  url.searchParams.set("symbol", providerSymbol);
  url.searchParams.set("apikey", apiKey);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });
    const payload = parseTwelveQuotePayload(await response.json());

    if (!response.ok) {
      return createTwelveErrorMarketQuote({
        displaySymbol,
        providerSymbol,
        label,
        sourceLabel,
        error: response.status === 429
          ? "twelve_rate_limited"
          : `twelve_request_failed_${response.status}`
      });
    }

    return normalizeTwelveQuote(payload, {
      displaySymbol,
      providerSymbol,
      label,
      sourceLabel
    });
  } catch {
    return createTwelveErrorMarketQuote({
      displaySymbol,
      providerSymbol,
      label,
      sourceLabel,
      error: "twelve_fetch_failed"
    });
  }
}

function createMissingProviderQuote({
  displaySymbol,
  providerSymbol,
  label,
  sourceLabel,
  providerName
}: {
  displaySymbol: string;
  providerSymbol: string;
  label: string;
  sourceLabel: string;
  providerName: "fmp" | "twelve";
}) {
  const error = providerName === "fmp" ? "missing_fmp_api_key" : "missing_twelve_data_api_key";

  return providerName === "fmp"
    ? createErrorMarketQuote({
      displaySymbol,
      providerSymbol,
      label,
      sourceLabel,
      error
    })
    : createTwelveErrorMarketQuote({
      displaySymbol,
      providerSymbol,
      label,
      sourceLabel,
      error
    });
}

async function getFmpQuoteOrMissing({
  apiKey,
  displaySymbol,
  providerSymbol,
  label,
  sourceLabel
}: {
  apiKey: string | undefined;
  displaySymbol: string;
  providerSymbol: string;
  label: string;
  sourceLabel: string;
}) {
  return apiKey
    ? fetchFmpQuote({ apiKey, displaySymbol, providerSymbol, label, sourceLabel })
    : createMissingProviderQuote({
      displaySymbol,
      providerSymbol,
      label,
      sourceLabel,
      providerName: "fmp"
    });
}

async function getTwelveQuoteOrMissing({
  apiKey,
  displaySymbol,
  providerSymbol,
  label,
  sourceLabel
}: {
  apiKey: string | undefined;
  displaySymbol: string;
  providerSymbol: string;
  label: string;
  sourceLabel: string;
}) {
  return apiKey
    ? fetchTwelveQuote({ apiKey, displaySymbol, providerSymbol, label, sourceLabel })
    : createMissingProviderQuote({
      displaySymbol,
      providerSymbol,
      label,
      sourceLabel,
      providerName: "twelve"
    });
}

async function fetchSpxQuote(fmpApiKey: string | undefined) {
  const spxPrimary = await getFmpQuoteOrMissing({
    apiKey: fmpApiKey,
    displaySymbol: "SPX500",
    providerSymbol: "ESUSD",
    label: "SPX500",
    sourceLabel: "E-Mini S&P 500 proxy"
  });

  return isUsableMarketQuote(spxPrimary)
    ? spxPrimary
    : getFmpQuoteOrMissing({
      apiKey: fmpApiKey,
      displaySymbol: "SPX500",
      providerSymbol: "^GSPC",
      label: "SPX500",
      sourceLabel: "S&P 500 index fallback"
    });
}

async function fetchGoldQuote({
  fmpApiKey,
  twelveApiKey
}: {
  fmpApiKey: string | undefined;
  twelveApiKey: string | undefined;
}) {
  const goldPrimary = await getTwelveQuoteOrMissing({
    apiKey: twelveApiKey,
    displaySymbol: "XAUUSD",
    providerSymbol: "XAU/USD",
    label: "XAU/USD",
    sourceLabel: "Gold spot"
  });

  return isUsableMarketQuote(goldPrimary)
    ? goldPrimary
    : getFmpQuoteOrMissing({
      apiKey: fmpApiKey,
      displaySymbol: "XAUUSD",
      providerSymbol: "GCUSD",
      label: "XAU/USD",
      sourceLabel: "Gold futures fallback"
    });
}

async function fetchBtcQuote({
  fmpApiKey,
  twelveApiKey
}: {
  fmpApiKey: string | undefined;
  twelveApiKey: string | undefined;
}) {
  const btcPrimary = await getFmpQuoteOrMissing({
    apiKey: fmpApiKey,
    displaySymbol: "BTCUSDT",
    providerSymbol: "BTCUSD",
    label: "BTC/USDT",
    sourceLabel: "BTC/USD proxy"
  });

  return isUsableMarketQuote(btcPrimary)
    ? btcPrimary
    : getTwelveQuoteOrMissing({
      apiKey: twelveApiKey,
      displaySymbol: "BTCUSDT",
      providerSymbol: "BTC/USD",
      label: "BTC/USDT",
      sourceLabel: "BTC/USD proxy"
    });
}

async function fetchCadQuote(twelveApiKey: string | undefined) {
  const cadQuote = await getTwelveQuoteOrMissing({
    apiKey: twelveApiKey,
    displaySymbol: "CADUSD",
    providerSymbol: "CAD/USD",
    label: "CAD/USD",
    sourceLabel: "CAD/USD forex"
  });

  return isUsableMarketQuote(cadQuote)
    ? cadQuote
    : createUnavailableMarketQuote({
      displaySymbol: "CADUSD",
      label: "CAD/USD",
      message: "Live CAD/USD is unavailable without a working Twelve Data quote."
    });
}

async function fetchLiveQuotes({
  fmpApiKey,
  twelveApiKey
}: {
  fmpApiKey: string | undefined;
  twelveApiKey: string | undefined;
}) {
  const [spxQuote, goldQuote, btcQuote, cadQuote] = await Promise.all([
    fetchSpxQuote(fmpApiKey),
    fetchGoldQuote({ fmpApiKey, twelveApiKey }),
    fetchBtcQuote({ fmpApiKey, twelveApiKey }),
    fetchCadQuote(twelveApiKey)
  ]);

  return {
    SPX500: spxQuote,
    XAUUSD: goldQuote,
    BTCUSDT: btcQuote,
    CADUSD: cadQuote,
    ...getStaticUnavailableQuotes()
  };
}

function hasAnyLiveQuote(quotes: Record<string, MarketQuote>) {
  return Object.values(quotes).some((quote) => quote.status === "live" && quote.price !== null);
}

function hasAnyErrorQuote(quotes: Record<string, MarketQuote>) {
  return Object.values(quotes).some((quote) => quote.status === "error");
}

function getErrorStatus(error: string | undefined) {
  if (
    error === "missing_fmp_api_key" ||
    error === "missing_twelve_data_api_key" ||
    error === "missing_market_quote_api_keys"
  ) {
    return 503;
  }

  if (error === "fmp_rate_limited" || error === "twelve_rate_limited") {
    return 429;
  }

  return 502;
}

export async function GET() {
  const cached = getFreshCachedResult();

  if (cached) {
    return NextResponse.json(cached);
  }

  const fmpApiKey = process.env.FMP_API_KEY?.trim();
  const twelveApiKey = process.env.TWELVE_DATA_API_KEY?.trim();

  if (!fmpApiKey && !twelveApiKey) {
    const result = createErrorOrStaleResult("missing_market_quote_api_keys");

    return NextResponse.json(result, {
      status: result.ok ? 200 : getErrorStatus(result.error)
    });
  }

  const quotes = await fetchLiveQuotes({ fmpApiKey, twelveApiKey });
  const ok = hasAnyLiveQuote(quotes);
  const firstError = Object.values(quotes).find((quote) => quote.status === "error")?.error;

  if (!ok) {
    const result = createErrorOrStaleResult(firstError ?? "market_quotes_unavailable");

    return NextResponse.json(result, {
      status: result.ok ? 200 : getErrorStatus(result.error)
    });
  }

  const result = createResult({
    ok: true,
    quotes,
    stale: false,
    error: hasAnyErrorQuote(quotes) ? "partial_market_quote_failure" : undefined
  });

  cachedResult = result;
  cachedAt = Date.now();

  return NextResponse.json(result);
}
