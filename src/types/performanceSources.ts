export type ISODate = string;
export type ISODateTime = string;

export type PerformanceSource = "google_sheet" | "manual" | "csv_import";

export interface AccountEquitySnapshot {
  id: string;
  date: ISODate;
  equity: number;
  percentChange: number;
  source: PerformanceSource;
  importedAt?: ISODateTime;
}

export type ExchangeTradeDirection =
  | "Long"
  | "Short"
  | "Buy"
  | "Sell"
  | "Open Long"
  | "Open Short"
  | "Close Long"
  | "Close Short";

export interface ExchangeTradeRecord {
  id: string;
  sourceFileId?: string;
  futures: string;
  rawTime?: string;
  time: ISODateTime;
  direction: ExchangeTradeDirection;
  marginMode?: string;
  leverage?: number | null;
  amount?: number | null;
  amountAsset?: string | null;
  orderPrice?: number | null;
  filledQuantity?: number | null;
  filledQuantityAsset?: string | null;
  averageFilledPrice?: number | null;
  closingPnl?: number | null;
  fee?: number | null;
  status: string;
  importedAt?: ISODateTime;
  raw?: Record<string, string | number | null>;
}

export interface PerformanceReviewNote {
  text: string;
  tags: string[];
  updatedAt: ISODateTime;
}

export interface PerformanceReviewSnapshot {
  asOfDate: ISODate;
  accountEquity: {
    latestEquity?: number;
    equityCurvePercent: Array<{
      date: ISODate;
      valuePercent: number;
    }>;
    dailyReturnPercent?: number;
    weeklyReturnPercent?: number;
    monthlyReturnPercent?: number;
    ytdReturnPercent?: number;
    accountDrawdownPercent?: number;
  };
  tradeStats?: {
    closedTradePnl?: number;
    totalFees?: number;
    tradeCount?: number;
    winRatePercent?: number;
    averageWin?: number;
    averageLoss?: number;
    profitFactor?: number;
    symbolBreakdown?: Array<{
      symbol: string;
      pnl: number;
      trades: number;
    }>;
    directionBreakdown?: Array<{
      direction: "long" | "short";
      pnl: number;
      trades: number;
    }>;
    leverageNotes?: string;
    marginModeNotes?: string;
  };
  note: PerformanceReviewNote;
  derivedAt: ISODateTime;
  sourceCoverage: {
    accountEquityHistory: boolean;
    exchangeTradeLedger: boolean;
  };
}
