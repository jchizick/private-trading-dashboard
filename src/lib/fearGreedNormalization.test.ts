import { describe, expect, it } from "vitest";
import {
  FEAR_GREED_SOURCE,
  normalizeFearGreedReadings,
  normalizeFearGreedSnapshot,
  toFearGreedSnapshot
} from "@/lib/fearGreedNormalization";
import type { FearGreedApiResponse } from "@/types/fearGreed";

function unixSeconds(isoDate: string) {
  return Date.parse(isoDate) / 1000;
}

const currentTimestamp = unixSeconds("2026-05-04T12:00:00.000Z");
const sevenDaysAgoTimestamp = unixSeconds("2026-04-27T12:30:00.000Z");
const thirtyDaysAgoTimestamp = unixSeconds("2026-04-04T11:30:00.000Z");

describe("Fear & Greed normalization", () => {
  it("normalizes a valid CMC response into the dashboard snapshot shape", () => {
    const response: FearGreedApiResponse = {
      data: [
        {
          timestamp: String(currentTimestamp),
          value: "71",
          value_classification: "Greed"
        },
        {
          timestamp: String(sevenDaysAgoTimestamp),
          value: "44",
          value_classification: "fear"
        },
        {
          timestamp: String(thirtyDaysAgoTimestamp),
          value: "21",
          value_classification: "Extreme Fear"
        }
      ]
    };

    const snapshot = normalizeFearGreedSnapshot(response);

    expect(snapshot).toEqual({
      source: FEAR_GREED_SOURCE,
      value: 71,
      label: "Greed",
      lastWeek: 44,
      lastMonth: 21,
      yearHigh: 71,
      yearLow: 21,
      lastUpdatedAt: "2026-05-04T12:00:00.000Z"
    });
  });

  it("sorts newest-first and oldest-first payloads before selecting the current reading", () => {
    const newestFirst = normalizeFearGreedSnapshot({
      data: [
        { timestamp: currentTimestamp, value: 63, value_classification: "Greed" },
        { timestamp: thirtyDaysAgoTimestamp, value: 30, value_classification: "Fear" }
      ]
    });
    const oldestFirst = normalizeFearGreedSnapshot({
      data: [
        { timestamp: thirtyDaysAgoTimestamp, value: 30, value_classification: "Fear" },
        { timestamp: currentTimestamp, value: 63, value_classification: "Greed" }
      ]
    });

    expect(newestFirst?.value).toBe(63);
    expect(oldestFirst?.value).toBe(63);
    expect(newestFirst).toEqual(oldestFirst);
  });

  it("skips malformed readings and derives classification from valid numeric values", () => {
    const readings = normalizeFearGreedReadings({
      data: [
        { timestamp: currentTimestamp, value: "not-a-number", value_classification: "Greed" },
        { timestamp: "not-a-timestamp", value: 40, value_classification: "Fear" },
        { timestamp: sevenDaysAgoTimestamp, value: "48", value_classification: "unsupported-label" }
      ]
    });

    expect(readings).toEqual([
      {
        timestamp: "2026-04-27T12:30:00.000Z",
        value: 48,
        valueClassification: "Neutral",
        source: FEAR_GREED_SOURCE,
        updatedAt: "2026-04-27T12:30:00.000Z"
      }
    ]);
  });

  it("clamps out-of-range values into 0..100 using current implementation semantics", () => {
    const readings = normalizeFearGreedReadings({
      data: [
        { timestamp: currentTimestamp, value: 140, value_classification: "Extreme Greed" },
        { timestamp: sevenDaysAgoTimestamp, value: -8, value_classification: "Extreme Fear" }
      ]
    });

    expect(readings.map((reading) => reading.value)).toEqual([100, 0]);
  });

  it("derives last week, last month, year high, and year low from available history", () => {
    const snapshot = normalizeFearGreedSnapshot({
      data: [
        { timestamp: currentTimestamp, value: 62, value_classification: "Greed" },
        { timestamp: unixSeconds("2026-04-27T11:30:00.000Z"), value: 38, value_classification: "Fear" },
        { timestamp: unixSeconds("2026-04-27T23:00:00.000Z"), value: 42, value_classification: "Fear" },
        { timestamp: unixSeconds("2026-04-04T12:15:00.000Z"), value: 22, value_classification: "Extreme Fear" },
        { timestamp: unixSeconds("2026-03-15T12:00:00.000Z"), value: 84, value_classification: "Extreme Greed" },
        { timestamp: unixSeconds("2026-02-01T12:00:00.000Z"), value: 12, value_classification: "Extreme Fear" }
      ]
    });

    expect(snapshot).toMatchObject({
      value: 62,
      lastWeek: 38,
      lastMonth: 22,
      yearHigh: 84,
      yearLow: 12
    });
  });

  it("handles short history without crashing by using nearest available readings", () => {
    const snapshot = toFearGreedSnapshot([
      {
        timestamp: "2026-05-04T12:00:00.000Z",
        value: 57,
        valueClassification: "Greed",
        source: FEAR_GREED_SOURCE,
        updatedAt: "2026-05-04T12:00:00.000Z"
      }
    ]);

    expect(snapshot).toMatchObject({
      value: 57,
      lastWeek: 57,
      lastMonth: 57,
      yearHigh: 57,
      yearLow: 57
    });
  });

  it("returns safe null results for empty or malformed responses", () => {
    expect(normalizeFearGreedReadings({})).toEqual([]);
    expect(normalizeFearGreedSnapshot({})).toBeNull();
    expect(normalizeFearGreedSnapshot({ data: [] })).toBeNull();
    expect(normalizeFearGreedSnapshot({ data: [{ timestamp: "bad", value: "bad" }] })).toBeNull();
  });
});
