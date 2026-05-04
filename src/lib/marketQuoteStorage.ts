import type { MarketQuote, MarketQuoteStatus, MarketQuotesFetchResult } from "@/types/marketQuotes";

const MARKET_QUOTES_CACHE_STORAGE_KEY = "market-command:market-quotes-cache";
const VALID_STATUSES = new Set<MarketQuoteStatus>([
  "live",
  "cached",
  "mock",
  "unavailable",
  "error"
]);

function canUseLocalStorage() {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isMarketQuote(value: unknown): value is MarketQuote {
  if (!value || typeof value !== "object") {
    return false;
  }

  const quote = value as Partial<MarketQuote>;

  return (
    typeof quote.displaySymbol === "string" &&
    isNullableString(quote.providerSymbol) &&
    (quote.provider === "fmp" || quote.provider === "twelve" || quote.provider === "mock") &&
    isNullableNumber(quote.price) &&
    isNullableNumber(quote.change) &&
    isNullableNumber(quote.changePercent) &&
    isNullableNumber(quote.volume) &&
    isNullableString(quote.asOf) &&
    typeof quote.status === "string" &&
    VALID_STATUSES.has(quote.status as MarketQuoteStatus) &&
    typeof quote.label === "string" &&
    typeof quote.sourceLabel === "string"
  );
}

export function isMarketQuotesFetchResult(value: unknown): value is MarketQuotesFetchResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const result = value as Partial<MarketQuotesFetchResult>;

  return (
    typeof result.ok === "boolean" &&
    !!result.quotes &&
    typeof result.quotes === "object" &&
    !Array.isArray(result.quotes) &&
    typeof result.stale === "boolean" &&
    (result.source === "Financial Modeling Prep" || result.source === "Financial Modeling Prep + Twelve Data") &&
    typeof result.updatedAt === "string" &&
    Object.values(result.quotes).every(isMarketQuote)
  );
}

export function saveMarketQuotesCache(result: MarketQuotesFetchResult) {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(MARKET_QUOTES_CACHE_STORAGE_KEY, JSON.stringify(result));
  } catch {
    // Local market quote cache should never block dashboard rendering.
  }
}

export function loadMarketQuotesCache() {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const rawResult = window.localStorage.getItem(MARKET_QUOTES_CACHE_STORAGE_KEY);

    if (!rawResult) {
      return null;
    }

    const parsedResult: unknown = JSON.parse(rawResult);

    return isMarketQuotesFetchResult(parsedResult) ? parsedResult : null;
  } catch {
    return null;
  }
}

export function clearMarketQuotesCache() {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(MARKET_QUOTES_CACHE_STORAGE_KEY);
  } catch {
    // Local market quote cache should never block dashboard rendering.
  }
}
