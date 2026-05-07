"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useDailySnapshot } from "@/components/dashboard/DailySnapshotProvider";
import { SectionPanel } from "@/components/ui/SectionPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { parseAccountEquityCsv } from "@/lib/accountEquityCsvImport";
import {
  clearImportedAccountEquityHistory,
  loadImportedAccountEquityHistory,
  loadImportedAccountEquityImportSummary,
  saveImportedAccountEquityHistory,
  saveImportedAccountEquityImportSummary
} from "@/lib/accountEquityStorage";
import { parseExchangeTradeLedgerCsv } from "@/lib/exchangeTradeLedgerCsvImport";
import {
  clearImportedExchangeTradeLedger,
  loadExchangeTradeLedgerImportSummary,
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
import type { CurrentPositionSide, CurrentPositionSnapshot } from "@/types/dailySnapshot";
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
const currentPositionSides: CurrentPositionSide[] = ["Long", "Short", "Flat"];

interface CurrentPositionDraft {
  symbol: string;
  side: CurrentPositionSide;
  leverage: string;
  pnlPercent: string;
  note: string;
}

const performanceSourceCopy = {
  mock: {
    badge: "Mock Data",
    label: "Source: Mock Equity History",
    chartLabel: "Mock account equity curve"
  },
  imported: {
    badge: "Local CSV",
    label: "Source: Imported CSV",
    chartLabel: "Local CSV equity curve"
  }
} satisfies Record<
  PerformanceSourceState,
  {
    badge: string;
    label: string;
    chartLabel: string;
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
    return "Mock/default data";
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return `Imported ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short"
  }).format(date)}`;
}

function createCurrentPositionDraft(position: CurrentPositionSnapshot | null): CurrentPositionDraft {
  return {
    symbol: position?.symbol ?? "",
    side: position?.side ?? "Flat",
    leverage: position?.leverage ?? "",
    pnlPercent: position?.pnlPercent !== null && typeof position?.pnlPercent !== "undefined"
      ? String(position.pnlPercent)
      : "",
    note: position?.note ?? ""
  };
}

function formatLeverage(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  return trimmedValue.toLowerCase().endsWith("x") ? trimmedValue : `${trimmedValue}x`;
}

function formatPositionPnl(value: number | null) {
  if (value === null) {
    return "P&L n/a";
  }

  const sign = value > 0 ? "+" : "";

  return `${sign}${value.toFixed(2)}% PnL`;
}

function formatCurrentPosition(position: CurrentPositionSnapshot | null) {
  if (!position) {
    return "Current Position: none logged";
  }

  const symbol = position.symbol || "Unspecified";
  const leverage = formatLeverage(position.leverage);
  const direction = leverage ? `${position.side.toUpperCase()} ${leverage}` : position.side.toUpperCase();

  return `${symbol} / ${direction} / ${formatPositionPnl(position.pnlPercent)}`;
}

function getLatestValidTimestamp(values: Array<string | null | undefined>) {
  const validTimestamps = values
    .filter((value): value is string => !!value)
    .map((value) => ({ value, time: new Date(value).getTime() }))
    .filter((entry) => Number.isFinite(entry.time));

  if (validTimestamps.length === 0) {
    return null;
  }

  return validTimestamps.reduce((latest, entry) => (
    entry.time > latest.time ? entry : latest
  )).value;
}

function getLatestRecordImportedAt(records: Array<{ importedAt?: string }> | null) {
  return getLatestValidTimestamp(records?.map((record) => record.importedAt) ?? []);
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
  const { activeDate, dailySnapshot, updateSnapshot } = useDailySnapshot();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tradeLedgerFileInputRef = useRef<HTMLInputElement>(null);
  const [currentPerformance, setCurrentPerformance] = useState(performance);
  const [performanceSource, setPerformanceSource] = useState<PerformanceSourceState>("mock");
  const [tradeLedgerSource, setTradeLedgerSource] = useState<TradeLedgerSourceState>("pending");
  const [importResult, setImportResult] = useState<EquityImportResult | null>(null);
  const [importMessage, setImportMessage] = useState("");
  const [tradeLedgerImportResult, setTradeLedgerImportResult] = useState<TradeLedgerImportResult | null>(null);
  const [tradeLedgerImportMessage, setTradeLedgerImportMessage] = useState("");
  const [equityImportedAt, setEquityImportedAt] = useState<string | null>(null);
  const [tradeLedgerImportedAt, setTradeLedgerImportedAt] = useState<string | null>(null);
  const [isEditingPosition, setIsEditingPosition] = useState(false);
  const [positionDraft, setPositionDraft] = useState<CurrentPositionDraft>(() =>
    createCurrentPositionDraft(dailySnapshot.currentPosition)
  );
  const [positionError, setPositionError] = useState<string | null>(null);
  const sourceCopy = performanceSourceCopy[performanceSource];
  const isUsingImportedData = performanceSource === "imported";
  const isUsingTradeLedgerData = tradeLedgerSource === "imported";
  const latestImportTimestamp = getLatestValidTimestamp([equityImportedAt, tradeLedgerImportedAt]);

  useEffect(() => {
    setPositionDraft(createCurrentPositionDraft(dailySnapshot.currentPosition));
    setIsEditingPosition(false);
    setPositionError(null);
  }, [activeDate, dailySnapshot.currentPosition]);

  useEffect(() => {
    const importedHistory = loadImportedAccountEquityHistory();
    const importedTradeLedger = loadImportedExchangeTradeLedger();
    const equityImportSummary = loadImportedAccountEquityImportSummary();
    const tradeLedgerImportSummary = loadExchangeTradeLedgerImportSummary();

    if (importedHistory?.length) {
      setCurrentPerformance(getPerformanceFromEquityHistory(importedHistory, importedTradeLedger));
      setPerformanceSource("imported");
      setEquityImportedAt(equityImportSummary?.importedAt ?? getLatestRecordImportedAt(importedHistory));
    } else {
      setCurrentPerformance(getPerformanceWithTradeLedger(performance, importedTradeLedger));
      setEquityImportedAt(null);
    }

    if (getTradeLedgerMetrics(importedTradeLedger)) {
      setTradeLedgerSource("imported");
      setTradeLedgerImportedAt(
        tradeLedgerImportSummary?.importedAt ?? getLatestRecordImportedAt(importedTradeLedger)
      );
    } else {
      setTradeLedgerImportedAt(null);
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
    setEquityImportedAt(importResult.summary.importedAt);
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
    setTradeLedgerImportedAt(tradeMetrics ? tradeLedgerImportResult.summary.importedAt : null);
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
    setEquityImportedAt(null);
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
    setTradeLedgerImportedAt(null);
    setTradeLedgerImportResult(null);
    setTradeLedgerImportMessage("Trade ledger cleared. Metrics are pending import.");
  }

  function beginPositionEdit() {
    setPositionDraft(createCurrentPositionDraft(dailySnapshot.currentPosition));
    setPositionError(null);
    setIsEditingPosition(true);
  }

  function cancelPositionEdit() {
    setPositionDraft(createCurrentPositionDraft(dailySnapshot.currentPosition));
    setPositionError(null);
    setIsEditingPosition(false);
  }

  function updatePositionDraft<Field extends keyof CurrentPositionDraft>(
    field: Field,
    value: CurrentPositionDraft[Field]
  ) {
    setPositionDraft((current) => ({
      ...current,
      [field]: value
    }));
  }

  function saveCurrentPosition() {
    const symbol = positionDraft.symbol.trim().toUpperCase();
    const leverage = formatLeverage(positionDraft.leverage);
    const note = positionDraft.note.trim();
    const pnlText = positionDraft.pnlPercent.trim();
    const pnlPercent = pnlText ? Number(pnlText) : null;

    if (pnlText && !Number.isFinite(pnlPercent)) {
      setPositionError("PnL must be numeric.");
      return;
    }

    const hasPosition = symbol || leverage || pnlPercent !== null || positionDraft.side !== "Flat" || note;
    const now = new Date().toISOString();

    updateSnapshot((snapshot) => ({
      ...snapshot,
      status: "saved" as const,
      updatedAt: now,
      currentPosition: hasPosition
        ? {
            symbol,
            side: positionDraft.side,
            leverage,
            pnlPercent,
            note: note || undefined,
            updatedAt: now
          }
        : null
    }));

    setPositionError(null);
    setIsEditingPosition(false);
  }

  function clearCurrentPosition() {
    const now = new Date().toISOString();

    updateSnapshot((snapshot) => ({
      ...snapshot,
      status: "saved" as const,
      updatedAt: now,
      currentPosition: null
    }));
    setPositionDraft(createCurrentPositionDraft(null));
    setPositionError(null);
    setIsEditingPosition(false);
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
        <div className="currentPositionPanel" aria-label="Current Position">
          <div className="currentPositionPanel__header">
            <div>
              <span>Current Position</span>
              <strong>{formatCurrentPosition(dailySnapshot.currentPosition)}</strong>
            </div>
            {isEditingPosition ? (
              <div className="currentPositionPanel__actions">
                <button className="terminalButton terminalButton--primary" type="button" onClick={saveCurrentPosition}>
                  Save
                </button>
                <button className="terminalButton" type="button" onClick={cancelPositionEdit}>
                  Cancel
                </button>
                {dailySnapshot.currentPosition ? (
                  <button className="terminalButton" type="button" onClick={clearCurrentPosition}>
                    Clear
                  </button>
                ) : null}
              </div>
            ) : (
              <button className="terminalButton" type="button" onClick={beginPositionEdit}>
                Edit
              </button>
            )}
          </div>
          {isEditingPosition ? (
            <div className="currentPositionEditor">
              <label>
                <span>Symbol</span>
                <input
                  value={positionDraft.symbol}
                  onChange={(event) => updatePositionDraft("symbol", event.target.value)}
                  placeholder="SOL"
                />
              </label>
              <label>
                <span>Side</span>
                <select
                  value={positionDraft.side}
                  onChange={(event) => updatePositionDraft("side", event.target.value as CurrentPositionSide)}
                >
                  {currentPositionSides.map((side) => (
                    <option value={side} key={side}>
                      {side}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Leverage</span>
                <input
                  value={positionDraft.leverage}
                  onChange={(event) => updatePositionDraft("leverage", event.target.value)}
                  placeholder="10x"
                />
              </label>
              <label className="currentPositionEditor__pnl">
                <span>PnL %</span>
                <input
                  inputMode="decimal"
                  type="number"
                  value={positionDraft.pnlPercent}
                  onChange={(event) => updatePositionDraft("pnlPercent", event.target.value)}
                  placeholder="158.64"
                />
              </label>
              <label className="currentPositionEditor__note">
                <span>Note</span>
                <input
                  value={positionDraft.note}
                  onChange={(event) => updatePositionDraft("note", event.target.value)}
                  placeholder="Optional"
                />
              </label>
              {positionError ? <p className="currentPositionPanel__error">{positionError}</p> : null}
            </div>
          ) : dailySnapshot.currentPosition?.note ? (
            <p className="currentPositionPanel__note">{dailySnapshot.currentPosition.note}</p>
          ) : null}
        </div>
      </div>

      <p className="performanceUpdated">Last Updated: {formatLastUpdated(latestImportTimestamp)}</p>
    </SectionPanel>
  );
}
