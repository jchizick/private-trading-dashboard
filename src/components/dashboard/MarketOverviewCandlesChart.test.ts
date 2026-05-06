/**
 * @vitest-environment jsdom
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MarketOverviewCandlesChart } from "@/components/dashboard/MarketOverviewCandlesChart";
import type { MarketCandlesFetchResult } from "@/types/marketCandles";

const chartMocks = vi.hoisted(() => {
  const setDataMock = vi.fn();
  const fitContentMock = vi.fn();
  const removeMock = vi.fn();
  const applyOptionsMock = vi.fn();
  const addSeriesMock = vi.fn(() => ({
    setData: setDataMock
  }));
  const createChartMock = vi.fn(() => ({
    addSeries: addSeriesMock,
    timeScale: () => ({
      fitContent: fitContentMock
    }),
    priceScale: () => ({
      applyOptions: applyOptionsMock
    }),
    applyOptions: applyOptionsMock,
    remove: removeMock
  }));

  return {
    addSeriesMock,
    applyOptionsMock,
    createChartMock,
    fitContentMock,
    removeMock,
    setDataMock
  };
});

vi.mock("lightweight-charts", () => ({
  CandlestickSeries: "CandlestickSeries",
  ColorType: {
    Solid: "Solid"
  },
  HistogramSeries: "HistogramSeries",
  createChart: chartMocks.createChartMock
}));

function candleResult(overrides: Partial<MarketCandlesFetchResult> = {}): MarketCandlesFetchResult {
  return {
    ok: true,
    displaySymbol: "SPX500",
    requestedSymbol: "SPX500",
    providerSymbol: "^GSPC",
    source: "Yahoo Finance",
    interval: "30m",
    range: "5d",
    stale: false,
    updatedAt: "2026-05-05T14:00:00.000Z",
    isProxy: false,
    candles: [
      {
        time: 1777469400,
        open: 7131.61,
        high: 7142.25,
        low: 7128.2,
        close: 7139.5,
        volume: 123456,
        source: "Yahoo Finance",
        symbol: "^GSPC",
        isProxy: false
      },
      {
        time: 1777471200,
        open: 7140.5,
        high: 7151.75,
        low: 7137.4,
        close: 7148.3,
        volume: null,
        source: "Yahoo Finance",
        symbol: "^GSPC",
        isProxy: false
      }
    ],
    ...overrides
  };
}

function fetchResponse(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body
  } as Response;
}

async function flushClientEffects() {
  await act(async () => {
    await Promise.resolve();
  });
}

function renderChart(root: Root, fallbackText: string) {
  root.render(React.createElement(MarketOverviewCandlesChart, {
    fallback: React.createElement("div", null, fallbackText)
  }));
}

describe("MarketOverviewCandlesChart", () => {
  let root: Root | null;
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    root = null;
    container = document.createElement("div");
    document.body.replaceChildren(container);
    chartMocks.setDataMock.mockClear();
    chartMocks.fitContentMock.mockClear();
    chartMocks.removeMock.mockClear();
    chartMocks.applyOptionsMock.mockClear();
    chartMocks.addSeriesMock.mockClear();
    chartMocks.createChartMock.mockClear();
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }

    document.body.replaceChildren();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("keeps the fallback visible when candles are unavailable or malformed", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fetchResponse({ ok: true, candles: [] })));

    await act(async () => {
      root = createRoot(container);
      renderChart(root, "Mock SPX chart fallback");
    });
    await flushClientEffects();
    await flushClientEffects();

    expect(container.textContent).toContain("Mock SPX chart fallback");
    expect(container.textContent).not.toContain("SPX500 / 30m / Yahoo Finance / Live");
    expect(chartMocks.createChartMock).not.toHaveBeenCalled();
  });

  it("renders live candles and hides the fallback after chart creation succeeds", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fetchResponse(candleResult())));

    await act(async () => {
      root = createRoot(container);
      renderChart(root, "Mock SPX chart fallback");
    });
    await flushClientEffects();
    await flushClientEffects();
    await flushClientEffects();

    expect(container.textContent).toContain("SPX500 / 30m / Yahoo Finance / Live");
    expect(container.querySelector(".marketCandlesChart__fallback--hidden")).not.toBeNull();
    expect(chartMocks.createChartMock).toHaveBeenCalledTimes(1);
    expect(chartMocks.addSeriesMock).toHaveBeenCalledWith("CandlestickSeries", {
      upColor: "rgba(209, 216, 213, 0.9)",
      downColor: "rgba(35, 40, 43, 1)",
      borderUpColor: "rgba(102, 217, 157, 0.8)",
      borderDownColor: "rgba(102, 217, 157, 0.5)",
      wickUpColor: "rgba(102, 217, 157, 0.8)",
      wickDownColor: "rgba(102, 217, 157, 0.5)"
    });
    expect(chartMocks.setDataMock).toHaveBeenCalledWith([
      {
        time: 1777469400,
        open: 7131.61,
        high: 7142.25,
        low: 7128.2,
        close: 7139.5
      },
      {
        time: 1777471200,
        open: 7140.5,
        high: 7151.75,
        low: 7137.4,
        close: 7148.3
      }
    ]);
    expect(chartMocks.setDataMock).toHaveBeenCalledWith([
      {
        time: 1777469400,
        value: 123456,
        color: "rgba(102, 217, 157, 0.15)"
      }
    ]);
    expect(chartMocks.fitContentMock).toHaveBeenCalled();
  });

  it("labels SPY proxy candles clearly", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fetchResponse(candleResult({
      providerSymbol: "SPY",
      isProxy: true,
      proxyFor: "^GSPC",
      candles: [
        {
          time: 1777469400,
          open: 711,
          high: 714,
          low: 710,
          close: 713,
          volume: 123456,
          source: "Yahoo Finance",
          symbol: "SPY",
          isProxy: true
        }
      ]
    }))));

    await act(async () => {
      root = createRoot(container);
      renderChart(root, "Mock SPX chart fallback");
    });
    await flushClientEffects();
    await flushClientEffects();
    await flushClientEffects();

    expect(container.textContent).toContain("SPX500 proxy via SPY / 30m / Yahoo Finance / Live");
  });

  it("resizes the chart through the resize observer without dropping the fitted view", async () => {
    class ResizeObserverStub {
      static instance: ResizeObserverStub | null = null;
      private callback: ResizeObserverCallback;

      observe = vi.fn();
      disconnect = vi.fn();

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
        ResizeObserverStub.instance = this;
      }

      emit(width: number, height: number) {
        this.callback([
          {
            contentRect: {
              width,
              height
            }
          } as ResizeObserverEntry
        ], this as unknown as ResizeObserver);
      }
    }

    const requestAnimationFrameMock = vi.fn((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    const cancelAnimationFrameMock = vi.fn();

    vi.stubGlobal("ResizeObserver", ResizeObserverStub);
    vi.stubGlobal("requestAnimationFrame", requestAnimationFrameMock);
    vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrameMock);
    vi.stubGlobal("fetch", vi.fn(async () => fetchResponse(candleResult())));

    await act(async () => {
      root = createRoot(container);
      renderChart(root, "Mock SPX chart fallback");
    });
    await flushClientEffects();
    await flushClientEffects();
    await flushClientEffects();

    await act(async () => {
      ResizeObserverStub.instance?.emit(512, 333);
    });

    expect(chartMocks.applyOptionsMock).toHaveBeenCalledWith({
      width: 512,
      height: 333
    });
    expect(chartMocks.fitContentMock).toHaveBeenCalled();
  });
});
