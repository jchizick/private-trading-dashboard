import { afterEach, describe, expect, it, vi } from "vitest";
import { createDailySnapshotForDate } from "@/lib/dailySnapshotFactory";
import {
  getDailySnapshotStorageKey,
  listDailyDashboardSnapshotDates,
  loadDailyDashboardSnapshot,
  saveDailyDashboardSnapshot
} from "@/lib/dailySnapshotStorage";
import { createLocalStorageMock, createWindowWithLocalStorage } from "@/test/localStorageMock";
import type { DailyDashboardSnapshot } from "@/types/dailySnapshot";

function setupLocalStorage(initialStore: Record<string, string> = {}) {
  const localStorage = createLocalStorageMock(initialStore);

  vi.stubGlobal("window", createWindowWithLocalStorage(localStorage));

  return localStorage;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("daily dashboard snapshot localStorage", () => {
  it("saves and loads a snapshot by trading date using the expected key format", () => {
    const localStorage = setupLocalStorage();
    const snapshot = createDailySnapshotForDate("2026-05-04");

    saveDailyDashboardSnapshot(snapshot);

    expect(getDailySnapshotStorageKey("2026-05-04")).toBe("market-command:daily-snapshot:2026-05-04");
    expect(localStorage.getItem("market-command:daily-snapshot:2026-05-04")).toBe(JSON.stringify(snapshot));
    expect(loadDailyDashboardSnapshot("2026-05-04")).toEqual(snapshot);
  });

  it("normalizes legacy gamma levels into named gamma fields when loading", () => {
    const snapshot = createDailySnapshotForDate("2026-05-04");
    const legacySnapshot = {
      ...snapshot,
      gamma: {
        regime: "positive gamma",
        source: "mock",
        sourceLabel: "@gexbot15",
        capturedAt: "2026-05-04T14:05:00.000Z",
        updatedAt: "2026-05-04T14:05:00.000Z",
        levels: [
          { label: "Major Pos Gamma", price: 7260 },
          { label: "Major Neg Gamma", price: 7240 },
          { label: "Zero Gamma / Flip", price: 7250.83 }
        ]
      }
    };
    setupLocalStorage({
      [getDailySnapshotStorageKey("2026-05-04")]: JSON.stringify(legacySnapshot)
    });

    const loaded = loadDailyDashboardSnapshot("2026-05-04");

    expect(loaded?.gamma).toMatchObject({
      regime: "positive gamma",
      status: "checked",
      source: "mock",
      sourceName: "@gexbot15",
      majorPositiveGamma: 7260,
      majorNegativeGamma: 7240,
      zeroGamma: 7250.83,
      capturedAt: "2026-05-04T14:05:00.000Z"
    });
  });

  it("rejects snapshots whose tradingDate does not match the requested key date", () => {
    const snapshot = createDailySnapshotForDate("2026-05-03");
    setupLocalStorage({
      [getDailySnapshotStorageKey("2026-05-04")]: JSON.stringify(snapshot)
    });

    expect(loadDailyDashboardSnapshot("2026-05-04")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    setupLocalStorage({
      [getDailySnapshotStorageKey("2026-05-04")]: "{bad json"
    });

    expect(loadDailyDashboardSnapshot("2026-05-04")).toBeNull();
  });

  it("lists only matching daily snapshot keys in descending date order", () => {
    const may4 = createDailySnapshotForDate("2026-05-04");
    const may1 = createDailySnapshotForDate("2026-05-01");
    setupLocalStorage({
      [getDailySnapshotStorageKey("2026-05-04")]: JSON.stringify(may4),
      [getDailySnapshotStorageKey("2026-05-01")]: JSON.stringify(may1),
      "market-command:daily-snapshot:draft": JSON.stringify(may4),
      "market-command:fear-greed-cache": "{}",
      "other:2026-05-03": "{}"
    });

    expect(listDailyDashboardSnapshotDates()).toEqual(["2026-05-04", "2026-05-01"]);
  });

  it("returns null or empty values without throwing when localStorage is unavailable", () => {
    vi.unstubAllGlobals();
    const snapshot = createDailySnapshotForDate("2026-05-04");

    expect(() => saveDailyDashboardSnapshot(snapshot)).not.toThrow();
    expect(loadDailyDashboardSnapshot("2026-05-04")).toBeNull();
    expect(listDailyDashboardSnapshotDates()).toEqual([]);
  });
});
