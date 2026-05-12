import type {
  ISODate,
  ISODateTime,
  PerformanceReviewSnapshot
} from "@/types/performanceSources";
import type { MarketQuoteProvider, MarketQuoteStatus } from "@/types/marketQuotes";

export type SnapshotStatus = "draft" | "saved" | "archived";
export type ChecklistStatus = "checked" | "watch" | "not checked";
export type TradingBiasOption =
  | "Bullish"
  | "Bearish"
  | "Neutral"
  | "Long Selective"
  | "Short Selective"
  | "Range / Chop"
  | "Risk Off";
export type TradingBias = TradingBiasOption | (string & {});
export type RiskState = "constructive" | "balanced" | "defensive";
export type TrendDirection = "bullish" | "bearish" | "neutral";
export type SessionStatus = "positive" | "negative" | "mixed";
export type GammaRegime = "positive gamma" | "negative gamma" | "transition";
export type GammaStatus = "pending" | "not_checked" | "checked" | "unavailable" | "market_closed";
export type MarketQuoteSourceState = "live" | "cached" | "partial" | "mock";
export type DailySnapshotSource = "manual" | "mock" | "market_data";
export type FearGreedLabel = "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed" | "Unknown";
export type CurrentPositionSide = "Long" | "Short" | "Flat";
export type MarketNewsCategory = "equities" | "fx" | "crypto" | "macro" | "rates" | "energy";

export interface CapturedMarketQuoteRow {
  displaySymbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  provider: MarketQuoteProvider;
  providerSymbol: string | null;
  status: MarketQuoteStatus;
  sourceLabel: string;
  asOf: ISODateTime | null;
}

// Persistence/domain types are intentionally separate from src/types/dashboard.ts.
// The dashboard.ts contracts remain frontend view models for the current shell.
export interface DailyDashboardSnapshot {
  id: string;
  tradingDate: ISODate;
  status: SnapshotStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  sessionState: {
    sessionStatus: SessionStatus;
    riskState: RiskState;
    mode: "focused" | "review" | "post-session";
    lastUpdatedAt: ISODateTime;
  };
  spx: SpxSnapshot;
  gamma: GammaSnapshot;
  fearGreed: FearGreedSnapshot;
  marketNews: MarketNewsItem[];
  synthesis: SynthesisNotes;
  checklist: TradingChecklistItem[];
  currentPosition: CurrentPositionSnapshot | null;
  performanceReview: PerformanceReviewSnapshot;
  externalToolLinks: ExternalToolLink[];
}

// Manual curated items today; future X/news ingestion should normalize watched-source output into this shape.
export interface MarketNewsItem {
  id: string;
  date: ISODate;
  headline: string;
  source: string;
  category: MarketNewsCategory;
  url?: string;
  timestamp?: string;
}

export interface SpxSnapshot {
  symbol: "SPX";
  latestClose: number | null;
  dailyTrend: TrendDirection;
  weeklyTrend: TrendDirection;
  marketStatus:
    | "ATH price discovery"
    | "sideways consolidation"
    | "correction"
    | "risk-off"
    | "recovery";
  keyLevels: Array<{
    label: string;
    price: number;
    bias: "support" | "resistance" | "pivot";
  }>;
  primaryQuote: CapturedMarketQuoteRow | null;
  quoteSourceState: MarketQuoteSourceState;
  watchlist: CapturedMarketQuoteRow[];
  source: DailySnapshotSource;
  capturedAt: ISODateTime;
}

export interface GammaSnapshot {
  regime: GammaRegime;
  status: GammaStatus;
  source: "manual" | "mock" | "uploaded_image" | "provider";
  sourceName: string;
  majorPositiveGamma: number | null;
  majorNegativeGamma: number | null;
  zeroGamma: number | null;
  spotReferencePrice?: number | null;
  capturedAt: ISODateTime | null;
  updatedAt: ISODateTime;
  notes?: string;
  sourceReferenceUrl?: string;
  distributionImageUrl?: string;
}

export interface FearGreedSnapshot {
  source: "CMC Crypto Fear and Greed Index" | string;
  value: number | null;
  label: FearGreedLabel;
  lastWeek: number | null;
  lastMonth: number | null;
  yearHigh: number | null;
  yearLow: number | null;
  updatedAt: ISODateTime | null;
  capturedAt: ISODateTime;
}

export interface SynthesisNotes {
  marketBias: TradingBias;
  primaryBias?: TradingBias;
  whatMattersToday: string;
  conditionsToWatch: string;
  invalidation: string;
  operatorNote: string;
  updatedAt: ISODateTime;
}

export interface CurrentPositionSnapshot {
  symbol: string;
  side: CurrentPositionSide;
  leverage: string;
  pnlPercent: number | null;
  note?: string;
  updatedAt: ISODateTime;
}

export interface TradingChecklistItem {
  id: string;
  label: string;
  sourceKey: string;
  status: ChecklistStatus;
  dailyNote?: string;
  updatedAt: ISODateTime;
}

export interface ExternalToolLink {
  id: string;
  label: string;
  url: string;
  category: "orderflow" | "gamma" | "macro" | "sentiment" | "journal" | "other";
  isDefault: boolean;
}
