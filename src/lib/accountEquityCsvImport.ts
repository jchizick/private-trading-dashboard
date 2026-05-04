import type { AccountEquitySnapshot } from "@/types/performanceSources";
import type {
  EquityImportIssueCode,
  EquityImportResult,
  EquityImportRowError,
  EquityImportSeverity
} from "@/types/accountEquityImport";

interface ParseAccountEquityCsvOptions {
  sourceName?: string;
  importedAt?: string;
}

interface CsvRow {
  rowNumber: number;
  cells: string[];
}

interface ColumnIndexes {
  date?: number;
  equity?: number;
  cumulativeReturnPercent?: number;
}

const REQUIRED_COLUMNS: Array<keyof ColumnIndexes> = ["date", "equity", "cumulativeReturnPercent"];
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function createIssue({
  rowNumber,
  code,
  severity,
  message,
  column,
  rawValue
}: {
  rowNumber: number;
  code: EquityImportIssueCode;
  severity: EquityImportSeverity;
  message: string;
  column?: string;
  rawValue?: string;
}): EquityImportRowError {
  return {
    rowNumber,
    code,
    severity,
    message,
    column,
    rawValue
  };
}

function isBlankCell(value: string) {
  return value.trim() === "";
}

function isBlankRow(row: CsvRow) {
  return row.cells.every(isBlankCell);
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function getLogicalColumn(header: string): keyof ColumnIndexes | null {
  const normalizedHeader = normalizeHeader(header);

  if (normalizedHeader === "date") {
    return "date";
  }

  if (normalizedHeader === "equity") {
    return "equity";
  }

  if (
    normalizedHeader === "cumulativereturnpercent" ||
    normalizedHeader === "cumulativereturn%" ||
    normalizedHeader === "totalreturnpercent" ||
    normalizedHeader === "totalreturn%" ||
    normalizedHeader === "totalreturn" ||
    normalizedHeader === "cumulativereturn" ||
    normalizedHeader === "percentchange" ||
    normalizedHeader === "%change" ||
    normalizedHeader === "pctchange"
  ) {
    return "cumulativeReturnPercent";
  }

  return null;
}

function pushCsvRow(rows: CsvRow[], rowNumber: number, cells: string[]) {
  rows.push({
    rowNumber,
    cells
  });
}

function parseCsvRows(csvText: string) {
  const rows: CsvRow[] = [];
  const issues: EquityImportRowError[] = [];
  const text = csvText.replace(/^\uFEFF/, "");
  let currentCell = "";
  let currentCells: string[] = [];
  let inQuotes = false;
  let rowNumber = 1;
  let currentLine = 1;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentCell += char;

        if (char === "\n") {
          currentLine += 1;
        }
      }

      continue;
    }

    if (char === '"' && currentCell === "") {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      currentCells.push(currentCell);
      currentCell = "";
      continue;
    }

    if (char === "\r" || char === "\n") {
      currentCells.push(currentCell);
      pushCsvRow(rows, rowNumber, currentCells);
      currentCells = [];
      currentCell = "";

      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentLine += 1;
      rowNumber = currentLine;
      continue;
    }

    currentCell += char;
  }

  if (inQuotes) {
    issues.push(
      createIssue({
        rowNumber,
        code: "malformed_csv_row",
        severity: "error",
        message: "Row has an unmatched quote."
      })
    );
  }

  if (currentCell !== "" || currentCells.length > 0 || text.length > 0) {
    currentCells.push(currentCell);
    pushCsvRow(rows, rowNumber, currentCells);
  }

  return { rows, issues };
}

function parseHeader(row: CsvRow, issues: EquityImportRowError[]) {
  const columnIndexes: ColumnIndexes = {};
  const seenUnexpectedColumns = new Set<string>();

  row.cells.forEach((header, index) => {
    const trimmedHeader = header.trim();
    const logicalColumn = getLogicalColumn(trimmedHeader);

    if (logicalColumn) {
      if (typeof columnIndexes[logicalColumn] === "undefined") {
        columnIndexes[logicalColumn] = index;
      }

      return;
    }

    if (trimmedHeader && !seenUnexpectedColumns.has(trimmedHeader)) {
      seenUnexpectedColumns.add(trimmedHeader);
      issues.push(
        createIssue({
          rowNumber: row.rowNumber,
          code: "unexpected_column",
          severity: "warning",
          message: `Unexpected column "${trimmedHeader}" will be ignored.`,
          column: trimmedHeader
        })
      );
    }
  });

  for (const requiredColumn of REQUIRED_COLUMNS) {
    if (typeof columnIndexes[requiredColumn] === "undefined") {
      issues.push(
        createIssue({
          rowNumber: row.rowNumber,
          code: "missing_required_column",
          severity: "error",
          message: `Missing required column "${requiredColumn}".`,
          column: requiredColumn
        })
      );
    }
  }

  return columnIndexes;
}

function isValidISODate(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  );
}

function parseEquity(value: string) {
  const normalizedValue = value.trim().replace(/^\$/, "").replace(/,/g, "");

  if (normalizedValue === "") {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parsePercent(value: string) {
  const normalizedValue = value.trim().replace(/%$/, "");

  if (normalizedValue === "") {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function getCell(row: CsvRow, columnIndex: number | undefined) {
  if (typeof columnIndex === "undefined") {
    return "";
  }

  return row.cells[columnIndex] ?? "";
}

function getPopulatedExtraCells(row: CsvRow, expectedCells: number) {
  return row.cells.slice(expectedCells).filter((cell) => !isBlankCell(cell));
}

function hasImportBlockingErrors(issues: EquityImportRowError[]) {
  return issues.some((issue) => issue.severity === "error");
}

function createEmptyResult({
  importedAt,
  sourceName,
  issues,
  rowsSkipped
}: {
  importedAt: string;
  sourceName?: string;
  issues: EquityImportRowError[];
  rowsSkipped: number;
}): EquityImportResult {
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;

  return {
    ok: errorCount === 0,
    records: [],
    summary: {
      rowsParsed: 0,
      rowsSkipped,
      errorCount,
      warningCount,
      dateRange: {
        startDate: null,
        endDate: null
      },
      latestEquity: null,
      importedAt,
      sourceName
    },
    issues
  };
}

export function parseAccountEquityCsv(
  csvText: string,
  options: ParseAccountEquityCsvOptions = {}
): EquityImportResult {
  const importedAt = options.importedAt ?? new Date().toISOString();
  const { rows, issues } = parseCsvRows(csvText);
  let rowsSkipped = 0;

  const nonBlankRows = rows.filter((row) => {
    if (isBlankRow(row)) {
      rowsSkipped += 1;
      return false;
    }

    return true;
  });

  if (nonBlankRows.length === 0) {
    issues.push(
      createIssue({
        rowNumber: 1,
        code: "empty_file",
        severity: "error",
        message: "CSV file is empty or contains only blank rows."
      })
    );

    return createEmptyResult({
      importedAt,
      sourceName: options.sourceName,
      issues,
      rowsSkipped
    });
  }

  const headerRow = nonBlankRows[0];
  const dataRows = nonBlankRows.slice(1);
  const columnIndexes = parseHeader(headerRow, issues);
  const expectedCells = headerRow.cells.length;
  const records: AccountEquitySnapshot[] = [];
  const seenDates = new Set<string>();
  const duplicateDates = new Set<string>();
  let previousDate: string | null = null;
  let hasOutOfOrderRows = false;

  for (const row of dataRows) {
    const rowIssues: EquityImportRowError[] = [];
    const extraCells = getPopulatedExtraCells(row, expectedCells);

    if (extraCells.length > 0) {
      rowIssues.push(
        createIssue({
          rowNumber: row.rowNumber,
          code: "malformed_csv_row",
          severity: "error",
          message:
            "Row has more cells than the header. Quote comma-formatted equity values such as \"$100,000.50\".",
          rawValue: row.cells.join(",")
        })
      );
    }

    const rawDate = getCell(row, columnIndexes.date).trim();
    const rawEquity = getCell(row, columnIndexes.equity).trim();
    const rawCumulativeReturn = getCell(row, columnIndexes.cumulativeReturnPercent).trim();

    if (!rawDate) {
      rowIssues.push(
        createIssue({
          rowNumber: row.rowNumber,
          code: "missing_date",
          severity: "error",
          message: "Missing date.",
          column: "date"
        })
      );
    } else if (!isValidISODate(rawDate)) {
      rowIssues.push(
        createIssue({
          rowNumber: row.rowNumber,
          code: "invalid_date",
          severity: "error",
          message: "Date must be a valid ISO date in YYYY-MM-DD format.",
          column: "date",
          rawValue: rawDate
        })
      );
    }

    const parsedEquity = parseEquity(rawEquity);

    if (!rawEquity) {
      rowIssues.push(
        createIssue({
          rowNumber: row.rowNumber,
          code: "missing_equity",
          severity: "error",
          message: "Missing equity.",
          column: "equity"
        })
      );
    } else if (parsedEquity === null) {
      rowIssues.push(
        createIssue({
          rowNumber: row.rowNumber,
          code: "invalid_equity",
          severity: "error",
          message: "Equity must be a valid number, optionally with commas or a leading currency symbol.",
          column: "equity",
          rawValue: rawEquity
        })
      );
    } else if (parsedEquity < 0) {
      rowIssues.push(
        createIssue({
          rowNumber: row.rowNumber,
          code: "negative_equity",
          severity: "error",
          message: "Equity cannot be negative.",
          column: "equity",
          rawValue: rawEquity
        })
      );
    }

    const parsedCumulativeReturn = parsePercent(rawCumulativeReturn);

    if (!rawCumulativeReturn) {
      rowIssues.push(
        createIssue({
          rowNumber: row.rowNumber,
          code: "missing_cumulative_return_percent",
          severity: "error",
          message: "Missing cumulative return percent.",
          column: "cumulativeReturnPercent"
        })
      );
    } else if (parsedCumulativeReturn === null) {
      rowIssues.push(
        createIssue({
          rowNumber: row.rowNumber,
          code: "invalid_cumulative_return_percent",
          severity: "error",
          message: "Cumulative return percent must be a valid number, optionally followed by a percent sign.",
          column: "cumulativeReturnPercent",
          rawValue: rawCumulativeReturn
        })
      );
    }

    if (rawDate && seenDates.has(rawDate)) {
      duplicateDates.add(rawDate);
      rowIssues.push(
        createIssue({
          rowNumber: row.rowNumber,
          code: "duplicate_date",
          severity: "error",
          message: `Duplicate date "${rawDate}" found in CSV.`,
          column: "date",
          rawValue: rawDate
        })
      );
    }

    if (previousDate && rawDate && isValidISODate(rawDate) && rawDate < previousDate) {
      hasOutOfOrderRows = true;
    }

    if (rawDate && isValidISODate(rawDate)) {
      seenDates.add(rawDate);
      previousDate = rawDate;
    }

    issues.push(...rowIssues);

    if (
      rowIssues.length === 0 &&
      parsedEquity !== null &&
      parsedCumulativeReturn !== null &&
      rawDate
    ) {
      records.push({
        id: `equity-${rawDate}`,
        date: rawDate,
        equity: parsedEquity,
        cumulativeReturnPercent: parsedCumulativeReturn,
        source: "csv_import",
        importedAt
      });
    }
  }

  if (hasOutOfOrderRows) {
    issues.push(
      createIssue({
        rowNumber: headerRow.rowNumber,
        code: "out_of_order_rows",
        severity: "warning",
        message: "Rows are out of chronological order and will be sorted by date."
      })
    );
  }

  if (duplicateDates.size > 0) {
    for (const date of duplicateDates) {
      const firstDuplicateRow = dataRows.find((row) => getCell(row, columnIndexes.date).trim() === date);

      if (firstDuplicateRow) {
        issues.push(
          createIssue({
            rowNumber: firstDuplicateRow.rowNumber,
            code: "duplicate_date",
            severity: "error",
            message: `Duplicate date "${date}" blocks import.`,
            column: "date",
            rawValue: date
          })
        );
      }
    }
  }

  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const latestRecord = sortedRecords.at(-1);

  return {
    ok: !hasImportBlockingErrors(issues),
    records: sortedRecords,
    summary: {
      rowsParsed: sortedRecords.length,
      rowsSkipped,
      errorCount,
      warningCount,
      dateRange: {
        startDate: sortedRecords[0]?.date ?? null,
        endDate: latestRecord?.date ?? null
      },
      latestEquity: latestRecord?.equity ?? null,
      importedAt,
      sourceName: options.sourceName
    },
    issues
  };
}
