import type { FearGreedSnapshot } from "@/types/dashboard";

const FEAR_GREED_CACHE_STORAGE_KEY = "market-command:fear-greed-cache";

const VALID_LABELS = new Set([
  "Extreme Fear",
  "Fear",
  "Neutral",
  "Greed",
  "Extreme Greed"
]);

function canUseLocalStorage() {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isFearGreedSnapshot(value: unknown): value is FearGreedSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as Partial<FearGreedSnapshot>;

  return (
    snapshot.source === "CMC Crypto Fear and Greed Index" &&
    isFiniteNumber(snapshot.value) &&
    typeof snapshot.label === "string" &&
    VALID_LABELS.has(snapshot.label) &&
    isFiniteNumber(snapshot.lastWeek) &&
    isFiniteNumber(snapshot.lastMonth) &&
    isFiniteNumber(snapshot.yearHigh) &&
    isFiniteNumber(snapshot.yearLow) &&
    typeof snapshot.lastUpdatedAt === "string"
  );
}

export function saveFearGreedCache(snapshot: FearGreedSnapshot) {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(FEAR_GREED_CACHE_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Local sentiment cache should never block dashboard rendering.
  }
}

export function loadFearGreedCache() {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const rawSnapshot = window.localStorage.getItem(FEAR_GREED_CACHE_STORAGE_KEY);

    if (!rawSnapshot) {
      return null;
    }

    const parsedSnapshot: unknown = JSON.parse(rawSnapshot);

    return isFearGreedSnapshot(parsedSnapshot) ? parsedSnapshot : null;
  } catch {
    return null;
  }
}

export function clearFearGreedCache() {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(FEAR_GREED_CACHE_STORAGE_KEY);
  } catch {
    // Local sentiment cache should never block dashboard rendering.
  }
}
