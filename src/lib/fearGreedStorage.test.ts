import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearFearGreedCache,
  loadFearGreedCache,
  saveFearGreedCache
} from "@/lib/fearGreedStorage";
import { createLocalStorageMock, createWindowWithLocalStorage } from "@/test/localStorageMock";
import type { FearGreedSnapshot } from "@/types/dashboard";

const FEAR_GREED_CACHE_STORAGE_KEY = "market-command:fear-greed-cache";

function snapshot(overrides: Partial<FearGreedSnapshot> = {}): FearGreedSnapshot {
  return {
    source: "CMC Crypto Fear and Greed Index",
    value: 71,
    label: "Greed",
    lastWeek: 44,
    lastMonth: 21,
    yearHigh: 84,
    yearLow: 12,
    lastUpdatedAt: "2026-05-04T12:00:00.000Z",
    ...overrides
  };
}

function setupLocalStorage(initialStore: Record<string, string> = {}) {
  const localStorage = createLocalStorageMock(initialStore);

  vi.stubGlobal("window", createWindowWithLocalStorage(localStorage));

  return localStorage;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Fear & Greed browser cache storage", () => {
  it("saves and loads a valid snapshot under the expected cache key", () => {
    const localStorage = setupLocalStorage();
    const value = snapshot();

    saveFearGreedCache(value);

    expect(localStorage.getItem(FEAR_GREED_CACHE_STORAGE_KEY)).toBe(JSON.stringify(value));
    expect(loadFearGreedCache()).toEqual(value);
  });

  it("returns null when the cache key is missing", () => {
    setupLocalStorage();

    expect(loadFearGreedCache()).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    setupLocalStorage({
      [FEAR_GREED_CACHE_STORAGE_KEY]: "{bad json"
    });

    expect(loadFearGreedCache()).toBeNull();
  });

  it("returns null for invalid snapshot shapes", () => {
    setupLocalStorage({
      [FEAR_GREED_CACHE_STORAGE_KEY]: JSON.stringify(snapshot({ label: "Panic" as FearGreedSnapshot["label"] }))
    });

    expect(loadFearGreedCache()).toBeNull();
  });

  it("clears the cached snapshot", () => {
    const localStorage = setupLocalStorage({
      [FEAR_GREED_CACHE_STORAGE_KEY]: JSON.stringify(snapshot())
    });

    clearFearGreedCache();

    expect(localStorage.getItem(FEAR_GREED_CACHE_STORAGE_KEY)).toBeNull();
  });

  it("does not throw when localStorage is unavailable", () => {
    vi.unstubAllGlobals();

    expect(() => saveFearGreedCache(snapshot())).not.toThrow();
    expect(loadFearGreedCache()).toBeNull();
    expect(() => clearFearGreedCache()).not.toThrow();
  });
});
