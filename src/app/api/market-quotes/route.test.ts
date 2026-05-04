import { afterEach, describe, expect, it, vi } from "vitest";
import type { MarketQuotesFetchResult } from "@/types/marketQuotes";

const ORIGINAL_FMP_API_KEY = process.env.FMP_API_KEY;
const ORIGINAL_TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;
const BASE_TIME = new Date("2026-05-04T14:00:00.000Z");
const ACTIVE_MARKET_CACHE_TTL_MS = 5 * 60 * 1000;
const QUOTE_TIMESTAMP_SECONDS = Date.parse("2026-05-04T14:00:00.000Z") / 1000;

interface MockProviderResponse {
  body?: unknown;
  status?: number;
  reject?: boolean;
}

type ProviderResponseMap = Record<string, MockProviderResponse | MockProviderResponse[]>;

function restoreEnv() {
  if (typeof ORIGINAL_FMP_API_KEY === "undefined") {
    delete process.env.FMP_API_KEY;
  } else {
    process.env.FMP_API_KEY = ORIGINAL_FMP_API_KEY;
  }

  if (typeof ORIGINAL_TWELVE_DATA_API_KEY === "undefined") {
    delete process.env.TWELVE_DATA_API_KEY;
  } else {
    process.env.TWELVE_DATA_API_KEY = ORIGINAL_TWELVE_DATA_API_KEY;
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

function fmpQuote(symbol: string, price: number) {
  return [
    {
      symbol,
      price,
      change: 1.25,
      changesPercentage: 0.24,
      volume: 123456,
      timestamp: QUOTE_TIMESTAMP_SECONDS
    }
  ];
}

function twelveQuote(symbol: string, close: number) {
  return {
    symbol,
    close,
    change: "0.12",
    percent_change: "0.18",
    volume: "98765",
    timestamp: QUOTE_TIMESTAMP_SECONDS
  };
}

function providerKey(provider: "fmp" | "twelve", symbol: string) {
  return `${provider}:${symbol}`;
}

function createResponseQueue(response: MockProviderResponse | MockProviderResponse[] | undefined) {
  if (Array.isArray(response)) {
    return [...response];
  }

  return response ? [response] : [];
}

function mockMarketFetch(responses: ProviderResponseMap) {
  const queues = new Map(
    Object.entries(responses).map(([key, response]) => [key, createResponseQueue(response)])
  );
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const requestUrl = input instanceof Request ? input.url : input.toString();
    const url = new URL(requestUrl);
    const provider = url.hostname.includes("financialmodelingprep") ? "fmp" : "twelve";
    const symbol = url.searchParams.get("symbol") ?? "";
    const key = providerKey(provider, symbol);
    const queue = queues.get(key) ?? [];
    const response = queue.shift() ?? { reject: true };

    if (response.reject) {
      throw new Error(`Mock provider failure: ${key}`);
    }

    return jsonResponse(response.body ?? {}, response.status ?? 200);
  });

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

function successfulProviderResponses(): ProviderResponseMap {
  return {
    [providerKey("fmp", "ESUSD")]: { body: fmpQuote("ESUSD", 5234.56) },
    [providerKey("twelve", "XAU/USD")]: { body: twelveQuote("XAU/USD", 2335.5) },
    [providerKey("fmp", "BTCUSD")]: { body: fmpQuote("BTCUSD", 65000) },
    [providerKey("twelve", "CAD/USD")]: { body: twelveQuote("CAD/USD", 0.73) }
  };
}

async function importRoute() {
  vi.resetModules();

  return import("./route");
}

async function readResult(response: Response) {
  return (await response.json()) as MarketQuotesFetchResult;
}

function setMarketApiKeys() {
  process.env.FMP_API_KEY = "test-fmp-key";
  process.env.TWELVE_DATA_API_KEY = "test-twelve-key";
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
  restoreEnv();
});

describe("GET /api/market-quotes fallback behavior", () => {
  it("returns a controlled 503 with unavailable quotes when both API keys are missing and no cache exists", async () => {
    delete process.env.FMP_API_KEY;
    delete process.env.TWELVE_DATA_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await importRoute();

    const response = await GET();
    const result = await readResult(response);

    expect(response.status).toBe(503);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("missing_market_quote_api_keys");
    expect(Array.isArray(result.quotes)).toBe(false);
    expect(Object.keys(result.quotes).sort()).toEqual(["BTCUSDT", "CADUSD", "DXY", "SPX500", "WTI", "XAUUSD"]);
    expect(Object.values(result.quotes).every((quote) => quote.status === "unavailable")).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a symbol-keyed mixed provider success result", async () => {
    setMarketApiKeys();
    mockMarketFetch(successfulProviderResponses());
    const { GET } = await importRoute();

    const response = await GET();
    const result = await readResult(response);

    expect(response.status).toBe(200);
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.quotes)).toBe(false);
    expect(result.quotes.SPX500).toMatchObject({ provider: "fmp", providerSymbol: "ESUSD", status: "live" });
    expect(result.quotes.XAUUSD).toMatchObject({ provider: "twelve", providerSymbol: "XAU/USD", status: "live" });
    expect(result.quotes.BTCUSDT).toMatchObject({ provider: "fmp", providerSymbol: "BTCUSD", status: "live" });
    expect(result.quotes.CADUSD).toMatchObject({ provider: "twelve", providerSymbol: "CAD/USD", status: "live" });
    expect(result.quotes.WTI).toMatchObject({ provider: "mock", status: "unavailable" });
    expect(result.quotes.DXY).toMatchObject({ provider: "mock", status: "unavailable" });
  });

  it("falls back from FMP ESUSD to FMP ^GSPC for SPX500", async () => {
    setMarketApiKeys();
    mockMarketFetch({
      ...successfulProviderResponses(),
      [providerKey("fmp", "ESUSD")]: { body: { error: "primary failed" }, status: 502 },
      [providerKey("fmp", "^GSPC")]: { body: fmpQuote("^GSPC", 5230.25) }
    });
    const { GET } = await importRoute();

    const response = await GET();
    const result = await readResult(response);

    expect(response.status).toBe(200);
    expect(result.ok).toBe(true);
    expect(result.quotes.SPX500).toMatchObject({
      provider: "fmp",
      providerSymbol: "^GSPC",
      status: "live",
      sourceLabel: "S&P 500 index fallback"
    });
  });

  it("falls back from Twelve XAU/USD to FMP GCUSD for XAUUSD", async () => {
    setMarketApiKeys();
    mockMarketFetch({
      ...successfulProviderResponses(),
      [providerKey("twelve", "XAU/USD")]: { body: { status: "error", message: "primary failed" }, status: 502 },
      [providerKey("fmp", "GCUSD")]: { body: fmpQuote("GCUSD", 2330.75) }
    });
    const { GET } = await importRoute();

    const response = await GET();
    const result = await readResult(response);

    expect(response.status).toBe(200);
    expect(result.ok).toBe(true);
    expect(result.quotes.XAUUSD).toMatchObject({
      provider: "fmp",
      providerSymbol: "GCUSD",
      status: "live",
      sourceLabel: "Gold futures fallback"
    });
  });

  it("returns stale server cache after total provider failure", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME);
    setMarketApiKeys();
    const fetchMock = mockMarketFetch({
      [providerKey("fmp", "ESUSD")]: [
        { body: fmpQuote("ESUSD", 5234.56) },
        { body: { error: "failed" }, status: 502 }
      ],
      [providerKey("fmp", "^GSPC")]: { body: { error: "failed" }, status: 502 },
      [providerKey("twelve", "XAU/USD")]: [
        { body: twelveQuote("XAU/USD", 2335.5) },
        { body: { status: "error", message: "failed" }, status: 502 }
      ],
      [providerKey("fmp", "GCUSD")]: { body: { error: "failed" }, status: 502 },
      [providerKey("fmp", "BTCUSD")]: [
        { body: fmpQuote("BTCUSD", 65000) },
        { body: { error: "failed" }, status: 502 }
      ],
      [providerKey("twelve", "BTC/USD")]: { body: { status: "error", message: "failed" }, status: 502 },
      [providerKey("twelve", "CAD/USD")]: [
        { body: twelveQuote("CAD/USD", 0.73) },
        { body: { status: "error", message: "failed" }, status: 502 }
      ]
    });
    const { GET } = await importRoute();

    const firstResponse = await GET();
    const firstResult = await readResult(firstResponse);
    vi.setSystemTime(new Date(BASE_TIME.getTime() + ACTIVE_MARKET_CACHE_TTL_MS + 1));

    const staleResponse = await GET();
    const staleResult = await readResult(staleResponse);

    expect(firstResponse.status).toBe(200);
    expect(firstResult.ok).toBe(true);
    expect(staleResponse.status).toBe(200);
    expect(staleResult.ok).toBe(true);
    expect(staleResult.stale).toBe(true);
    expect(staleResult.quotes.SPX500.status).toBe("cached");
    expect(staleResult.quotes.XAUUSD.status).toBe("cached");
    expect(staleResult.quotes.BTCUSDT.status).toBe("cached");
    expect(staleResult.quotes.CADUSD.status).toBe("cached");
    expect(staleResult.quotes.WTI.status).toBe("unavailable");
    expect(staleResult.quotes.DXY.status).toBe("unavailable");
    expect(fetchMock).toHaveBeenCalledTimes(11);
  });

  it("returns partial success when one provider-backed quote fails and others remain live", async () => {
    setMarketApiKeys();
    mockMarketFetch({
      ...successfulProviderResponses(),
      [providerKey("fmp", "ESUSD")]: { body: { error: "primary failed" }, status: 502 },
      [providerKey("fmp", "^GSPC")]: { body: { error: "fallback failed" }, status: 502 }
    });
    const { GET } = await importRoute();

    const response = await GET();
    const result = await readResult(response);

    expect(response.status).toBe(200);
    expect(result.ok).toBe(true);
    expect(result.error).toBe("partial_market_quote_failure");
    expect(result.quotes.SPX500).toMatchObject({ provider: "fmp", status: "error" });
    expect(result.quotes.XAUUSD.status).toBe("live");
    expect(result.quotes.BTCUSDT.status).toBe("live");
    expect(result.quotes.CADUSD.status).toBe("live");
  });
});
