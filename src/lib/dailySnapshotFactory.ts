import { mockDailyDashboardSnapshot } from "@/data/mockDailySnapshot";
import { createDefaultGammaSnapshotForDate, normalizeGammaSnapshot } from "@/lib/gammaSnapshot";
import { sortDailyMarketCaptureRows } from "@/lib/dailyMarketSnapshotCapture";
import type {
  CapturedMarketQuoteRow,
  CurrentPositionSnapshot,
  DailyDashboardSnapshot,
  FearGreedLabel,
  FearGreedSnapshot,
  MarketQuoteSourceState,
  SpxSnapshot,
  SynthesisNotes
} from "@/types/dailySnapshot";
import type { MarketQuoteProvider, MarketQuoteStatus } from "@/types/marketQuotes";

export const DEFAULT_DAILY_SNAPSHOT_TRADING_DATE = mockDailyDashboardSnapshot.tradingDate;

export function cloneSynthesisNotes(synthesis: SynthesisNotes): SynthesisNotes {
  return { ...synthesis, marketBias: normalizeMarketBias(synthesis.marketBias ?? synthesis.primaryBias) };
}

export function cloneDailySnapshot(snapshot: DailyDashboardSnapshot): DailyDashboardSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as DailyDashboardSnapshot;
}

function normalizeNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function normalizeMarketBias(value: unknown): string {
  if (typeof value !== "string") {
    return "Neutral";
  }

  const trimmedValue = value.trim();
  const legacyMap: Record<string, string> = {
    bullish: "Bullish",
    bearish: "Bearish",
    neutral: "Neutral",
    "long selective": "Long Selective",
    "short selective": "Short Selective",
    "range / chop": "Range / Chop",
    "range/chop": "Range / Chop",
    chop: "Range / Chop",
    "risk off": "Risk Off",
    "risk-off": "Risk Off",
    "no trade": "Risk Off"
  };

  return legacyMap[trimmedValue.toLowerCase()] ?? trimmedValue;
}

function normalizeMarketQuoteProvider(value: unknown): MarketQuoteProvider {
  return value === "fmp" || value === "twelve" || value === "mock" ? value : "mock";
}

function normalizeMarketQuoteStatus(value: unknown): MarketQuoteStatus {
  if (
    value === "live" ||
    value === "cached" ||
    value === "mock" ||
    value === "unavailable" ||
    value === "error"
  ) {
    return value;
  }

  return "mock";
}

function normalizeMarketQuoteSourceState(value: unknown): MarketQuoteSourceState {
  if (value === "live" || value === "cached" || value === "partial" || value === "mock") {
    return value;
  }

  return "mock";
}

function normalizeFearGreedLabel(value: unknown): FearGreedLabel {
  if (
    value === "Extreme Fear" ||
    value === "Fear" ||
    value === "Neutral" ||
    value === "Greed" ||
    value === "Extreme Greed" ||
    value === "Unknown"
  ) {
    return value;
  }

  return "Unknown";
}

function normalizeCapturedMarketQuoteRow(value: unknown): CapturedMarketQuoteRow | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Partial<CapturedMarketQuoteRow> & {
    symbol?: unknown;
    last?: unknown;
  };
  const displaySymbol = normalizeString(row.displaySymbol) ?? normalizeString(row.symbol);

  if (!displaySymbol) {
    return null;
  }

  return {
    displaySymbol,
    price: normalizeNullableNumber(row.price ?? row.last),
    change: normalizeNullableNumber(row.change),
    changePercent: normalizeNullableNumber(row.changePercent),
    provider: normalizeMarketQuoteProvider(row.provider),
    providerSymbol: normalizeString(row.providerSymbol),
    status: normalizeMarketQuoteStatus(row.status),
    sourceLabel: normalizeString(row.sourceLabel) ?? "mock",
    asOf: normalizeString(row.asOf)
  };
}

function normalizeSpxSnapshot(spx: DailyDashboardSnapshot["spx"], updatedAt: string): SpxSnapshot {
  const candidate = (spx ?? {}) as Partial<SpxSnapshot> & {
    watchlist?: unknown;
    source?: unknown;
  };
  const watchlist = Array.isArray(candidate.watchlist)
    ? sortDailyMarketCaptureRows(
        candidate.watchlist
          .map(normalizeCapturedMarketQuoteRow)
          .filter((row): row is CapturedMarketQuoteRow => row !== null)
      )
    : [];
  const primaryQuote =
    normalizeCapturedMarketQuoteRow(candidate.primaryQuote) ??
    watchlist.find((row) => row.displaySymbol === "SPX500") ??
    null;

  return {
    ...spx,
    symbol: "SPX",
    latestClose: normalizeNullableNumber(candidate.latestClose ?? primaryQuote?.price),
    dailyTrend: candidate.dailyTrend ?? "neutral",
    weeklyTrend: candidate.weeklyTrend ?? "neutral",
    marketStatus: candidate.marketStatus ?? "sideways consolidation",
    keyLevels: Array.isArray(candidate.keyLevels) ? candidate.keyLevels : [],
    primaryQuote,
    quoteSourceState: normalizeMarketQuoteSourceState(candidate.quoteSourceState),
    watchlist,
    source: candidate.source === "manual" || candidate.source === "market_data" ? candidate.source : "mock",
    capturedAt: normalizeString(candidate.capturedAt) ?? updatedAt
  };
}

function normalizeFearGreedSnapshot(
  fearGreed: DailyDashboardSnapshot["fearGreed"],
  updatedAt: string
): FearGreedSnapshot {
  const candidate = (fearGreed ?? {}) as Partial<FearGreedSnapshot>;

  return {
    source: normalizeString(candidate.source) ?? "CMC Crypto Fear and Greed Index",
    value: normalizeNullableNumber(candidate.value),
    label: normalizeFearGreedLabel(candidate.label),
    lastWeek: normalizeNullableNumber(candidate.lastWeek),
    lastMonth: normalizeNullableNumber(candidate.lastMonth),
    yearHigh: normalizeNullableNumber(candidate.yearHigh),
    yearLow: normalizeNullableNumber(candidate.yearLow),
    updatedAt: normalizeString(candidate.updatedAt),
    capturedAt: normalizeString(candidate.capturedAt) ?? updatedAt
  };
}

function normalizeCurrentPosition(value: unknown, updatedAt: string): CurrentPositionSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<CurrentPositionSnapshot>;
  const symbol = normalizeString(candidate.symbol)?.trim().toUpperCase() ?? "";
  const leverage = normalizeString(candidate.leverage)?.trim() ?? "";
  const note = normalizeString(candidate.note)?.trim();
  const side =
    candidate.side === "Long" || candidate.side === "Short" || candidate.side === "Flat"
      ? candidate.side
      : "Flat";
  const pnlPercent = normalizeNullableNumber(candidate.pnlPercent);
  const hasPosition = symbol || leverage || pnlPercent !== null || side !== "Flat" || note;

  if (!hasPosition) {
    return null;
  }

  return {
    symbol,
    side,
    leverage,
    pnlPercent,
    note: note || undefined,
    updatedAt: normalizeString(candidate.updatedAt) ?? updatedAt
  };
}

function normalizeSynthesisNotes(synthesis: DailyDashboardSnapshot["synthesis"], updatedAt: string): SynthesisNotes {
  const candidate = (synthesis ?? {}) as Partial<SynthesisNotes>;

  return {
    ...candidate,
    marketBias: normalizeMarketBias(candidate.marketBias ?? candidate.primaryBias),
    whatMattersToday: normalizeString(candidate.whatMattersToday) ?? "",
    conditionsToWatch: normalizeString(candidate.conditionsToWatch) ?? "",
    invalidation: normalizeString(candidate.invalidation) ?? "",
    operatorNote: normalizeString(candidate.operatorNote) ?? "",
    updatedAt: normalizeString(candidate.updatedAt) ?? updatedAt
  };
}

export function normalizeDailyDashboardSnapshot(snapshot: DailyDashboardSnapshot): DailyDashboardSnapshot {
  return {
    ...snapshot,
    spx: normalizeSpxSnapshot(snapshot.spx, snapshot.updatedAt),
    gamma: normalizeGammaSnapshot(snapshot.gamma, snapshot.tradingDate, snapshot.updatedAt),
    fearGreed: normalizeFearGreedSnapshot(snapshot.fearGreed, snapshot.updatedAt),
    synthesis: normalizeSynthesisNotes(snapshot.synthesis, snapshot.updatedAt),
    currentPosition: normalizeCurrentPosition(snapshot.currentPosition, snapshot.updatedAt)
  };
}

export function createDailySnapshotForDate(tradingDate: string): DailyDashboardSnapshot {
  const now = new Date().toISOString();
  const snapshot = normalizeDailyDashboardSnapshot(cloneDailySnapshot(mockDailyDashboardSnapshot));

  return {
    ...snapshot,
    id: `daily-snapshot-${tradingDate}`,
    tradingDate,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    sessionState: {
      ...snapshot.sessionState,
      lastUpdatedAt: now
    },
    synthesis: {
      ...snapshot.synthesis,
      updatedAt: now
    },
    checklist: snapshot.checklist.map((item) => ({
      ...item,
      updatedAt: now
    })),
    gamma: createDefaultGammaSnapshotForDate(tradingDate, now),
    currentPosition: null,
    performanceReview: {
      ...snapshot.performanceReview,
      asOfDate: tradingDate
    }
  };
}
