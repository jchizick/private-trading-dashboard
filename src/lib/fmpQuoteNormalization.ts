import type { FmpQuoteRow, MarketQuote, MarketQuoteStatus } from "@/types/marketQuotes";

interface NormalizeFmpQuoteOptions {
  displaySymbol: string;
  providerSymbol: string;
  label: string;
  sourceLabel: string;
  status?: MarketQuoteStatus;
}

interface UnavailableQuoteOptions {
  displaySymbol: string;
  label: string;
  message: string;
}

export function parseFmpQuotePayload(payload: unknown): FmpQuoteRow | null {
  if (Array.isArray(payload)) {
    const firstRow = payload[0];

    return firstRow && typeof firstRow === "object" ? firstRow as FmpQuoteRow : null;
  }

  return payload && typeof payload === "object" ? payload as FmpQuoteRow : null;
}

function parseFiniteNumber(value: number | string | null | undefined) {
  if (value === null || typeof value === "undefined" || value === "") {
    return null;
  }

  const numericValue = typeof value === "number" ? value : Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function parseFmpTimestamp(value: number | string | null | undefined) {
  const numericTimestamp = parseFiniteNumber(value);

  if (numericTimestamp === null) {
    return null;
  }

  const milliseconds = numericTimestamp > 1_000_000_000_000
    ? numericTimestamp
    : numericTimestamp * 1000;
  const date = new Date(milliseconds);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function createUnavailableMarketQuote({
  displaySymbol,
  label,
  message
}: UnavailableQuoteOptions): MarketQuote {
  return {
    displaySymbol,
    providerSymbol: null,
    provider: "mock",
    price: null,
    change: null,
    changePercent: null,
    volume: null,
    asOf: null,
    status: "unavailable",
    label,
    sourceLabel: "Mock fallback",
    message
  };
}

export function createErrorMarketQuote({
  displaySymbol,
  providerSymbol,
  label,
  sourceLabel,
  error,
  provider = "fmp"
}: NormalizeFmpQuoteOptions & { error: string; provider?: MarketQuote["provider"] }): MarketQuote {
  return {
    displaySymbol,
    providerSymbol,
    provider,
    price: null,
    change: null,
    changePercent: null,
    volume: null,
    asOf: null,
    status: "error",
    label,
    sourceLabel,
    error
  };
}

export function normalizeFmpQuote(
  row: FmpQuoteRow | null,
  {
    displaySymbol,
    providerSymbol,
    label,
    sourceLabel,
    status = "live"
  }: NormalizeFmpQuoteOptions
): MarketQuote {
  if (!row) {
    return createErrorMarketQuote({
      displaySymbol,
      providerSymbol,
      label,
      sourceLabel,
      error: "missing_fmp_quote_row"
    });
  }

  const price = parseFiniteNumber(row.price);

  if (price === null) {
    return createErrorMarketQuote({
      displaySymbol,
      providerSymbol,
      label,
      sourceLabel,
      error: "missing_fmp_quote_price"
    });
  }

  return {
    displaySymbol,
    providerSymbol: row.symbol ?? providerSymbol,
    provider: "fmp",
    price,
    change: parseFiniteNumber(row.change),
    changePercent: parseFiniteNumber(row.changePercentage ?? row.changesPercentage),
    volume: parseFiniteNumber(row.volume),
    asOf: parseFmpTimestamp(row.timestamp),
    status,
    label,
    sourceLabel
  };
}

export function isUsableMarketQuote(quote: MarketQuote) {
  return quote.status !== "error" && quote.price !== null;
}
