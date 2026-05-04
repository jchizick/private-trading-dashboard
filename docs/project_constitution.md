# Trading Dashboard Project Constitution

## Architecture Invariants

- Mock data comes before live data integrations.
- TypeScript interfaces must be defined before dashboard components consume data.
- Current `src/types/dashboard.ts` contracts are view models unless a specific type is explicitly promoted into a persistence schema.
- Persisted daily state should be modeled around a planned `DailyDashboardSnapshot`, not the current `DashboardData` screen payload.
- Account-level equity history and exchange trade exports must remain separate performance source models.
- Account equity source rows use cumulative/total return semantics for imported return columns; Performance Review period return cards must derive from equity values, not from an imported cumulative return column.
- `PerformanceReviewSnapshot` should be derived from account equity history plus optional exchange trade ledger data.
- Account-equity Performance Review calculations must consume `AccountEquitySnapshot[]` only and remain agnostic to whether rows came from mock data, CSV, Google Sheets, local files, or Supabase.
- Imported account equity history must persist separately from `DailyDashboardSnapshot` and separately from future exchange trade ledger records.
- Imported exchange trade ledger records must persist separately from `DailyDashboardSnapshot` and separately from account equity history.
- Trade-ledger calculations must consume accepted close `ExchangeTradeRecord[]` rows only; the MVP closed-trade inclusion rule is `Status = Filled` plus `Direction = Close Long` or `Close Short`.
- Trade-ledger net realized PNL is after fees: `closingPnl - abs(fee)`. Gross closing PNL and total fees should remain separately available.
- Trade-ledger-derived metrics must not be faked from account equity history. If exchange trade records are unavailable, trade count, win rate, average win/loss, profit factor, fees, and symbol/direction breakdowns should be marked unavailable or future import.
- Daily snapshots should store point-in-time review summaries and daily context, not full equity history or full trade ledgers.
- Static checklist definitions and external tool default links should remain configuration, while daily checklist statuses belong to saved snapshots.
- Daily Gamma Context values belong to `DailyDashboardSnapshot.gamma`, not a separate global cache or provider cache.
- MVP Gamma Context is manual-first, based on @gexbot15 charts checked by the user; X/Twitter scraping, OCR, and provider automation are future work only.
- New manual Gamma drafts default to source `@gexbot15` and use the 10:05 AM ET check-time convention.
- Weekend Gamma drafts should be treated as `market_closed`; no Saturday or Sunday gamma update is expected.
- UI components must not hardcode business classification logic.
- Dashboard modules should remain modular and reusable.
- External technical-analysis platforms are summarized, not rebuilt, in the MVP.
- The app currently uses a Next.js App Router frontend with `src/app`.
- External provider API keys must never be exposed to browser/client code; provider calls that require secrets must go through server-side App Router route handlers.
- CoinMarketCap Fear & Greed uses `CMC_API_KEY` server-side only through `/api/fear-greed`.
- Live Fear & Greed cache data must remain separate from `DailyDashboardSnapshot`; daily snapshots may later capture point-in-time sentiment values during an explicit save flow.
- Financial Modeling Prep market quotes use `FMP_API_KEY` server-side only through `/api/market-quotes`.
- Twelve Data market quotes use `TWELVE_DATA_API_KEY` server-side only through `/api/market-quotes`.
- Live/cache market quote data must remain separate from `DailyDashboardSnapshot`; daily snapshots may later capture point-in-time SPX/watchlist values during an explicit save flow.
- Browser stale cache for market quotes uses `market-command:market-quotes-cache` and remains separate from saved daily history.
- `MarketSituationModule` must render mock-first and hydrate market quote data only after client mount.
- MVP market quotes should use only verified symbols: FMP `ESUSD` primary and `^GSPC` fallback for `SPX500`, Twelve Data `XAU/USD` primary and FMP `GCUSD` fallback for `XAUUSD`, FMP `BTCUSD` primary and Twelve Data `BTC/USD` fallback for `BTCUSDT`, and Twelve Data `CAD/USD` for `CADUSD`.
- `WTI` and `DXY` should remain unavailable/mock until another provider or plan is approved.
- Live integrations must preserve mock fallback behavior when provider, route, cache, or client fetch state is unavailable.
- `src/data/mockDashboardData.ts` provides the server-rendered mock view-model data; Performance Review can hydrate from imported local account equity history after client mount.
- Shared visual primitives belong in `src/components/ui`.
- Domain-specific dashboard modules belong in `src/components/dashboard`.
- Domain status formatting and descriptive helpers belong outside UI components, currently in `src/lib/marketStatus.ts`.

## Module Contracts

- `DashboardShell` consumes a `DashboardData` object and composes the full page.
- `PerformanceModule` consumes a `PerformanceSnapshot`.
- `MarketSituationModule` consumes a `MarketSituation`.
- `MarketSituationModule` can hydrate display-only SPX/watchlist quotes from `/api/market-quotes` after mount while preserving mock fallback.
- `GammaContextModule` consumes a `GammaContext`.
- `GammaContextModule` now reads saved daily gamma values from `DailySnapshotProvider` and uses `GammaContext` only for current display-shell context such as the mock distribution label.
- `FearGreedModule` consumes an initial mock `FearGreedSnapshot` and can hydrate from the internal `/api/fear-greed` route after client mount.
- `TradingContextModule` consumes a `TradingContext` for the surrounding module contract and currently initializes editable Synthesis Notes from `DailyDashboardSnapshot.synthesis`.
- `TradingContextModule` currently initializes interactive Trading Checklist status state from `DailyDashboardSnapshot.checklist`.
- `DailySnapshotProvider` owns the active editable `DailyDashboardSnapshot` prototype object, active date, saved date list, date switching, and localStorage persistence under `market-command:daily-snapshot:${date}`.
- `TradingContextModule` consumes `DailySnapshotProvider` state for Synthesis Notes and Trading Checklist instead of owning duplicate daily snapshot state.
- Local snapshot archive access is currently date-key based; saved snapshot dates are inferred from localStorage keys rather than a separate archive index.
- Switching the active date currently auto-cancels Synthesis Notes edit mode and discards unsaved draft edits.
- Switching the active date also auto-cancels unsaved Gamma Context edits and loads that date's `DailyDashboardSnapshot.gamma`.
- `PerformanceModule` still consumes the frontend `PerformanceSnapshot` view model, but that view model is now adapted from an equity-history-derived `PerformanceReviewSnapshot`.
- `PerformanceModule` owns the local CSV import UI and client-side source switch between mock equity history and imported local account equity history.
- Client-side edit and persistence state should remain narrowly scoped until a dedicated daily snapshot state hook or provider is introduced.
- Shared UI primitives consume display-ready props and do not own domain decisions.
- `SectionPanel` owns repeated panel framing, title, description, action, and body layout.
- `StatCard` owns label/value/detail presentation with display tone.
- `StatusBadge` owns compact status tone display.
- `KeyValueStrip` owns repeated key/value summary rows and strips.
- `ModuleNote` owns standardized module note presentation.
- `PlaceholderFrame` owns code-native placeholder framing for mock chart, gamma, and upload surfaces.
- `src/lib/formatters.ts` owns shared display formatting helpers.
- `src/lib/gammaSnapshot.ts` owns manual GammaSnapshot defaults, legacy gamma level normalization, and simple America/Toronto timing status rules.

## Behavioral Rules

- Emphasize review quality and context clarity over vanity performance presentation.
- Avoid celebratory or casino-style trading feedback.
- Prefer explicit manual fields when real business logic is unknown.
- Treat current market and gamma logic as mock display assumptions until formal rules are provided.
- Do not duplicate external tools for CVD, OI, liquidation heatmaps, funding, orderflow, candlestick telemetry, volume analysis, or net long/short positioning in the first build.

## Schemas

- Initial schemas are defined in `src/types/dashboard.ts`.
- The initial dashboard root contract is `DashboardData`.
- `DashboardData` is currently a view model for rendering the shell.
- Persistence-oriented daily snapshot schemas are defined in `src/types/dailySnapshot.ts`.
- Performance source schemas are defined in `src/types/performanceSources.ts`.
- Account equity import result schemas are defined in `src/types/accountEquityImport.ts`.
- Exchange trade ledger import result schemas are defined in `src/types/tradeLedgerImport.ts`.
- Account-equity calculation helpers are defined in `src/lib/performanceReviewCalculations.ts`.
- Account equity CSV parsing helpers are defined in `src/lib/accountEquityCsvImport.ts`.
- Imported account equity localStorage helpers are defined in `src/lib/accountEquityStorage.ts`.
- Exchange trade ledger CSV parsing helpers are defined in `src/lib/exchangeTradeLedgerCsvImport.ts`.
- Imported exchange trade ledger localStorage helpers are defined in `src/lib/exchangeTradeLedgerStorage.ts`.
- Trade-ledger metric helpers are defined in `src/lib/tradeLedgerCalculations.ts`.
- The Performance Review domain-to-view-model adapter is defined in `src/lib/performanceReviewViewModel.ts`.
- CoinMarketCap Fear & Greed source/API contracts are defined in `src/types/fearGreed.ts`.
- CoinMarketCap Fear & Greed normalization is defined in `src/lib/fearGreedNormalization.ts`.
- Browser stale cache helpers for Fear & Greed are defined in `src/lib/fearGreedStorage.ts`.
- Market quote source/API contracts are defined in `src/types/marketQuotes.ts`.
- Financial Modeling Prep quote normalization is defined in `src/lib/fmpQuoteNormalization.ts`.
- Twelve Data quote normalization is defined in `src/lib/twelveQuoteNormalization.ts`.
- Browser stale cache helpers for market quotes are defined in `src/lib/marketQuoteStorage.ts`.
- Gamma snapshot defaults and normalization helpers are defined in `src/lib/gammaSnapshot.ts`.
- The persistence root is `DailyDashboardSnapshot`.
- Daily snapshot submodels include `SpxSnapshot`, `GammaSnapshot`, `FearGreedSnapshot`, `SynthesisNotes`, `TradingChecklistItem`, `ExternalToolLink`, `PerformanceReviewSnapshot`, and `PerformanceReviewNote`.
- Performance source models include `AccountEquitySnapshot` for Google Sheet equity history and `ExchangeTradeRecord` for exchange CSV/XLSX trade ledger imports.
- Module data contracts are `PerformanceSnapshot`, `MarketSituation`, `GammaContext`, and `TradingContext`.
- Sentiment data contract is `FearGreedSnapshot`.
- Supporting schema types include `EquityPoint`, `TechnicalLevel`, `GammaLevel`, and `ExternalToolContext`.
- Current controlled unions include `TrendDirection`, `SessionStatus`, `MarketStatus`, `GammaRegime`, and `ReviewTag`.
- Gamma daily status values are `pending`, `not_checked`, `checked`, `unavailable`, and `market_closed`.

## Styling Invariants

- Visual system is dark, terminal-inspired, and restrained.
- Primary accent is controlled emerald/green using CSS variables in `src/app/globals.css`.
- Negative and warning colors are semantic accents, not dominant palette drivers.
- Radius is restrained and sharp; the current visual baseline favors `4px` cockpit-style panel geometry over soft cards.
- Layout uses a terminal side rail, compact telemetry top bar, command strip, and responsive dashboard grid.
- Desktop layout should favor the cockpit arrangement: Performance, SPX, and Gamma in the primary row, with Trading Context spanning below when viewport width allows.
- Header treatment should remain instrumentation-first, not hero/title-first.
- SPX Situation is the primary analytical anchor and should carry the strongest module hierarchy.
- Performance Review and Gamma Context are secondary context modules and should not visually overpower SPX.
- Trading Context should present as analyst synthesis/log output rather than a generic card grid.
- SPX and Gamma placeholders should read as embedded analytical panels, not generic empty states.
- Gamma Context should prioritize gamma-by-strike distribution shape, Major Positive Gamma, Major Negative Gamma, Zero Gamma / Flip when available, and last checked time.
- Fear & Greed is a compact secondary sentiment instrument beneath Gamma Context, not a dominant dashboard module.
- CSS breakpoints currently shift the cockpit grid at `1320px`, collapse to single-column flow at `980px`, convert the rail/layout at `760px`, and tighten small-screen spacing at `430px`.
- Avoid decorative casino-style effects, loud gradients, oversized PnL presentation, and retail-trading visual noise.

## Current Gaps

- No durable backend persistence layer has been implemented yet; current persistence is localStorage prototype state only.
- The account equity mock source is wired into the Performance Review module through a derived view model.
- Account equity CSV parsing, localStorage helpers, import UI, and Performance Review runtime source selection now exist for account equity history.
- Exchange trade ledger CSV parsing, localStorage helpers, import UI, and Performance Review runtime metric wiring now exist for imported exchange close trades.
- CoinMarketCap Fear & Greed now uses a server-side proxy, server memory cache, browser stale cache, and mock fallback.
- Financial Modeling Prep and Twelve Data market quotes now use a server-side proxy route, server memory cache, and mock/unavailable fallback rows.
- No broad validation layer exists; account equity CSV import has focused parser validation only.
- SPX/watchlist live market quote UI hydration now exists, but explicit daily market snapshot capture has not been added yet.
- No gamma image upload implementation exists.
- No tests exist.
- Dependency ranges are not pinned.
