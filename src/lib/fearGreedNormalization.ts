import type { FearGreedSnapshot } from "@/types/dashboard";
import type {
  FearGreedApiResponse,
  FearGreedClassification,
  FearGreedReading
} from "@/types/fearGreed";

export const FEAR_GREED_SOURCE = "CMC Crypto Fear and Greed Index" as const;

const DAY_MS = 24 * 60 * 60 * 1000;

function clampValue(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function deriveClassification(value: number): FearGreedClassification {
  if (value <= 24) {
    return "Extreme Fear";
  }

  if (value <= 44) {
    return "Fear";
  }

  if (value <= 54) {
    return "Neutral";
  }

  if (value <= 74) {
    return "Greed";
  }

  return "Extreme Greed";
}

function normalizeClassification(value: string | undefined, fallbackValue: number) {
  const normalizedValue = value?.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");

  if (normalizedValue === "extreme fear") {
    return "Extreme Fear";
  }

  if (normalizedValue === "fear") {
    return "Fear";
  }

  if (normalizedValue === "neutral") {
    return "Neutral";
  }

  if (normalizedValue === "greed") {
    return "Greed";
  }

  if (normalizedValue === "extreme greed") {
    return "Extreme Greed";
  }

  return deriveClassification(fallbackValue);
}

function parseTimestamp(value: string | number | undefined) {
  if (typeof value === "undefined" || value === "") {
    return null;
  }

  const numericTimestamp = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericTimestamp)) {
    return null;
  }

  const timestampMs = numericTimestamp < 10_000_000_000 ? numericTimestamp * 1000 : numericTimestamp;
  const date = new Date(timestampMs);

  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function parseValue(value: string | number | undefined) {
  if (typeof value === "undefined" || value === "") {
    return null;
  }

  const numericValue = typeof value === "number" ? value : Number(value);

  return Number.isFinite(numericValue) ? clampValue(numericValue) : null;
}

function getReadingTime(reading: FearGreedReading) {
  return new Date(reading.timestamp).getTime();
}

function findNearestReading(readings: FearGreedReading[], targetTime: number) {
  return readings.reduce((nearest, reading) => {
    const nearestDistance = Math.abs(getReadingTime(nearest) - targetTime);
    const readingDistance = Math.abs(getReadingTime(reading) - targetTime);

    return readingDistance < nearestDistance ? reading : nearest;
  }, readings[0]);
}

export function normalizeFearGreedReadings(response: FearGreedApiResponse): FearGreedReading[] {
  if (!Array.isArray(response.data)) {
    return [];
  }

  return response.data
    .map((item) => {
      const timestamp = parseTimestamp(item.timestamp);
      const value = parseValue(item.value);

      if (!timestamp || value === null) {
        return null;
      }

      return {
        timestamp,
        value,
        valueClassification: normalizeClassification(item.value_classification, value),
        source: FEAR_GREED_SOURCE,
        updatedAt: timestamp
      };
    })
    .filter((reading): reading is FearGreedReading => Boolean(reading))
    .sort((a, b) => {
      const timeDelta = getReadingTime(b) - getReadingTime(a);

      return timeDelta === 0 ? b.value - a.value : timeDelta;
    });
}

export function toFearGreedSnapshot(readings: FearGreedReading[]): FearGreedSnapshot | null {
  if (readings.length === 0) {
    return null;
  }

  const current = readings[0];
  const currentTime = getReadingTime(current);
  const lastWeek = findNearestReading(readings, currentTime - 7 * DAY_MS);
  const lastMonth = findNearestReading(readings, currentTime - 30 * DAY_MS);
  const values = readings.map((reading) => reading.value);

  return {
    source: FEAR_GREED_SOURCE,
    value: current.value,
    label: current.valueClassification,
    lastWeek: lastWeek.value,
    lastMonth: lastMonth.value,
    yearHigh: Math.max(...values),
    yearLow: Math.min(...values),
    lastUpdatedAt: current.updatedAt
  };
}

export function normalizeFearGreedSnapshot(response: FearGreedApiResponse) {
  return toFearGreedSnapshot(normalizeFearGreedReadings(response));
}
