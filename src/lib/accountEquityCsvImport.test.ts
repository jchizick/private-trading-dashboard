import { describe, expect, it } from "vitest";
import { parseAccountEquityCsv } from "@/lib/accountEquityCsvImport";

const IMPORTED_AT = "2026-05-04T14:30:00.000Z";

function parse(csvText: string) {
  return parseAccountEquityCsv(csvText, {
    importedAt: IMPORTED_AT,
    sourceName: "equity.csv"
  });
}

function issueCodes(csvText: string) {
  return parse(csvText).issues.map((issue) => issue.code);
}

describe("parseAccountEquityCsv", () => {
  it("parses valid canonical CSV rows with legacy Percent Change header as cumulative return", () => {
    const result = parse(`Date,Equity,Percent Change
2026-05-02,292.81,193%
2026-05-03,291.79,192%`);

    expect(result.ok).toBe(true);
    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toMatchObject({
      id: "equity-2026-05-02",
      date: "2026-05-02",
      equity: 292.81,
      cumulativeReturnPercent: 193,
      source: "csv_import",
      importedAt: IMPORTED_AT
    });
    expect(result.records[1]).toMatchObject({
      id: "equity-2026-05-03",
      cumulativeReturnPercent: 192,
      importedAt: IMPORTED_AT
    });
    expect(result.summary.latestEquity).toBe(291.79);
  });

  it.each([
    ["Percent Change"],
    ["% Change"],
    ["percentChange"],
    ["pctChange"],
    ["Cumulative Return"],
    ["Cumulative Return %"],
    ["Total Return"],
    ["Total Return %"]
  ])("maps %s into cumulativeReturnPercent", (header) => {
    const result = parse(`Date,Equity,${header}
2026-05-02,292.81,+193%`);

    expect(result.ok).toBe(true);
    expect(result.records[0]?.cumulativeReturnPercent).toBe(193);
  });

  it.each([
    ["100000", 100000],
    ['"100,000"', 100000],
    ['"$100,000.50"', 100000.5]
  ])("parses equity value %s", (rawEquity, expectedEquity) => {
    const result = parse(`Date,Equity,Percent Change
2026-05-02,${rawEquity},0.35`);

    expect(result.ok).toBe(true);
    expect(result.records[0]?.equity).toBe(expectedEquity);
  });

  it.each([
    ["0.35", 0.35],
    ["0.35%", 0.35],
    ["+0.35%", 0.35],
    ["-0.35%", -0.35]
  ])("parses cumulative return value %s as numeric percent units", (rawPercent, expectedPercent) => {
    const result = parse(`Date,Equity,Percent Change
2026-05-02,100000,${rawPercent}`);

    expect(result.ok).toBe(true);
    expect(result.records[0]?.cumulativeReturnPercent).toBe(expectedPercent);
  });

  it("skips fully blank rows", () => {
    const result = parse(`Date,Equity,Percent Change

2026-05-02,100000,0.35
   ,   ,   
2026-05-03,100350,0.7`);

    expect(result.ok).toBe(true);
    expect(result.summary.rowsSkipped).toBe(2);
    expect(result.records.map((record) => record.date)).toEqual(["2026-05-02", "2026-05-03"]);
  });

  it("reports missing, non-ISO, and impossible dates", () => {
    const codes = issueCodes(`Date,Equity,Percent Change
,100000,0
05/02/2026,100100,0.1
2026-02-30,100200,0.2`);

    expect(codes).toContain("missing_date");
    expect(codes.filter((code) => code === "invalid_date")).toHaveLength(2);
  });

  it("reports missing, invalid, and negative equity", () => {
    const codes = issueCodes(`Date,Equity,Percent Change
2026-05-02,,0
2026-05-03,not-a-number,0.1
2026-05-04,-100,0.2`);

    expect(codes).toContain("missing_equity");
    expect(codes).toContain("invalid_equity");
    expect(codes).toContain("negative_equity");
  });

  it("reports missing and invalid cumulative return values", () => {
    const codes = issueCodes(`Date,Equity,Percent Change
2026-05-02,100000,
2026-05-03,100100,not-a-percent`);

    expect(codes).toContain("missing_cumulative_return_percent");
    expect(codes).toContain("invalid_cumulative_return_percent");
  });

  it("blocks duplicate dates", () => {
    const result = parse(`Date,Equity,Percent Change
2026-05-02,100000,0
2026-05-02,100100,0.1`);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === "duplicate_date")).toBe(true);
  });

  it("sorts out-of-order rows ascending and reports a warning", () => {
    const result = parse(`Date,Equity,Percent Change
2026-05-03,100350,0.35
2026-05-01,100000,0
2026-05-02,100150,0.15`);

    expect(result.ok).toBe(true);
    expect(result.records.map((record) => record.date)).toEqual([
      "2026-05-01",
      "2026-05-02",
      "2026-05-03"
    ]);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "out_of_order_rows",
        severity: "warning"
      })
    );
  });

  it("warns but does not fail on unexpected columns", () => {
    const result = parse(`Date,Equity,Percent Change,Notes
2026-05-02,100000,0,Opening balance`);

    expect(result.ok).toBe(true);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "unexpected_column",
        severity: "warning"
      })
    );
  });

  it("reports malformed rows when comma-formatted equity is not quoted", () => {
    const result = parse(`Date,Equity,Percent Change
2026-05-02,$100,000.50,0.35`);

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "malformed_csv_row",
        severity: "error"
      })
    );
  });
});
