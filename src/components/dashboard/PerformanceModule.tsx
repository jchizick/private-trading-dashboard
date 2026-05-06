"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { SectionPanel } from "@/components/ui/SectionPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ModuleNote } from "@/components/ui/ModuleNote";
import { parseAccountEquityCsv } from "@/lib/accountEquityCsvImport";
import {
  clearImportedAccountEquityHistory,
  loadImportedAccountEquityHistory,
  saveImportedAccountEquityHistory,
  saveImportedAccountEquityImportSummary
} from "@/lib/accountEquityStorage";
import { parseExchangeTradeLedgerCsv } from "@/lib/exchangeTradeLedgerCsvImport";
import {
  clearImportedExchangeTradeLedger,
  loadImportedExchangeTradeLedger,
  saveExchangeTradeLedgerImportSummary,
  saveImportedExchangeTradeLedger
} from "@/lib/exchangeTradeLedgerStorage";
import { formatPercent, formatPrice } from "@/lib/formatters";
import { derivePerformanceReviewSnapshot } from "@/lib/performanceReviewCalculations";
import { deriveTradeLedgerMetrics } from "@/lib/tradeLedgerCalculations";
import {
  toPerformanceSnapshot,
  withTradeLedgerMetrics,
  withTradeLedgerMetricsSnapshot
} from "@/lib/performanceReviewViewModel";
import type { EquityImportResult, EquityImportRowError } from "@/types/accountEquityImport";
import type { PerformanceSnapshot } from "@/types/dashboard";
import type { AccountEquitySnapshot, ExchangeTradeRecord } from "@/types/performanceSources";
import type { TradeLedgerImportResult, TradeLedgerImportRowError } from "@/types/tradeLedgerImport";

interface PerformanceModuleProps {
  performance: PerformanceSnapshot;
}

function getTone(value: number) {
  if (value > 0) {
    return "positive";
  }

  if (value < 0) {
    return "negative";
  }

  return "neutral";
}

type BreakdownRow = {
  metric: string;
  value: { value: string; tone: "positive" | "negative" | "neutral" };
};

type BreakdownGroup = {
  title: string;
  status: string;
  rows: BreakdownRow[];
};

type PerformanceSourceState = "mock" | "imported";
type TradeLedgerSourceState = "pending" | "imported";
const TRADE_LEDGER_ERROR_PREVIEW_LIMIT = 5;
const TRADE_LEDGER_WARNING_PREVIEW_LIMIT = 3;

const performanceSourceCopy = {
  mock: {
    badge: "Mock Data",
    label: "Source: Mock Equity History",
    chartLabel: "Mock account equity curve",
    note: "Review focus: account trajectory is derived from mock equity history."
  },
  imported: {
    badge: "Local CSV",
    label: "Source: Imported CSV",
    chartLabel: "Local CSV equity curve",
    note: "Review focus: account trajectory is derived from imported local equity history."
  }
} satisfies Record<
  PerformanceSourceState,
  {
    badge: string;
    label: string;
    chartLabel: string;
    note: string;
  }
>;

function formatCurrency(value: number | null) {
  if (value === null) {
    return "N/A";
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}$${formatPrice(Math.abs(value), 2)}`;
}

function formatOptionalPercent(value: number | null) {
  return value === null ? "N/A" : formatPercent(value);
}

function formatOptionalMultiple(value: number | null) {
  return value === null ? "N/A" : value.toFixed(2);
}

function formatPnl(value: number) {
  return formatCurrency(value);
}

function formatTradeCount(value: number | null) {
  return value === null ? "N/A" : String(value);
}

function formatAvgWinLoss(averageWin: number | null, averageLoss: number | null) {
  if (averageWin === null && averageLoss === null) {
    return "N/A";
  }

  return `${formatCurrency(averageWin)} / ${formatCurrency(averageLoss)}`;
}

function getOptionalTone(value: number | null) {
  if (value === null) {
    return "neutral";
  }

  return getTone(value);
}

function buildPerformanceBreakdown(performance: PerformanceSnapshot): BreakdownGroup[] {
  const hasTradeLedger = performance.sourceCoverage.exchangeTradeLedger;

  return [
    {
      title: "Account Equity",
      status: "equity",
      rows: [
        {
          metric: "Latest Equity",
          value: {
            value: performance.latestEquity === null ? "N/A" : `$${formatPrice(performance.latestEquity, 2)}`,
            tone: "neutral"
          }
        },
        {
          metric: "Equity Change",
          value: {
            value: formatCurrency(performance.accountEquityChange),
            tone: getOptionalTone(performance.accountEquityChange)
          }
        },
        {
          metric: "YTD Return",
          value: {
            value: formatOptionalPercent(performance.ytdPerformancePercent),
            tone: getOptionalTone(performance.ytdPerformancePercent)
          }
        },
        {
          metric: "Max Drawdown",
          value: {
            value: formatOptionalPercent(performance.accountDrawdownPercent),
            tone: getOptionalTone(performance.accountDrawdownPercent)
          }
        }
      ]
    },
    {
      title: "Trade Ledger",
      status: hasTradeLedger ? "imported" : "pending",
      rows: [
        {
          metric: "Trades",
          value: {
            value: hasTradeLedger ? formatTradeCount(performance.tradeCount) : "N/A",
            tone: "neutral"
          }
        },
        {
          metric: "Win Rate",
          value: {
            value: hasTradeLedger ? formatOptionalPercent(performance.winRatePercent) : "N/A",
            tone: "neutral"
          }
        },
        {
          metric: "Profit Factor",
          value: {
            value: hasTradeLedger ? formatOptionalMultiple(performance.profitFactor) : "N/A",
            tone: "neutral"
          }
        },
        {
          metric: "Avg Win / Loss",
          value: {
            value: hasTradeLedger ? formatAvgWinLoss(performance.averageWin, performance.averageLoss) : "N/A",
            tone: "neutral"
          }
        }
      ]
    }
  ];
}

function PerformanceMetric({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "positive" | "negative" | "neutral";
}) {
  return (
    <div className={`performanceSnapshot__item performanceSnapshot__item--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EquityCurve({
  points,
  chartLabel
}: {
  points: PerformanceSnapshot["accountEquityCurvePercent"];
  chartLabel: string;
}) {
  if (points.length === 0) {
    return (
      <div className="equityCurve" aria-label="Account equity curve unavailable">
        <div className="equityCurve__header">
          <span>{chartLabel}</span>
          <strong>N/A</strong>
        </div>
      </div>
    );
  }

  const max = Math.max(...points.map((point) => point.valuePercent), 1);
  const min = Math.min(...points.map((point) => point.valuePercent), 0);
  const range = Math.max(max - min, 1);
  const plot = {
    left: 34,
    right: 292,
    top: 18,
    bottom: 112
  };
  const width = plot.right - plot.left;
  const height = plot.bottom - plot.top;

  const coordinates = points.map((point, index) => {
    const x = plot.left + (index / Math.max(points.length - 1, 1)) * width;
    const y = plot.bottom - ((point.valuePercent - min) / range) * height;
    return { ...point, key: point.date ? `${point.date}-${point.label}` : `${point.label}-${index}`, x, y };
  });

  const linePoints = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = `${plot.left},${plot.bottom} ${linePoints} ${plot.right},${plot.bottom}`;
  const ticks = [
    { label: formatPercent(max, 1), y: plot.top },
    { label: formatPercent((max + min) / 2, 1), y: plot.top + height / 2 },
    { label: formatPercent(min, 1), y: plot.bottom }
  ];
  const latest = points.at(-1)?.valuePercent ?? 0;

  return (
    <div className="equityCurve" aria-label={chartLabel}>
      <div className="equityCurve__header">
        <span>5D cumulative equity</span>
        <strong>{formatPercent(latest)}</strong>
      </div>
      <svg viewBox="0 0 320 144" role="img" aria-label="Five day cumulative return curve">
        <defs>
          <linearGradient id="equityFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(54, 189, 126, 0.2)" />
            <stop offset="100%" stopColor="rgba(54, 189, 126, 0)" />
          </linearGradient>
        </defs>
        {ticks.map((tick, index) => (
          <g key={`${tick.label}-${index}`}>
            <line className="equityCurve__grid" x1={plot.left} x2={plot.right} y1={tick.y} y2={tick.y} />
            <text className="equityCurve__axis" x="6" y={tick.y + 3}>
              {tick.label}
            </text>
          </g>
        ))}
        {coordinates.map((point) => (
          <line
            key={`${point.key}-grid`}
            className="equityCurve__grid equityCurve__grid--vertical"
            x1={point.x}
            x2={point.x}
            y1={plot.top}
            y2={plot.bottom}
          />
        ))}
        <line className="equityCurve__zero" x1={plot.left} x2={plot.right} y1={plot.bottom} y2={plot.bottom} />
        <polygon points={areaPoints} fill="url(#equityFill)" />
        <polyline className="equityCurve__line" points={linePoints} />
      </svg>
      <div className="equityCurve__footer">
        <span>Return axis</span>
        <span>{chartLabel}</span>
      </div>
    </div>
  );
}

function PerformanceBreakdown({ performance }: { performance: PerformanceSnapshot }) {
  const groups = buildPerformanceBreakdown(performance);

  return (
    <div className="performanceBreakdown" aria-label="Performance breakdown">
      <div className="performanceBreakdown__title">Performance Breakdown</div>
      <div className="performanceBreakdown__groups">
        {groups.map((group) => (
          <div className="performanceBreakdown__group" key={group.title}>
            <div className="performanceBreakdown__groupHeader">
              <span>{group.title}</span>
              <small>{group.status}</small>
            </div>
            <div className="performanceBreakdown__rows">
              {group.rows.map((row) => (
                <div className="performanceBreakdown__row" key={row.metric}>
                  <strong>{row.metric}</strong>
                  <span className={`performanceBreakdown__value performanceBreakdown__value--${row.value.tone}`}>
                    {row.value.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatLastUpdated(value: string | null) {
  if (!value) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short"
  }).format(new Date(value));
}

function getTradeLedgerMetrics(records: ExchangeTradeRecord[] | null) {
  if (!records?.length) {
    return null;
  }

  const metrics = deriveTradeLedgerMetrics(records);

  return metrics.tradeCount > 0 ? metrics : null;
}

function getPerformanceFromEquityHistory(
  records: AccountEquitySnapshot[],
  tradeLedgerRecords: ExchangeTradeRecord[] | null = null
) {
  const review = derivePerformanceReviewSnapshot(records);
  const tradeMetrics = getTradeLedgerMetrics(tradeLedgerRecords);

  return toPerformanceSnapshot(withTradeLedgerMetrics(review, tradeMetrics));
}

function getPerformanceWithTradeLedger(
  performance: PerformanceSnapshot,
  tradeLedgerRecords: ExchangeTradeRecord[] | null
) {
  return withTradeLedgerMetricsSnapshot(performance, getTradeLedgerMetrics(tradeLedgerRecords));
}

function formatDateRange(result: EquityImportResult) {
  const { startDate, endDate } = result.summary.dateRange;

  if (!startDate || !endDate) {
    return "N/A";
  }

  return startDate === endDate ? startDate : `${startDate} to ${endDate}`;
}

function formatDateTimeRange(result: TradeLedgerImportResult) {
  const { startTime, endTime } = result.summary.dateRange;

  if (!startTime || !endTime) {
    return "N/A";
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York"
  });
  const startLabel = formatter.format(new Date(startTime));
  const endLabel = formatter.format(new Date(endTime));

  return startTime === endTime ? startLabel : `${startLabel} to ${endLabel}`;
}

function formatSymbols(symbols: string[]) {
  if (symbols.length === 0) {
    return "N/A";
  }

  return symbols.length <= 3 ? symbols.join(", ") : `${symbols.slice(0, 3).join(", ")} +${symbols.length - 3}`;
}

function getIssueTone(issue: EquityImportRowError | TradeLedgerImportRowError) {
  return issue.severity === "error" ? "negative" : "warning";
}

function TradeLedgerIssueGroup({
  title,
  issues,
  limit
}: {
  title: string;
  issues: TradeLedgerImportRowError[];
  limit: number;
}) {
  if (issues.length === 0) {
    return null;
  }

  const visibleIssues = issues.slice(0, limit);
  const hiddenCount = Math.max(issues.length - visibleIssues.length, 0);

  return (
    <div className="performanceImportIssueGroup">
      <div className="performanceImportIssueGroup__header">
        <span>{title}</span>
        <strong>{issues.length}</strong>
      </div>
      {visibleIssues.map((issue, index) => (
        <div className="performanceImportIssue" key={`${issue.rowNumber}-${issue.code}-${index}`}>
          <StatusBadge tone={getIssueTone(issue)}>{issue.severity}</StatusBadge>
          <span>Row {issue.rowNumber}</span>
          <p>{issue.message}</p>
        </div>
      ))}
      {hiddenCount > 0 ? (
        <p className="performanceImportIssueOverflow">
          {hiddenCount} more {title.toLowerCase()} hidden.
        </p>
      ) : null}
    </div>
  );
}

function TradeLedgerImportIssues({ result }: { result: TradeLedgerImportResult }) {
  const errorIssues = result.issues.filter((issue) => issue.severity === "error");
  const warningIssues = result.issues.filter((issue) => issue.severity === "warning");

  if (errorIssues.length === 0 && warningIssues.length === 0) {
    return null;
  }

  return (
    <div className="performanceImportIssues" aria-label="Trade ledger CSV validation issues">
      <div className="performanceImportIssueTotals">
        <span>Errors: {errorIssues.length}</span>
        <span>Warnings: {warningIssues.length}</span>
      </div>
      <TradeLedgerIssueGroup title="Errors" issues={errorIssues} limit={TRADE_LEDGER_ERROR_PREVIEW_LIMIT} />
      <TradeLedgerIssueGroup title="Warnings" issues={warningIssues} limit={TRADE_LEDGER_WARNING_PREVIEW_LIMIT} />
    </div>
  );
}

export function PerformanceModule({ performance }: PerformanceModuleProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tradeLedgerFileInputRef = useRef<HTMLInputElement>(null);
  const [currentPerformance, setCurrentPerformance] = useState(performance);
  const [performanceSource, setPerformanceSource] = useState<PerformanceSourceState>("mock");
  const [tradeLedgerSource, setTradeLedgerSource] = useState<TradeLedgerSourceState>("pending");
  const [importResult, setImportResult] = useState<EquityImportResult | null>(null);
  const [importMessage, setImportMessage] = useState("");
  const [tradeLedgerImportResult, setTradeLedgerImportResult] = useState<TradeLedgerImportResult | null>(null);
  const [tradeLedgerImportMessage, setTradeLedgerImportMessage] = useState("");
  const sourceCopy = performanceSourceCopy[performanceSource];
  const isUsingImportedData = performanceSource === "imported";
  const isUsingTradeLedgerData = tradeLedgerSource === "imported";
  const reviewNote =
    tradeLedgerSource === "imported"
      ? `${sourceCopy.note} Trade-ledger stats are derived from imported exchange close records.`
      : `${sourceCopy.note} Trade-ledger stats remain pending until an exchange CSV is imported.`;

  useEffect(() => {
    const importedHistory = loadImportedAccountEquityHistory();
    const importedTradeLedger = loadImportedExchangeTradeLedger();

    if (importedHistory?.length) {
      setCurrentPerformance(getPerformanceFromEquityHistory(importedHistory, importedTradeLedger));
      setPerformanceSource("imported");
    } else {
      setCurrentPerformance(getPerformanceWithTradeLedger(performance, importedTradeLedger));
    }

    if (getTradeLedgerMetrics(importedTradeLedger)) {
      setTradeLedgerSource("imported");
    }
  }, [performance]);

  function openFilePicker() {
    setImportMessage("");
    fileInputRef.current?.click();
  }

  function openTradeLedgerFilePicker() {
    setTradeLedgerImportMessage("");
    tradeLedgerFileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setImportResult(null);
      setImportMessage("Choose a .csv file.");
      input.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const csvText = typeof reader.result === "string" ? reader.result : "";
      const result = parseAccountEquityCsv(csvText, {
        sourceName: file.name
      });

      setImportResult(result);
      setImportMessage(result.ok ? "CSV parsed. Review and confirm import." : "Fix CSV issues before importing.");
      input.value = "";
    };

    reader.onerror = () => {
      setImportResult(null);
      setImportMessage("Could not read the selected CSV file.");
      input.value = "";
    };

    try {
      reader.readAsText(file);
    } catch {
      setImportResult(null);
      setImportMessage("Could not read the selected CSV file.");
      input.value = "";
    }
  }

  function handleTradeLedgerFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setTradeLedgerImportResult(null);
      setTradeLedgerImportMessage("Choose a .csv file.");
      input.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const csvText = typeof reader.result === "string" ? reader.result : "";
      const result = parseExchangeTradeLedgerCsv(csvText, {
        sourceName: file.name
      });

      setTradeLedgerImportResult(result);
      setTradeLedgerImportMessage(
        result.ok ? "Trade ledger parsed. Review and confirm import." : "Fix trade ledger CSV issues before importing."
      );
      input.value = "";
    };

    reader.onerror = () => {
      setTradeLedgerImportResult(null);
      setTradeLedgerImportMessage("Could not read the selected trade ledger CSV file.");
      input.value = "";
    };

    try {
      reader.readAsText(file);
    } catch {
      setTradeLedgerImportResult(null);
      setTradeLedgerImportMessage("Could not read the selected trade ledger CSV file.");
      input.value = "";
    }
  }

  function confirmImport() {
    if (!importResult?.ok) {
      return;
    }

    saveImportedAccountEquityHistory(importResult.records);
    saveImportedAccountEquityImportSummary(importResult.summary);
    const importedTradeLedger = loadImportedExchangeTradeLedger();
    setCurrentPerformance(getPerformanceFromEquityHistory(importResult.records, importedTradeLedger));
    setPerformanceSource("imported");
    setTradeLedgerSource(getTradeLedgerMetrics(importedTradeLedger) ? "imported" : "pending");
    setImportMessage("Imported equity history saved locally.");
  }

  function confirmTradeLedgerImport() {
    if (!tradeLedgerImportResult?.ok) {
      return;
    }

    saveImportedExchangeTradeLedger(tradeLedgerImportResult.records);
    saveExchangeTradeLedgerImportSummary(tradeLedgerImportResult.summary);
    const importedHistory = loadImportedAccountEquityHistory();
    const basePerformance =
      performanceSource === "imported" && importedHistory?.length
        ? getPerformanceFromEquityHistory(importedHistory)
        : performance;
    const tradeMetrics = getTradeLedgerMetrics(tradeLedgerImportResult.records);

    setCurrentPerformance(withTradeLedgerMetricsSnapshot(basePerformance, tradeMetrics));
    setTradeLedgerSource(tradeMetrics ? "imported" : "pending");
    setTradeLedgerImportMessage(
      tradeMetrics ? "Imported trade ledger saved locally." : "Trade ledger saved with no accepted close trades."
    );
  }

  function clearImport() {
    clearImportedAccountEquityHistory();
    const importedTradeLedger = loadImportedExchangeTradeLedger();
    setCurrentPerformance(getPerformanceWithTradeLedger(performance, importedTradeLedger));
    setPerformanceSource("mock");
    setTradeLedgerSource(getTradeLedgerMetrics(importedTradeLedger) ? "imported" : "pending");
    setImportResult(null);
    setImportMessage("Using mock equity history.");
  }

  function clearTradeLedgerImport() {
    clearImportedExchangeTradeLedger();
    const importedHistory = loadImportedAccountEquityHistory();

    if (performanceSource === "imported" && importedHistory?.length) {
      setCurrentPerformance(getPerformanceFromEquityHistory(importedHistory));
    } else {
      setCurrentPerformance(performance);
      setPerformanceSource("mock");
    }

    setTradeLedgerSource("pending");
    setTradeLedgerImportResult(null);
    setTradeLedgerImportMessage("Trade ledger cleared. Metrics are pending import.");
  }

  return (
    <SectionPanel
      title="Performance Review"
      description="Measured context without vanity scoring."
      action={
        <div className="performanceImportActions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="performanceImportInput"
            onChange={handleFileChange}
          />
          <input
            ref={tradeLedgerFileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="performanceImportInput"
            onChange={handleTradeLedgerFileChange}
          />
          <details className="performanceActionMenu">
            <summary className="terminalButton performanceActionMenu__summary">Actions</summary>
            <div className="performanceActionMenu__panel">
              <button type="button" onClick={openFilePicker}>
                Import Equity CSV
              </button>
              <button type="button" onClick={openTradeLedgerFilePicker}>
                Import Trade Ledger CSV
              </button>
              {isUsingImportedData ? (
                <button type="button" onClick={clearImport}>
                  Use Mock Data
                </button>
              ) : null}
              {isUsingTradeLedgerData ? (
                <button type="button" onClick={clearTradeLedgerImport}>
                  Clear Trade Ledger
                </button>
              ) : null}
            </div>
          </details>
        </div>
      }
    >
      <div className="performanceSourceState" aria-label="Performance Review active data source">
        <span>{sourceCopy.label}</span>
        <StatusBadge tone={isUsingImportedData ? "positive" : "neutral"}>{sourceCopy.badge}</StatusBadge>
      </div>
      <div className="performanceLedgerState" aria-label="Performance Review trade ledger source">
        <span>Trade Ledger: {tradeLedgerSource}</span>
      </div>

      <div className="performanceSnapshot" aria-label="Short-term performance snapshot">
        <PerformanceMetric
          label="Daily"
          value={formatPercent(currentPerformance.dailyPerformancePercent)}
          tone={getTone(currentPerformance.dailyPerformancePercent)}
        />
        <PerformanceMetric
          label="Weekly"
          value={formatPercent(currentPerformance.weeklyPerformancePercent)}
          tone={getTone(currentPerformance.weeklyPerformancePercent)}
        />
        <PerformanceMetric
          label="Monthly"
          value={formatPercent(currentPerformance.monthlyPerformancePercent)}
          tone={getTone(currentPerformance.monthlyPerformancePercent)}
        />
      </div>

      <EquityCurve points={currentPerformance.accountEquityCurvePercent} chartLabel={sourceCopy.chartLabel} />

      <PerformanceBreakdown performance={currentPerformance} />

      {importResult || importMessage ? (
        <div className="performanceImportPanel" aria-live="polite">
          <div className="performanceImportPanel__header">
            <div>
              <span>Equity CSV Import</span>
              <strong>{importResult?.summary.sourceName ?? "Local file"}</strong>
            </div>
            {importResult ? (
              <StatusBadge tone={importResult.ok ? "positive" : "negative"}>
                {importResult.ok ? "ready" : "fix csv"}
              </StatusBadge>
            ) : null}
          </div>
          {importMessage ? <p className="performanceImportMessage">{importMessage}</p> : null}
          {importResult ? (
            <>
              <div className="performanceImportSummary" aria-label="Equity import summary">
                <div>
                  <span>Rows</span>
                  <strong>{importResult.summary.rowsParsed}</strong>
                </div>
                <div>
                  <span>Skipped</span>
                  <strong>{importResult.summary.rowsSkipped}</strong>
                </div>
                <div>
                  <span>Errors</span>
                  <strong>{importResult.summary.errorCount}</strong>
                </div>
                <div>
                  <span>Warnings</span>
                  <strong>{importResult.summary.warningCount}</strong>
                </div>
                <div>
                  <span>Date Range</span>
                  <strong>{formatDateRange(importResult)}</strong>
                </div>
                <div>
                  <span>Latest Equity</span>
                  <strong>
                    {importResult.summary.latestEquity === null
                      ? "N/A"
                      : `$${formatPrice(importResult.summary.latestEquity, 2)}`}
                  </strong>
                </div>
              </div>
              {importResult.issues.length ? (
                <div className="performanceImportIssues" aria-label="CSV validation issues">
                  {importResult.issues.slice(0, 5).map((issue, index) => (
                    <div className="performanceImportIssue" key={`${issue.rowNumber}-${issue.code}-${index}`}>
                      <StatusBadge tone={getIssueTone(issue)}>{issue.severity}</StatusBadge>
                      <span>Row {issue.rowNumber}</span>
                      <p>{issue.message}</p>
                    </div>
                  ))}
                  {importResult.issues.length > 5 ? (
                    <p className="performanceImportIssueOverflow">
                      {importResult.issues.length - 5} more issue(s) hidden.
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="performanceImportConfirm">
                <button
                  className="terminalButton terminalButton--primary"
                  type="button"
                  onClick={confirmImport}
                  disabled={!importResult.ok}
                >
                  Confirm Import
                </button>
                {!importResult.ok ? <span>CSV must be fixed before import.</span> : null}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {tradeLedgerImportResult || tradeLedgerImportMessage ? (
        <div className="performanceImportPanel" aria-live="polite">
          <div className="performanceImportPanel__header">
            <div>
              <span>Trade Ledger CSV Import</span>
              <strong>{tradeLedgerImportResult?.summary.sourceName ?? "Local file"}</strong>
            </div>
            {tradeLedgerImportResult ? (
              <StatusBadge tone={tradeLedgerImportResult.ok ? "positive" : "negative"}>
                {tradeLedgerImportResult.ok ? "ready" : "fix csv"}
              </StatusBadge>
            ) : null}
          </div>
          {tradeLedgerImportMessage ? <p className="performanceImportMessage">{tradeLedgerImportMessage}</p> : null}
          {tradeLedgerImportResult ? (
            <>
              <div className="performanceImportSummary performanceImportSummary--tradeLedger" aria-label="Trade ledger import summary">
                <div>
                  <span>Rows</span>
                  <strong>{tradeLedgerImportResult.summary.rowsParsed}</strong>
                </div>
                <div>
                  <span>Skipped</span>
                  <strong>{tradeLedgerImportResult.summary.rowsSkipped}</strong>
                </div>
                <div>
                  <span>Errors</span>
                  <strong>{tradeLedgerImportResult.summary.errorCount}</strong>
                </div>
                <div>
                  <span>Warnings</span>
                  <strong>{tradeLedgerImportResult.summary.warningCount}</strong>
                </div>
                <div>
                  <span>Closed Trades</span>
                  <strong>{tradeLedgerImportResult.summary.acceptedClosedTrades}</strong>
                </div>
                <div>
                  <span>Ignored Rows</span>
                  <strong>{tradeLedgerImportResult.summary.ignoredOpenOrNonFilledRows}</strong>
                </div>
                <div>
                  <span>Date Range</span>
                  <strong>{formatDateTimeRange(tradeLedgerImportResult)}</strong>
                </div>
                <div>
                  <span>Symbols</span>
                  <strong>{formatSymbols(tradeLedgerImportResult.summary.symbolsDetected)}</strong>
                </div>
                <div>
                  <span>Gross Closing PnL</span>
                  <strong>{formatPnl(tradeLedgerImportResult.summary.grossClosingPnl)}</strong>
                </div>
                <div>
                  <span>Total Fees</span>
                  <strong>{formatPnl(tradeLedgerImportResult.summary.totalFees)}</strong>
                </div>
                <div>
                  <span>Net Realized PnL</span>
                  <strong>{formatPnl(tradeLedgerImportResult.summary.netRealizedPnl)}</strong>
                </div>
              </div>
              <TradeLedgerImportIssues result={tradeLedgerImportResult} />
              <div className="performanceImportConfirm">
                <button
                  className="terminalButton terminalButton--primary"
                  type="button"
                  onClick={confirmTradeLedgerImport}
                  disabled={!tradeLedgerImportResult.ok}
                >
                  Confirm Import
                </button>
                {!tradeLedgerImportResult.ok ? <span>CSV must be fixed before import.</span> : null}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="performanceReview">
        <div className="tagRow tagRow--subtle">
          {currentPerformance.reviewTags.map((tag, index) => (
            <StatusBadge key={`${tag}-${index}`} tone={tag === "late entry" ? "warning" : "neutral"}>
              {tag}
            </StatusBadge>
          ))}
        </div>
        <ModuleNote>{reviewNote}</ModuleNote>
      </div>

      <p className="performanceUpdated">Last Updated: {formatLastUpdated(currentPerformance.lastUpdatedAt)}</p>
    </SectionPanel>
  );
}
