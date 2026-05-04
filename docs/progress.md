# Trading Dashboard Progress

## 2026-05-01

- Created required project memory documents.
- Captured initial MVP assumptions and constraints.
- Scaffolded a private Next/TypeScript app using the requested `src/app` shape.
- Added dashboard TypeScript contracts, mock data, and market-status helper functions.
- Built modular Performance, SPX Situation, Gamma Context, and Trading Context modules.
- Added a dark terminal-inspired visual system with responsive desktop/mobile layouts.
- Installed dependencies and generated `package-lock.json`.
- Verified `npm run build` passes.
- Started the dev server at `http://localhost:3000` and verified the page returns HTTP 200.
- Captured desktop and mobile screenshots under `tmp/qa/`.
- Fixed a mobile nav overflow issue found during screenshot verification.
- Noted 2 moderate npm audit findings; no force dependency fix was applied.
- Added `.gitignore` for dependency, build, environment, and temporary QA artifacts.
- Paused implementation and audited the current project.
- Documented file inventory, component boundaries, schemas, styling decisions, constraints, and known risks.
- Updated `task_plan.md`, `findings.md`, `progress.md`, and `project_constitution.md`.

## Current State

- Frontend shell exists and uses static mock data.
- Core dashboard modules are present: Performance Review, SPX Situation, Gamma Context, and Trading Context.
- Styling is centralized in `src/app/globals.css`.
- No live data, persistence, auth, upload handling, API layer, or interactive editing exists yet.

## Refinement Checkpoint - 2026-05-01

- Paused feature expansion and stabilized the current MVP shell.
- Added reusable UI primitives: `KeyValueStrip`, `ModuleNote`, and `PlaceholderFrame`.
- Added shared formatting helpers in `src/lib/formatters.ts`.
- Refactored Performance Review, SPX Situation, Gamma Context, Trading Context, and the command strip to use shared display primitives.
- Preserved existing mock data shape and TypeScript module contracts.
- Moved repeated percent/price formatting out of module-local implementations where practical.
- Tightened top bar presence, command strip density, panel spacing, placeholder treatment, and terminal-style visual hierarchy.
- Removed obsolete one-off style hooks for the replaced metric/playbook/chart/gamma placeholders.
- Verified `npm run build` passes after the refinement.

## Visual Alignment Pass - 2026-05-01

- Used the attached command-center mockup as the primary visual reference.
- Identified the five main gaps before editing: oversized website-like header, too-open layout density, soft side rail, generic SaaS panel styling, and low-credibility chart/placeholder treatment.
- Reworked the header into a compact telemetry bar with mode, updated time, risk state, SPX close, and mock-data state, all driven from existing mock data.
- Tightened the side rail into a darker terminal rail with compact markers, labels, and local data/feed status.
- Reflowed the desktop dashboard into a denser cockpit layout: Performance, SPX, and Gamma in the primary row with Trading Context spanning below.
- Made panels flatter and more terminal-like with sharper borders, smaller headers, tighter interiors, colder typography, and reduced rounding.
- Improved SPX Situation with a more trading-panel-like mock chart, grid, axis labels, candles, volume bars, and tighter key-level side treatment.
- Improved Gamma Context with a mock dealer-gamma exposure panel and denser metric table treatment.
- Tightened Performance Review and Trading Context spacing toward a report/log feel while keeping the existing data shape.
- Added no features, data sources, dependencies, or schema changes.
- Captured a desktop verification screenshot at `tmp/qa/alignment-1600.png`.
- Verified `npm run build` passes after the visual alignment pass.

## Hierarchy Refinement Pass - 2026-05-01

- Preserved the current layout, architecture, mock data, module set, and dependency set.
- Strengthened SPX Situation as the dashboard's primary analytical anchor with a dedicated `sectionPanel--marketAnchor` class.
- Gave the SPX panel more column weight, stronger border/header emphasis, larger quote hierarchy, taller chart area, and tighter key-level treatment.
- Reduced relative visual dominance of Performance Review and Gamma Context through smaller secondary headers and calmer borders.
- Refined Trading Context from a card grid into an analyst-style brief plus table/log presentation.
- Tightened technical typography: smaller metadata labels, stronger important values, less chunky secondary text, and more consistent header/action sizing.
- Made minor refinements to side rail tightness, top telemetry balance, background grid scale, and panel spacing.
- Captured the refined desktop screenshot at `tmp/qa/alignment-1600.png`.
- Verified `npm run build` passes after the hierarchy refinement.

## Status Strip Removal - 2026-05-01

- Removed the redundant status strip below the top telemetry bar.
- Removed the now-unused `KeyValueStrip` import from `DashboardShell`.
- Removed obsolete `commandStrip` CSS rules.
- Tightened top-bar-to-dashboard spacing so the primary modules pull upward cleanly.
- Preserved existing layout, modules, mock data, schemas, dependencies, and visual system.
- Refreshed `tmp/qa/alignment-1600.png` after the change.
- Verified `npm run build` passes.

## SPX Situation Refinement - 2026-05-01

- Scoped the pass to the SPX Situation module and SPX-related styling.
- Removed the rendered right-side key-level column containing Prior High, Balance Pivot, and Demand Shelf.
- Reworked the SPX chart row so the mock chart occupies the full module width.
- Increased the chart's vertical presence so SPX reads more clearly as the main market anchor.
- Added a compact local mock watchlist below the chart with Symbol, Last, Chg, Chg%, and Vol columns.
- Included watchlist rows for SPX500, XAUUSD, WTI, DXY, and CADUSD.
- Preserved the existing regime/overview note area below the watchlist.
- Did not add dependencies, data sources, modules, or change the mock data schema.
- Refreshed `tmp/qa/alignment-1600.png` after the SPX refinement.
- Verified `npm run build` passes.

## Gamma And Sentiment Right Column - 2026-05-01

- Refined Gamma Context around a gamma-by-strike distribution inspired by the provided GEX reference.
- Replaced the generic gamma placeholder with a horizontal positive/negative gamma exposure distribution.
- Added visual strike markers, zero/positive/negative reference lines, and compact strike-axis labeling.
- Updated mock gamma levels to Major Pos Gamma `7260`, Major Neg Gamma `7240`, and Zero Gamma / Flip `7250.83`.
- Replaced the prior generic level table/upload fallback presentation with a compact gamma summary grid.
- Added a new compact `FearGreedModule` beneath Gamma Context for the CMC Crypto Fear and Greed Index.
- Added typed mock sentiment data showing current value, label, last week, last month, year high, year low, and last updated time.
- Kept the new sentiment module secondary in hierarchy and constrained to the right column.
- Added no dependencies and no live data integrations.
- Refreshed `tmp/qa/alignment-1600.png` after the right-column update.
- Verified `npm run build` passes.

## Fear And Greed Visual Refinement - 2026-05-01

- Scoped the pass to `FearGreedModule` styling only.
- Reduced gauge height so the module reads as supporting context beneath Gamma.
- Reduced current value size and readout prominence.
- Made the gauge arc thinner and less saturated.
- Softened the needle, hub, stats, and source text.
- Kept historical values readable but quieter.
- Preserved the right-column layout, data shape, modules, dependencies, and surrounding dashboard.
- Refreshed `tmp/qa/alignment-1600.png` after the refinement.
- Verified `npm run build` passes.

## Performance Review Refinement - 2026-05-01

- Scoped the pass to `PerformanceModule` and Performance Review styling only.
- Reworked the Daily, Weekly, and Monthly snapshot into a tighter terminal-style metric strip.
- Refined the equity curve into a cumulative-return panel with internal header, return axis labels, vertical/horizontal gridlines, point markers, subdued area fill, and footer labels.
- Replaced the old three-item lower metric strip with a compact Performance Breakdown report table.
- Added mock report values for Net PnL, Max Drawdown, Profit Factor, Trades, Win Rate, Avg Win, and Avg Loss across YTD, 6M, and 1Y.
- Kept review tags and review-focus note, but reduced their visual dominance below the breakdown.
- Added a subdued local mock timestamp: `Last Updated: 09:42 ET`.
- Preserved the existing `PerformanceSnapshot` schema, dashboard mock-data contract, dependencies, and surrounding layout.
- Captured a desktop verification screenshot at `tmp/qa/performance-refinement-1600.png`.
- Verified `npm run build` passes.

## Shell Telemetry And Rail Refinement - 2026-05-01

- Scoped the pass to the top telemetry bar, side rail, and the active rail link markup.
- Tightened the top telemetry bar into a crisper terminal-style header with more disciplined label/value sizing, calmer separators, compact spacing, and stronger operational alignment.
- Preserved the same telemetry fields: Mode, Updated, Risk State, SPX, and Mock Data status.
- Refined the side rail with tighter row height, more deliberate separators, clearer active-state treatment, quieter inactive labels, and a more purposeful local data/feed footer.
- Added `aria-current="page"` to the active rail item for accessibility without changing navigation structure.
- Did not modify dashboard modules, mock data schemas, dependencies, or layout architecture.
- Captured a desktop verification screenshot at `tmp/qa/shell-refinement-1600.png`.
- Verified `npm run build` passes.

## Simplified Side Rail Fix - 2026-05-01

- Scoped the pass to the left side rail and related CSS.
- Removed the numeric glyph column from the rail link markup so labels can align cleanly without text/box overlap.
- Changed rail labels to the explicit terminal labels `PERF`, `SPX`, `GAMMA`, and `CONTEXT`.
- Replaced the inactive boxed-button treatment with plain mono rows, subdued inactive text, restrained hover background, and a thin left active indicator.
- Increased the rail width slightly to keep labels readable while preserving compact dashboard density.
- Preserved the footer status area with `DATA / MOCK` and `FEED / LOCAL`, using tighter grid alignment.
- Did not modify the top telemetry bar, dashboard modules, mock data, schemas, dependencies, or nav item set.
- Captured a desktop verification screenshot at `tmp/qa/side-rail-simplified-1600.png`.
- Verified `npm run build` passes.

## Trading Context Workflow Redesign - 2026-05-01

- Scoped the pass to `TradingContextModule` and Trading Context styling only.
- Reworked Trading Context into one unified module with four internal workflow columns: Market News, Economic Calendar, Synthesis Notes, and Trading Checklist.
- Added local mock presentation data for market headlines and macro calendar events without changing the `TradingContext` schema.
- Preserved the existing external-tool checklist concept by rendering `context.externalTools` inside the Trading Checklist column.
- Made Synthesis Notes the wider interpretive column, using existing `primaryBias`, `activePlaybook`, `invalidation`, and `manualNotes` fields.
- Kept the panel terminal-like with thin borders, compact rows, subdued labels, restrained emerald accents, and tight report/list spacing.
- Added responsive internal collapse rules so the four-column layout becomes two columns and then one column on narrower widths.
- Did not redesign surrounding dashboard modules, add dependencies, add live data, or change mock-data contracts.
- Restarted the local dev server for visual verification after it had stopped.
- Captured desktop verification screenshots at `tmp/qa/trading-context-redesign-1600.png` and `tmp/qa/trading-context-redesign-full.png`.
- Verified `npm run build` passes.

## Trading Context External Links Strip - 2026-05-01

- Scoped the pass to `TradingContextModule` and Trading Context-related styling only.
- Added a low-profile External Tools utility strip beneath the four Trading Context workflow columns.
- Added local mock tool entries for Bookmap, SPX Flow (Tradytics), SpotGamma, Unusual Whales, Macro Calendar, and `+ Add Tool`.
- Kept the strip visually subordinate with compact mono labels, subtle separators, restrained hover states, and low-emphasis action labels.
- Preserved the four-column Trading Context structure, existing mock data schema, dependencies, and surrounding dashboard layout.
- Captured a desktop verification screenshot at `tmp/qa/trading-context-links-strip.png`.
- Verified `npm run build` passes.

## Trading Context Final Refinement - 2026-05-01

- Scoped the pass to Trading Context-related CSS only.
- Preserved the unified four-column Trading Context workflow and the external links utility strip.
- Rebalanced internal column widths so Market News has more reading room, Economic Calendar stays compact, Synthesis Notes remains widest, and Trading Checklist stays medium width.
- Tightened column headers, row padding, list gaps, note blocks, status pills, and footer strip spacing for a denser scan-oriented read.
- Refined Market News headline width and metadata hierarchy for quicker scanning.
- Refined Economic Calendar time/event/impact alignment while keeping rows compact.
- Refined Synthesis Notes spacing and text hierarchy to keep it as the interpretive anchor.
- Reduced Trading Checklist visual busyness with tighter rows, smaller status pills, and calmer note text.
- Kept the external links strip compact and visually subordinate.
- Did not change component contracts, mock data schemas, dependencies, or surrounding dashboard modules.
- Captured a desktop verification screenshot at `tmp/qa/trading-context-final-refinement.png`.
- Verified `npm run build` passes.

## SPX And Sentiment Cleanup - 2026-05-01

- Scoped the pass to `MarketSituationModule`, `FearGreedModule`, and related styling only.
- Removed the interpretive SPX status/note block from the bottom of SPX Situation, including the `sideways consolidation` row and macro-read note.
- Preserved the SPX header, chart, and supporting watchlist.
- Replaced the Fear & Greed gauge with a compact horizontal sentiment bar, left-to-right fear/neutral/greed scale, marker, current value, and current label.
- Preserved Fear & Greed historical stats and source/update line.
- Did not change mock data schemas, component contracts, dependencies, live data behavior, or surrounding dashboard modules.
- Captured a desktop verification screenshot at `tmp/qa/spx-sentiment-cleanup.png`.
- Verified `npm run build` passes.

## Gamma And Checklist Cleanup - 2026-05-01

- Scoped the pass to `GammaContextModule`, the Trading Checklist section inside `TradingContextModule`, and related styling only.
- Removed the explanatory gamma interpretation sentence from the bottom of Gamma Context.
- Preserved the gamma distribution chart, Major Pos Gamma, Major Neg Gamma, Zero Gamma / Flip, and Last Checked fields.
- Removed descriptive text from each Trading Checklist row so checklist entries now show only source name and status pill.
- Tightened Trading Checklist row height and alignment so it reads as a procedural readiness/status scan.
- Did not change mock data schemas, component contracts, dependencies, live data behavior, or surrounding dashboard modules.
- Captured a desktop verification screenshot at `tmp/qa/gamma-checklist-cleanup.png`.
- Verified `npm run build` passes.

## Global Polish And BTC Watchlist Addition - 2026-05-02

- Added `BTCUSDT` as an additional mock row in the SPX Situation watchlist.
- Scoped the functional addition to the local SPX watchlist presentation data inside `MarketSituationModule`.
- Added a final CSS polish layer to improve panel border consistency, header spacing, status pill weight, table row density, chart grid subtlety, and overall vertical rhythm.
- Tightened top telemetry spacing and side rail label rhythm without changing shell structure.
- Refined chart/data surface polish through slightly calmer gridlines, sharper table backgrounds, and more consistent axis/label color.
- Tuned Trading Context spacing, checklist status alignment, and external tools strip weight while preserving its four-column workflow and utility footer.
- Added narrow-screen guardrails for top telemetry wrapping and small equity-curve footer labels after mobile screenshot verification.
- Did not change dashboard architecture, dependencies, live data behavior, component contracts, or mock data schemas.
- Captured desktop and mobile verification screenshots at `tmp/qa/global-polish-1600.png` and `tmp/qa/global-polish-mobile.png`.
- Verified `npm run build` passes.

## Daily Snapshot Data Spine - 2026-05-02

- Added persistence/domain snapshot contracts in `src/types/dailySnapshot.ts`.
- Added separate performance source contracts in `src/types/performanceSources.ts`.
- Kept the new contracts separate from the current `src/types/dashboard.ts` frontend view-model contracts.
- Added a mock saved daily command read fixture in `src/data/mockDailySnapshot.ts`.
- Added mock account equity history and exchange trade export records in `src/data/mockPerformanceSources.ts`.
- Modeled account-level equity history separately from exchange trade records.
- Included timestamps and source metadata in the mock daily snapshot where appropriate.
- Did not wire the new snapshot fixtures into the dashboard UI.
- Did not add persistence, localStorage, Supabase, imports, editing, dependencies, live data, or CSV/XLSX parsing.
- Verified `npm run build` passes after adding the data spine.

## Synthesis Notes Manual Editing Slice - 2026-05-02

- Scoped the first interactive workflow slice to Synthesis Notes inside `TradingContextModule`.
- Converted `TradingContextModule` to a client component so it can own local in-memory edit state.
- Initialized editable Synthesis Notes from `mockDailyDashboardSnapshot.synthesis`.
- Added read-only and edit modes for market bias, what matters today, conditions to watch, invalidation, and operator note.
- Added compact Edit, Save, and Cancel controls styled to match the terminal dashboard surface.
- Save updates only local component state and stamps `updatedAt` in memory.
- Cancel restores the last saved in-memory Synthesis Notes state.
- Did not add persistence, localStorage, Supabase, checklist toggles, archive/history, live data, dependencies, or unrelated module changes.
- Verified `npm run build` passes after adding the Synthesis Notes editing slice.

## Trading Checklist Status Toggle Slice - 2026-05-02

- Scoped the second manual workflow slice to Trading Checklist status interactions inside `TradingContextModule`.
- Initialized checklist state from `mockDailyDashboardSnapshot.checklist`.
- Preserved the existing checklist item set: CVD, Open Interest, Liquidation Heatmap, Funding Rates, Orderflow, Candlestick Telemetry, Volume Analysis, and Net Long/Short.
- Added compact status controls that cycle `not checked` to `watch` to `checked` and back to `not checked`.
- Preserved the existing subdued, warning, and positive status tones through the `StatusBadge` system.
- Kept the interaction local to React state only and stamped each changed item with an in-memory `updatedAt`.
- Did not add persistence, localStorage, Supabase, archive/history, live data, checklist notes, new checklist items, dependencies, or broader Trading Context redesign.
- Verified `npm run build` passes after adding Trading Checklist status toggles.

## LocalStorage Daily Snapshot Persistence - 2026-05-02

- Added `src/lib/dailySnapshotStorage.ts` with localStorage helpers for daily snapshots.
- Established the prototype storage key format `market-command:daily-snapshot:${date}`.
- Refactored `TradingContextModule` to use one local `DailyDashboardSnapshot` state object for Synthesis Notes and Trading Checklist statuses.
- Hydrates today's snapshot from localStorage after client mount when a saved snapshot exists.
- Falls back to a daily snapshot created from `mockDailyDashboardSnapshot` when no saved local snapshot exists.
- Saves the full `DailyDashboardSnapshot` object to localStorage when Synthesis Notes are saved.
- Saves the full `DailyDashboardSnapshot` object to localStorage when a Trading Checklist status is toggled.
- Updates snapshot-level `updatedAt`, Synthesis Notes `updatedAt`, and changed checklist item `updatedAt` values during local saves.
- Kept localStorage access client-safe and tolerant of unavailable storage or malformed saved JSON.
- Did not add Supabase, archive/history, live data, CSV/XLSX import, Google Sheets sync, dependencies, or a dashboard redesign.
- Verified `npm run build` passes after adding localStorage daily snapshot persistence.

## LocalStorage Persistence Audit - 2026-05-02

- Audited `src/lib/dailySnapshotStorage.ts` and `TradingContextModule` snapshot state usage.
- Confirmed localStorage reads happen only through client-safe helper calls inside the mount effect.
- Confirmed Synthesis Notes and Trading Checklist now read/write through the same `DailyDashboardSnapshot` state object.
- Confirmed Synthesis Notes Save writes the full snapshot and preserves Cancel behavior.
- Confirmed Trading Checklist toggles write the full snapshot and preserve the existing status cycle.
- Confirmed snapshot-level timestamps update on Synthesis Notes saves and checklist toggles.
- Confirmed nested synthesis timestamps update only when Synthesis Notes are saved.
- Confirmed nested checklist item timestamps update only for the changed checklist item.
- Tightened localStorage hydration so a loaded snapshot must match the requested trading date.
- Moved localStorage writes out of React state updater callbacks to keep state updates pure.
- Did not add features, dependencies, Supabase, archive/history, live data, or UI redesign.
- Verified `npm run build` passes after the persistence audit patches.

## Daily Snapshot Archive And Date Switching - 2026-05-02

- Added `src/lib/dailySnapshotFactory.ts` for creating and cloning daily snapshots from the mock/default template.
- Extended `src/lib/dailySnapshotStorage.ts` with `listDailyDashboardSnapshotDates`.
- Preserved the per-date localStorage key format `market-command:daily-snapshot:${date}`.
- Added compact active-date and archive controls to the Trading Context panel action area.
- Active date switching loads a saved snapshot when one exists.
- Active date switching creates a draft snapshot from the default template when no saved snapshot exists for the selected date.
- The archive select lists saved local snapshot dates discovered from localStorage.
- Synthesis Notes and Trading Checklist continue to read/write through the active `DailyDashboardSnapshot`.
- Synthesis Notes Save and Trading Checklist toggles persist to the active date and mark the snapshot as `saved`.
- Switching dates auto-cancels Synthesis Notes edit mode and discards any unsaved draft edits for the prior date.
- Pre-hydration state uses the default mock snapshot date before the client mount effect switches to the local trading date.
- Did not add a full archive page, delete flow, Supabase, dependencies, live data, CSV/XLSX import, Google Sheets sync, or dashboard redesign.
- Verified `npm run build` passes after adding date switching and archive access.

## Daily Snapshot Control Polish - 2026-05-02

- Scoped the pass to Trading Context date/archive controls only.
- Wrapped the active date input and archive select in compact labeled control chips.
- Added `Day` and `Saved` labels to clarify active trading date versus saved snapshot access.
- Reduced browser-default form feel with darker chip surfaces, tighter dimensions, subdued borders, mono typography, and focused hover/focus states.
- Preserved date switching, archive select behavior, unsaved-date draft creation, edit auto-cancel on date switch, Synthesis Notes save, and checklist toggle persistence.
- Did not add features, dependencies, Supabase, live data, archive page, delete flow, or dashboard redesign.
- Verified `npm run build` passes after polishing the date/archive controls.

## Archive Select Dropdown Readability Fix - 2026-05-02

- Scoped the pass to native archive select option styling only.
- Added explicit dark background and readable light text colors for archive dropdown options.
- Added an emerald-toned selected option style where native select styling is honored.
- Added muted fallback styling for disabled archive options.
- Did not replace the native select, add dependencies, change date-switching behavior, or modify unrelated modules.
- Verified `npm run build` passes after the archive dropdown readability fix.

## Performance Review Calculation Layer - 2026-05-02

- Audited the existing Performance Review flow: `PerformanceModule` used the old `PerformanceSnapshot` view model, while account equity and trade ledger domain source types lived separately in `src/types/performanceSources.ts`.
- Added pure account-equity calculation helpers in `src/lib/performanceReviewCalculations.ts`.
- Added a small view-model adapter in `src/lib/performanceReviewViewModel.ts`.
- Derived Performance Review module data from `mockAccountEquityHistory` in `src/data/mockDashboardData.ts`.
- Kept the calculation layer source-agnostic: it consumes `AccountEquitySnapshot[]` and does not know whether rows came from mocks, CSV, Google Sheets, local files, or Supabase.
- Preserved source separation by not using `mockExchangeTradeRecords` in this task.
- Updated Performance Review display values to reflect equity-history-derived daily, weekly, monthly, YTD, max drawdown, latest equity, equity change, equity curve, and last-updated data.
- Marked trade-ledger-required metrics such as trades, win rate, profit factor, and average win/loss as unavailable/future import instead of faking them from equity history.
- Did not add dependencies, Google Sheets sync, CSV upload, exchange import, Supabase, local file watching, or UI redesign.
- Verified `npm run build` passes after the calculation-layer wiring.

## Account Equity CSV Import Foundation - 2026-05-02

- Added account equity import result types in `src/types/accountEquityImport.ts`.
- Added `parseAccountEquityCsv` in `src/lib/accountEquityCsvImport.ts`.
- The parser accepts Google Sheet-style account equity CSV rows with required logical fields: date, equity, and percent change.
- Dates are ISO-only (`YYYY-MM-DD`) and invalid calendar dates are rejected.
- Quoted comma-formatted equity values such as `"$100,000.50"` and `"100,000"` are supported.
- Malformed unquoted comma values that split rows into extra cells are rejected with a `malformed_csv_row` issue rather than guessed or repaired.
- Duplicate dates block import, out-of-order rows are sorted with a warning, blank rows are skipped, and unexpected columns warn without blocking.
- Added client-safe localStorage helpers in `src/lib/accountEquityStorage.ts`.
- Imported account equity history uses `market-command:account-equity-history`; optional import summary data uses `market-command:account-equity-history:import-summary`.
- Added documented parser fixture examples in `src/data/accountEquityCsvImportExamples.ts` because the project still has no test runner.
- Did not add UI, import buttons, file inputs, Google Sheets sync, Supabase, exchange trade import, or Performance Review wiring changes.
- Verified `npm run build` passes after adding the parser and storage helpers.

## Performance Review CSV Import UI - 2026-05-02

- Converted `PerformanceModule` to a client component so it can read localStorage and browser file input state safely after hydration.
- Added a compact `Import Equity CSV` action in the Performance Review panel header.
- Added a hidden `.csv` file input triggered by the import action; CSV text is read in-browser with `FileReader`.
- Wired selected CSV files through `parseAccountEquityCsv`, passing the selected file name as the source name.
- Added an inline import preview panel showing rows parsed, rows skipped, errors, warnings, date range, latest equity, and compact validation issues.
- Confirm Import is enabled only when `EquityImportResult.ok` is true.
- Confirming an import saves parsed records with `saveImportedAccountEquityHistory`, saves the optional import summary, and immediately recalculates Performance Review from imported account equity records.
- On initial client load, `PerformanceModule` now uses imported local account equity history when it exists; otherwise it keeps the mock-derived performance data passed from the server.
- Added a low-profile `Use Mock Data` action when imported data is active; it clears imported account equity history and returns the Performance Review to mock data.
- Kept imported account equity history separate from `DailyDashboardSnapshot` and separate from future exchange trade ledger records.
- Did not add Google Sheets sync, Supabase, backend upload, exchange trade import, DailyDashboardSnapshot changes, or dashboard redesign.
- Verified `npm run build` passes after wiring the import UI.

## Performance Breakdown Display Cleanup - 2026-05-02

- Scoped the pass to Performance Review display cleanup only.
- Replaced the cramped four-column Performance Breakdown table with compact grouped sections.
- Account-equity-derived metrics now sit under `Account Equity` with simple metric/value rows.
- Trade-ledger-only metrics now sit under `Trade Ledger` with a quiet `pending` group label and `N/A` values.
- Removed repeated Source and Status columns from the breakdown to avoid awkward wrapping in the narrow Performance Review panel.
- Preserved CSV import behavior, parser behavior, localStorage behavior, mock/imported source switching, and calculation logic.
- Did not change the import preview panel beyond adjacent layout compatibility.
- Verified `npm run build` passes after the display cleanup.

## Performance Review Source-State Polish - 2026-05-02

- Scoped the pass to Performance Review source-state display only.
- Added a compact active-source strip above the short-term performance metrics.
- Mock mode now labels the module as `Source: Mock Equity History` with a subdued `Mock Data` badge.
- Imported mode now labels the module as `Source: Imported CSV` with a low-profile `Local CSV` badge.
- Made the equity curve footer label dynamic: mock mode shows `Mock account equity curve`, imported mode shows `Local CSV equity curve`.
- Replaced the review note text with source-aware copy for mock equity history versus imported local equity history.
- Preserved import controls, import preview/confirm behavior, Use Mock Data reset behavior, parser behavior, localStorage behavior, calculation utilities, and source-switching logic.
- Verified `npm run build` passes after the source-state polish.

## Exchange Trade Ledger Import Foundation - 2026-05-03

- Added trade ledger import result types in `src/types/tradeLedgerImport.ts`.
- Minimally extended `ExchangeTradeRecord` to support parsed close-trade imports: close/open direction values, `rawTime`, `importedAt`, and optional amount/filled quantity asset labels.
- Added `parseExchangeTradeLedgerCsv` in `src/lib/exchangeTradeLedgerCsvImport.ts`.
- Added client-safe localStorage helpers in `src/lib/exchangeTradeLedgerStorage.ts`.
- Added pure trade-ledger metric utilities in `src/lib/tradeLedgerCalculations.ts`.
- Added documented CSV fixtures in `src/data/exchangeTradeLedgerCsvImportExamples.ts`.
- CSV parsing supports the approved exchange column aliases, quoted CSV rows, `YYYY-MM-DD HH:mm:ss` timestamps interpreted as `America/Toronto`, directions `Open Long`, `Open Short`, `Close Long`, and `Close Short`, `12X` leverage, quantity suffixes such as `2.2 SOL`, `Market` order price, and PNL/fee values such as `7.951 USDT`.
- Closed-trade metrics include only rows with `Status = Filled` and `Direction = Close Long` or `Close Short`.
- Open rows and non-filled rows are ignored with warnings. Accepted close rows require valid closing PNL, fee, filled quantity, and average filled price.
- Duplicate close rows block import using the approved composite key.
- Trade metrics now derive trade count, wins/losses/breakevens, win rate, gross closing PNL, total fees, after-fee net realized PNL, gross profit/loss, average win/loss, profit factor, symbol breakdown, direction breakdown, date range, and latest trade time.
- LocalStorage keys are `market-command:exchange-trade-ledger` and `market-command:exchange-trade-ledger:import-summary`.
- Did not add UI, Performance Review wiring, XLSX support, exchange API integration, Supabase, DailyDashboardSnapshot changes, or account-equity mixing.
- Verified `npm run build` passes after adding the trade-ledger foundation.

## Performance Review Trade Ledger Metrics Wiring - 2026-05-03

- Wired `PerformanceModule` to load imported exchange trade ledger records from localStorage after client mount with `loadImportedExchangeTradeLedger`.
- Kept account-equity source behavior unchanged: imported account equity history still wins when available, otherwise the server-provided mock equity view model remains active.
- Derived imported trade metrics only from exchange trade ledger records through `deriveTradeLedgerMetrics`.
- Updated the Performance Review view-model adapter so optional `PerformanceReviewSnapshot.tradeStats` can populate trade count, win rate, profit factor, average win, and average loss.
- Added a small view-model helper for applying imported trade metrics to the existing `PerformanceSnapshot` when mock account equity is active.
- Populated the existing Trade Ledger group with Trades, Win Rate, Profit Factor, and Avg Win / Loss when imported close-trade records exist.
- Preserved the pending `N/A` Trade Ledger display when no imported exchange trade ledger records exist.
- Added a compact `Trade Ledger: pending/imported` source line without adding trade import controls.
- Did not add an Import Trade Ledger button, file input, preview panel, parser/storage changes, DailyDashboardSnapshot changes, Supabase, exchange API, XLSX support, dependencies, or a dashboard redesign.

## Performance Review Trade Ledger CSV Import UI - 2026-05-03

- Added a compact `Import Trade Ledger CSV` action next to the existing Performance Review import controls.
- Added a separate hidden `.csv` file input for exchange trade ledger files; selected files are read in-browser with `FileReader`.
- Parsed selected trade ledger CSV text with `parseExchangeTradeLedgerCsv`, passing the selected file name as the source name.
- Added an inline Trade Ledger CSV import preview showing rows parsed, skipped rows, errors, warnings, accepted closed trades, ignored open/non-filled rows, date range, symbols detected, gross closing PnL, total fees, and net realized PnL.
- Displayed the first five parser validation issues compactly with row number, severity, and message.
- Enabled `Confirm Import` only when the trade ledger parser result is OK.
- Confirming a trade ledger import saves accepted records with `saveImportedExchangeTradeLedger`, saves the import summary with `saveExchangeTradeLedgerImportSummary`, and recalculates Performance Review trade metrics immediately.
- Added a low-profile `Clear Trade Ledger` action when imported trade ledger metrics are active; clearing removes imported exchange trade ledger storage and returns the Trade Ledger section to pending / `N/A`.
- Preserved account equity CSV import, equity source switching, mock fallback behavior, and separation between account equity history, exchange trade ledger records, and daily snapshots.
- Did not add Supabase, exchange API integration, XLSX support, DailyDashboardSnapshot changes, dependencies, parser/storage behavior changes, or a dashboard redesign.
- Verified `npm run build` passes after adding the import UI.

## Performance Review Local Data Flow Audit - 2026-05-03

- Audited the complete local Performance Review flow across `PerformanceModule`, account equity CSV import/storage, exchange trade ledger CSV import/storage, account-equity calculations, trade-ledger calculations, and the Performance Review view-model adapter.
- Confirmed source separation:
  - Daily snapshots use `market-command:daily-snapshot:${date}`.
  - Account equity history uses `market-command:account-equity-history`.
  - Account equity import summary uses `market-command:account-equity-history:import-summary`.
  - Exchange trade ledger records use `market-command:exchange-trade-ledger`.
  - Exchange trade ledger import summary uses `market-command:exchange-trade-ledger:import-summary`.
- Confirmed clearing imported account equity removes only account equity history and summary, leaving imported trade ledger records intact.
- Confirmed clearing imported trade ledger removes only trade ledger records and summary, leaving imported account equity history intact.
- Confirmed both imported account equity and imported exchange trade ledger records can coexist in Performance Review.
- Confirmed source priority: imported account equity history drives account-level metrics when present; otherwise the module uses the mock-derived `PerformanceSnapshot`.
- Confirmed trade-ledger metrics come only from imported exchange trade ledger records; when no accepted imported ledger exists, Trade Ledger stays pending / `N/A`.
- Confirmed account returns, equity change, equity curve, and drawdown are derived only from `AccountEquitySnapshot[]`.
- Confirmed trade count, win rate, average win/loss, profit factor, gross PnL, fees, and net realized PnL are derived only from accepted close `ExchangeTradeRecord[]`.
- Confirmed trade net PnL uses the after-fee convention from `getTradeNetPnl`: `closingPnl - abs(fee)`.
- Patched one UI copy bug so the Performance Review note no longer says trade-ledger stats are unavailable after imported exchange trade records are active.
- Known limitations: no automated tests yet, no import history view, no rehydrated import-summary preview after page reload, no localStorage schema versioning/migration layer, no cross-device sync, and no durable backend persistence.
- Recommended next integration phase: add focused tests for the pure CSV parser/calculation/view-model helpers, then consider either compact fee/net PnL display outside the preview or a durable persistence layer once the local workflow is proven.

## Gamma Snapshot Model And Shared Daily Snapshot State - 2026-05-03

- Updated `DailyDashboardSnapshot.gamma` from labeled `levels[]` storage to named fields for Major Positive Gamma, Major Negative Gamma, Zero Gamma / Flip, optional spot reference, source metadata, status, captured timestamp, and update timestamp.
- Added Gamma status values for `pending`, `not_checked`, `checked`, `unavailable`, and `market_closed`.
- Added Gamma snapshot helpers for the manual `@gexbot15` source convention, legacy `levels[]` normalization, and simple `America/Toronto` timing defaults.
- New draft snapshots now default Gamma status to `market_closed` on Saturday/Sunday, `pending` before 10:05 AM ET on weekdays, and `not_checked` after 10:05 AM ET on weekdays when no manual levels exist.
- Existing saved localStorage snapshots with old gamma level arrays are normalized on load so old Major Pos Gamma, Major Neg Gamma, and Zero Gamma / Flip values map into the new named fields.
- Added a shared client daily snapshot provider/hook that owns active date, active snapshot, saved snapshot dates, date loading, snapshot saving, and updater-based persistence.
- Wrapped dashboard modules with the shared provider and refactored `TradingContextModule` to consume the shared snapshot state instead of owning its own local daily snapshot load/save flow.
- Preserved Trading Context date switching, archive select, Synthesis Notes edit/save/cancel, checklist status toggles, and the existing `market-command:daily-snapshot:${date}` localStorage key.
- Did not add Gamma editing UI, screenshot upload, source URL UI, OCR, X/Twitter scraping, live provider integration, dependencies, or visual redesign.
- Verified `npm run build` passes after the refactor.

## Manual Gamma Context Editing - 2026-05-03

- Converted `GammaContextModule` to a client component that reads the active `DailyDashboardSnapshot.gamma` through `useDailySnapshot`.
- Gamma Context now displays saved daily gamma values for Major Positive Gamma, Major Negative Gamma, Zero Gamma / Flip, last checked time, source name, status, and regime.
- Preserved the existing mock gamma distribution SVG as visual context; the chart is not a live feed, uploaded screenshot, or parsed image.
- Added compact `Edit Gamma`, `Save`, and `Cancel` controls in the existing panel action area.
- Edit mode supports Major Positive Gamma, Major Negative Gamma, Zero Gamma / Flip, Last Checked datetime, and Gamma status.
- Saving writes to the active daily snapshot through the shared snapshot updater, marks the snapshot saved, sets source to `manual`, preserves/defaults source name to `@gexbot15`, updates `capturedAt` and `updatedAt`, and sets Gamma status to `checked` when any manual gamma level is saved.
- Empty gamma level fields save as `null`; non-numeric gamma level input shows a compact inline error and does not persist.
- Active date changes reset/discard unsaved Gamma edits, matching the Synthesis Notes date-switching behavior.
- Did not add screenshot upload, source URL UI, OCR, X/Twitter scraping, live provider integration, dependencies, separate Gamma localStorage keys, or dashboard redesign.
- Verified `npm run build` passes after the Gamma edit flow.

## Manual Gamma Context Workflow Audit - 2026-05-03

- Audited Gamma Context, `DailySnapshotProvider`, daily snapshot storage/factory helpers, legacy gamma normalization, and Trading Context's shared snapshot usage.
- Confirmed Gamma Context reads from the active `DailyDashboardSnapshot.gamma` and saves through the shared snapshot updater.
- Confirmed no separate Gamma localStorage key exists; Gamma persists only through `market-command:daily-snapshot:${date}`.
- Confirmed Gamma and Trading Context share the same active daily snapshot state through `DailySnapshotProvider`.
- Confirmed date switching loads date-specific Gamma snapshots and resets unsaved Gamma edits safely.
- Confirmed legacy `gamma.levels[]` snapshots normalize old Major Pos Gamma, Major Neg Gamma, and Zero Gamma / Flip labels into the named fields.
- Confirmed timing defaults remain simple: weekend `market_closed`, weekday pre-10:05 AM ET `pending`, and weekday post-10:05 AM ET `not_checked`.
- Patched one clear edge-case bug: invalid or partial Last Checked datetime values now show a compact error instead of risking a thrown `toISOString` error during save.
- Confirmed Trading Context date switching, Synthesis Notes editing, checklist toggles, Performance Review local source flows, and Fear & Greed storage/API separation are not changed by the Gamma audit patch.
- Verified `npm run build` passes after the audit patch.

## Whole-System Local MVP Audit - 2026-05-03

- Audited the local MVP across `DailySnapshotProvider`, Trading Context, Gamma Context, Performance Review, Fear & Greed, localStorage helpers, and the `/api/fear-greed` route.
- Confirmed source separation remains intact: daily command snapshots, account equity history, exchange trade ledger records, and Fear & Greed live/cache data use separate storage paths.
- Confirmed daily snapshots contain daily command state only; raw account equity imports, raw exchange trade ledger records, and Fear & Greed browser/server cache data are not stored inside `DailyDashboardSnapshot`.
- Confirmed daily snapshot behavior: active date switching, archive select, Synthesis Notes, Trading Checklist, and Gamma Snapshot all use the shared active daily snapshot state and persist by date.
- Confirmed unsaved Synthesis Notes and Gamma edits reset safely on active date changes.
- Confirmed Performance Review source behavior: imported account equity history takes precedence over mock equity history, clearing account equity returns account metrics to mock, imported trade ledger records populate trade stats, clearing trade ledger returns the Trade Ledger section to pending / `N/A`, and both imported sources remain separate.
- Confirmed Fear & Greed behavior: mock data renders first, the module fetches `/api/fear-greed` after mount, `CMC_API_KEY` stays server-side in the route, stale browser/server cache fallback is separate from daily snapshots, and missing API key leaves the dashboard on cached/mock data without crashing.
- Current localStorage key map:
  - Daily snapshots: `market-command:daily-snapshot:${date}`
  - Account equity history: `market-command:account-equity-history`
  - Account equity import summary: `market-command:account-equity-history:import-summary`
  - Exchange trade ledger: `market-command:exchange-trade-ledger`
  - Exchange trade ledger import summary: `market-command:exchange-trade-ledger:import-summary`
  - Fear & Greed browser cache: `market-command:fear-greed-cache`
- Known limitations remain: no Supabase or durable multi-device persistence, no tests/test runner, no Google Sheets sync, no exchange API, no XLSX import, no Gamma screenshot/upload/OCR, no SPX/watchlist live feed, and no market holiday calendar.
- No whole-system audit bugs required a code patch.
- Verified `npm run build` passes after documentation updates.

## Market Quote Route MVP - 2026-05-03

- Added normalized market quote contracts in `src/types/marketQuotes.ts`, separate from `dashboard.ts` view models and `DailyDashboardSnapshot`.
- Added pure FMP quote normalization helpers in `src/lib/fmpQuoteNormalization.ts`.
- Added `GET /api/market-quotes` as a server-side App Router route using `FMP_API_KEY`.
- Wired only the verified FMP-supported MVP symbols into the route: `ESUSD` primary and `^GSPC` fallback for `SPX500`, `GCUSD` for `XAUUSD`, and `BTCUSD` for `BTCUSDT`.
- Returned normalized unavailable rows for `WTI`, `DXY`, and `CADUSD` instead of retrying FMP symbols blocked by the current plan.
- Added module-level in-memory route cache with 5-minute active-hours freshness and 30-minute off-hours freshness, plus stale-cache fallback on provider failure.
- Preserved source separation: no UI wiring, no DailyDashboardSnapshot writes, no dependencies, no Twelve Data integration, and no live charting.
- Verified `npm run build` passes and local `GET /api/market-quotes` returns the expected live/unavailable row mix.

## Market Situation Quote Hydration - 2026-05-03

- Added `src/lib/marketQuoteStorage.ts` for client-safe browser stale cache helpers using `market-command:market-quotes-cache`.
- Converted `MarketSituationModule` to a client component with mock-first render and post-mount `/api/market-quotes` hydration.
- Hydrated the SPX hero/chart quote from `SPX500` route data when available.
- Hydrated watchlist rows for `SPX500`, `XAUUSD`, and `BTCUSDT` from live/cache route data while preserving mock values as fallback.
- Kept `WTI`, `DXY`, and `CADUSD` as mock-value rows with subtle unavailable status when the route reports unavailable.
- Added a compact market quote source state badge and subtle per-row source/status text without redesigning the module.
- Preserved source separation: market quote browser cache is separate from `DailyDashboardSnapshot`, and no daily snapshot writes were added.
- Verified `npm run build` passes after wiring the client hydration path.

## Market Quote Integration Audit - 2026-05-03

- Audited `/api/market-quotes`, FMP normalization, browser stale-cache helpers, `MarketSituationModule` hydration, source/status labels, and storage boundaries.
- Confirmed the route keeps `FMP_API_KEY` server-side and returns controlled JSON for missing key or provider failure paths.
- Confirmed live route rows for `SPX500`, `XAUUSD`, and `BTCUSDT`, with unavailable rows for `WTI`, `DXY`, and `CADUSD`.
- Confirmed `SPX500` uses FMP `ESUSD` as primary and FMP `^GSPC` as fallback only when ESUSD is unusable.
- Confirmed client hydration is mock-first, client-only, saves successful route responses to `market-command:market-quotes-cache`, and falls back to stale cache before mock data.
- Confirmed no market quote data writes to `DailyDashboardSnapshot`, imported performance source storage, or Fear & Greed cache storage.
- Patched one stability issue by reusing the stricter market quote result validator in `MarketSituationModule` before accepting or caching route responses.
- Verified `npm run build` passes after the audit patch.

## SPX Watchlist Metadata Polish - 2026-05-03

- Scoped the pass to `MarketSituationModule` display copy and watchlist metadata styling only.
- Replaced verbose row metadata such as `E-Mini S&P 500 proxy / live` with compact labels such as `proxy / live`, `futures / live`, and `mock / unavailable`.
- Shortened the module-level quote source badge from `Market Quotes: partial` style copy to `quotes: partial`.
- Reduced watchlist metadata font size, weight, and opacity so it stays subordinate to price/change values.
- Preserved the existing table layout, chart placeholder, route/fetch/cache behavior, normalized quote logic, and DailyDashboardSnapshot separation.
- Verified `npm run build` passes after the display polish.

## Mixed Provider Market Quote Route - 2026-05-03

- Added pure Twelve Data quote normalization in `src/lib/twelveQuoteNormalization.ts`.
- Expanded market quote contracts and browser stale-cache validation to support mixed FMP, Twelve Data, and mock providers.
- Updated `GET /api/market-quotes` to use the approved provider map:
  - `SPX500`: FMP `ESUSD`, fallback FMP `^GSPC`.
  - `XAUUSD`: Twelve Data `XAU/USD`, fallback FMP `GCUSD`.
  - `BTCUSDT`: FMP `BTCUSD`, fallback Twelve Data `BTC/USD`.
  - `CADUSD`: Twelve Data `CAD/USD`, fallback unavailable.
  - `WTI` and `DXY`: unavailable/mock, with no provider calls.
- Preserved existing server cache behavior and browser cache compatibility under `market-command:market-quotes-cache`.
- Preserved source separation: provider keys stay server-side, no UI layout redesign was added, and quote data is not written into `DailyDashboardSnapshot`.
- Verified `npm run build` passes.
- Verified local `GET /api/market-quotes` returns live `CADUSD` from Twelve Data, `XAUUSD` from Twelve Data primary, and `BTCUSDT` from FMP primary.

## Mixed Provider Market Quote Stabilization Audit - 2026-05-03

- Audited `/api/market-quotes`, FMP normalization, Twelve Data normalization, provider fallback order, server cache behavior, browser stale-cache validation, `MarketSituationModule` hydration, API key boundaries, and localStorage source separation.
- Confirmed the live provider map remains: `SPX500` uses FMP `ESUSD` then FMP `^GSPC`; `XAUUSD` uses Twelve Data `XAU/USD` then FMP `GCUSD`; `BTCUSDT` uses FMP `BTCUSD` then Twelve Data `BTC/USD`; `CADUSD` uses Twelve Data `CAD/USD`; `WTI` and `DXY` remain unavailable/mock with no provider calls.
- Confirmed `FMP_API_KEY` and `TWELVE_DATA_API_KEY` are read only in the server route, provider endpoints are called only from the server route, and no provider keys or provider URLs appear in client components.
- Confirmed route fallback behavior covers missing individual keys, missing both keys, provider request failures, malformed quote payloads, partial provider success, and stale server-cache fallback.
- Confirmed `MarketSituationModule` renders mock values first, fetches `/api/market-quotes` after mount, hydrates validated successful results, saves successful results to `market-command:market-quotes-cache`, and falls back from route failure to browser stale cache before mock.
- Confirmed market quote data is not written into `DailyDashboardSnapshot`, Fear & Greed cache, account equity history, or exchange trade ledger storage.
- Patched the missing-both-keys route status so `missing_market_quote_api_keys` returns service-unavailable semantics instead of generic upstream-failure semantics when no stale cache exists.
- Patched the watchlist metadata separator from a mojibake artifact to compact ASCII copy such as `proxy / live` and `mock / unavailable`.
- Preserved existing UI layout, provider set, chart placeholder behavior, websocket boundary, dependency set, and `DailyDashboardSnapshot` separation.
- Verified `npm run build` passes after the stabilization audit.

## Final MVP Handoff Documentation - 2026-05-03

- Added `docs/mvp_handoff.md` as the current Market Command MVP operating handoff.
- Documented the working feature set, local setup commands, environment variables, server-side API key boundaries, manual daily workflow, account equity CSV import, exchange trade ledger CSV import, live-data behavior, localStorage keys, known limitations, and recommended roadmap.
- Updated the task plan to mark final MVP handoff documentation complete.
- Made no app behavior changes, source-code changes, provider changes, storage changes, dependencies, or UI changes.
- Verified `npm run build` passes after the documentation update.

## Account Equity Return Semantics Fix - 2026-05-04

- Audited account equity return flow across `AccountEquitySnapshot`, account equity CSV import types, parser/storage helpers, `performanceReviewCalculations`, `performanceReviewViewModel`, `PerformanceModule`, and mock account equity fixtures.
- Confirmed the incorrect imported Daily card came from treating the imported sheet's third column as row-level daily `percentChange`.
- Renamed the account equity source field to `cumulativeReturnPercent` so imported Google Sheet return columns are modeled as cumulative/total return from starting equity.
- Kept CSV header compatibility for legacy sheet headers such as `Percent Change`, `% Change`, `percentChange`, and `pctChange`, but now maps them into `cumulativeReturnPercent`.
- Added explicit parser aliases for future cumulative/total return headers such as `cumulativeReturnPercent`, `totalReturnPercent`, `cumulativeReturn`, and `totalReturn`.
- Updated account equity localStorage loading to migrate old imported records with `percentChange` into `cumulativeReturnPercent`.
- Changed Daily return derivation to use latest equity versus the previous available equity row: `((latestEquity - previousEquity) / previousEquity) * 100`.
- Confirmed Weekly, Monthly, YTD, equity curve, max drawdown, latest equity, and account equity change continue to derive from equity values rather than the imported cumulative-return column.
- Updated mock account equity fixture rows and handoff documentation to reflect cumulative-return semantics.
- Verified `npm run build` passes after the fix.

## Account Equity Testing Foundation - 2026-05-04

- Added Vitest as the first automated test framework with the minimal `vitest.config.ts` needed for Node-based tests and `@/*` source alias resolution.
- Added `npm run test` as `vitest run`.
- Added focused account equity CSV parser coverage in `src/lib/accountEquityCsvImport.test.ts`.
- Parser tests cover canonical import, ID/source/import timestamp assignment, cumulative-return mapping, legacy return aliases, explicit cumulative/total return aliases, equity parsing, percent parsing, blank rows, date validation, equity validation, cumulative-return validation, duplicate dates, out-of-order sorting, unexpected columns, and malformed unquoted comma rows.
- Added focused account equity return calculation coverage in `src/lib/performanceReviewCalculations.test.ts`.
- Calculation tests cover Daily return from latest versus previous equity, Weekly/Monthly/YTD return windows, account equity change, max drawdown, out-of-order input handling, and protection against imported cumulative-return values leaking into Daily.
- Patched one parser alias gap found while writing tests: `Cumulative Return %` and `Total Return %` are now accepted as explicit cumulative/total return headers.
- `npm run test` passed with 2 test files and 31 tests.

## Exchange Trade Ledger Testing Foundation - 2026-05-04

- Added focused exchange trade ledger CSV parser coverage in `src/lib/exchangeTradeLedgerCsvImport.test.ts`.
- Parser tests cover accepted Filled close-long/close-short rows, import metadata, header aliases, Toronto-local time parsing, raw time preservation, invalid time formats, direction handling, ignored open/non-filled rows, missing status, close-row validation errors, duplicate composite rows, unexpected columns, blank rows, and accepted-record sorting.
- Added focused trade ledger metric coverage in `src/lib/tradeLedgerCalculations.test.ts`.
- Calculation tests cover after-fee net PnL, accepted-close filtering, trade counts, win rate, breakeven treatment, gross/net PnL separation, total fees, gross profit/loss, average win/loss, profit factor fallback, symbol breakdown, direction breakdown, date range, latest trade time, ignored non-accepted rows, and empty input.
- No parser or calculation behavior changes were needed; the new tests matched existing behavior.
- `npm run test` passed with 4 test files and 81 tests.
- `npm run build` passed after the new test coverage and documentation updates.

## Trade Ledger Import Preview Priority - 2026-05-04

- Scoped the pass to Trade Ledger import preview display inside `PerformanceModule`.
- Changed the Trade Ledger issue preview from raw first-five issue order to grouped issue display.
- Blocking errors now appear before warnings and include their own visible count.
- Warnings remain visible but are capped separately after errors so expected ignored Open Long/Open Short/non-filled rows do not bury fix-required rows.
- Kept the hidden-count message for both error and warning groups.
- Confirm Import remains disabled only when `tradeLedgerImportResult.ok` is false; the parser already treats warnings-only imports as `ok: true`.
- Did not change parser validation rules, accepted closed-trade rules, trade calculations, account equity import, storage boundaries, or dashboard layout.

## Exact Duplicate Trade Ledger Row Handling - 2026-05-04

- Changed exact duplicate close-trade rows from blocking errors into skipped warnings for the MVP exchange CSV workflow.
- Duplicate detection now includes optional export fields such as margin mode, leverage, amount, order price, and filled quantity asset so non-identical or ambiguous close rows are not auto-deduped.
- Duplicate skipped rows are not added to imported records and do not affect trade count, gross closing PNL, fees, net realized PNL, win rate, averages, profit factor, symbol breakdown, or direction breakdown.
- Duplicate skipped rows increment the import summary skipped-row count and emit a warning that identifies the first matching row number.
- Warnings-only duplicate imports keep `result.ok` true, so Confirm Import remains enabled.
- Updated exchange trade ledger parser tests for duplicate warnings, skipped-row counts, accepted closed-trade counts, metric totals, and optional-field non-deduping.

## Live Data Normalization Testing Foundation - 2026-05-04

- Added focused Fear & Greed normalization coverage in `src/lib/fearGreedNormalization.test.ts`.
- Fear & Greed tests cover valid CMC response normalization, sorting newest/oldest payloads, malformed reading skipping, numeric-string values, current clamping behavior, nearest last-week/last-month derivation, high/low derivation, short history behavior, and empty/malformed safe null results.
- Added focused FMP quote normalization coverage in `src/lib/fmpQuoteNormalization.test.ts`.
- FMP tests cover array/object payload parsing, valid quote mapping, numeric string parsing, `changesPercentage` and `changePercentage`, missing optional volume/timestamp fields, missing/invalid required price errors, unavailable fallback quote creation, and usability checks.
- Added focused Twelve Data quote normalization coverage in `src/lib/twelveQuoteNormalization.test.ts`.
- Twelve tests cover object payload parsing, valid quote mapping, numeric string parsing, `percent_change` and `percentChange`, missing optional volume/timestamp fields, passed-through provider labels, provider error payloads, and missing/invalid required close price errors.
- Added pure market quote route-payload validator coverage in `src/lib/marketQuoteStorage.test.ts`.
- Patched `isMarketQuotesFetchResult` to reject quote arrays; route results must provide a symbol-keyed quote map.
- `npm run test` passed with 8 test files and 105 tests.

## API Route Fallback Testing Foundation - 2026-05-04

- Added focused direct route-handler tests for `GET /api/fear-greed` in `src/app/api/fear-greed/route.test.ts`.
- Fear & Greed route tests cover missing `CMC_API_KEY`, successful CMC normalization, stale server-cache fallback after provider failure, CMC 429 behavior, and invalid CMC payload behavior.
- Added focused direct route-handler tests for `GET /api/market-quotes` in `src/app/api/market-quotes/route.test.ts`.
- Market quote route tests cover missing market quote API keys, mixed FMP/Twelve success, SPX fallback from FMP `ESUSD` to `^GSPC`, XAU fallback from Twelve `XAU/USD` to FMP `GCUSD`, stale server-cache fallback after total provider failure, and partial provider failure.
- Route cache isolation is handled with `vi.resetModules()` before fresh route imports, plus controlled fake timers where cache expiry must be forced.
- Provider calls are fully mocked through `global.fetch`; no CoinMarketCap, FMP, or Twelve Data calls are made by the tests.
- No route behavior bugs were found, so no production route code changed.
- `npm run test` passed with 10 test files and 116 tests.

## Next Steps

- Expand tests into browser localStorage save/load paths, component hydration behavior, and view-model adapters before broadening source inputs further.
- Add an explicit market snapshot capture action later if saved daily SPX/watchlist reads become useful.
- Consider another provider or plan change only if live `WTI` or `DXY` become necessary.
- Consider adding Total Fees and Net Realized PnL to the compact Trade Ledger display model if the panel needs those values outside the import preview.
- Consider a fuller import history/clear confirmation flow after the MVP import path proves useful.
- Choose private persistence strategy for manual notes and context snapshots.
- Decide the first live market data source, starting with SPX.
- Later add source reference or screenshot upload for Gamma after manual numeric entry is proven.
- Consider Supabase or another durable sync layer only after local workflows stabilize.
- Pin dependency versions and address npm audit findings before hardening.
