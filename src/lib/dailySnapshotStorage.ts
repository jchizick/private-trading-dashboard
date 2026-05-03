import { normalizeDailyDashboardSnapshot } from "@/lib/dailySnapshotFactory";
import type { DailyDashboardSnapshot } from "@/types/dailySnapshot";

const DAILY_SNAPSHOT_STORAGE_PREFIX = "market-command:daily-snapshot";
const DAILY_SNAPSHOT_STORAGE_KEY_PREFIX = `${DAILY_SNAPSHOT_STORAGE_PREFIX}:`;
const TRADING_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getDailySnapshotStorageKey(tradingDate: string) {
  return `${DAILY_SNAPSHOT_STORAGE_KEY_PREFIX}${tradingDate}`;
}

export function getLocalTradingDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function canUseLocalStorage() {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function isDailyDashboardSnapshot(value: unknown): value is DailyDashboardSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as Partial<DailyDashboardSnapshot>;

  return (
    typeof snapshot.id === "string" &&
    typeof snapshot.tradingDate === "string" &&
    typeof snapshot.updatedAt === "string" &&
    !!snapshot.synthesis &&
    Array.isArray(snapshot.checklist)
  );
}

export function loadDailyDashboardSnapshot(tradingDate: string) {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const rawSnapshot = window.localStorage.getItem(getDailySnapshotStorageKey(tradingDate));

    if (!rawSnapshot) {
      return null;
    }

    const parsedSnapshot: unknown = JSON.parse(rawSnapshot);

    if (!isDailyDashboardSnapshot(parsedSnapshot)) {
      return null;
    }

    return parsedSnapshot.tradingDate === tradingDate
      ? normalizeDailyDashboardSnapshot(parsedSnapshot)
      : null;
  } catch {
    return null;
  }
}

export function listDailyDashboardSnapshotDates() {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    const dates = new Set<string>();

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (key?.startsWith(DAILY_SNAPSHOT_STORAGE_KEY_PREFIX)) {
        const date = key.slice(DAILY_SNAPSHOT_STORAGE_KEY_PREFIX.length);

        if (TRADING_DATE_PATTERN.test(date)) {
          dates.add(date);
        }
      }
    }

    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  } catch {
    return [];
  }
}

export function saveDailyDashboardSnapshot(snapshot: DailyDashboardSnapshot) {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      getDailySnapshotStorageKey(snapshot.tradingDate),
      JSON.stringify(snapshot)
    );
  } catch {
    // Prototype persistence should never block the dashboard interaction path.
  }
}
