import { createErrorMarketQuote } from "@/lib/fmpQuoteNormalization";
import type { MarketQuote, MarketQuoteStatus, TwelveQuoteRow } from "@/types/marketQuotes";

interface NormalizeTwelveQuoteOptions {
  displaySymbol: string;
  providerSymbol: string;
  label: string;
  sourceLabel: string;
  status?: MarketQuoteStatus;
}

export function parseTwelveQuotePayload(payload: unknown): TwelveQuoteRow | null {
  return payload && typeof payload === "object" ? payload as TwelveQuoteRow : null;
}

function parseFiniteNumber(value: number | string | null | undefined) {
  if (value === null || typeof value === "undefined" || value === "") {
    return null;
  }

  const numericValue = typeof value === "number" ? value : Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function parseTwelveTimestamp(value: number | string | null | undefined) {
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

function getTwelveError(row: TwelveQuoteRow | null) {
  if (!row) {
    return "missing_twelve_quote_row";
  }

  if (row.status === "error" || row.code) {
    return row.message ?? `twelve_request_failed_${row.code ?? "unknown"}`;
  }

  return null;
}

export function createTwelveErrorMarketQuote({
  displaySymbol,
  providerSymbol,
  label,
  sourceLabel,
  error
}: NormalizeTwelveQuoteOptions & { error: string }): MarketQuote {
  return createErrorMarketQuote({
    displaySymbol,
    providerSymbol,
    label,
    sourceLabel,
    provider: "twelve",
    error
  });
}

export function normalizeTwelveQuote(
  row: TwelveQuoteRow | null,
  {
    displaySymbol,
    providerSymbol,
    label,
    sourceLabel,
    status = "live"
  }: NormalizeTwelveQuoteOptions
): MarketQuote {
  const providerError = getTwelveError(row);

  if (providerError) {
    return createTwelveErrorMarketQuote({
      displaySymbol,
      providerSymbol,
      label,
      sourceLabel,
      error: providerError
    });
  }

  const price = parseFiniteNumber(row?.close);

  if (price === null) {
    return createTwelveErrorMarketQuote({
      displaySymbol,
      providerSymbol,
      label,
      sourceLabel,
      error: "missing_twelve_quote_price"
    });
  }

  return {
    displaySymbol,
    providerSymbol: row?.symbol ?? providerSymbol,
    provider: "twelve",
    price,
    change: parseFiniteNumber(row?.change),
    changePercent: parseFiniteNumber(row?.percent_change ?? row?.percentChange),
    volume: parseFiniteNumber(row?.volume),
    asOf: parseTwelveTimestamp(row?.timestamp),
    status,
    label,
    sourceLabel
  };
}
