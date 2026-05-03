import type { ExchangeTradeRecord, ISODateTime } from "@/types/performanceSources";

export type TradeLedgerImportSeverity = "error" | "warning";

export type TradeLedgerImportIssueCode =
  | "empty_file"
  | "missing_required_column"
  | "unexpected_column"
  | "blank_row"
  | "malformed_csv_row"
  | "missing_time"
  | "invalid_time"
  | "missing_symbol"
  | "invalid_direction"
  | "missing_status"
  | "ignored_open_row"
  | "ignored_non_filled_row"
  | "missing_closing_pnl"
  | "invalid_closing_pnl"
  | "missing_fee"
  | "invalid_fee"
  | "missing_filled_quantity"
  | "invalid_filled_quantity"
  | "missing_average_filled_price"
  | "invalid_average_filled_price"
  | "duplicate_trade";

export interface TradeLedgerImportRowError {
  rowNumber: number;
  code: TradeLedgerImportIssueCode;
  severity: TradeLedgerImportSeverity;
  message: string;
  column?: string;
  rawValue?: string;
}

export interface TradeLedgerImportSummary {
  rowsParsed: number;
  rowsSkipped: number;
  errorCount: number;
  warningCount: number;
  acceptedClosedTrades: number;
  ignoredOpenOrNonFilledRows: number;
  dateRange: {
    startTime: ISODateTime | null;
    endTime: ISODateTime | null;
  };
  symbolsDetected: string[];
  grossClosingPnl: number;
  totalFees: number;
  netRealizedPnl: number;
  importedAt: ISODateTime;
  sourceName?: string;
}

export interface TradeLedgerImportResult {
  ok: boolean;
  records: ExchangeTradeRecord[];
  summary: TradeLedgerImportSummary;
  issues: TradeLedgerImportRowError[];
}
