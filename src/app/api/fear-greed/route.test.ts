import { afterEach, describe, expect, it, vi } from "vitest";
import type { FearGreedFetchResult } from "@/types/fearGreed";

const ORIGINAL_CMC_API_KEY = process.env.CMC_API_KEY;
const BASE_TIME = new Date("2026-05-04T12:00:00.000Z");
const FEAR_GREED_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

function restoreEnv() {
  if (typeof ORIGINAL_CMC_API_KEY === "undefined") {
    delete process.env.CMC_API_KEY;
  } else {
    process.env.CMC_API_KEY = ORIGINAL_CMC_API_KEY;
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

function cmcPayload() {
  return {
    data: [
      {
        timestamp: String(Date.parse("2026-05-04T12:00:00.000Z") / 1000),
        value: "71",
        value_classification: "Greed"
      },
      {
        timestamp: String(Date.parse("2026-04-27T12:00:00.000Z") / 1000),
        value: "44",
        value_classification: "Fear"
      },
      {
        timestamp: String(Date.parse("2026-04-04T12:00:00.000Z") / 1000),
        value: "21",
        value_classification: "Extreme Fear"
      }
    ]
  };
}

async function importRoute() {
  vi.resetModules();

  return import("./route");
}

async function readResult(response: Response) {
  return (await response.json()) as FearGreedFetchResult;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
  restoreEnv();
});

describe("GET /api/fear-greed fallback behavior", () => {
  it("returns a controlled 503 when CMC_API_KEY is missing and no cache exists", async () => {
    delete process.env.CMC_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await importRoute();

    const response = await GET();
    const result = await readResult(response);

    expect(response.status).toBe(503);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("missing_cmc_api_key");
    expect(result.snapshot).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("normalizes a successful CMC response", async () => {
    process.env.CMC_API_KEY = "test-cmc-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(jsonResponse(cmcPayload())));
    const { GET } = await importRoute();

    const response = await GET();
    const result = await readResult(response);

    expect(response.status).toBe(200);
    expect(result.ok).toBe(true);
    expect(result.stale).toBe(false);
    expect(result.snapshot).toMatchObject({
      value: 71,
      label: "Greed",
      lastWeek: 44,
      lastMonth: 21
    });
  });

  it("returns stale cache after a successful response when the provider later fails", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME);
    process.env.CMC_API_KEY = "test-cmc-key";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(cmcPayload()))
      .mockRejectedValueOnce(new Error("provider unavailable"));
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await importRoute();

    const firstResponse = await GET();
    const firstResult = await readResult(firstResponse);
    vi.setSystemTime(new Date(BASE_TIME.getTime() + FEAR_GREED_CACHE_TTL_MS + 1));

    const staleResponse = await GET();
    const staleResult = await readResult(staleResponse);

    expect(firstResponse.status).toBe(200);
    expect(firstResult.ok).toBe(true);
    expect(staleResponse.status).toBe(200);
    expect(staleResult.ok).toBe(true);
    expect(staleResult.stale).toBe(true);
    expect(staleResult.error).toBe("fear_greed_fetch_failed");
    expect(staleResult.snapshot).toEqual(firstResult.snapshot);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns a controlled 429 when CMC rate limits and no cache exists", async () => {
    process.env.CMC_API_KEY = "test-cmc-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(jsonResponse({ status: "rate limited" }, 429)));
    const { GET } = await importRoute();

    const response = await GET();
    const result = await readResult(response);

    expect(response.status).toBe(429);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("cmc_rate_limited");
    expect(result.snapshot).toBeUndefined();
  });

  it("returns a controlled 502 for invalid CMC payloads when no cache exists", async () => {
    process.env.CMC_API_KEY = "test-cmc-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(jsonResponse({ data: [] })));
    const { GET } = await importRoute();

    const response = await GET();
    const result = await readResult(response);

    expect(response.status).toBe(502);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("invalid_cmc_fear_greed_response");
    expect(result.snapshot).toBeUndefined();
  });
});
