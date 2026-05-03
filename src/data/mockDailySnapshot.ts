import type { DailyDashboardSnapshot } from "@/types/dailySnapshot";

export const mockDailyDashboardSnapshot = {
  id: "daily-snapshot-2026-05-01",
  tradingDate: "2026-05-01",
  status: "saved",
  createdAt: "2026-05-01T08:42:00-04:00",
  updatedAt: "2026-05-01T13:35:00-04:00",
  sessionState: {
    sessionStatus: "positive",
    riskState: "balanced",
    mode: "focused",
    lastUpdatedAt: "2026-05-01T13:35:00-04:00"
  },
  spx: {
    symbol: "SPX",
    latestClose: 5148.21,
    dailyTrend: "bullish",
    weeklyTrend: "neutral",
    marketStatus: "sideways consolidation",
    keyLevels: [
      { label: "Prior high", price: 5185, bias: "resistance" },
      { label: "Balance pivot", price: 5120, bias: "pivot" },
      { label: "Demand shelf", price: 5068, bias: "support" }
    ],
    watchlist: [
      { symbol: "SPX500", last: 5148.21, change: 18.4, changePercent: 0.36, volumeLabel: "2.1B" },
      { symbol: "XAUUSD", last: 2331.8, change: -6.2, changePercent: -0.27, volumeLabel: "184K" },
      { symbol: "WTI", last: 78.42, change: 0.54, changePercent: 0.69, volumeLabel: "312K" },
      { symbol: "DXY", last: 104.68, change: -0.12, changePercent: -0.11, volumeLabel: "96K" },
      { symbol: "BTCUSDT", last: 64820.5, change: 410.2, changePercent: 0.64, volumeLabel: "38K" }
    ],
    source: "mock",
    capturedAt: "2026-05-01T09:15:00-04:00"
  },
  gamma: {
    regime: "positive gamma",
    status: "checked",
    source: "mock",
    sourceName: "@gexbot15",
    majorPositiveGamma: 7260,
    majorNegativeGamma: 7240,
    zeroGamma: 7250.83,
    spotReferencePrice: null,
    capturedAt: "2026-05-01T13:30:00-04:00",
    updatedAt: "2026-05-01T13:35:00-04:00",
    notes: "Positive gamma is concentrated above the flip; negative exposure remains clustered below major negative gamma."
  },
  fearGreed: {
    source: "CMC Crypto Fear and Greed Index",
    value: 45,
    label: "Neutral",
    lastWeek: 42,
    lastMonth: 51,
    yearHigh: 78,
    yearLow: 18,
    capturedAt: "2026-05-01T09:00:00-04:00"
  },
  synthesis: {
    primaryBias: "long selective",
    whatMattersToday: "Wait for external orderflow confirmation before pressing continuation.",
    conditionsToWatch: "Respect SPX balance conditions; require external confirmation before pressing size.",
    invalidation: "No long bias if SPX loses 5115 and crypto majors reject VWAP reclaim.",
    operatorNote: "Do not rebuild execution tools here. This panel is for the synthesized read after checking specialist platforms.",
    updatedAt: "2026-05-01T13:35:00-04:00"
  },
  checklist: [
    {
      id: "checklist-cvd",
      label: "CVD",
      sourceKey: "cvd",
      status: "watch",
      dailyNote: "Match only if continuation is supported by external platform read.",
      updatedAt: "2026-05-01T13:20:00-04:00"
    },
    {
      id: "checklist-open-interest",
      label: "Open Interest",
      sourceKey: "open_interest",
      status: "checked",
      updatedAt: "2026-05-01T13:21:00-04:00"
    },
    {
      id: "checklist-liquidation-heatmap",
      label: "Liquidation Heatmap",
      sourceKey: "liquidation_heatmap",
      status: "watch",
      updatedAt: "2026-05-01T13:22:00-04:00"
    },
    {
      id: "checklist-funding-rates",
      label: "Funding Rates",
      sourceKey: "funding_rates",
      status: "not checked",
      updatedAt: "2026-05-01T13:23:00-04:00"
    },
    {
      id: "checklist-orderflow",
      label: "Orderflow",
      sourceKey: "orderflow",
      status: "checked",
      updatedAt: "2026-05-01T13:24:00-04:00"
    },
    {
      id: "checklist-candlestick-telemetry",
      label: "Candlestick Telemetry",
      sourceKey: "candlestick_telemetry",
      status: "watch",
      updatedAt: "2026-05-01T13:25:00-04:00"
    },
    {
      id: "checklist-volume-analysis",
      label: "Volume Analysis",
      sourceKey: "volume_analysis",
      status: "checked",
      updatedAt: "2026-05-01T13:26:00-04:00"
    },
    {
      id: "checklist-net-long-short",
      label: "Net Long/Short",
      sourceKey: "net_long_short",
      status: "not checked",
      updatedAt: "2026-05-01T13:27:00-04:00"
    }
  ],
  performanceReview: {
    asOfDate: "2026-05-01",
    accountEquity: {
      latestEquity: 100900,
      equityCurvePercent: [
        { date: "2026-04-27", valuePercent: 0 },
        { date: "2026-04-28", valuePercent: 0.7 },
        { date: "2026-04-29", valuePercent: 0.2 },
        { date: "2026-04-30", valuePercent: 1.1 },
        { date: "2026-05-01", valuePercent: 0.9 }
      ],
      dailyReturnPercent: -0.2,
      weeklyReturnPercent: 0.9,
      monthlyReturnPercent: 3.4,
      ytdReturnPercent: 18.4,
      accountDrawdownPercent: -1.3
    },
    tradeStats: {
      closedTradePnl: 170.98,
      totalFees: 22.27,
      tradeCount: 3,
      winRatePercent: 66.67,
      averageWin: 122.59,
      averageLoss: -74.2,
      profitFactor: 3.31,
      symbolBreakdown: [
        { symbol: "BTCUSDT", pnl: 186.42, trades: 1 },
        { symbol: "ETHUSDT", pnl: -74.2, trades: 1 },
        { symbol: "SOLUSDT", pnl: 58.76, trades: 1 }
      ],
      directionBreakdown: [
        { direction: "long", pnl: 245.18, trades: 2 },
        { direction: "short", pnl: -74.2, trades: 1 }
      ],
      leverageNotes: "All sample records remain within 2x-5x review band.",
      marginModeNotes: "Mixed cross and isolated usage; review whether isolated trades matched planned risk."
    },
    note: {
      text: "Review focus: keep entries closer to planned invalidation and avoid adding size after the first impulse.",
      tags: ["discipline", "risk contained", "late entry"],
      updatedAt: "2026-05-01T09:42:00-04:00"
    },
    derivedAt: "2026-05-01T13:35:00-04:00",
    sourceCoverage: {
      accountEquityHistory: true,
      exchangeTradeLedger: true
    }
  },
  externalToolLinks: [
    {
      id: "tool-bookmap",
      label: "Bookmap",
      url: "https://bookmap.com",
      category: "orderflow",
      isDefault: true
    },
    {
      id: "tool-tradytics-spx-flow",
      label: "SPX Flow (Tradytics)",
      url: "https://tradytics.com",
      category: "orderflow",
      isDefault: true
    },
    {
      id: "tool-spotgamma",
      label: "SpotGamma",
      url: "https://spotgamma.com",
      category: "gamma",
      isDefault: true
    },
    {
      id: "tool-unusual-whales",
      label: "Unusual Whales",
      url: "https://unusualwhales.com",
      category: "sentiment",
      isDefault: true
    },
    {
      id: "tool-macro-calendar",
      label: "Macro Calendar",
      url: "https://www.forexfactory.com/calendar",
      category: "macro",
      isDefault: true
    }
  ]
} satisfies DailyDashboardSnapshot;
