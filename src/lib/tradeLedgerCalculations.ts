import type { ExchangeTradeRecord, ISODateTime } from "@/types/performanceSources";

export interface TradeLedgerMetrics {
  tradeCount: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRatePercent: number | null;
  grossClosingPnl: number;
  totalFees: number;
  netRealizedPnl: number;
  grossProfit: number;
  grossLoss: number;
  averageWin: number | null;
  averageLoss: number | null;
  profitFactor: number | null;
  symbolBreakdown: Array<{
    symbol: string;
    pnl: number;
    trades: number;
  }>;
  directionBreakdown: Array<{
    direction: "long" | "short";
    pnl: number;
    trades: number;
  }>;
  dateRange: {
    startTime: ISODateTime | null;
    endTime: ISODateTime | null;
  };
  latestTradeTime: ISODateTime | null;
}

function roundMetric(value: number) {
  return Math.round(value * 100) / 100;
}

export function getTradeNetPnl(record: ExchangeTradeRecord) {
  return (record.closingPnl ?? 0) - Math.abs(record.fee ?? 0);
}

export function isAcceptedCloseTrade(record: ExchangeTradeRecord) {
  return (
    record.status.toLowerCase() === "filled" &&
    (record.direction === "Close Long" || record.direction === "Close Short") &&
    typeof record.closingPnl === "number" &&
    typeof record.fee === "number"
  );
}

export function deriveTradeLedgerMetrics(records: ExchangeTradeRecord[]): TradeLedgerMetrics {
  const closeTrades = records.filter(isAcceptedCloseTrade).sort((a, b) => a.time.localeCompare(b.time));
  const symbolMap = new Map<string, { symbol: string; pnl: number; trades: number }>();
  const directionMap = new Map<"long" | "short", { direction: "long" | "short"; pnl: number; trades: number }>();

  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  let grossClosingPnl = 0;
  let totalFees = 0;
  let netRealizedPnl = 0;
  let grossProfit = 0;
  let grossLoss = 0;

  for (const trade of closeTrades) {
    const netPnl = getTradeNetPnl(trade);
    const normalizedDirection = trade.direction === "Close Long" ? "long" : "short";

    grossClosingPnl += trade.closingPnl ?? 0;
    totalFees += Math.abs(trade.fee ?? 0);
    netRealizedPnl += netPnl;

    if (netPnl > 0) {
      winningTrades += 1;
      grossProfit += netPnl;
    } else if (netPnl < 0) {
      losingTrades += 1;
      grossLoss += netPnl;
    } else {
      breakevenTrades += 1;
    }

    const symbolSummary = symbolMap.get(trade.futures) ?? {
      symbol: trade.futures,
      pnl: 0,
      trades: 0
    };
    symbolSummary.pnl += netPnl;
    symbolSummary.trades += 1;
    symbolMap.set(trade.futures, symbolSummary);

    const directionSummary = directionMap.get(normalizedDirection) ?? {
      direction: normalizedDirection,
      pnl: 0,
      trades: 0
    };
    directionSummary.pnl += netPnl;
    directionSummary.trades += 1;
    directionMap.set(normalizedDirection, directionSummary);
  }

  const tradeCount = closeTrades.length;
  const startTime = closeTrades[0]?.time ?? null;
  const latestTradeTime = closeTrades.at(-1)?.time ?? null;

  return {
    tradeCount,
    winningTrades,
    losingTrades,
    breakevenTrades,
    winRatePercent: tradeCount > 0 ? roundMetric((winningTrades / tradeCount) * 100) : null,
    grossClosingPnl: roundMetric(grossClosingPnl),
    totalFees: roundMetric(totalFees),
    netRealizedPnl: roundMetric(netRealizedPnl),
    grossProfit: roundMetric(grossProfit),
    grossLoss: roundMetric(grossLoss),
    averageWin: winningTrades > 0 ? roundMetric(grossProfit / winningTrades) : null,
    averageLoss: losingTrades > 0 ? roundMetric(grossLoss / losingTrades) : null,
    profitFactor: grossLoss < 0 ? roundMetric(grossProfit / Math.abs(grossLoss)) : null,
    symbolBreakdown: Array.from(symbolMap.values())
      .map((summary) => ({
        ...summary,
        pnl: roundMetric(summary.pnl)
      }))
      .sort((a, b) => a.symbol.localeCompare(b.symbol)),
    directionBreakdown: Array.from(directionMap.values())
      .map((summary) => ({
        ...summary,
        pnl: roundMetric(summary.pnl)
      }))
      .sort((a, b) => a.direction.localeCompare(b.direction)),
    dateRange: {
      startTime,
      endTime: latestTradeTime
    },
    latestTradeTime
  };
}
