import type {
  AccountEquitySnapshot,
  ExchangeTradeRecord
} from "@/types/performanceSources";

export const mockAccountEquityHistory = [
  {
    id: "equity-2026-04-27",
    date: "2026-04-27",
    equity: 100000,
    percentChange: 0,
    source: "google_sheet",
    importedAt: "2026-05-01T09:05:00-04:00"
  },
  {
    id: "equity-2026-04-28",
    date: "2026-04-28",
    equity: 100700,
    percentChange: 0.7,
    source: "google_sheet",
    importedAt: "2026-05-01T09:05:00-04:00"
  },
  {
    id: "equity-2026-04-29",
    date: "2026-04-29",
    equity: 100200,
    percentChange: -0.5,
    source: "google_sheet",
    importedAt: "2026-05-01T09:05:00-04:00"
  },
  {
    id: "equity-2026-04-30",
    date: "2026-04-30",
    equity: 101100,
    percentChange: 0.9,
    source: "google_sheet",
    importedAt: "2026-05-01T09:05:00-04:00"
  },
  {
    id: "equity-2026-05-01",
    date: "2026-05-01",
    equity: 100900,
    percentChange: -0.2,
    source: "google_sheet",
    importedAt: "2026-05-01T09:05:00-04:00"
  }
] satisfies AccountEquitySnapshot[];

export const mockExchangeTradeRecords = [
  {
    id: "trade-2026-05-01-001",
    sourceFileId: "exchange-export-2026-05-01",
    futures: "BTCUSDT",
    time: "2026-05-01T09:48:12-04:00",
    direction: "Long",
    marginMode: "Cross",
    leverage: 5,
    amount: 0.18,
    orderPrice: 64220.5,
    filledQuantity: 0.18,
    averageFilledPrice: 64218.3,
    closingPnl: 186.42,
    fee: 12.34,
    status: "Filled"
  },
  {
    id: "trade-2026-05-01-002",
    sourceFileId: "exchange-export-2026-05-01",
    futures: "ETHUSDT",
    time: "2026-05-01T10:37:44-04:00",
    direction: "Short",
    marginMode: "Isolated",
    leverage: 3,
    amount: 1.4,
    orderPrice: 3184.2,
    filledQuantity: 1.4,
    averageFilledPrice: 3185.1,
    closingPnl: -74.2,
    fee: 5.82,
    status: "Filled"
  },
  {
    id: "trade-2026-05-01-003",
    sourceFileId: "exchange-export-2026-05-01",
    futures: "SOLUSDT",
    time: "2026-05-01T13:22:08-04:00",
    direction: "Long",
    marginMode: "Cross",
    leverage: 2,
    amount: 34,
    orderPrice: 142.38,
    filledQuantity: 34,
    averageFilledPrice: 142.41,
    closingPnl: 58.76,
    fee: 4.11,
    status: "Filled"
  }
] satisfies ExchangeTradeRecord[];
