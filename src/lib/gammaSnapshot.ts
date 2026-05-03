import type { GammaSnapshot, GammaStatus } from "@/types/dailySnapshot";

const GAMMA_CHECK_HOUR_ET = 10;
const GAMMA_CHECK_MINUTE_ET = 5;
const DEFAULT_GAMMA_SOURCE_NAME = "@gexbot15";

interface LegacyGammaLevel {
  label?: unknown;
  price?: unknown;
}

interface LegacyGammaSnapshot {
  regime?: unknown;
  status?: unknown;
  source?: unknown;
  sourceName?: unknown;
  sourceLabel?: unknown;
  majorPositiveGamma?: unknown;
  majorNegativeGamma?: unknown;
  zeroGamma?: unknown;
  spotReferencePrice?: unknown;
  capturedAt?: unknown;
  updatedAt?: unknown;
  notes?: unknown;
  sourceReferenceUrl?: unknown;
  distributionImageUrl?: unknown;
  levels?: unknown;
}

const gammaStatusValues: GammaStatus[] = [
  "pending",
  "not_checked",
  "checked",
  "unavailable",
  "market_closed"
];

function isGammaStatus(value: unknown): value is GammaStatus {
  return typeof value === "string" && gammaStatusValues.includes(value as GammaStatus);
}

function normalizeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function getEtDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minutesAfterMidnight: Number(values.hour) * 60 + Number(values.minute)
  };
}

function isWeekendTradingDate(tradingDate: string) {
  const calendarDate = new Date(`${tradingDate}T12:00:00Z`);
  const day = calendarDate.getUTCDay();

  return day === 0 || day === 6;
}

export function getDefaultGammaStatusForDate(tradingDate: string, now = new Date()): GammaStatus {
  if (isWeekendTradingDate(tradingDate)) {
    return "market_closed";
  }

  const etNow = getEtDateParts(now);
  const checkMinutesAfterMidnight = GAMMA_CHECK_HOUR_ET * 60 + GAMMA_CHECK_MINUTE_ET;

  if (tradingDate > etNow.date) {
    return "pending";
  }

  if (tradingDate < etNow.date) {
    return "not_checked";
  }

  return etNow.minutesAfterMidnight < checkMinutesAfterMidnight ? "pending" : "not_checked";
}

export function createDefaultGammaSnapshotForDate(
  tradingDate: string,
  updatedAt: string,
  now = new Date()
): GammaSnapshot {
  return {
    regime: "transition",
    status: getDefaultGammaStatusForDate(tradingDate, now),
    source: "manual",
    sourceName: DEFAULT_GAMMA_SOURCE_NAME,
    majorPositiveGamma: null,
    majorNegativeGamma: null,
    zeroGamma: null,
    spotReferencePrice: null,
    capturedAt: null,
    updatedAt
  };
}

function getLegacyLevelPrice(levels: LegacyGammaLevel[], label: string) {
  const match = levels.find((level) => level.label === label);
  return normalizeNumber(match?.price);
}

export function normalizeGammaSnapshot(
  gamma: unknown,
  tradingDate: string,
  updatedAt: string
): GammaSnapshot {
  const fallback = createDefaultGammaSnapshotForDate(tradingDate, updatedAt);

  if (!gamma || typeof gamma !== "object") {
    return fallback;
  }

  const candidate = gamma as LegacyGammaSnapshot;
  const legacyLevels = Array.isArray(candidate.levels)
    ? (candidate.levels as LegacyGammaLevel[])
    : [];
  const majorPositiveGamma =
    normalizeNumber(candidate.majorPositiveGamma) ?? getLegacyLevelPrice(legacyLevels, "Major Pos Gamma");
  const majorNegativeGamma =
    normalizeNumber(candidate.majorNegativeGamma) ?? getLegacyLevelPrice(legacyLevels, "Major Neg Gamma");
  const zeroGamma =
    normalizeNumber(candidate.zeroGamma) ?? getLegacyLevelPrice(legacyLevels, "Zero Gamma / Flip");
  const capturedAt = normalizeString(candidate.capturedAt) ?? null;
  const normalizedStatus = isGammaStatus(candidate.status) ? candidate.status : undefined;
  const inferredStatus =
    majorPositiveGamma !== null || majorNegativeGamma !== null || zeroGamma !== null || capturedAt
      ? "checked"
      : fallback.status;

  return {
    regime:
      candidate.regime === "positive gamma" ||
      candidate.regime === "negative gamma" ||
      candidate.regime === "transition"
        ? candidate.regime
        : fallback.regime,
    status: normalizedStatus ?? inferredStatus,
    source:
      candidate.source === "manual" ||
      candidate.source === "mock" ||
      candidate.source === "uploaded_image" ||
      candidate.source === "provider"
        ? candidate.source
        : "manual",
    sourceName:
      normalizeString(candidate.sourceName) ??
      normalizeString(candidate.sourceLabel) ??
      DEFAULT_GAMMA_SOURCE_NAME,
    majorPositiveGamma,
    majorNegativeGamma,
    zeroGamma,
    spotReferencePrice: normalizeOptionalNumber(candidate.spotReferencePrice) ?? null,
    capturedAt,
    updatedAt: normalizeString(candidate.updatedAt) ?? capturedAt ?? updatedAt,
    notes: normalizeString(candidate.notes),
    sourceReferenceUrl: normalizeString(candidate.sourceReferenceUrl),
    distributionImageUrl: normalizeString(candidate.distributionImageUrl)
  };
}
