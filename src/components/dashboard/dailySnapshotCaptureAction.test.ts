/**
 * @vitest-environment jsdom
 */

import React, { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DailySnapshotProvider,
  useDailySnapshot
} from "@/components/dashboard/DailySnapshotProvider";
import { createDailySnapshotForDate } from "@/lib/dailySnapshotFactory";
import { getDailySnapshotStorageKey } from "@/lib/dailySnapshotStorage";
import type {
  FearGreedCaptureCandidate,
  MarketCaptureCandidate
} from "@/lib/dailyMarketSnapshotCapture";
import { createLocalStorageMock, type LocalStorageMock } from "@/test/localStorageMock";

const may4CaptureTime = "2026-05-04T14:30:00.000Z";
const may5CaptureTime = "2026-05-05T14:45:00.000Z";

function marketCandidate(price: number, quoteSourceState: MarketCaptureCandidate["quoteSourceState"] = "live"): MarketCaptureCandidate {
  return {
    symbol: "SPX",
    latestClose: price,
    dailyTrend: "bullish",
    weeklyTrend: "neutral",
    marketStatus: "sideways consolidation",
    keyLevels: [
      { label: "Prior high", price: 5185, bias: "resistance" }
    ],
    quoteSourceState,
    source: quoteSourceState === "mock" ? "mock" : "market_data",
    watchlist: [
      {
        displaySymbol: "SPX500",
        price,
        change: 12.5,
        changePercent: 0.21,
        provider: quoteSourceState === "mock" ? "mock" : "fmp",
        providerSymbol: quoteSourceState === "mock" ? null : "ESUSD",
        status: quoteSourceState === "mock" ? "mock" : "live",
        sourceLabel: quoteSourceState === "mock" ? "mock" : "E-Mini S&P 500 proxy",
        asOf: quoteSourceState === "mock" ? null : "2026-05-04T14:29:00.000Z"
      }
    ]
  };
}

function fearGreedCandidate(value: number): FearGreedCaptureCandidate {
  return {
    source: "CMC Crypto Fear and Greed Index",
    value,
    label: value >= 75 ? "Extreme Greed" : "Neutral",
    lastWeek: 64,
    lastMonth: 55,
    yearHigh: 91,
    yearLow: 22,
    updatedAt: "2026-05-04T14:25:00.000Z"
  };
}

function setupLocalStorage(initialStore: Record<string, string> = {}) {
  const localStorage = createLocalStorageMock(initialStore);

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: localStorage
  });

  return localStorage;
}

function CaptureHarness({
  market,
  fearGreed
}: {
  market: MarketCaptureCandidate | null;
  fearGreed: FearGreedCaptureCandidate | null;
}) {
  const {
    activeDate,
    canCaptureMarketSnapshot,
    captureMarketSnapshot,
    loadSnapshotForDate,
    publishFearGreedCaptureCandidate,
    publishMarketCaptureCandidate
  } = useDailySnapshot();

  useEffect(() => {
    publishMarketCaptureCandidate(market);

    return () => publishMarketCaptureCandidate(null);
  }, [market, publishMarketCaptureCandidate]);

  useEffect(() => {
    publishFearGreedCaptureCandidate(fearGreed);

    return () => publishFearGreedCaptureCandidate(null);
  }, [fearGreed, publishFearGreedCaptureCandidate]);

  return React.createElement(
    "div",
    null,
    React.createElement("span", { "data-testid": "active-date" }, activeDate),
    React.createElement("span", { "data-testid": "can-capture" }, String(canCaptureMarketSnapshot)),
    React.createElement("button", { type: "button", onClick: captureMarketSnapshot }, "capture"),
    React.createElement("button", { type: "button", onClick: () => loadSnapshotForDate("2026-05-05") }, "may5"),
    React.createElement("button", { type: "button", onClick: () => loadSnapshotForDate("2026-05-04") }, "may4")
  );
}

async function renderHarness(
  props: { market: MarketCaptureCandidate | null; fearGreed: FearGreedCaptureCandidate | null },
  container: HTMLElement
) {
  const root = createRoot(container);

  await act(async () => {
    root.render(
      React.createElement(
        DailySnapshotProvider,
        null,
        React.createElement(CaptureHarness, props)
      )
    );
  });

  return root;
}

describe("daily market snapshot capture action", () => {
  let localStorage: LocalStorageMock;
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    vi.setSystemTime(new Date(may4CaptureTime));
    container = document.createElement("div");
    document.body.replaceChildren(container);
    localStorage = setupLocalStorage();
    root = null;
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }

    vi.useRealTimers();
    document.body.replaceChildren();
    localStorage.clear();
  });

  it("writes SPX and Fear & Greed snapshots only after explicit capture", async () => {
    root = await renderHarness({ market: marketCandidate(6001.25), fearGreed: fearGreedCandidate(82) }, container);

    expect(localStorage.getItem(getDailySnapshotStorageKey("2026-05-04"))).toBeNull();

    await act(async () => {
      container.querySelector("button")?.click();
    });

    const saved = JSON.parse(localStorage.getItem(getDailySnapshotStorageKey("2026-05-04")) ?? "{}");

    expect(saved.updatedAt).toBe(may4CaptureTime);
    expect(saved.spx.primaryQuote).toMatchObject({
      displaySymbol: "SPX500",
      price: 6001.25,
      provider: "fmp",
      status: "live"
    });
    expect(saved.spx.quoteSourceState).toBe("live");
    expect(saved.spx.capturedAt).toBe(may4CaptureTime);
    expect(saved.fearGreed).toMatchObject({
      value: 82,
      label: "Extreme Greed",
      capturedAt: may4CaptureTime
    });
  });

  it("overwrites previous captured market data for the same active date", async () => {
    root = await renderHarness({ market: marketCandidate(6001.25), fearGreed: fearGreedCandidate(82) }, container);

    await act(async () => {
      container.querySelector("button")?.click();
    });

    vi.setSystemTime(new Date("2026-05-04T15:00:00.000Z"));

    await act(async () => {
      root?.render(
        React.createElement(
          DailySnapshotProvider,
          null,
          React.createElement(CaptureHarness, {
            market: marketCandidate(6123.45, "cached"),
            fearGreed: fearGreedCandidate(66)
          })
        )
      );
    });
    await act(async () => {
      container.querySelector("button")?.click();
    });

    const saved = JSON.parse(localStorage.getItem(getDailySnapshotStorageKey("2026-05-04")) ?? "{}");

    expect(saved.spx.primaryQuote.price).toBe(6123.45);
    expect(saved.spx.quoteSourceState).toBe("cached");
    expect(saved.fearGreed.value).toBe(66);
    expect(saved.updatedAt).toBe("2026-05-04T15:00:00.000Z");
  });

  it("keeps captured snapshots isolated by active date", async () => {
    root = await renderHarness({ market: marketCandidate(6001.25), fearGreed: fearGreedCandidate(82) }, container);

    await act(async () => {
      container.querySelector("button")?.click();
    });

    vi.setSystemTime(new Date(may5CaptureTime));

    await act(async () => {
      Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "may5")?.click();
    });
    await act(async () => {
      root?.render(
        React.createElement(
          DailySnapshotProvider,
          null,
          React.createElement(CaptureHarness, {
            market: marketCandidate(6222.5, "mock"),
            fearGreed: fearGreedCandidate(45)
          })
        )
      );
    });
    await act(async () => {
      container.querySelector("button")?.click();
    });

    const may4 = JSON.parse(localStorage.getItem(getDailySnapshotStorageKey("2026-05-04")) ?? "{}");
    const may5 = JSON.parse(localStorage.getItem(getDailySnapshotStorageKey("2026-05-05")) ?? "{}");

    expect(may4.spx.primaryQuote.price).toBe(6001.25);
    expect(may4.fearGreed.value).toBe(82);
    expect(may5.spx.primaryQuote.price).toBe(6222.5);
    expect(may5.spx.quoteSourceState).toBe("mock");
    expect(may5.fearGreed.value).toBe(45);
  });

  it("can capture one available candidate without fabricating the other", async () => {
    const existing = createDailySnapshotForDate("2026-05-04");

    localStorage.setItem(getDailySnapshotStorageKey("2026-05-04"), JSON.stringify(existing));
    root = await renderHarness({ market: marketCandidate(6001.25), fearGreed: null }, container);

    await act(async () => {
      container.querySelector("button")?.click();
    });

    const saved = JSON.parse(localStorage.getItem(getDailySnapshotStorageKey("2026-05-04")) ?? "{}");

    expect(saved.spx.primaryQuote.price).toBe(6001.25);
    expect(saved.fearGreed).toEqual(existing.fearGreed);
  });
});
