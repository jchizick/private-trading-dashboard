import type { PerformanceReviewSnapshot } from "@/types/performanceSources";
import type { EquityPoint, PerformanceSnapshot } from "@/types/dashboard";
import type { TradeLedgerMetrics } from "@/lib/tradeLedgerCalculations";

function dateLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "UTC"
  }).format(parsedDate);
}

function toNumberOrNull(value: number | undefined) {
  return typeof value === "number" ? value : null;
}

function getAccountEquityChange(review: PerformanceReviewSnapshot) {
  const latestEquity = review.accountEquity.latestEquity;
  const latestCurvePoint = review.accountEquity.equityCurvePercent.at(-1);

  if (typeof latestEquity !== "number" || !latestCurvePoint) {
    return null;
  }

  const baseEquity = latestEquity / (1 + latestCurvePoint.valuePercent / 100);

  return Math.round((latestEquity - baseEquity) * 100) / 100;
}

function getEquityCurvePoints(review: PerformanceReviewSnapshot): EquityPoint[] {
  return review.accountEquity.equityCurvePercent.map((point) => ({
    label: dateLabel(point.date),
    valuePercent: point.valuePercent
  }));
}

export function withTradeLedgerMetrics(
  review: PerformanceReviewSnapshot,
  tradeMetrics: TradeLedgerMetrics | null
): PerformanceReviewSnapshot {
  if (!tradeMetrics || tradeMetrics.tradeCount === 0) {
    return review;
  }

  return {
    ...review,
    tradeStats: {
      ...review.tradeStats,
      closedTradePnl: tradeMetrics.netRealizedPnl,
      totalFees: tradeMetrics.totalFees,
      tradeCount: tradeMetrics.tradeCount,
      winRatePercent: tradeMetrics.winRatePercent ?? undefined,
      averageWin: tradeMetrics.averageWin ?? undefined,
      averageLoss: tradeMetrics.averageLoss ?? undefined,
      profitFactor: tradeMetrics.profitFactor ?? undefined,
      symbolBreakdown: tradeMetrics.symbolBreakdown,
      directionBreakdown: tradeMetrics.directionBreakdown
    },
    sourceCoverage: {
      ...review.sourceCoverage,
      exchangeTradeLedger: true
    }
  };
}

export function toPerformanceSnapshot(review: PerformanceReviewSnapshot): PerformanceSnapshot {
  const tradeStats = review.tradeStats;

  return {
    accountEquityCurvePercent: getEquityCurvePoints(review),
    latestEquity: toNumberOrNull(review.accountEquity.latestEquity),
    accountEquityChange: getAccountEquityChange(review),
    dailyPerformancePercent: review.accountEquity.dailyReturnPercent ?? 0,
    weeklyPerformancePercent: review.accountEquity.weeklyReturnPercent ?? 0,
    monthlyPerformancePercent: review.accountEquity.monthlyReturnPercent ?? 0,
    ytdPerformancePercent: toNumberOrNull(review.accountEquity.ytdReturnPercent),
    accountDrawdownPercent: toNumberOrNull(review.accountEquity.accountDrawdownPercent),
    winRatePercent: toNumberOrNull(tradeStats?.winRatePercent),
    averageRiskReward: null,
    profitFactor: toNumberOrNull(tradeStats?.profitFactor),
    tradeCount: toNumberOrNull(tradeStats?.tradeCount),
    averageWin: toNumberOrNull(tradeStats?.averageWin),
    averageLoss: toNumberOrNull(tradeStats?.averageLoss),
    reviewTags: review.note.tags,
    notes: review.note.text,
    lastUpdatedAt: review.derivedAt || review.note.updatedAt || null,
    sourceCoverage: review.sourceCoverage
  };
}

export function withTradeLedgerMetricsSnapshot(
  performance: PerformanceSnapshot,
  tradeMetrics: TradeLedgerMetrics | null
): PerformanceSnapshot {
  if (!tradeMetrics || tradeMetrics.tradeCount === 0) {
    return performance;
  }

  return {
    ...performance,
    winRatePercent: tradeMetrics.winRatePercent,
    profitFactor: tradeMetrics.profitFactor,
    tradeCount: tradeMetrics.tradeCount,
    averageWin: tradeMetrics.averageWin,
    averageLoss: tradeMetrics.averageLoss,
    sourceCoverage: {
      ...performance.sourceCoverage,
      exchangeTradeLedger: true
    }
  };
}
