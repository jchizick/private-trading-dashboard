import type { DashboardData } from "@/types/dashboard";
import { mockAccountEquityHistory } from "@/data/mockPerformanceSources";
import { derivePerformanceReviewSnapshot } from "@/lib/performanceReviewCalculations";
import { toPerformanceSnapshot } from "@/lib/performanceReviewViewModel";

const derivedPerformanceReview = derivePerformanceReviewSnapshot(mockAccountEquityHistory, {
  asOfDate: "2026-05-01",
  note: {
    text:
      "Account trajectory is derived from equity history only; manual current position stays in daily snapshot state.",
    tags: ["discipline", "risk contained", "trade ledger pending"],
    updatedAt: "2026-05-01T09:42:00-04:00"
  }
});

export const dashboardData: DashboardData = {
  generatedAt: "2026-05-01T09:15:00-04:00",
  performance: toPerformanceSnapshot(derivedPerformanceReview),
  marketSituation: {
    symbol: "SPX",
    dailyTrend: "bullish",
    weeklyTrend: "neutral",
    latestDailyClose: 5148.21,
    sessionStatus: "positive",
    marketStatus: "sideways consolidation",
    riskState: "balanced",
    keyTechnicalLevels: [
      { label: "Prior high", price: 5185, bias: "resistance" },
      { label: "Balance pivot", price: 5120, bias: "pivot" },
      { label: "Demand shelf", price: 5068, bias: "support" }
    ],
    chartPlaceholderLabel: "SPX daily chart embed placeholder",
    notes:
      "Macro read is constructive but not impulsive. Treat SPX as supportive only above the balance pivot."
  },
  gammaContext: {
    imageSourceLabel: "SPX gamma by strike mock distribution",
    lastCheckedAt: "13:30 ET",
    regime: "positive gamma",
    keyGammaLevels: [
      { label: "Major Pos Gamma", price: 7260, importance: "primary" },
      { label: "Major Neg Gamma", price: 7240, importance: "primary" },
      { label: "Zero Gamma / Flip", price: 7250.83, importance: "secondary" }
    ],
    manualUploadAvailable: true,
    notes:
      "Positive gamma is concentrated above the flip; negative exposure remains clustered below major negative gamma."
  },
  fearGreed: {
    source: "CMC Crypto Fear and Greed Index",
    value: 45,
    label: "Neutral",
    lastWeek: 42,
    lastMonth: 51,
    yearHigh: 78,
    yearLow: 18,
    lastUpdatedAt: "09:00 ET"
  },
  tradingContext: {
    primaryBias: "long selective",
    activePlaybook: "Wait for external orderflow confirmation before pressing continuation.",
    invalidation: "No long bias if SPX loses 5115 and crypto majors reject VWAP reclaim.",
    externalTools: [
      {
        tool: "CVD",
        summary: "Use external platform read; dashboard stores only the final daily note.",
        status: "watch"
      },
      {
        tool: "Open Interest",
        summary: "Check whether breakout attempts are supported by healthy participation.",
        status: "checked"
      },
      {
        tool: "Liquidation Heatmap",
        summary: "Mark nearby liquidity pools manually when they matter for the session.",
        status: "watch"
      },
      {
        tool: "Funding Rates",
        summary: "Current conditions do not require a full funding module in MVP.",
        status: "not checked"
      },
      {
        tool: "Orderflow",
        summary: "Keep execution read on the dedicated platform.",
        status: "checked"
      },
      {
        tool: "Candlestick Telemetry",
        summary: "Use only as a final context note inside this dashboard.",
        status: "watch"
      },
      {
        tool: "Volume Analysis",
        summary: "Record whether volume confirms or fades the selected setup.",
        status: "checked"
      },
      {
        tool: "Net Long/Short",
        summary: "Manual sentiment note only until provider rules are defined.",
        status: "not checked"
      }
    ],
    manualNotes:
      "Do not rebuild execution tools here. This panel is for the synthesized read after checking the specialist platforms."
  }
};
