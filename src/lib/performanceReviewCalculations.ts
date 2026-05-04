import type {
  AccountEquitySnapshot,
  ISODate,
  ISODateTime,
  PerformanceReviewNote,
  PerformanceReviewSnapshot
} from "@/types/performanceSources";

type ReturnPeriod = "weekly" | "monthly" | "ytd";

interface DerivePerformanceReviewOptions {
  asOfDate?: ISODate;
  derivedAt?: ISODateTime;
  note?: PerformanceReviewNote;
}

const DEFAULT_PERFORMANCE_NOTE: PerformanceReviewNote = {
  text: "Account performance is derived from equity history only. Trade-ledger metrics remain unavailable until exchange imports are added.",
  tags: ["equity history", "trade ledger pending"],
  updatedAt: ""
};
const EMPTY_PERFORMANCE_AS_OF_DATE = "1970-01-01";

function parseISODate(value: ISODate) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatISODate(date: Date): ISODate {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPeriodStartDate(asOfDate: ISODate, period: ReturnPeriod) {
  const date = parseISODate(asOfDate);

  if (period === "weekly") {
    date.setUTCDate(date.getUTCDate() - 6);
    return formatISODate(date);
  }

  if (period === "monthly") {
    date.setUTCDate(date.getUTCDate() - 29);
    return formatISODate(date);
  }

  return `${date.getUTCFullYear()}-01-01`;
}

function calculatePercentChange(startValue: number, endValue: number) {
  if (startValue === 0) {
    return undefined;
  }

  return ((endValue - startValue) / startValue) * 100;
}

function roundMetric(value: number) {
  return Math.round(value * 100) / 100;
}

export function sortAccountEquityHistory(history: AccountEquitySnapshot[]) {
  return [...history].sort((a, b) => a.date.localeCompare(b.date));
}

export function buildEquityCurve(history: AccountEquitySnapshot[]) {
  const sortedHistory = sortAccountEquityHistory(history);
  const baseEquity = sortedHistory[0]?.equity;

  if (!baseEquity) {
    return [];
  }

  return sortedHistory.map((snapshot) => ({
    date: snapshot.date,
    valuePercent: roundMetric(calculatePercentChange(baseEquity, snapshot.equity) ?? 0)
  }));
}

export function calculateReturnForPeriod(
  history: AccountEquitySnapshot[],
  asOfDate: ISODate,
  period: ReturnPeriod
) {
  const sortedHistory = sortAccountEquityHistory(history).filter(
    (snapshot) => snapshot.date <= asOfDate
  );
  const latestSnapshot = sortedHistory.at(-1);

  if (!latestSnapshot) {
    return undefined;
  }

  const periodStartDate = getPeriodStartDate(asOfDate, period);
  const firstSnapshotInPeriod =
    sortedHistory.find((snapshot) => snapshot.date >= periodStartDate) ?? sortedHistory[0];

  if (!firstSnapshotInPeriod) {
    return undefined;
  }

  const percentChange = calculatePercentChange(firstSnapshotInPeriod.equity, latestSnapshot.equity);

  return typeof percentChange === "number" ? roundMetric(percentChange) : undefined;
}

export function calculateDailyReturn(history: AccountEquitySnapshot[], asOfDate: ISODate) {
  const sortedHistory = sortAccountEquityHistory(history).filter(
    (snapshot) => snapshot.date <= asOfDate
  );
  const latestSnapshot = sortedHistory.at(-1);
  const previousSnapshot = sortedHistory.at(-2);

  if (!latestSnapshot || !previousSnapshot) {
    return undefined;
  }

  const percentChange = calculatePercentChange(previousSnapshot.equity, latestSnapshot.equity);

  return typeof percentChange === "number" ? roundMetric(percentChange) : undefined;
}

export function calculateMaxDrawdown(history: AccountEquitySnapshot[]) {
  const sortedHistory = sortAccountEquityHistory(history);
  let peakEquity = sortedHistory[0]?.equity;
  let maxDrawdown = 0;

  if (typeof peakEquity !== "number") {
    return undefined;
  }

  for (const snapshot of sortedHistory) {
    peakEquity = Math.max(peakEquity, snapshot.equity);

    if (peakEquity > 0) {
      const drawdown = ((snapshot.equity - peakEquity) / peakEquity) * 100;
      maxDrawdown = Math.min(maxDrawdown, drawdown);
    }
  }

  return roundMetric(maxDrawdown);
}

function getLatestImportedAt(history: AccountEquitySnapshot[]) {
  return history
    .map((snapshot) => snapshot.importedAt)
    .filter((value): value is ISODateTime => Boolean(value))
    .sort((a, b) => b.localeCompare(a))[0];
}

export function derivePerformanceReviewSnapshot(
  history: AccountEquitySnapshot[],
  options: DerivePerformanceReviewOptions = {}
): PerformanceReviewSnapshot {
  const sortedHistory = sortAccountEquityHistory(history);
  const latestSnapshot = sortedHistory.at(-1);
  const asOfDate = options.asOfDate ?? latestSnapshot?.date ?? EMPTY_PERFORMANCE_AS_OF_DATE;
  const historyThroughAsOfDate = sortedHistory.filter((snapshot) => snapshot.date <= asOfDate);
  const latestAvailableSnapshot = historyThroughAsOfDate.at(-1);
  const derivedAt = options.derivedAt ?? getLatestImportedAt(historyThroughAsOfDate) ?? "";
  const note = options.note ?? {
    ...DEFAULT_PERFORMANCE_NOTE,
    updatedAt: derivedAt
  };

  return {
    asOfDate,
    accountEquity: {
      latestEquity: latestAvailableSnapshot?.equity,
      equityCurvePercent: buildEquityCurve(historyThroughAsOfDate),
      dailyReturnPercent: calculateDailyReturn(historyThroughAsOfDate, asOfDate),
      weeklyReturnPercent: calculateReturnForPeriod(historyThroughAsOfDate, asOfDate, "weekly"),
      monthlyReturnPercent: calculateReturnForPeriod(historyThroughAsOfDate, asOfDate, "monthly"),
      ytdReturnPercent: calculateReturnForPeriod(historyThroughAsOfDate, asOfDate, "ytd"),
      accountDrawdownPercent: calculateMaxDrawdown(historyThroughAsOfDate)
    },
    note,
    derivedAt,
    sourceCoverage: {
      accountEquityHistory: historyThroughAsOfDate.length > 0,
      exchangeTradeLedger: false
    }
  };
}
