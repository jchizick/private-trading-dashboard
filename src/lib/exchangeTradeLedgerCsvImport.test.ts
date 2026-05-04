import { describe, expect, it } from "vitest";
import { exchangeTradeLedgerCsvImportExamples } from "@/data/exchangeTradeLedgerCsvImportExamples";
import { parseExchangeTradeLedgerCsv } from "@/lib/exchangeTradeLedgerCsvImport";

const IMPORTED_AT = "2026-05-04T14:30:00.000Z";
const SOURCE_NAME = "exchange-ledger.csv";

function parse(csvText: string) {
  return parseExchangeTradeLedgerCsv(csvText, {
    importedAt: IMPORTED_AT,
    sourceName: SOURCE_NAME
  });
}

function issueCodes(csvText: string) {
  return parse(csvText).issues.map((issue) => issue.code);
}

function singleCloseTradeCsv(overrides: {
  futures?: string;
  time?: string;
  direction?: string;
  filledQuantity?: string;
  averageFilledPrice?: string;
  closingPnl?: string;
  fee?: string;
  status?: string;
}) {
  return `Futures,Time,Direction,Filled Quantity,Avg Filled Price,Closing PNL,Fee,Status
${overrides.futures ?? "SOLUSDT"},${overrides.time ?? "2026-01-21 09:14:25"},${
    overrides.direction ?? "Close Long"
  },${overrides.filledQuantity ?? "2.2 SOL"},${overrides.averageFilledPrice ?? "128.9"},${
    overrides.closingPnl ?? "7.951 USDT"
  },${overrides.fee ?? "0.0283 USDT"},${overrides.status ?? "Filled"}`;
}

describe("parseExchangeTradeLedgerCsv", () => {
  it("accepts valid filled close long and close short rows with import metadata", () => {
    const result = parse(exchangeTradeLedgerCsvImportExamples.validCloseTrades);

    expect(result.ok).toBe(true);
    expect(result.records).toHaveLength(2);
    expect(result.summary.acceptedClosedTrades).toBe(2);
    expect(result.summary.sourceName).toBe(SOURCE_NAME);
    expect(result.summary.importedAt).toBe(IMPORTED_AT);
    expect(result.records[0]).toMatchObject({
      futures: "SOLUSDT",
      rawTime: "2026-01-21 09:14:25",
      time: "2026-01-21T14:14:25.000Z",
      direction: "Close Long",
      leverage: 12,
      amount: 2.2,
      amountAsset: "SOL",
      orderPrice: null,
      filledQuantity: 2.2,
      filledQuantityAsset: "SOL",
      averageFilledPrice: 128.9,
      closingPnl: 7.951,
      fee: 0.0283,
      status: "Filled",
      sourceFileId: SOURCE_NAME,
      importedAt: IMPORTED_AT
    });
    expect(result.records[1]).toMatchObject({
      futures: "BTCUSDT",
      direction: "Close Short",
      leverage: 5,
      orderPrice: 41750.2,
      closingPnl: -12.25,
      fee: 1.12
    });
  });

  it.each([
    ["Symbol", "futures"],
    ["Market", "futures"],
    ["Pair", "futures"],
    ["Filled Time", "time"],
    ["Executed At", "time"],
    ["Side", "direction"],
    ["Trade Direction", "direction"],
    ["Filled Qty", "filledQuantity"],
    ["Executed Quantity", "filledQuantity"],
    ["Avg Price", "averageFilledPrice"],
    ["Average Filled Price", "averageFilledPrice"],
    ["Realized PnL", "closingPnl"],
    ["Closing PNL", "closingPnl"],
    ["Fees", "fee"],
    ["Trading Fee", "fee"],
    ["Order Status", "status"]
  ])("maps %s as %s", (aliasHeader, logicalColumn) => {
    const headers = {
      futures: "Futures",
      time: "Time",
      direction: "Direction",
      filledQuantity: "Filled Quantity",
      averageFilledPrice: "Avg Filled Price",
      closingPnl: "Closing PNL",
      fee: "Fee",
      status: "Status"
    };
    const values = {
      futures: "SOLUSDT",
      time: "2026-01-21 09:14:25",
      direction: "Close Long",
      filledQuantity: "2.2 SOL",
      averageFilledPrice: "128.9",
      closingPnl: "7.951 USDT",
      fee: "0.0283 USDT",
      status: "Filled"
    };
    const aliasedHeaders = {
      ...headers,
      [logicalColumn]: aliasHeader
    };
    const csvText = `${Object.values(aliasedHeaders).join(",")}
${Object.values(values).join(",")}`;

    const result = parse(csvText);

    expect(result.ok).toBe(true);
    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toMatchObject({
      futures: "SOLUSDT",
      time: "2026-01-21T14:14:25.000Z",
      direction: "Close Long",
      filledQuantity: 2.2,
      averageFilledPrice: 128.9,
      closingPnl: 7.951,
      fee: 0.0283,
      status: "Filled"
    });
  });

  it("stores exact trade times as Toronto-local ISO datetimes and preserves rawTime", () => {
    const result = parse(singleCloseTradeCsv({ time: "2026-07-21 09:14:25" }));

    expect(result.ok).toBe(true);
    expect(result.records[0]?.rawTime).toBe("2026-07-21 09:14:25");
    expect(result.records[0]?.time).toBe("2026-07-21T13:14:25.000Z");
  });

  it.each([
    ["2026-02-30 09:14:25"],
    ["2026/01/21 09:14:25"],
    ["2026-01-21T09:14:25Z"]
  ])("rejects invalid or unsupported trade time %s", (rawTime) => {
    const result = parse(singleCloseTradeCsv({ time: rawTime }));

    expect(result.ok).toBe(false);
    expect(result.records).toHaveLength(0);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "invalid_time",
        severity: "error",
        rawValue: rawTime
      })
    );
  });

  it("accepts open directions but ignores them with warnings instead of errors", () => {
    const result = parse(`Futures,Time,Direction,Filled Quantity,Avg Filled Price,Closing PNL,Fee,Status
ETHUSDT,2026-01-21 09:45:00,Open Long,1.5 ETH,2501.2,0 USDT,0.45 USDT,Filled
BTCUSDT,2026-01-21 09:55:00,Open Short,0.04 BTC,41749.8,0 USDT,1.12 USDT,Filled`);

    expect(result.ok).toBe(true);
    expect(result.records).toHaveLength(0);
    expect(result.summary.acceptedClosedTrades).toBe(0);
    expect(result.summary.ignoredOpenOrNonFilledRows).toBe(2);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "ignored_open_row", severity: "warning", rawValue: "Open Long" }),
        expect.objectContaining({ code: "ignored_open_row", severity: "warning", rawValue: "Open Short" })
      ])
    );
  });

  it("reports invalid direction as an error", () => {
    const result = parse(singleCloseTradeCsv({ direction: "Exit Long" }));

    expect(result.ok).toBe(false);
    expect(result.records).toHaveLength(0);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "invalid_direction",
        severity: "error",
        rawValue: "Exit Long"
      })
    );
  });

  it("ignores non-filled close rows with warnings without failing import", () => {
    const result = parse(exchangeTradeLedgerCsvImportExamples.ignoredOpenAndNonFilledRows);

    expect(result.ok).toBe(true);
    expect(result.records).toHaveLength(0);
    expect(result.summary.acceptedClosedTrades).toBe(0);
    expect(result.summary.ignoredOpenOrNonFilledRows).toBe(3);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "ignored_open_row", severity: "warning" }),
        expect.objectContaining({ code: "ignored_non_filled_row", severity: "warning", rawValue: "Partially Filled" }),
        expect.objectContaining({ code: "ignored_non_filled_row", severity: "warning", rawValue: "Canceled" })
      ])
    );
  });

  it("reports missing status as an error", () => {
    const result = parse(singleCloseTradeCsv({ status: "" }));

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "missing_status",
        severity: "error"
      })
    );
  });

  it.each([
    [{ futures: "" }, "missing_symbol"],
    [{ time: "" }, "missing_time"],
    [{ time: "2026/01/21 09:14:25" }, "invalid_time"],
    [{ filledQuantity: "" }, "missing_filled_quantity"],
    [{ filledQuantity: "not-quantity" }, "invalid_filled_quantity"],
    [{ averageFilledPrice: "" }, "missing_average_filled_price"],
    [{ averageFilledPrice: "not-a-price" }, "invalid_average_filled_price"],
    [{ closingPnl: "" }, "missing_closing_pnl"],
    [{ closingPnl: "not-pnl" }, "invalid_closing_pnl"],
    [{ fee: "" }, "missing_fee"],
    [{ fee: "not-fee" }, "invalid_fee"]
  ])("reports %s for close-row validation failures", (overrides, expectedCode) => {
    expect(issueCodes(singleCloseTradeCsv(overrides))).toContain(expectedCode);
  });

  it("blocks duplicate close rows using the composite trade key", () => {
    const result = parse(exchangeTradeLedgerCsvImportExamples.duplicateCompositeRows);

    expect(result.ok).toBe(false);
    expect(result.records).toHaveLength(1);
    expect(result.summary.acceptedClosedTrades).toBe(1);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "duplicate_trade",
        severity: "error",
        rawValue: "SOLUSDT|2026-01-21T14:14:25.000Z|Close Long|2.2|128.9|7.951|0.0283|filled"
      })
    );
  });

  it("allows non-duplicate rows when one composite-key field differs", () => {
    const result = parse(`Futures,Time,Direction,Filled Quantity,Avg Filled Price,Closing PNL,Fee,Status
SOLUSDT,2026-01-21 09:14:25,Close Long,2.2 SOL,128.9,7.951 USDT,0.0283 USDT,Filled
SOLUSDT,2026-01-21 09:14:25,Close Long,2.2 SOL,128.9,7.952 USDT,0.0283 USDT,Filled`);

    expect(result.ok).toBe(true);
    expect(result.records).toHaveLength(2);
    expect(result.issues.some((issue) => issue.code === "duplicate_trade")).toBe(false);
  });

  it("warns but does not fail on unexpected columns", () => {
    const result = parse(exchangeTradeLedgerCsvImportExamples.unexpectedColumns);

    expect(result.ok).toBe(true);
    expect(result.records).toHaveLength(1);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "unexpected_column",
        severity: "warning",
        column: "Notes"
      })
    );
  });

  it("skips fully blank rows", () => {
    const result = parse(`Futures,Time,Direction,Filled Quantity,Avg Filled Price,Closing PNL,Fee,Status

SOLUSDT,2026-01-21 09:14:25,Close Long,2.2 SOL,128.9,7.951 USDT,0.0283 USDT,Filled
   ,   ,   ,   ,   ,   ,   ,   
BTCUSDT,2026-01-21 10:02:11,Close Short,0.04 BTC,41749.8,-12.25 USDT,1.12 USDT,Filled`);

    expect(result.ok).toBe(true);
    expect(result.summary.rowsSkipped).toBe(2);
    expect(result.records).toHaveLength(2);
  });

  it("sorts accepted records by parsed time ascending", () => {
    const result = parse(`Futures,Time,Direction,Filled Quantity,Avg Filled Price,Closing PNL,Fee,Status
BTCUSDT,2026-01-21 10:02:11,Close Short,0.04 BTC,41749.8,-12.25 USDT,1.12 USDT,Filled
ETHUSDT,2026-01-21 08:18:42,Close Long,1.5 ETH,2501.2,0.45 USDT,0.45 USDT,Filled
SOLUSDT,2026-01-21 09:14:25,Close Long,2.2 SOL,128.9,7.951 USDT,0.0283 USDT,Filled`);

    expect(result.ok).toBe(true);
    expect(result.records.map((record) => record.futures)).toEqual(["ETHUSDT", "SOLUSDT", "BTCUSDT"]);
    expect(result.summary.dateRange).toEqual({
      startTime: "2026-01-21T13:18:42.000Z",
      endTime: "2026-01-21T15:02:11.000Z"
    });
  });
});
