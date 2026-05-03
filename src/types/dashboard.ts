export type TrendDirection = "bullish" | "bearish" | "neutral";

export type SessionStatus = "positive" | "negative" | "mixed";

export type MarketStatus =
  | "ATH price discovery"
  | "sideways consolidation"
  | "correction"
  | "risk-off"
  | "recovery";

export type GammaRegime = "positive gamma" | "negative gamma" | "transition";

export type ReviewTag =
  | "A+ setup"
  | "discipline"
  | "overtrading"
  | "late entry"
  | "risk contained"
  | "missed plan";

export interface EquityPoint {
  label: string;
  valuePercent: number;
}

export interface PerformanceSnapshot {
  accountEquityCurvePercent: EquityPoint[];
  latestEquity: number | null;
  accountEquityChange: number | null;
  dailyPerformancePercent: number;
  weeklyPerformancePercent: number;
  monthlyPerformancePercent: number;
  ytdPerformancePercent: number | null;
  accountDrawdownPercent: number | null;
  winRatePercent: number | null;
  averageRiskReward: number | null;
  profitFactor: number | null;
  tradeCount: number | null;
  averageWin: number | null;
  averageLoss: number | null;
  reviewTags: string[];
  notes: string;
  lastUpdatedAt: string | null;
  sourceCoverage: {
    accountEquityHistory: boolean;
    exchangeTradeLedger: boolean;
  };
}

export interface TechnicalLevel {
  label: string;
  price: number;
  bias: "support" | "resistance" | "pivot";
}

export interface MarketSituation {
  symbol: "SPX";
  dailyTrend: TrendDirection;
  weeklyTrend: TrendDirection;
  latestDailyClose: number;
  sessionStatus: SessionStatus;
  marketStatus: MarketStatus;
  riskState: "constructive" | "balanced" | "defensive";
  keyTechnicalLevels: TechnicalLevel[];
  chartPlaceholderLabel: string;
  notes: string;
}

export interface GammaLevel {
  label: string;
  price: number;
  importance: "primary" | "secondary";
}

export interface GammaContext {
  imageSourceLabel: string;
  lastCheckedAt: string;
  regime: GammaRegime;
  keyGammaLevels: GammaLevel[];
  manualUploadAvailable: boolean;
  notes: string;
}

export interface ExternalToolContext {
  tool:
    | "CVD"
    | "Open Interest"
    | "Liquidation Heatmap"
    | "Funding Rates"
    | "Orderflow"
    | "Candlestick Telemetry"
    | "Volume Analysis"
    | "Net Long/Short";
  summary: string;
  status: "checked" | "watch" | "not checked";
}

export interface TradingContext {
  primaryBias: "long selective" | "short selective" | "neutral" | "no trade";
  activePlaybook: string;
  invalidation: string;
  externalTools: ExternalToolContext[];
  manualNotes: string;
}

export interface FearGreedSnapshot {
  source: "CMC Crypto Fear and Greed Index";
  value: number;
  label: "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed";
  lastWeek: number;
  lastMonth: number;
  yearHigh: number;
  yearLow: number;
  lastUpdatedAt: string;
}

export interface DashboardData {
  generatedAt: string;
  performance: PerformanceSnapshot;
  marketSituation: MarketSituation;
  gammaContext: GammaContext;
  fearGreed: FearGreedSnapshot;
  tradingContext: TradingContext;
}
