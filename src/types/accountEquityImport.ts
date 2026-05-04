import type { AccountEquitySnapshot, ISODate, ISODateTime } from "@/types/performanceSources";

export type EquityImportSeverity = "error" | "warning";

export type EquityImportIssueCode =
  | "empty_file"
  | "missing_required_column"
  | "unexpected_column"
  | "blank_row"
  | "malformed_csv_row"
  | "missing_date"
  | "invalid_date"
  | "missing_equity"
  | "invalid_equity"
  | "negative_equity"
  | "missing_cumulative_return_percent"
  | "invalid_cumulative_return_percent"
  | "duplicate_date"
  | "out_of_order_rows";

export interface EquityImportRowError {
  rowNumber: number;
  code: EquityImportIssueCode;
  severity: EquityImportSeverity;
  message: string;
  column?: string;
  rawValue?: string;
}

export interface EquityImportSummary {
  rowsParsed: number;
  rowsSkipped: number;
  errorCount: number;
  warningCount: number;
  dateRange: {
    startDate: ISODate | null;
    endDate: ISODate | null;
  };
  latestEquity: number | null;
  importedAt: ISODateTime;
  sourceName?: string;
}

export interface EquityImportResult {
  ok: boolean;
  records: AccountEquitySnapshot[];
  summary: EquityImportSummary;
  issues: EquityImportRowError[];
}
