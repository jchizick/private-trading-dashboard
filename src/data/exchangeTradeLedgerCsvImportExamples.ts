export const exchangeTradeLedgerCsvImportExamples = {
  validCloseTrades: `Futures,Time,Direction,Margin Mode,Leverage,Amount,Order Price,Filled Quantity,Avg Filled Price,Closing PNL,Fee,Status
SOLUSDT,2026-01-21 09:14:25,Close Long,Cross,12X,2.2 SOL,Market,2.2 SOL,128.9,7.951 USDT,0.0283 USDT,Filled
BTCUSDT,2026-01-21 10:02:11,Close Short,Isolated,5X,0.04 BTC,41750.2,0.04 BTC,41749.8,-12.25 USDT,1.12 USDT,Filled`,
  ignoredOpenAndNonFilledRows: `Futures,Time,Direction,Margin Mode,Leverage,Amount,Order Price,Filled Quantity,Avg Filled Price,Closing PNL,Fee,Status
ETHUSDT,2026-01-21 09:45:00,Open Long,Cross,3X,1.5 ETH,2500,1.5 ETH,2501.2,0 USDT,0.45 USDT,Filled
SOLUSDT,2026-01-21 09:50:00,Close Long,Cross,12X,2.2 SOL,Market,1.1 SOL,128.9,4.1 USDT,0.014 USDT,Partially Filled
BTCUSDT,2026-01-21 09:55:00,Close Short,Isolated,5X,0.04 BTC,Market,0.04 BTC,41749.8,-12.25 USDT,1.12 USDT,Canceled`,
  invalidRows: `Futures,Time,Direction,Margin Mode,Leverage,Amount,Order Price,Filled Quantity,Avg Filled Price,Closing PNL,Fee,Status
,2026-01-21 09:14:25,Close Long,Cross,12X,2.2 SOL,Market,2.2 SOL,128.9,7.951 USDT,0.0283 USDT,Filled
SOLUSDT,2026/01/21 09:14:25,Close Long,Cross,12X,2.2 SOL,Market,2.2 SOL,128.9,7.951 USDT,0.0283 USDT,Filled
SOLUSDT,2026-01-21 09:14:25,Exit Long,Cross,12X,2.2 SOL,Market,2.2 SOL,128.9,7.951 USDT,0.0283 USDT,Filled
SOLUSDT,2026-01-21 09:14:25,Close Long,Cross,12X,2.2 SOL,Market,2.2 SOL,not-a-price,7.951 USDT,0.0283 USDT,Filled
SOLUSDT,2026-01-21 09:14:25,Close Long,Cross,12X,2.2 SOL,Market,2.2 SOL,128.9,not-pnl,0.0283 USDT,Filled
SOLUSDT,2026-01-21 09:14:25,Close Long,Cross,12X,2.2 SOL,Market,2.2 SOL,128.9,7.951 USDT,not-fee,Filled`,
  duplicateCompositeRows: `Futures,Time,Direction,Margin Mode,Leverage,Amount,Order Price,Filled Quantity,Avg Filled Price,Closing PNL,Fee,Status
SOLUSDT,2026-01-21 09:14:25,Close Long,Cross,12X,2.2 SOL,Market,2.2 SOL,128.9,7.951 USDT,0.0283 USDT,Filled
SOLUSDT,2026-01-21 09:14:25,Close Long,Cross,12X,2.2 SOL,Market,2.2 SOL,128.9,7.951 USDT,0.0283 USDT,Filled`,
  unexpectedColumns: `Symbol,Filled Time,Side,Leverage,Filled Qty,Avg Price,Realized PnL,Fees,Order Status,Notes
SOLUSDT,2026-01-21 09:14:25,Close Long,12X,2.2 SOL,128.9,7.951 USDT,0.0283 USDT,Filled,manual export note`,
  metricFormulaFixture: `Futures,Time,Direction,Leverage,Filled Quantity,Avg Filled Price,Closing PNL,Fee,Status
SOLUSDT,2026-01-21 09:14:25,Close Long,12X,2.2 SOL,128.9,7.951 USDT,0.0283 USDT,Filled
BTCUSDT,2026-01-21 10:02:11,Close Short,5X,0.04 BTC,41749.8,-12.25 USDT,1.12 USDT,Filled
ETHUSDT,2026-01-21 11:18:42,Close Long,3X,1.5 ETH,2501.2,0.45 USDT,0.45 USDT,Filled`
} as const;
