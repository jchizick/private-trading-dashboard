import { describe, expect, it } from "vitest";
import {
  deriveTradeLedgerMetrics,
  getTradeNetPnl,
  isAcceptedCloseTrade
} from "@/lib/tradeLedgerCalculations";
import type { ExchangeTradeDirection, ExchangeTradeRecord } from "@/types/performanceSources";

function trade({
  id,
  futures,
  time,
  direction,
  closingPnl,
  fee,
  status = "Filled"
}: {
  id: string;
  futures: string;
  time: string;
  direction: ExchangeTradeDirection;
  closingPnl?: number | null;
  fee?: number | null;
  status?: string;
}): ExchangeTradeRecord {
  return {
    id,
    futures,
    time,
    direction,
    closingPnl,
    fee,
    status
  };
}

const acceptedTrades = [
  trade({
    id: "winner-long",
    futures: "SOLUSDT",
    time: "2026-01-21T14:14:25.000Z",
    direction: "Close Long",
    closingPnl: 10,
    fee: 1
  }),
  trade({
    id: "loser-short",
    futures: "BTCUSDT",
    time: "2026-01-21T15:02:11.000Z",
    direction: "Close Short",
    closingPnl: -12,
    fee: 2
  }),
  trade({
    id: "breakeven-long",
    futures: "SOLUSDT",
    time: "2026-01-21T16:18:42.000Z",
    direction: "Close Long",
    closingPnl: 1,
    fee: -1
  }),
  trade({
    id: "winner-short",
    futures: "ETHUSDT",
    time: "2026-01-21T17:18:42.000Z",
    direction: "Close Short",
    closingPnl: 6,
    fee: 0.5
  })
];

describe("trade ledger calculations", () => {
  it("calculates per-trade net PnL after absolute fees", () => {
    expect(getTradeNetPnl(acceptedTrades[0])).toBe(9);
    expect(getTradeNetPnl(acceptedTrades[2])).toBe(0);
  });

  it("accepts only filled close trades with numeric PnL and fee", () => {
    expect(isAcceptedCloseTrade(acceptedTrades[0])).toBe(true);
    expect(isAcceptedCloseTrade(trade({ id: "open", futures: "SOLUSDT", time: "2026-01-21T14:00:00.000Z", direction: "Open Long", closingPnl: 10, fee: 1 }))).toBe(false);
    expect(isAcceptedCloseTrade(trade({ id: "pending", futures: "SOLUSDT", time: "2026-01-21T14:00:00.000Z", direction: "Close Long", closingPnl: 10, fee: 1, status: "Canceled" }))).toBe(false);
    expect(isAcceptedCloseTrade(trade({ id: "missing-pnl", futures: "SOLUSDT", time: "2026-01-21T14:00:00.000Z", direction: "Close Long", closingPnl: null, fee: 1 }))).toBe(false);
  });

  it("derives counts, win rate, gross/net PnL, fees, averages, and profit factor", () => {
    const metrics = deriveTradeLedgerMetrics(acceptedTrades);

    expect(metrics.tradeCount).toBe(4);
    expect(metrics.winningTrades).toBe(2);
    expect(metrics.losingTrades).toBe(1);
    expect(metrics.breakevenTrades).toBe(1);
    expect(metrics.winRatePercent).toBe(50);
    expect(metrics.grossClosingPnl).toBe(5);
    expect(metrics.totalFees).toBe(4.5);
    expect(metrics.netRealizedPnl).toBe(0.5);
    expect(metrics.grossProfit).toBe(14.5);
    expect(metrics.grossLoss).toBe(-14);
    expect(metrics.averageWin).toBe(7.25);
    expect(metrics.averageLoss).toBe(-14);
    expect(metrics.profitFactor).toBe(1.04);
  });

  it("groups net PnL and trade counts by symbol", () => {
    const metrics = deriveTradeLedgerMetrics(acceptedTrades);

    expect(metrics.symbolBreakdown).toEqual([
      { symbol: "BTCUSDT", pnl: -14, trades: 1 },
      { symbol: "ETHUSDT", pnl: 5.5, trades: 1 },
      { symbol: "SOLUSDT", pnl: 9, trades: 2 }
    ]);
  });

  it("groups close long trades as long and close short trades as short", () => {
    const metrics = deriveTradeLedgerMetrics(acceptedTrades);

    expect(metrics.directionBreakdown).toEqual([
      { direction: "long", pnl: 9, trades: 2 },
      { direction: "short", pnl: -8.5, trades: 2 }
    ]);
  });

  it("sorts accepted close trades before deriving date range and latest trade", () => {
    const metrics = deriveTradeLedgerMetrics([...acceptedTrades].reverse());

    expect(metrics.dateRange).toEqual({
      startTime: "2026-01-21T14:14:25.000Z",
      endTime: "2026-01-21T17:18:42.000Z"
    });
    expect(metrics.latestTradeTime).toBe("2026-01-21T17:18:42.000Z");
  });

  it("ignores non-accepted rows when deriving metrics", () => {
    const metrics = deriveTradeLedgerMetrics([
      ...acceptedTrades,
      trade({
        id: "open-row",
        futures: "SOLUSDT",
        time: "2026-01-21T18:00:00.000Z",
        direction: "Open Long",
        closingPnl: 999,
        fee: 0
      }),
      trade({
        id: "canceled-row",
        futures: "BTCUSDT",
        time: "2026-01-21T19:00:00.000Z",
        direction: "Close Short",
        closingPnl: 999,
        fee: 0,
        status: "Canceled"
      })
    ]);

    expect(metrics.tradeCount).toBe(4);
    expect(metrics.netRealizedPnl).toBe(0.5);
    expect(metrics.latestTradeTime).toBe("2026-01-21T17:18:42.000Z");
  });

  it("returns null profit factor when there is no gross loss", () => {
    const metrics = deriveTradeLedgerMetrics([
      trade({
        id: "winner",
        futures: "SOLUSDT",
        time: "2026-01-21T14:14:25.000Z",
        direction: "Close Long",
        closingPnl: 10,
        fee: 1
      })
    ]);

    expect(metrics.grossProfit).toBe(9);
    expect(metrics.grossLoss).toBe(0);
    expect(metrics.profitFactor).toBeNull();
    expect(metrics.averageLoss).toBeNull();
  });

  it("returns safe zero and null metrics for empty input", () => {
    const metrics = deriveTradeLedgerMetrics([]);

    expect(metrics).toEqual({
      tradeCount: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      winRatePercent: null,
      grossClosingPnl: 0,
      totalFees: 0,
      netRealizedPnl: 0,
      grossProfit: 0,
      grossLoss: 0,
      averageWin: null,
      averageLoss: null,
      profitFactor: null,
      symbolBreakdown: [],
      directionBreakdown: [],
      dateRange: {
        startTime: null,
        endTime: null
      },
      latestTradeTime: null
    });
  });
});
