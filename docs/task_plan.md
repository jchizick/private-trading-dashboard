# Trading Dashboard Task Plan

## Current Audit Status

- [x] Pause implementation.
- [x] Inventory current files and project structure.
- [x] Audit component boundaries.
- [x] Audit data schemas and mock fixtures.
- [x] Audit styling and visual-system decisions.
- [x] Update project memory files.
- [x] Audit current view models for daily snapshot planning.
- [x] Document separate account-equity and exchange-trade performance source models.
- [x] Document staged persistence recommendation.
- [x] Create final MVP handoff documentation.

## Phase 1 - Mock Frontend Shell

- [x] Establish project memory files.
- [x] Scaffold a private dashboard frontend.
- [x] Define TypeScript contracts before UI components.
- [x] Add mock dashboard data.
- [x] Build modular dashboard modules.
- [x] Verify the app builds and can run locally.

## Phase 2 - Data Contracts

- [x] Decide that current `dashboard.ts` contracts are view models by default, not persistence schemas.
- [x] Draft planned `DailyDashboardSnapshot` model.
- [x] Draft planned `SpxSnapshot`, `GammaSnapshot`, `FearGreedSnapshot`, and `SynthesisNotes` models.
- [x] Draft planned `TradingChecklistItem` and `ExternalToolLink` models.
- [x] Draft planned separate `AccountEquitySnapshot` and `ExchangeTradeRecord` source models.
- [x] Draft planned derived `PerformanceReviewSnapshot` and `PerformanceReviewNote` models.
- [x] Classify daily editable state, captured market snapshots, static config, performance source data, and future live integrations.
- [x] Recommend staged persistence strategy: localStorage prototype first, Supabase history later.
- [x] Implement snapshot interfaces in source code after approval.
- [x] Refine manual-entry schema for gamma context.
- [ ] Add timestamp/source metadata to module snapshots where needed.
- [ ] Define validation boundaries for percent values, prices, labels, and enum-like statuses.
- [ ] Add validation rules once the first real data source is chosen.

## Phase 3 - Private Workflow

- [x] Create a mock daily dashboard snapshot fixture.
- [x] Create a mock account equity history source fixture.
- [x] Create derived performance review snapshot helpers from account equity history.
- [x] Create shared daily snapshot provider/hook for loading or creating today's snapshot.
- [ ] Add edit flows for manual review notes and context snapshots.
- [x] Add manual edit flow for Synthesis Notes.
- [x] Add checklist status toggles.
- [x] Add localStorage persistence for daily snapshots.
- [ ] Add saved daily market read state.
- [x] Add snapshot archive concept by trading date.
- [x] Add named-field GammaSnapshot model and legacy gamma levels normalization.
- [x] Add manual Gamma Context edit flow.
- [ ] Add import or upload fallback for gamma images.
- [ ] Add a local review workflow for notes/tags without emphasizing PnL vanity.
- [x] Audit complete local MVP source separation and storage key map.

## Phase 4 - Live Integrations

- [ ] Add Google Sheets equity history sync or import after manual workflow is proven.
- [x] Add exchange CSV import parser foundation after account-equity source is stable.
- [x] Add exchange trade ledger import UI after parser/storage/calculation foundation is approved.
- [ ] Add exchange XLSX import parser after CSV workflow is proven.
- [x] Complete SPX/watchlist provider symbol discovery planning.
- [x] Add local FMP API key placeholder support for quote verification.
- [x] Add server-safe FMP quote verification script.
- [x] Verify FMP quote symbols after `FMP_API_KEY` is manually added.
- [x] Finalize MVP SPX/watchlist symbol map.
- [x] Add market quote route with server-side FMP key handling and mock fallback.
- [x] Add server-side market quote stale cache and unavailable fallback rows.
- [x] Wire SPX/watchlist quote values after route and cache are approved.
- [x] Add browser stale cache fallback for market quotes.
- [x] Audit and stabilize SPX/watchlist market quote integration.
- [x] Add local Twelve Data API key placeholder support for quote verification.
- [x] Add server-safe Twelve Data quote verification script.
- [x] Verify Twelve Data quote symbols after `TWELVE_DATA_API_KEY` is manually added.
- [x] Update market quote provider map after Twelve Data verification.
- [x] Integrate Twelve Data into `/api/market-quotes` for `XAUUSD`, `CADUSD`, and BTC fallback.
- [x] Audit and stabilize mixed-provider market quote integration.
- [ ] Add explicit daily market snapshot capture behavior after live display is stable.
- [ ] Integrate chart/embed source after provider choice.
- [ ] Integrate gamma image/levels provider or upload workflow after manual gamma state exists.
- [x] Integrate Fear & Greed source through server-side CoinMarketCap proxy with mock/stale fallback.
- [ ] Integrate market news and economic calendar sources after provider choice.
- [ ] Keep external orderflow platforms as references, not duplicated tools.
- [ ] Migrate daily snapshots, equity history, trade ledger records, and derived summaries to Supabase when ready.

## Phase 5 - Hardening

- [ ] Replace `latest` dependency ranges with pinned compatible versions after stack policy is chosen.
- [ ] Resolve or document npm audit findings.
- [ ] Add lint/typecheck script behavior compatible with the installed Next version.
- [ ] Add smoke tests or component tests once interactive workflows begin.
