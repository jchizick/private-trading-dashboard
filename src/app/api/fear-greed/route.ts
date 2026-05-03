import { NextResponse } from "next/server";
import type { FearGreedSnapshot } from "@/types/dashboard";
import type { FearGreedApiResponse, FearGreedFetchResult } from "@/types/fearGreed";
import { FEAR_GREED_SOURCE, normalizeFearGreedSnapshot } from "@/lib/fearGreedNormalization";

const CMC_FEAR_GREED_URL =
  "https://pro-api.coinmarketcap.com/v3/fear-and-greed/historical?start=1&limit=365";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

export const dynamic = "force-dynamic";

let cachedSnapshot: FearGreedSnapshot | null = null;
let cachedAt = 0;

function createResult({
  ok,
  snapshot,
  stale,
  error
}: {
  ok: boolean;
  snapshot?: FearGreedSnapshot;
  stale: boolean;
  error?: string;
}): FearGreedFetchResult {
  return {
    ok,
    snapshot,
    stale,
    source: FEAR_GREED_SOURCE,
    updatedAt: new Date().toISOString(),
    error
  };
}

function getFreshCachedResult() {
  if (!cachedSnapshot || Date.now() - cachedAt > CACHE_TTL_MS) {
    return null;
  }

  return createResult({
    ok: true,
    snapshot: cachedSnapshot,
    stale: false
  });
}

function createErrorOrStaleResult(error: string) {
  if (cachedSnapshot) {
    return createResult({
      ok: true,
      snapshot: cachedSnapshot,
      stale: true,
      error
    });
  }

  return createResult({
    ok: false,
    stale: false,
    error
  });
}

function getErrorStatus(error: string, fallbackStatus: number) {
  if (error === "missing_cmc_api_key") {
    return 503;
  }

  if (error === "cmc_rate_limited") {
    return 429;
  }

  return fallbackStatus;
}

export async function GET() {
  const cachedResult = getFreshCachedResult();

  if (cachedResult) {
    return NextResponse.json(cachedResult);
  }

  const apiKey = process.env.CMC_API_KEY;

  if (!apiKey) {
    const result = createErrorOrStaleResult("missing_cmc_api_key");
    return NextResponse.json(result, {
      status: result.ok ? 200 : getErrorStatus(result.error ?? "", 503)
    });
  }

  try {
    const response = await fetch(CMC_FEAR_GREED_URL, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-CMC_PRO_API_KEY": apiKey
      }
    });

    if (!response.ok) {
      const error = response.status === 429 ? "cmc_rate_limited" : `cmc_request_failed_${response.status}`;
      const result = createErrorOrStaleResult(error);

      return NextResponse.json(result, {
        status: result.ok ? 200 : getErrorStatus(error, 502)
      });
    }

    const rawResponse = (await response.json()) as FearGreedApiResponse;
    const snapshot = normalizeFearGreedSnapshot(rawResponse);

    if (!snapshot) {
      const result = createErrorOrStaleResult("invalid_cmc_fear_greed_response");

      return NextResponse.json(result, {
        status: result.ok ? 200 : 502
      });
    }

    cachedSnapshot = snapshot;
    cachedAt = Date.now();

    return NextResponse.json(
      createResult({
        ok: true,
        snapshot,
        stale: false
      })
    );
  } catch {
    const result = createErrorOrStaleResult("fear_greed_fetch_failed");

    return NextResponse.json(result, {
      status: result.ok ? 200 : 502
    });
  }
}
