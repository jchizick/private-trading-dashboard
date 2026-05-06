import { describe, expect, it } from "vitest";
import {
  buildEquityCurve,
  calculateDailyReturn,
  calculateMaxDrawdown,
  calculateReturnForPeriod,
  derivePerformanceReviewSnapshot
} from "@/lib/performanceReviewCalculations";
import { toPerformanceSnapshot } from "@/lib/performanceReviewViewModel";
import type { AccountEquitySnapshot } from "@/types/performanceSources";

function equity(date: string, value: number, cumulativeReturnPercent: number): AccountEquitySnapshot {
  return {
    id: `equity-${date}`,
    date,
    equity: value,
    cumulativeReturnPercent,
    source: "csv_import",
    importedAt: "2026-05-04T14:30:00.000Z"
  };
}

const outOfOrderHistory = [
  equity("2026-05-03", 291.79, 192),
  equity("2025-12-31", 80, -20),
  equity("2026-05-02", 292.81, 193),
  equity("2026-04-20", 275, 175),
  equity("2026-04-10", 250, 150),
  equity("2026-01-02", 100, 0)
];

describe("account equity performance calculations", () => {
  it("derives Daily return from latest and previous equity values, not cumulative return", () => {
    const expected = ((291.79 - 292.81) / 292.81) * 100;
    const review = derivePerformanceReviewSnapshot(outOfOrderHistory, {
      asOfDate: "2026-05-03"
    });

    expect(calculateDailyReturn(outOfOrderHistory, "2026-05-03")).toBeCloseTo(expected, 2);
    expect(review.accountEquity.dailyReturnPercent).toBeCloseTo(-0.35, 2);
    expect(review.accountEquity.dailyReturnPercent).not.toBe(192);
  });

  it("derives Weekly return from the first available row in the weekly window to latest", () => {
    const expected = ((291.79 - 292.81) / 292.81) * 100;

    expect(calculateReturnForPeriod(outOfOrderHistory, "2026-05-03", "weekly")).toBeCloseTo(expected, 2);
  });

  it("derives Monthly return from the first available row in the monthly window to latest", () => {
    const expected = ((291.79 - 250) / 250) * 100;

    expect(calculateReturnForPeriod(outOfOrderHistory, "2026-05-03", "monthly")).toBeCloseTo(expected, 2);
  });

  it("derives YTD return from the first available equity row in the current calendar year", () => {
    const expected = ((291.79 - 100) / 100) * 100;

    expect(calculateReturnForPeriod(outOfOrderHistory, "2026-05-03", "ytd")).toBeCloseTo(expected, 2);
  });

  it("derives Equity Change as latest equity minus first equity in imported history", () => {
    const review = derivePerformanceReviewSnapshot(outOfOrderHistory, {
      asOfDate: "2026-05-03"
    });
    const performance = toPerformanceSnapshot(review);

    expect(performance.latestEquity).toBe(291.79);
    expect(performance.accountEquityChange).toBeCloseTo(211.79, 2);
  });

  it("keeps source dates on display equity curve points for stable React keys", () => {
    const review = derivePerformanceReviewSnapshot(outOfOrderHistory, {
      asOfDate: "2026-05-03"
    });
    const performance = toPerformanceSnapshot(review);

    expect(performance.accountEquityCurvePercent.map((point) => point.date)).toEqual([
      "2025-12-31",
      "2026-01-02",
      "2026-04-10",
      "2026-04-20",
      "2026-05-02",
      "2026-05-03"
    ]);
    expect(performance.accountEquityCurvePercent.map((point) => point.label)).toEqual([
      "Wed",
      "Fri",
      "Fri",
      "Mon",
      "Sat",
      "Sun"
    ]);
  });

  it("derives Max Drawdown from the equity path", () => {
    expect(calculateMaxDrawdown(outOfOrderHistory)).toBeCloseTo(-0.35, 2);
  });

  it("sorts out-of-order input before deriving the equity curve and review snapshot", () => {
    const curve = buildEquityCurve(outOfOrderHistory);
    const review = derivePerformanceReviewSnapshot(outOfOrderHistory, {
      asOfDate: "2026-05-03"
    });

    expect(curve.map((point) => point.date)).toEqual([
      "2025-12-31",
      "2026-01-02",
      "2026-04-10",
      "2026-04-20",
      "2026-05-02",
      "2026-05-03"
    ]);
    expect(review.accountEquity.latestEquity).toBe(291.79);
    expect(review.accountEquity.weeklyReturnPercent).toBeCloseTo(-0.35, 2);
    expect(review.accountEquity.monthlyReturnPercent).toBeCloseTo(16.72, 2);
    expect(review.accountEquity.ytdReturnPercent).toBeCloseTo(191.79, 2);
  });
});
