import { afterEach, describe, expect, it, vi } from "vitest";
import type { MarketCandlesFetchResult } from "@/types/marketCandles";

const ORIGINAL_MARKET_CANDLES_ENABLE_SPY_PROXY = process.env.MARKET_CANDLES_ENABLE_SPY_PROXY;
const BASE_TIME = new Date("2026-05-05T14:00:00.000Z");

interface MockProviderResponse {
  body?: unknown;
  status?: number;
  reject?: boolean;
}

type ProviderResponseMap = Record<string, MockProviderResponse | MockProviderResponse[]>;

function restoreEnv() {
  if (typeof ORIGINAL_MARKET_CANDLES_ENABLE_SPY_PROXY === "undefined") {
    delete process.env.MARKET_CANDLES_ENABLE_SPY_PROXY;
  } else {
    process.env.MARKET_CANDLES_ENABLE_SPY_PROXY = ORIGINAL_MARKET_CANDLES_ENABLE_SPY_PROXY;
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function yahooChart(symbol: "^GSPC" | "SPY" | "ES=F", close = 7148.3) {
  return {
    chart: {
      result: [
        {
          meta: {
            symbol,
            timezone: "EDT"
          },
          timestamp: [1777469400, 1777471200],
          indicators: {
            quote: [
              {
                open: [7131.61, 7140.5],
                high: [7142.25, 7151.75],
                low: [7128.2, 7137.4],
                close: [7139.5, close],
                volume: [123456, null]
              }
            ]
          }
        }
      ],
      error: null
    }
  };
}

function createResponseQueue(response: MockProviderResponse | MockProviderResponse[] | undefined) {
  if (Array.isArray(response)) {
    return [...response];
  }

  return response ? [response] : [];
}

function mockYahooFetch(responses: ProviderResponseMap) {
  const queues = new Map(
    Object.entries(responses).map(([key, response]) => [key, createResponseQueue(response)])
  );
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const requestUrl = input instanceof Request ? input.url : input.toString();
    const url = new URL(requestUrl);
    const symbol = decodeURIComponent(url.pathname.split("/").at(-1) ?? "");
    const queue = queues.get(symbol) ?? [];
    const response = queue.shift() ?? { reject: true };

    if (response.reject) {
      throw new Error(`Mock Yahoo failure: ${symbol}`);
    }

    return jsonResponse(response.body ?? {}, response.status ?? 200);
  });

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

async function importRoute() {
  vi.resetModules();

  return import("./route");
}

async function readResult(response: Response) {
  return (await response.json()) as MarketCandlesFetchResult;
}

function requestFor(path = "http://localhost/api/market-candles") {
  return new Request(path);
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
  restoreEnv();
});

describe("GET /api/market-candles", () => {
  it("returns normalized Yahoo ^GSPC candles for SPX500", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME);
    const fetchMock = mockYahooFetch({
      "^GSPC": { body: yahooChart("^GSPC") }
    });
    const { GET } = await importRoute();

    const response = await GET(requestFor());
    const result = await readResult(response);

    expect(response.status).toBe(200);
    expect(result).toMatchObject({
      ok: true,
      displaySymbol: "SPX500",
      requestedSymbol: "SPX500",
      displaySource: "index",
      providerSymbol: "^GSPC",
      sourceLabel: "S&P 500 Index",
      sessionLabel: "Regular session",
      source: "Yahoo Finance",
      interval: "30m",
      range: "5d",
      stale: false,
      updatedAt: BASE_TIME.toISOString(),
      isProxy: false
    });
    expect(result.proxyFor).toBeUndefined();
    expect(result.candles).toHaveLength(2);
    expect(result.candles[0]).toMatchObject({
      time: 1777469400,
      open: 7131.61,
      high: 7142.25,
      low: 7128.2,
      close: 7139.5,
      volume: 123456,
      source: "Yahoo Finance",
      symbol: "^GSPC",
      isProxy: false
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns normalized Yahoo ^GSPC candles for source=index", async () => {
    const fetchMock = mockYahooFetch({
      "^GSPC": { body: yahooChart("^GSPC") }
    });
    const { GET } = await importRoute();

    const response = await GET(requestFor("http://localhost/api/market-candles?symbol=SPX500&source=index"));
    const result = await readResult(response);

    expect(response.status).toBe(200);
    expect(result).toMatchObject({
      ok: true,
      displaySource: "index",
      providerSymbol: "^GSPC",
      sourceLabel: "S&P 500 Index",
      sessionLabel: "Regular session"
    });
    expect(result.candles.every((candle) => candle.symbol === "^GSPC" && !candle.isProxy)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns normalized Yahoo ES=F candles for source=futures", async () => {
    const fetchMock = mockYahooFetch({
      "ES=F": { body: yahooChart("ES=F", 7367.5) }
    });
    const { GET } = await importRoute();

    const response = await GET(requestFor("http://localhost/api/market-candles?symbol=SPX500&source=futures"));
    const result = await readResult(response);

    expect(response.status).toBe(200);
    expect(result).toMatchObject({
      ok: true,
      displaySource: "futures",
      providerSymbol: "ES=F",
      sourceLabel: "E-Mini S&P 500 Futures",
      sessionLabel: "CME delayed / extended hours",
      isProxy: false
    });
    expect(result.candles).toHaveLength(2);
    expect(result.candles.every((candle) => candle.symbol === "ES=F" && !candle.isProxy)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns 400 for unsupported requested symbols", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await importRoute();

    const response = await GET(requestFor("http://localhost/api/market-candles?symbol=BTCUSDT"));
    const result = await readResult(response);

    expect(response.status).toBe(400);
    expect(result).toMatchObject({
      ok: false,
      displaySource: "index",
      providerSymbol: null,
      candles: [],
      isProxy: false,
      error: "unsupported_market_candle_symbol"
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 400 for unsupported chart sources", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await importRoute();

    const response = await GET(requestFor("http://localhost/api/market-candles?symbol=SPX500&source=crypto"));
    const result = await readResult(response);

    expect(response.status).toBe(400);
    expect(result).toMatchObject({
      ok: false,
      displaySource: "index",
      providerSymbol: null,
      candles: [],
      isProxy: false,
      error: "unsupported_market_candle_source"
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns controlled failure when ^GSPC fails and SPY proxy is disabled", async () => {
    delete process.env.MARKET_CANDLES_ENABLE_SPY_PROXY;
    const fetchMock = mockYahooFetch({
      "^GSPC": {
        body: {
          chart: {
            result: null,
            error: {
              code: "Not Found",
              description: "No chart data found"
            }
          }
        }
      }
    });
    const { GET } = await importRoute();

    const response = await GET(requestFor());
    const result = await readResult(response);

    expect(response.status).toBe(502);
    expect(result).toMatchObject({
      ok: false,
      displaySource: "index",
      providerSymbol: null,
      candles: [],
      stale: false,
      isProxy: false,
      error: "yahoo_chart_provider_error_No chart data found"
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to SPY proxy when enabled and ^GSPC fails", async () => {
    process.env.MARKET_CANDLES_ENABLE_SPY_PROXY = "true";
    const fetchMock = mockYahooFetch({
      "^GSPC": {
        body: {
          chart: {
            result: null,
            error: {
              description: "Primary failed"
            }
          }
        }
      },
      SPY: { body: yahooChart("SPY", 723.77) }
    });
    const { GET } = await importRoute();

    const response = await GET(requestFor());
    const result = await readResult(response);

    expect(response.status).toBe(200);
    expect(result).toMatchObject({
      ok: true,
      displaySource: "index",
      providerSymbol: "SPY",
      source: "Yahoo Finance",
      sourceLabel: "SPY ETF proxy",
      sessionLabel: "Regular session",
      isProxy: true,
      proxyFor: "^GSPC"
    });
    expect(result.candles).toHaveLength(2);
    expect(result.candles.every((candle) => candle.symbol === "SPY" && candle.isProxy)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns controlled failure when both Yahoo providers fail", async () => {
    process.env.MARKET_CANDLES_ENABLE_SPY_PROXY = "true";
    mockYahooFetch({
      "^GSPC": { reject: true },
      SPY: {
        body: {
          chart: {
            result: [],
            error: null
          }
        }
      }
    });
    const { GET } = await importRoute();

    const response = await GET(requestFor());
    const result = await readResult(response);

    expect(response.status).toBe(502);
    expect(result).toMatchObject({
      ok: false,
      displaySource: "index",
      providerSymbol: null,
      candles: [],
      stale: false,
      isProxy: false,
      error: "yahoo_chart_empty_candles"
    });
  });
});
