import type { ExchangeTradeDirection, ExchangeTradeRecord } from "@/types/performanceSources";
import type {
  TradeLedgerImportIssueCode,
  TradeLedgerImportResult,
  TradeLedgerImportRowError,
  TradeLedgerImportSeverity
} from "@/types/tradeLedgerImport";
import { deriveTradeLedgerMetrics, getTradeNetPnl } from "@/lib/tradeLedgerCalculations";

interface ParseExchangeTradeLedgerCsvOptions {
  sourceName?: string;
  importedAt?: string;
}

interface CsvRow {
  rowNumber: number;
  cells: string[];
}

interface ColumnIndexes {
  futures?: number;
  time?: number;
  direction?: number;
  marginMode?: number;
  leverage?: number;
  amount?: number;
  orderPrice?: number;
  filledQuantity?: number;
  averageFilledPrice?: number;
  closingPnl?: number;
  fee?: number;
  status?: number;
}

const REQUIRED_COLUMNS: Array<keyof ColumnIndexes> = [
  "futures",
  "time",
  "direction",
  "filledQuantity",
  "averageFilledPrice",
  "closingPnl",
  "fee",
  "status"
];
const TRADE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

function createIssue({
  rowNumber,
  code,
  severity,
  message,
  column,
  rawValue
}: {
  rowNumber: number;
  code: TradeLedgerImportIssueCode;
  severity: TradeLedgerImportSeverity;
  message: string;
  column?: string;
  rawValue?: string;
}): TradeLedgerImportRowError {
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

  if (["futures", "symbol", "market", "contract", "pair"].includes(normalizedHeader)) {
    return "futures";
  }

  if (["time", "datetime", "createdtime", "filledtime", "executedat"].includes(normalizedHeader)) {
    return "time";
  }

  if (["direction", "side", "tradedirection"].includes(normalizedHeader)) {
    return "direction";
  }

  if (["marginmode", "margin", "mode"].includes(normalizedHeader)) {
    return "marginMode";
  }

  if (["leverage", "lev"].includes(normalizedHeader)) {
    return "leverage";
  }

  if (["amount", "orderamount", "size"].includes(normalizedHeader)) {
    return "amount";
  }

  if (["orderprice", "price"].includes(normalizedHeader)) {
    return "orderPrice";
  }

  if (["filledquantity", "filledqty", "executedquantity", "executedqty"].includes(normalizedHeader)) {
    return "filledQuantity";
  }

  if (["avgfilledprice", "averagefilledprice", "avgprice"].includes(normalizedHeader)) {
    return "averageFilledPrice";
  }

  if (["closingpnl", "closedpnl", "realizedpnl"].includes(normalizedHeader)) {
    return "closingPnl";
  }

  if (["fee", "tradingfee", "fees"].includes(normalizedHeader)) {
    return "fee";
  }

  if (["status", "orderstatus"].includes(normalizedHeader)) {
    return "status";
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
  const issues: TradeLedgerImportRowError[] = [];
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

function parseHeader(row: CsvRow, issues: TradeLedgerImportRowError[]) {
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

function getCell(row: CsvRow, columnIndex: number | undefined) {
  if (typeof columnIndex === "undefined") {
    return "";
  }

  return row.cells[columnIndex] ?? "";
}

function getPopulatedExtraCells(row: CsvRow, expectedCells: number) {
  return row.cells.slice(expectedCells).filter((cell) => !isBlankCell(cell));
}

function getTimeZoneParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
  const parts = formatter.formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
    hour: Number(parts.find((part) => part.type === "hour")?.value),
    minute: Number(parts.find((part) => part.type === "minute")?.value),
    second: Number(parts.find((part) => part.type === "second")?.value)
  };
}

function parseTorontoTradeTime(value: string) {
  const match = value.trim().match(TRADE_TIME_PATTERN);

  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match;
  const target = {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
    hour: Number(hourText),
    minute: Number(minuteText),
    second: Number(secondText)
  };
  const initialUtc = Date.UTC(
    target.year,
    target.month - 1,
    target.day,
    target.hour,
    target.minute,
    target.second
  );
  const initialParts = getTimeZoneParts(new Date(initialUtc));
  const targetAsUtc = Date.UTC(
    target.year,
    target.month - 1,
    target.day,
    target.hour,
    target.minute,
    target.second
  );
  const initialPartsAsUtc = Date.UTC(
    initialParts.year,
    initialParts.month - 1,
    initialParts.day,
    initialParts.hour,
    initialParts.minute,
    initialParts.second
  );
  const correctedDate = new Date(initialUtc + (targetAsUtc - initialPartsAsUtc));
  const correctedParts = getTimeZoneParts(correctedDate);
  const isValid =
    correctedParts.year === target.year &&
    correctedParts.month === target.month &&
    correctedParts.day === target.day &&
    correctedParts.hour === target.hour &&
    correctedParts.minute === target.minute &&
    correctedParts.second === target.second;

  return isValid ? correctedDate.toISOString() : null;
}

function normalizeDirection(value: string): ExchangeTradeDirection | null {
  const normalizedValue = value.trim().toLowerCase().replace(/\s+/g, " ");

  if (normalizedValue === "open long") {
    return "Open Long";
  }

  if (normalizedValue === "open short") {
    return "Open Short";
  }

  if (normalizedValue === "close long") {
    return "Close Long";
  }

  if (normalizedValue === "close short") {
    return "Close Short";
  }

  return null;
}

function normalizeStatus(value: string) {
  const normalizedValue = value.trim().toLowerCase().replace(/\s+/g, " ");

  if (!normalizedValue) {
    return "";
  }

  return normalizedValue
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseLeverage(value: string) {
  const normalizedValue = value.trim().replace(/x$/i, "");

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parseNumberWithOptionalAsset(value: string) {
  const match = value.trim().match(/^([+-]?(?:\d+(?:,\d{3})*|\d+)(?:\.\d+)?)(?:\s*([A-Za-z][A-Za-z0-9]*))?$/);

  if (!match) {
    return null;
  }

  const parsedValue = Number(match[1].replace(/,/g, ""));

  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return {
    value: parsedValue,
    asset: match[2] ?? null
  };
}

function parseOrderPrice(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue || trimmedValue.toLowerCase() === "market") {
    return null;
  }

  const parsedValue = Number(trimmedValue.replace(/,/g, ""));

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function createRawRow(headers: string[], row: CsvRow) {
  return headers.reduce<Record<string, string | number | null>>((raw, header, index) => {
    if (header.trim()) {
      raw[header.trim()] = row.cells[index] ?? "";
    }

    return raw;
  }, {});
}

function createCompositeKey({
  futures,
  time,
  direction,
  marginMode,
  leverage,
  amount,
  amountAsset,
  orderPrice,
  filledQuantity,
  filledQuantityAsset,
  averageFilledPrice,
  closingPnl,
  closingPnlAsset,
  fee,
  feeAsset,
  status
}: {
  futures: string;
  time: string;
  direction: ExchangeTradeDirection;
  marginMode: string;
  leverage: number | null;
  amount: number | null;
  amountAsset: string | null;
  orderPrice: string;
  filledQuantity: number;
  filledQuantityAsset: string | null;
  averageFilledPrice: number;
  closingPnl: number;
  closingPnlAsset: string | null;
  fee: number;
  feeAsset: string | null;
  status: string;
}) {
  return [
    futures.toUpperCase(),
    time,
    direction,
    marginMode.toLowerCase(),
    leverage ?? "",
    amount ?? "",
    amountAsset?.toUpperCase() ?? "",
    orderPrice.toLowerCase(),
    filledQuantity,
    filledQuantityAsset?.toUpperCase() ?? "",
    averageFilledPrice,
    closingPnl,
    closingPnlAsset?.toUpperCase() ?? "",
    fee,
    feeAsset?.toUpperCase() ?? "",
    status.toLowerCase()
  ].join("|");
}

function hasImportBlockingErrors(issues: TradeLedgerImportRowError[]) {
  return issues.some((issue) => issue.severity === "error");
}

function createEmptyResult({
  importedAt,
  sourceName,
  issues,
  rowsSkipped,
  rowsParsed
}: {
  importedAt: string;
  sourceName?: string;
  issues: TradeLedgerImportRowError[];
  rowsSkipped: number;
  rowsParsed: number;
}): TradeLedgerImportResult {
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;

  return {
    ok: errorCount === 0,
    records: [],
    summary: {
      rowsParsed,
      rowsSkipped,
      errorCount,
      warningCount,
      acceptedClosedTrades: 0,
      ignoredOpenOrNonFilledRows: 0,
      dateRange: {
        startTime: null,
        endTime: null
      },
      symbolsDetected: [],
      grossClosingPnl: 0,
      totalFees: 0,
      netRealizedPnl: 0,
      importedAt,
      sourceName
    },
    issues
  };
}

export function parseExchangeTradeLedgerCsv(
  csvText: string,
  options: ParseExchangeTradeLedgerCsvOptions = {}
): TradeLedgerImportResult {
  const importedAt = options.importedAt ?? new Date().toISOString();
  const { rows, issues } = parseCsvRows(csvText);
  let rowsSkipped = 0;
  let ignoredOpenOrNonFilledRows = 0;

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
      rowsSkipped,
      rowsParsed: 0
    });
  }

  const headerRow = nonBlankRows[0];
  const headers = headerRow.cells.map((header) => header.trim());
  const dataRows = nonBlankRows.slice(1);
  const columnIndexes = parseHeader(headerRow, issues);
  const expectedCells = headerRow.cells.length;
  const records: ExchangeTradeRecord[] = [];
  const duplicateKeys = new Map<string, number>();
  const symbolsDetected = new Set<string>();

  for (const row of dataRows) {
    const rowIssues: TradeLedgerImportRowError[] = [];
    const extraCells = getPopulatedExtraCells(row, expectedCells);

    if (extraCells.length > 0) {
      rowIssues.push(
        createIssue({
          rowNumber: row.rowNumber,
          code: "malformed_csv_row",
          severity: "error",
          message: "Row has more cells than the header. Quote comma-formatted values if needed.",
          rawValue: row.cells.join(",")
        })
      );
    }

    const rawFutures = getCell(row, columnIndexes.futures).trim().toUpperCase();
    const rawTime = getCell(row, columnIndexes.time).trim();
    const rawDirection = getCell(row, columnIndexes.direction).trim();
    const rawStatus = getCell(row, columnIndexes.status).trim();
    const rawFilledQuantity = getCell(row, columnIndexes.filledQuantity).trim();
    const rawAverageFilledPrice = getCell(row, columnIndexes.averageFilledPrice).trim();
    const rawClosingPnl = getCell(row, columnIndexes.closingPnl).trim();
    const rawFee = getCell(row, columnIndexes.fee).trim();
    const rawLeverage = getCell(row, columnIndexes.leverage).trim();
    const rawAmount = getCell(row, columnIndexes.amount).trim();
    const rawOrderPrice = getCell(row, columnIndexes.orderPrice).trim();
    const rawMarginMode = getCell(row, columnIndexes.marginMode).trim();

    if (!rawFutures) {
      rowIssues.push(
        createIssue({
          rowNumber: row.rowNumber,
          code: "missing_symbol",
          severity: "error",
          message: "Missing futures symbol.",
          column: "futures"
        })
      );
    } else {
      symbolsDetected.add(rawFutures);
    }

    const parsedTime = rawTime ? parseTorontoTradeTime(rawTime) : null;

    if (!rawTime) {
      rowIssues.push(
        createIssue({
          rowNumber: row.rowNumber,
          code: "missing_time",
          severity: "error",
          message: "Missing trade time.",
          column: "time"
        })
      );
    } else if (!parsedTime) {
      rowIssues.push(
        createIssue({
          rowNumber: row.rowNumber,
          code: "invalid_time",
          severity: "error",
          message: "Time must be valid and use YYYY-MM-DD HH:mm:ss format.",
          column: "time",
          rawValue: rawTime
        })
      );
    }

    const direction = normalizeDirection(rawDirection);

    if (!direction) {
      rowIssues.push(
        createIssue({
          rowNumber: row.rowNumber,
          code: "invalid_direction",
          severity: "error",
          message: "Direction must be Open Long, Open Short, Close Long, or Close Short.",
          column: "direction",
          rawValue: rawDirection
        })
      );
    }

    const status = normalizeStatus(rawStatus);

    if (!status) {
      rowIssues.push(
        createIssue({
          rowNumber: row.rowNumber,
          code: "missing_status",
          severity: "error",
          message: "Missing order status.",
          column: "status"
        })
      );
    }

    const isFilled = status.toLowerCase() === "filled";
    const isCloseDirection = direction === "Close Long" || direction === "Close Short";

    if (status && !isFilled) {
      ignoredOpenOrNonFilledRows += 1;
      rowIssues.push(
        createIssue({
          rowNumber: row.rowNumber,
          code: "ignored_non_filled_row",
          severity: "warning",
          message: `Status "${status}" is ignored for closed-trade metrics.`,
          column: "status",
          rawValue: rawStatus
        })
      );
    }

    if (isFilled && direction && !isCloseDirection) {
      ignoredOpenOrNonFilledRows += 1;
      rowIssues.push(
        createIssue({
          rowNumber: row.rowNumber,
          code: "ignored_open_row",
          severity: "warning",
          message: `Direction "${direction}" is ignored for closed-trade metrics.`,
          column: "direction",
          rawValue: rawDirection
        })
      );
    }

    const filledQuantity = parseNumberWithOptionalAsset(rawFilledQuantity);
    const averageFilledPrice = parseOrderPrice(rawAverageFilledPrice);
    const closingPnl = parseNumberWithOptionalAsset(rawClosingPnl);
    const fee = parseNumberWithOptionalAsset(rawFee);

    if (isFilled && isCloseDirection) {
      if (!rawFilledQuantity) {
        rowIssues.push(
          createIssue({
            rowNumber: row.rowNumber,
            code: "missing_filled_quantity",
            severity: "error",
            message: "Missing filled quantity for close row.",
            column: "filledQuantity"
          })
        );
      } else if (!filledQuantity) {
        rowIssues.push(
          createIssue({
            rowNumber: row.rowNumber,
            code: "invalid_filled_quantity",
            severity: "error",
            message: "Filled quantity must be numeric with an optional asset suffix.",
            column: "filledQuantity",
            rawValue: rawFilledQuantity
          })
        );
      }

      if (!rawAverageFilledPrice) {
        rowIssues.push(
          createIssue({
            rowNumber: row.rowNumber,
            code: "missing_average_filled_price",
            severity: "error",
            message: "Missing average filled price for close row.",
            column: "averageFilledPrice"
          })
        );
      } else if (averageFilledPrice === null) {
        rowIssues.push(
          createIssue({
            rowNumber: row.rowNumber,
            code: "invalid_average_filled_price",
            severity: "error",
            message: "Average filled price must be numeric for close rows.",
            column: "averageFilledPrice",
            rawValue: rawAverageFilledPrice
          })
        );
      }

      if (!rawClosingPnl) {
        rowIssues.push(
          createIssue({
            rowNumber: row.rowNumber,
            code: "missing_closing_pnl",
            severity: "error",
            message: "Missing closing PNL for close row.",
            column: "closingPnl"
          })
        );
      } else if (!closingPnl) {
        rowIssues.push(
          createIssue({
            rowNumber: row.rowNumber,
            code: "invalid_closing_pnl",
            severity: "error",
            message: "Closing PNL must be numeric with an optional asset suffix.",
            column: "closingPnl",
            rawValue: rawClosingPnl
          })
        );
      }

      if (!rawFee) {
        rowIssues.push(
          createIssue({
            rowNumber: row.rowNumber,
            code: "missing_fee",
            severity: "error",
            message: "Missing fee for close row.",
            column: "fee"
          })
        );
      } else if (!fee) {
        rowIssues.push(
          createIssue({
            rowNumber: row.rowNumber,
            code: "invalid_fee",
            severity: "error",
            message: "Fee must be numeric with an optional asset suffix.",
            column: "fee",
            rawValue: rawFee
          })
        );
      }
    }

    const hasBlockingRowError = rowIssues.some((issue) => issue.severity === "error");

    if (
      !hasBlockingRowError &&
      rawFutures &&
      parsedTime &&
      direction &&
      isFilled &&
      isCloseDirection &&
      filledQuantity &&
      averageFilledPrice !== null &&
      closingPnl &&
      fee
    ) {
      const leverage = rawLeverage ? parseLeverage(rawLeverage) : null;
      const amount = rawAmount ? parseNumberWithOptionalAsset(rawAmount) : null;
      const orderPrice = rawOrderPrice ? parseOrderPrice(rawOrderPrice) : null;
      const duplicateKey = createCompositeKey({
        futures: rawFutures,
        time: parsedTime,
        direction,
        marginMode: rawMarginMode,
        leverage,
        amount: amount?.value ?? null,
        amountAsset: amount?.asset ?? null,
        orderPrice: rawOrderPrice,
        filledQuantity: filledQuantity.value,
        filledQuantityAsset: filledQuantity.asset,
        averageFilledPrice,
        closingPnl: closingPnl.value,
        closingPnlAsset: closingPnl.asset,
        fee: fee.value,
        feeAsset: fee.asset,
        status
      });
      const matchingRowNumber = duplicateKeys.get(duplicateKey);

      if (matchingRowNumber) {
        rowsSkipped += 1;
        rowIssues.push(
          createIssue({
            rowNumber: row.rowNumber,
            code: "duplicate_trade",
            severity: "warning",
            message: `Duplicate close trade row skipped; matches row ${matchingRowNumber}.`,
            rawValue: duplicateKey
          })
        );
      } else {
        duplicateKeys.set(duplicateKey, row.rowNumber);
        const record: ExchangeTradeRecord = {
          id: `trade-${parsedTime}-${rawFutures}-${row.rowNumber}`,
          sourceFileId: options.sourceName,
          futures: rawFutures,
          rawTime,
          time: parsedTime,
          direction,
          marginMode: rawMarginMode || undefined,
          leverage,
          amount: amount?.value ?? null,
          amountAsset: amount?.asset ?? null,
          orderPrice,
          filledQuantity: filledQuantity.value,
          filledQuantityAsset: filledQuantity.asset,
          averageFilledPrice,
          closingPnl: closingPnl.value,
          fee: fee.value,
          status,
          importedAt,
          raw: createRawRow(headers, row)
        };

        records.push(record);
      }
    }

    issues.push(...rowIssues);
  }

  const sortedRecords = [...records].sort((a, b) => a.time.localeCompare(b.time));
  const metrics = deriveTradeLedgerMetrics(sortedRecords);
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;

  return {
    ok: !hasImportBlockingErrors(issues),
    records: sortedRecords,
    summary: {
      rowsParsed: dataRows.length,
      rowsSkipped,
      errorCount,
      warningCount,
      acceptedClosedTrades: sortedRecords.length,
      ignoredOpenOrNonFilledRows,
      dateRange: metrics.dateRange,
      symbolsDetected: Array.from(symbolsDetected).sort((a, b) => a.localeCompare(b)),
      grossClosingPnl: metrics.grossClosingPnl,
      totalFees: metrics.totalFees,
      netRealizedPnl: metrics.netRealizedPnl,
      importedAt,
      sourceName: options.sourceName
    },
    issues
  };
}
