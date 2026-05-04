# Trading Dashboard Findings

## Audit Summary - 2026-05-01

- Current project is a Next.js App Router TypeScript dashboard shell using mock data only.
- No persistence layer, API routes, authentication, broker integration, or live market data integration exists yet.
- The UI is currently server-rendered/static composition from `src/app/page.tsx` into `DashboardShell`.
- The project is not initialized as a git repository in this workspace.

## File Inventory

- `package.json` defines a private Next/React/TypeScript project with `dev`, `build`, `start`, and `lint` scripts.
- `package-lock.json` records installed dependency resolution.
- `next.config.ts` enables React strict mode.
- `tsconfig.json` uses strict TypeScript, App Router-compatible JSX, bundler module resolution, and `@/*` path aliases.
- `next-env.d.ts` is managed by Next.js.
- `.gitignore` excludes dependencies, build output, env files, and temporary QA artifacts.
- `src/app/layout.tsx` sets metadata and imports global CSS.
- `src/app/page.tsx` passes mock dashboard data into the shell.
- `src/app/globals.css` contains all current styling tokens, layout rules, module styling, and responsive behavior.
- `src/types/dashboard.ts` defines the domain contracts consumed by UI modules.
- `src/data/mockDashboardData.ts` contains the only dashboard data source.
- `src/lib/marketStatus.ts` maps domain statuses into UI tones and status descriptions.
- `src/components/ui/SectionPanel.tsx`, `StatCard.tsx`, and `StatusBadge.tsx` are shared display primitives.
- `src/components/dashboard/*Module.tsx` files implement the four dashboard modules.
- `src/components/dashboard/DashboardShell.tsx` owns global dashboard composition, side navigation, top bar, and command strip.

## Decisions

- Start with mock data and a clean frontend shell before live integrations.
- Use the suggested Next-style `src/app` structure for the MVP.
- Keep charting code dependency-free in the first build; use simple SVG/CSS visualizations over adding a chart library.
- Use controlled green accents and low-noise status language to avoid dopamine-heavy trading UI patterns.
- Use `latest` npm tags for the initial private scaffold so the local install resolves current Next/React versions.
- Keep the first build CSS-only for layout and visual system rather than introducing Tailwind, shadcn, a charting library, or a component framework.
- Use `StatusBadge`, `StatCard`, and `SectionPanel` as the first shared UI primitives.

## Constraints

- The dashboard supplements, but does not replace, external technical-analysis platforms.
- CVD, open interest, liquidation heatmaps, funding, orderflow, candlestick telemetry, volume analysis, and net long/short tools should remain summarized manually in the first build.
- Business logic for status classification is not yet final.
- Current tone mapping is lightweight display logic, not final trading logic.
- Current mock timestamp is static and should not be interpreted as live market freshness.

## Assumptions

- SPX market status can be mocked using explicit fixture fields until a live data source and classification rules are chosen.
- Performance metrics are review-oriented summaries, not a broker/accounting ledger.
- Gamma image upload is represented as a placeholder in the first shell.
- The `DashboardData` shape is a view-model contract for the frontend shell, not necessarily the final persistence schema.
- The side rail single-letter navigation is acceptable for the private MVP, but may need icon/tooltips once the app grows.

## Research Notes

- No external market data provider has been selected yet.
- `npm install` completed with 2 moderate audit findings. No force fix was applied because it may introduce breaking dependency changes; revisit after the dependency policy is chosen.

## Audit Notes

- `package.json` uses `latest` dependency ranges. This is convenient for bootstrap but should be pinned before the project becomes relied upon.
- `npm run build` previously passed after granting sandbox permission for Next worker processes.
- `npm run dev` previously required elevated sandbox permission because Next worker spawn was blocked in the default sandbox.
- `npm run lint` may need review because newer Next versions have changed lint command behavior.
- No tests exist yet, which is acceptable for the mock shell but should change before adding persistence or data integrations.

## Refinement Findings - 2026-05-01

- Current refinement stayed within the existing feature set and did not add new data sources, persistence, or dependencies.
- New primitives reduce repeated dashboard markup:
  - `KeyValueStrip` handles repeated key/value summary rows and strips.
  - `ModuleNote` standardizes module note styling.
  - `PlaceholderFrame` standardizes chart/upload placeholder presentation.
- `src/lib/formatters.ts` now centralizes percent and price formatting used by modules.
- `DashboardShell` still owns page composition, side navigation, top status area, and command summary.
- The command-center visual direction is stronger through denser top status chrome, tighter panels, subtler grid texture, and unified placeholder treatment.
- `DashboardData` and all existing module schemas remained unchanged.
- Build verification passed with `npm run build`.

## Visual Alignment Findings - 2026-05-01

- Reference mockup priority was visual density, operational header treatment, terminal rail, flat panels, and credible market-panel placeholders.
- The current app was visually too spacious and website-like before this pass, especially in the header, two-column layout, side rail, and card spacing.
- The alignment pass changed presentation only: no new modules, features, data sources, dependencies, or mock-data schema changes were introduced.
- `DashboardShell` now presents existing mock fields as top telemetry rather than a large title area.
- The side rail remains the same navigation scope, but is visually closer to the reference with compact labels, tiny active markers, darker background, and status footer.
- SPX and Gamma mock visuals are still placeholders, but they now communicate trading-panel intent through gridlines, axis text, bars/candles, and denser level tables.
- `PlaceholderFrame` now has a `gamma` variant in addition to existing chart/upload presentation needs.
- Remaining visual delta: the reference contains richer real tables and more market internals than the current typed MVP data supports. Those were not faked beyond existing mock-data-driven presentation.
- Final build verification passed with `npm run build`.

## Hierarchy Refinement Findings - 2026-05-01

- SPX should remain the primary visual anchor of the dashboard because it is the main macro/market indicator.
- Performance Review and Gamma Context should support the SPX read visually rather than compete with it.
- Trading Context reads better as synthesis/log output than as equal-weight feature cards.
- The current Trading Context table still uses the existing external-tool summaries; no additional observations or workflow data were introduced.
- Typography hierarchy now favors smaller metadata, tighter labels, and stronger numeric emphasis.
- The refinement was presentation-only: no data schema, mock fixture, feature, dependency, or integration changes were made.
- Final build verification passed with `npm run build`.

## Status Strip Removal Findings - 2026-05-01

- The removed status strip duplicated information already available in the top telemetry area.
- Removing it improves the dashboard's vertical rhythm and makes the modules feel more directly connected to the command header.
- The `commandStrip` style surface is no longer used and was removed from `globals.css`.
- No data model changes were needed because the removed strip was a presentation-only reuse of existing mock fields.
- Final build verification passed with `npm run build`.

## SPX Situation Refinement Findings - 2026-05-01

- The right-side key-level rail made the SPX module feel split between chart and level cards; removing it gives the chart the correct main-screen role.
- The new watchlist is intentionally local mock presentation data inside `MarketSituationModule`, not a new data source or schema expansion.
- Existing `market.keyTechnicalLevels` mock/schema fields remain available but are not rendered in the current SPX module layout.
- The watchlist should remain compact and subordinate to the chart; it is supporting market context, not a full market screener.
- The overview/regime note still provides the interpretive layer below the chart/watchlist stack.
- Final build verification passed with `npm run build`.

## Gamma And Sentiment Findings - 2026-05-01

- The prior gamma chart still felt like a generic placeholder; the right column now better matches the user's workflow by emphasizing gamma distribution shape and peak strike levels.
- Gamma Context now focuses on Major Positive Gamma, Major Negative Gamma, Zero Gamma / Flip, and last checked time.
- The gamma distribution is still mock/code-native presentation, not a live options feed or uploaded image.
- The old `manualUploadAvailable` field remains in the schema for future fallback workflow, but it is no longer rendered in the simplified Gamma Context UI.
- A new `FearGreedSnapshot` contract was added because the CMC Crypto Fear and Greed Index is a distinct support module with its own data shape.
- Fear & Greed remains secondary to Gamma and SPX: compact gauge, current value/label, and small historical summary only.
- No external CMC integration was added; all sentiment values are mock data.
- Final build verification passed with `npm run build`.

## Fear And Greed Visual Refinement Findings - 2026-05-01

- The first Fear & Greed gauge treatment was visually too competitive for a secondary sentiment readout.
- Reducing gauge height, arc weight, saturation, and value size better preserves Gamma Context as the right-column anchor.
- Historical sentiment values are now intentionally quieter while remaining readable.
- This was a styling-only pass; no feature, schema, dependency, or data-source changes were made.
- Final build verification passed with `npm run build`.

## Performance Review Refinement Findings - 2026-05-01

- The prior Performance Review lower metric strip was too sparse for a professional performance report and gave the module less analytical credibility than its role requires.
- The refined module now presents short-term performance, cumulative equity curve, report-style performance breakdown, process tags, review note, and last-updated timestamp in one compact panel.
- The new Performance Breakdown table uses local mock presentation values only; it does not introduce persistence, live data, or new schema fields.
- `PerformanceSnapshot` remains unchanged, so the current mock-data flow and component contract are preserved.
- Tags and the review note are now deliberately secondary to the breakdown to keep the module focused on disciplined review rather than vanity scoring.
- Screenshot verification was captured at `tmp/qa/performance-refinement-1600.png`.
- Final build verification passed with `npm run build`.

## Shell Telemetry And Rail Refinement Findings - 2026-05-01

- The previous top telemetry bar carried the right information but still read as loosely spaced metadata; tighter separators and label/value hierarchy now make it feel more like a live terminal header.
- The side rail navigation structure remains unchanged, but inactive rows are quieter and the active row now has clearer rail, glow, and status-dot signals.
- The local `Data` / `Feed` footer remains intentionally compact and subordinate to the navigation.
- The only markup change was adding `aria-current="page"` to the active side-rail link; component contracts and data structures remain unchanged.
- This was a shell-chrome refinement only: no dashboard module redesign, mock-data schema change, dependency addition, or feature expansion.
- Screenshot verification was captured at `tmp/qa/shell-refinement-1600.png`.
- Final build verification passed with `npm run build`.

## Simplified Side Rail Fix Findings - 2026-05-01

- The overlap issue came from older `.sideRail a` styles with higher specificity than the newer `.sideRail__link` overrides, which kept forcing narrow boxed anchors.
- Removing the glyph column from the markup and using higher-specificity side-rail CSS resolved the text/box overlap.
- The rail now uses simple mono text rows, a thin left active bar, subdued hover state, and no boxed inactive item treatment.
- The rail width was increased slightly to improve readability for `CONTEXT` while keeping the compact terminal feel.
- Footer status remains readable and consistent with the simplified rail treatment.
- This was a side-rail-only fix: no module, top telemetry, schema, dependency, or mock-data changes were introduced.
- Screenshot verification was captured at `tmp/qa/side-rail-simplified-1600.png`.
- Final build verification passed with `npm run build`.

## Trading Context Workflow Redesign Findings - 2026-05-01

- The prior Trading Context table was useful as a checklist, but it did not fully express the intended operator workflow of external inputs, macro events, personal synthesis, and readiness.
- The redesigned module keeps Trading Context as one cohesive panel while dividing the interior into four workflow columns: Market News, Economic Calendar, Synthesis Notes, and Trading Checklist.
- Market News and Economic Calendar use local mock presentation arrays only; no live feeds, providers, schema changes, or persistence were added.
- Synthesis Notes remains the interpretive center of the panel and reuses the existing Trading Context fields for bias, active playbook, invalidation, and manual notes.
- Trading Checklist still uses the existing `externalTools` data, preserving Source + Status readiness logic in a more procedural layout.
- The `TradingContext` TypeScript contract and mock-data shape remain unchanged.
- Visual verification required restarting the local dev server because the first screenshot attempt captured a stopped-server connection page.
- Screenshot verification was captured at `tmp/qa/trading-context-redesign-full.png`.
- Final build verification passed with `npm run build`.

## Trading Context External Links Strip Findings - 2026-05-01

- The external links strip works best as a utility footer beneath the four workflow columns, not as another major content column.
- The strip uses local mock presentation data only and does not introduce live links, provider integrations, persistence, or schema changes.
- Compact text-link styling, thin separators, and subdued action labels keep the strip visually subordinate to Market News, Economic Calendar, Synthesis Notes, and Trading Checklist.
- The `TradingContext` TypeScript contract and mock-data shape remain unchanged.
- Screenshot verification was captured at `tmp/qa/trading-context-links-strip.png`.
- Final build verification passed with `npm run build`.

## Trading Context Final Refinement Findings - 2026-05-01

- The four-column Trading Context structure was correct, but the first weighting left Market News compressed and the checklist visually busy.
- Rebalancing column fractions improved scanability: news has more usable line length, calendar remains compact, synthesis carries the most interpretive weight, and checklist remains procedural.
- Tighter row padding, smaller status pills, calmer metadata, and reduced note spacing make the panel feel more operational without becoming cramped.
- The external links strip remains a utility footer and does not compete with the main workflow columns.
- This was a CSS-only Trading Context refinement; no component contracts, data schemas, features, dependencies, or live integrations changed.
- Screenshot verification was captured at `tmp/qa/trading-context-final-refinement.png`.
- Final build verification passed with `npm run build`.

## SPX And Sentiment Cleanup Findings - 2026-05-01

- The SPX interpretive status/note block duplicated information now better handled by Trading Context Synthesis Notes.
- Removing the SPX interpretation block leaves SPX focused on chart and watchlist context without changing the market data contract.
- The prior Fear & Greed gauge was more visually prominent than a secondary sentiment module needs to be.
- The new horizontal sentiment indicator preserves current value, label, scale context, historical stats, and source metadata while reducing visual competition with SPX and Gamma.
- This pass did not add dependencies, live data, schema changes, or new features.
- Screenshot verification was captured at `tmp/qa/spx-sentiment-cleanup.png`.
- Final build verification passed with `npm run build`.

## Gamma And Checklist Cleanup Findings - 2026-05-01

- The Gamma Context note duplicated interpretive synthesis that belongs in Trading Context, so removing it makes Gamma read more like an operational levels panel.
- Gamma Context now focuses on distribution shape, major positive gamma, major negative gamma, zero gamma / flip, and last checked time.
- The Trading Checklist descriptions made the checklist feel like a note log instead of a readiness scan.
- Removing checklist descriptions improves source/status scanability and makes the rows feel closer to future clickable checklist controls.
- This pass did not change schemas, dependencies, live data behavior, or module contracts.
- Screenshot verification was captured at `tmp/qa/gamma-checklist-cleanup.png`.
- Final build verification passed with `npm run build`.

## Global Polish And BTC Watchlist Addition Findings - 2026-05-02

- Adding `BTCUSDT` as a local mock watchlist row did not require a schema change because the watchlist remains component-local presentation data.
- The dashboard structure was already correct; the polish pass focused on consistency of spacing, panel borders, typography weight, status pills, chart grids, table rows, and shell rhythm.
- Status pills now read more consistently as low-weight terminal states across top telemetry, module actions, checklist states, and tags.
- Chart and table surfaces are slightly calmer through lower gridline intensity, more consistent row backgrounds, and tighter label sizing.
- Trading Context remains cohesive after tuning row density, checklist status alignment, and external tools strip weight.
- Mobile verification showed the top telemetry needed stronger wrapping rules and the small equity-curve footer needed a narrow-screen guardrail; both were addressed.
- This pass did not change architecture, dependencies, live data behavior, component contracts, or mock data schemas.
- Screenshot verification was captured at `tmp/qa/global-polish-1600.png` and `tmp/qa/global-polish-mobile.png`.
- Final build verification passed with `npm run build`.

## Daily Snapshot Data And Workflow Planning - 2026-05-02

### Audit Of Current Data State

- `src/types/dashboard.ts` currently defines frontend view-model contracts for the visual shell: `DashboardData`, `PerformanceSnapshot`, `MarketSituation`, `GammaContext`, `FearGreedSnapshot`, and `TradingContext`.
- `src/data/mockDashboardData.ts` is the only root data source and should remain mock view-model data until a daily snapshot state layer is introduced.
- Current `DashboardData.generatedAt` is a static screen timestamp, not a saved daily snapshot timestamp.
- Current `PerformanceSnapshot` mixes equity-curve display fields, derived return values, trade-stat-like values, review tags, and a note. It should not become a persisted performance table as-is.
- Current `MarketSituation` contains SPX fields that can inform a future `SpxSnapshot`, but `chartPlaceholderLabel` is display-only and should not be persisted as daily state.
- Current `GammaContext` contains candidate daily snapshot fields such as gamma regime, last checked time, and key gamma levels. `manualUploadAvailable` is a UI capability flag and should remain config/display behavior, not daily state.
- Current `FearGreedSnapshot` is close to a captured market snapshot shape. It needs source timestamp metadata if promoted beyond the view model.
- Current `TradingContext` contains daily editable state: primary bias, active playbook, invalidation, checklist statuses through `externalTools`, and manual notes.
- SPX watchlist rows in `MarketSituationModule`, market news, economic calendar events, performance breakdown rows, gamma distribution bars, and external tool strip links are component-local mock presentation data.
- The workspace is still not a git repository, so documentation changes cannot be reviewed through git history unless the project is initialized later.

### Current Mock Assumptions

- Market, gamma, sentiment, news, calendar, watchlist, and performance values are all static mock values.
- No live freshness guarantee exists for any current timestamp.
- No persistence, validation, auth, API layer, Google Sheets sync, file import, or Supabase backend exists.
- Domain status classification remains lightweight display logic in `src/lib/marketStatus.ts`.

### Editable Daily State

- Synthesis notes: primary bias, what matters today, conditions to watch, invalidation, and operator note.
- Trading checklist item statuses and optional daily notes for each checklist source.
- Performance review note and review tags for the day.
- Manually entered gamma levels, gamma regime, gamma source note, and gamma last checked time.
- Optional manually corrected SPX levels or risk/session annotations.

### Daily Captured Market Snapshot

- SPX latest close, trend labels, session status, risk state, and watched levels.
- Supporting watchlist values if promoted out of component-local mock data.
- Gamma major positive, major negative, zero gamma / flip, regime, and checked timestamp.
- Fear & Greed current value, label, historical comparison values, source, and source timestamp.
- Market news and economic calendar events only after their source strategy is chosen.

### Static Configuration

- Checklist source definitions such as CVD, Open Interest, Liquidation Heatmap, Funding Rates, Orderflow, Candlestick Telemetry, Volume Analysis, and Net Long/Short.
- Default external tool links such as Bookmap, SPX Flow, SpotGamma, Unusual Whales, and macro calendar destinations.
- Display labels, module labels, source labels, and default status options.
- UI capability flags, including whether gamma upload is available.

### Performance Source Data

- Account-level equity history should be modeled as a separate source from the personal Google Sheet with `date`, `equity`, and `percentChange`.
- Account-level equity history should drive equity curve, daily return, weekly return, monthly return, YTD return, account drawdown, and broader performance trajectory.
- Exchange trade exports should be modeled as a separate ledger source with one row per trade/order record.
- Exchange trade records should drive closed trade PnL, fees, trade count, win rate, average win, average loss, profit factor, symbol breakdown, long/short breakdown, leverage review, and margin review.
- `PerformanceReviewSnapshot` should be derived from both source categories and then attached to a daily dashboard snapshot as a point-in-time summary.
- For the MVP sequence, account-level equity history should come first because it is simpler, matches the existing equity curve, and does not require exchange-specific CSV/XLSX parsing.

### Proposed TypeScript Planning Interfaces

```ts
export type ISODate = string; // YYYY-MM-DD
export type ISODateTime = string;

export type SnapshotStatus = "draft" | "saved" | "archived";
export type ChecklistStatus = "checked" | "watch" | "not checked";
export type TradingBias = "long selective" | "short selective" | "neutral" | "no trade";
export type RiskState = "constructive" | "balanced" | "defensive";

export interface DailyDashboardSnapshot {
  id: string;
  tradingDate: ISODate;
  status: SnapshotStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  sessionState: {
    sessionStatus: "positive" | "negative" | "mixed";
    riskState: RiskState;
    mode: "focused" | "review" | "post-session";
    lastUpdatedAt: ISODateTime;
  };
  spx: SpxSnapshot;
  gamma: GammaSnapshot;
  fearGreed: FearGreedSnapshot;
  synthesis: SynthesisNotes;
  checklist: TradingChecklistItem[];
  performanceReview: PerformanceReviewSnapshot;
  externalToolLinks: ExternalToolLink[];
}

export interface SpxSnapshot {
  symbol: "SPX";
  latestClose: number | null;
  dailyTrend: "bullish" | "bearish" | "neutral";
  weeklyTrend: "bullish" | "bearish" | "neutral";
  marketStatus: "ATH price discovery" | "sideways consolidation" | "correction" | "risk-off" | "recovery";
  keyLevels: Array<{
    label: string;
    price: number;
    bias: "support" | "resistance" | "pivot";
  }>;
  watchlist?: Array<{
    symbol: string;
    last: number | null;
    change: number | null;
    changePercent: number | null;
    volumeLabel?: string;
  }>;
  source: "manual" | "mock" | "market_data";
  capturedAt: ISODateTime;
}

export interface GammaSnapshot {
  regime: "positive gamma" | "negative gamma" | "transition";
  levels: Array<{
    label: "Major Pos Gamma" | "Major Neg Gamma" | "Zero Gamma / Flip" | string;
    price: number;
    importance: "primary" | "secondary";
  }>;
  distributionImageUrl?: string;
  sourceLabel?: string;
  source: "manual" | "mock" | "uploaded_image" | "provider";
  capturedAt: ISODateTime;
  notes?: string;
}

export interface FearGreedSnapshot {
  source: "CMC Crypto Fear and Greed Index" | string;
  value: number | null;
  label: "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed" | "Unknown";
  lastWeek?: number | null;
  lastMonth?: number | null;
  yearHigh?: number | null;
  yearLow?: number | null;
  capturedAt: ISODateTime;
}

export interface SynthesisNotes {
  primaryBias: TradingBias;
  whatMattersToday: string;
  conditionsToWatch: string;
  invalidation: string;
  operatorNote: string;
  updatedAt: ISODateTime;
}

export interface TradingChecklistItem {
  id: string;
  label: string;
  sourceKey: string;
  status: ChecklistStatus;
  dailyNote?: string;
  updatedAt: ISODateTime;
}

export interface ExternalToolLink {
  id: string;
  label: string;
  url: string;
  category: "orderflow" | "gamma" | "macro" | "sentiment" | "journal" | "other";
  isDefault: boolean;
}

export interface AccountEquitySnapshot {
  id: string;
  date: ISODate;
  equity: number;
  percentChange: number;
  source: "google_sheet" | "manual" | "csv_import";
  importedAt?: ISODateTime;
}

export interface ExchangeTradeRecord {
  id: string;
  sourceFileId?: string;
  futures: string;
  time: ISODateTime;
  direction: "Long" | "Short" | "Buy" | "Sell" | string;
  marginMode?: string;
  leverage?: number | null;
  amount?: number | null;
  orderPrice?: number | null;
  filledQuantity?: number | null;
  averageFilledPrice?: number | null;
  closingPnl?: number | null;
  fee?: number | null;
  status: string;
  raw?: Record<string, string | number | null>;
}

export interface PerformanceReviewSnapshot {
  asOfDate: ISODate;
  accountEquity: {
    latestEquity?: number;
    equityCurvePercent: Array<{ date: ISODate; valuePercent: number }>;
    dailyReturnPercent?: number;
    weeklyReturnPercent?: number;
    monthlyReturnPercent?: number;
    ytdReturnPercent?: number;
    accountDrawdownPercent?: number;
  };
  tradeStats?: {
    closedTradePnl?: number;
    totalFees?: number;
    tradeCount?: number;
    winRatePercent?: number;
    averageWin?: number;
    averageLoss?: number;
    profitFactor?: number;
    symbolBreakdown?: Array<{ symbol: string; pnl: number; trades: number }>;
    directionBreakdown?: Array<{ direction: "long" | "short"; pnl: number; trades: number }>;
    leverageNotes?: string;
    marginModeNotes?: string;
  };
  note: PerformanceReviewNote;
  derivedAt: ISODateTime;
  sourceCoverage: {
    accountEquityHistory: boolean;
    exchangeTradeLedger: boolean;
  };
}

export interface PerformanceReviewNote {
  text: string;
  tags: Array<"A+ setup" | "discipline" | "overtrading" | "late entry" | "risk contained" | "missed plan" | string>;
  updatedAt: ISODateTime;
}
```

### Persistence Options

- `localStorage`: best for Phase 1 manual editing prototype. It is fast, dependency-free, and good enough for one-browser private state. Downsides: no cross-device sync, fragile backups, awkward archive/export story, and no proper relational separation for equity/trade source data.
- Local JSON/file-backed state: better for durable local backups and inspectable data, but awkward from a browser-only Next app without an API/file layer. It is useful later if a local-first desktop-like workflow becomes the priority, but it adds operational complexity before the edit model is proven.
- Supabase: best for Phase 2 durable snapshots and history. It gives tables for daily snapshots, equity history, trade ledger imports, derived summaries, and external tool config. Downsides: auth/security decisions, schema migrations, network/backend setup, and more upfront implementation surface.

Recommendation:

- Phase 1 should use `localStorage` for manual daily snapshot prototyping only.
- Phase 2 should migrate saved daily snapshots and history to Supabase.
- Performance source data should eventually live outside the daily snapshot: account equity history in an equity history table, exchange records in a trade ledger table, derived summaries in a view or derived summary table, and daily snapshots storing only the point-in-time `PerformanceReviewSnapshot` plus references/coverage metadata.

### Daily Command Read Workflow

1. Open the dashboard.
2. Load today's `DailyDashboardSnapshot` by trading date or create a new draft.
3. Review SPX, gamma, sentiment, news, and calendar context.
4. Update synthesis notes: bias, what matters today, conditions to watch, invalidation, and operator note.
5. Toggle checklist statuses and optionally add daily source notes.
6. Update performance review note and tags.
7. Save the daily command read.
8. Reopen later to review archived daily snapshots by trading date.

### Performance Data Workflow

1. Update the personal Google Sheet with date, equity, and percent change.
2. In the first performance source phase, manually mock or import equity history from that account-level source.
3. Derive equity curve, daily return, weekly return, monthly return, YTD return, and account drawdown.
4. Later, import exchange CSV/XLSX exports into `ExchangeTradeRecord` rows.
5. Derive closed trade PnL, total fees, trade count, win rate, average win, average loss, profit factor, symbol breakdown, direction breakdown, leverage review, and margin review.
6. Compose `PerformanceReviewSnapshot` from account equity history plus optional trade ledger summaries.

### Smallest Safe Implementation Sequence

1. Define snapshot interfaces in a new type module without replacing the existing view models.
2. Define separate performance source interfaces for account equity history and exchange trade records.
3. Create a mock daily snapshot fixture.
4. Create a mock account equity history fixture.
5. Add pure derivation helpers that produce `PerformanceReviewSnapshot` from equity history first.
6. Add a snapshot state hook that can load/create today's in-memory snapshot.
7. Add manual edit flow for Synthesis Notes.
8. Add checklist status toggles.
9. Add `localStorage` persistence for daily snapshots.
10. Add snapshot archive/list concept by trading date.
11. Add Google Sheets equity sync or export import after the manual workflow proves useful.
12. Add exchange CSV/XLSX import parser for deeper trade-stat calculations.
13. Migrate snapshots, equity history, trade ledger records, and derived performance summaries to Supabase.

## Daily Snapshot Data Spine Implementation Findings - 2026-05-02

- Added `src/types/dailySnapshot.ts` for persistence-oriented daily command read contracts.
- Added `src/types/performanceSources.ts` for account equity history, exchange trade records, and derived performance review snapshot contracts.
- The new domain files intentionally do not replace `src/types/dashboard.ts`; the existing dashboard types remain frontend view models for the current visual shell.
- `FearGreedSnapshot` now exists in both the view-model module and the daily snapshot domain module. This is intentional because the domain version stores captured snapshot metadata, while the current view-model version remains tailored to the rendered sentiment module.
- Added `src/data/mockDailySnapshot.ts` with one saved `DailyDashboardSnapshot` fixture for `2026-05-01`.
- Added `src/data/mockPerformanceSources.ts` with separate `mockAccountEquityHistory` and `mockExchangeTradeRecords` fixtures.
- Account-level equity history is represented as `date`, `equity`, and `percentChange`, matching the planned Google Sheet source.
- Exchange trade records are represented as ledger rows with futures symbol, time, direction, margin mode, leverage, amount, order price, filled quantity, average filled price, closing PnL, fee, and status.
- The mock daily snapshot includes a `PerformanceReviewSnapshot` with both account-equity and trade-stat coverage, but no derivation helper has been implemented yet.
- The new fixtures are not wired into `src/app/page.tsx` or `DashboardShell`, so existing UI behavior should remain unchanged.
- No persistence, localStorage, Supabase, editing flow, live integration, dependency, Google Sheets sync, or CSV/XLSX import was added.
- Build verification passed with `npm run build`.

## Synthesis Notes Manual Editing Findings - 2026-05-02

- `TradingContextModule` is now a client component because Synthesis Notes requires local in-memory edit state.
- Synthesis Notes now initializes from `mockDailyDashboardSnapshot.synthesis`, using the new `SynthesisNotes` domain model rather than the old `TradingContext` view-model fields.
- The existing `TradingContext` prop is still used for the Trading Checklist data, preserving the rest of the module behavior.
- The edit slice includes market bias, what matters today, conditions to watch, invalidation, and operator note.
- The edit flow is intentionally local only: Save updates React state and Cancel restores the last saved in-memory state.
- No persistence adapter, localStorage, Supabase table, snapshot archive, checklist status editing, live integration, or validation layer was added.
- Because this is the first client-state slice, future work should consider moving daily snapshot state up into a dedicated hook or shell-level provider before additional fields become editable.
- Build verification passed with `npm run build`.

## Trading Checklist Status Toggle Findings - 2026-05-02

- Trading Checklist statuses now initialize from `mockDailyDashboardSnapshot.checklist`, using the new daily snapshot checklist domain model.
- Checklist status state is local to `TradingContextModule` and is not persisted.
- Each checklist status control cycles through the documented domain values: `not checked`, `watch`, and `checked`.
- The existing checklist source labels are preserved exactly and no explanatory item descriptions were reintroduced.
- The status controls reuse `StatusBadge` tones so `not checked` remains subdued, `watch` remains cautionary, and `checked` remains positive.
- Synthesis Notes edit/save/cancel behavior remains in the same component and was not intentionally changed.
- The remaining `TradingContext` prop is now legacy view-model input for the surrounding module contract; the interactive Synthesis Notes and Trading Checklist slices both initialize from `mockDailyDashboardSnapshot`.
- No persistence adapter, localStorage, Supabase table, archive/history, checklist notes, live integration, dependency, or broader layout redesign was added.
- Build verification passed with `npm run build`.

## LocalStorage Daily Snapshot Persistence Findings - 2026-05-02

- Prototype persistence now stores the full `DailyDashboardSnapshot` object in localStorage.
- Storage keys use the dated format `market-command:daily-snapshot:${date}`.
- `TradingContextModule` now owns one `DailyDashboardSnapshot` state object instead of separate persisted flows for Synthesis Notes and checklist statuses.
- Initial render uses the mock daily snapshot template, then a client-only effect checks localStorage for today's snapshot.
- If today's local snapshot exists and passes a lightweight shape check, Synthesis Notes and checklist state hydrate from it.
- If today's local snapshot is missing or malformed, the module uses a snapshot created from `mockDailyDashboardSnapshot` for the local trading date.
- Saving Synthesis Notes writes the updated full snapshot to localStorage and updates snapshot-level and synthesis-level timestamps.
- Toggling a checklist status writes the updated full snapshot to localStorage and updates snapshot-level and item-level timestamps.
- localStorage read/write failures are caught so prototype persistence cannot block dashboard interactions.
- No Supabase, archive/history, live data, CSV/XLSX import, Google Sheets sync, dependency, or broader UI redesign was added.
- Build verification passed with `npm run build`.

## LocalStorage Persistence Audit Findings - 2026-05-02

- Hydration behavior is client-safe: no localStorage access happens at module scope or during server render; reads occur through `loadDailyDashboardSnapshot` from the client mount effect.
- If today's snapshot exists and passes the lightweight shape check, `TradingContextModule` hydrates both Synthesis Notes and Trading Checklist from it.
- If today's snapshot is missing, malformed, or for a different trading date, `TradingContextModule` falls back to a `DailyDashboardSnapshot` created from `mockDailyDashboardSnapshot`.
- The storage key format remains stable: `market-command:daily-snapshot:${date}`.
- Single-source-of-truth behavior is correct for the current slice: Synthesis Notes and Trading Checklist read from the same `dailySnapshot` state object.
- Synthesis Notes uses draft state only for the unsaved edit form; Save merges the draft into `dailySnapshot`, while Cancel discards the draft and restores the last saved in-memory snapshot values.
- Synthesis Notes Save persists the full snapshot to localStorage.
- Trading Checklist status toggle persists the full snapshot to localStorage.
- Timestamp behavior is appropriate for the MVP: snapshot-level `updatedAt` updates on both save and toggle; synthesis-level `updatedAt` updates only on Synthesis Notes Save; checklist item `updatedAt` updates only for the toggled item.
- Timestamp format is consistently `new Date().toISOString()` for new user-driven updates.
- Patched a correctness issue by requiring loaded snapshots to match the requested trading date before hydration.
- Patched a React correctness issue by moving localStorage writes out of state updater callbacks.
- Future extensibility is acceptable for the prototype: the helper already accepts arbitrary dates for date switching, full-snapshot storage maps cleanly to a future Supabase row, and additional editable sections can be merged into the same snapshot state.
- Remaining future limitation: there is no snapshot index, archive list, migration/version field, or schema validation layer yet; those should wait for the archive/history or Supabase phase.
- Build verification passed with `npm run build`.

## Daily Snapshot Archive And Date Switching Findings - 2026-05-02

- Multi-date snapshot storage still uses one localStorage object per trading date.
- The storage key remains stable: `market-command:daily-snapshot:${date}`.
- `listDailyDashboardSnapshotDates` scans localStorage for snapshot keys and returns date-like `YYYY-MM-DD` suffixes sorted newest first.
- `TradingContextModule` now tracks `activeDate`, `savedSnapshotDates`, and the active `DailyDashboardSnapshot`.
- Active-date loading is client-only through event handlers and the mount effect.
- Pre-hydration state uses the mock/default snapshot date, then the mount effect switches to the local trading date; this avoids depending on `new Date()` during server prerender.
- Selecting a date loads the saved snapshot for that date when available.
- Selecting a date with no saved snapshot creates a draft snapshot from the mock/default template for that date.
- Synthesis Notes Save persists the active date's full snapshot and marks it `saved`.
- Trading Checklist status toggles persist the active date's full snapshot and mark it `saved`.
- Cancel reverts Synthesis Notes edits against the active date's current snapshot.
- Switching dates auto-cancels Synthesis Notes edit mode and discards unsaved draft edits. This is the documented MVP behavior; no warning modal was added.
- The compact archive select is intentionally not a full history page; it only exposes saved local snapshot dates.
- This approach can support fuller date switching and Supabase migration later because the active snapshot remains a full `DailyDashboardSnapshot` object keyed by date.
- Remaining limitation: localStorage does not maintain a separate archive index or deleted-state metadata; saved dates are inferred from existing keys.
- No delete flow, full archive page, Supabase, dependency, live data integration, CSV/XLSX import, Google Sheets sync, or major UI redesign was added.
- Build verification passed with `npm run build`.

## Daily Snapshot Control Polish Findings - 2026-05-02

- The date/archive controls were functionally correct but visually read too much like default browser controls.
- The active date input now sits inside a compact `Day` chip, clarifying that it controls the active trading date.
- The archive select now sits inside a compact `Saved` chip, clarifying that it accesses locally saved snapshots.
- The controls now use shared terminal-style visual language: mono text, low-height geometry, muted labels, dark surfaces, thin borders, and restrained emerald focus/hover states.
- No storage, date-switching, synthesis editing, checklist toggle, or persistence behavior was intentionally changed.
- No new features, dependencies, live integrations, Supabase, archive page, delete flow, or dashboard redesign was added.
- Build verification passed with `npm run build`.

## Archive Select Dropdown Readability Findings - 2026-05-02

- The native archive dropdown popup could render with unreadable platform default colors despite the closed select control being styled.
- Added explicit `option` foreground and background colors under `.snapshotDateControls select`.
- Added explicit `option:checked` colors to improve selected-option contrast where supported.
- Native select popup hover/highlight rendering is still partly browser/OS controlled, so a custom dropdown would be required for complete visual control later.
- No behavior, storage, date switching, Synthesis Notes, checklist logic, dependencies, or unrelated UI was changed.
- Build verification passed with `npm run build`.

## Performance Review Calculation Layer Findings - 2026-05-02

### Audit

- The existing `PerformanceModule` consumed `PerformanceSnapshot` from `src/types/dashboard.ts`, which was originally a frontend view model with static mock values for daily, weekly, monthly, win rate, risk/reward, profit factor, tags, notes, and an equity curve.
- The existing Performance Breakdown table inside `PerformanceModule` used local hardcoded presentation rows for Net PnL, Max Drawdown, Profit Factor, Trades, Win Rate, Avg Win, and Avg Loss. Those rows were not derived from the account equity source or exchange trade records.
- `AccountEquitySnapshot` in `src/types/performanceSources.ts` matches the intended Google Sheet-style source: `date`, `equity`, and `percentChange`.
- `PerformanceReviewSnapshot` is the domain summary model for account-level derived metrics plus optional future trade-ledger summaries.
- `mockAccountEquityHistory` is now the source for account-level Performance Review metrics. `mockExchangeTradeRecords` remains unused in this phase.

### Implementation

- Added `src/lib/performanceReviewCalculations.ts` with pure, data-source-agnostic helpers:
  - `sortAccountEquityHistory`
  - `buildEquityCurve`
  - `calculateReturnForPeriod`
  - `calculateMaxDrawdown`
  - `derivePerformanceReviewSnapshot`
- Added `src/lib/performanceReviewViewModel.ts` to adapt the derived `PerformanceReviewSnapshot` into the current `PerformanceSnapshot` view model consumed by `PerformanceModule`.
- Updated `src/data/mockDashboardData.ts` so the Performance Review view model is derived from `mockAccountEquityHistory` instead of static performance mock values.
- Updated `PerformanceModule` without changing the layout structure. It now displays equity-history-derived values for latest equity, equity change, YTD return, max drawdown, daily return, weekly return, monthly return, and the equity curve.
- Trade-ledger-derived values such as trades, win rate, average win/loss, and profit factor now render as `N/A` / future import instead of being presented as if they came from equity history.

### Metric Coverage

- Equity-history-derived now: latest equity, account equity change over available history, daily percent change, weekly return over available history, monthly return over available history, YTD return over available history, max drawdown, equity curve, and last updated timestamp from imported equity rows where available.
- Trade-ledger-required later: closed trade PnL, total fees, trade count, win rate, average win, average loss, profit factor, symbol breakdown, direction breakdown, leverage review, and margin mode review.
- The current weekly/monthly/YTD calculations are limited by available mock history. They intentionally do not invent missing historical rows.

### Future Swap Path

- A future CSV, local file, Google Sheets, or Supabase source should only need to provide `AccountEquitySnapshot[]` to the same `derivePerformanceReviewSnapshot` function.
- Exchange CSV/XLSX imports should remain a separate `ExchangeTradeRecord[]` input and should be added later as an optional trade-ledger calculation path, not mixed into account equity history.
- Build verification passed with `npm run build`.

## Account Equity CSV Import Foundation Findings - 2026-05-02

### Implementation

- Added `src/types/accountEquityImport.ts` for import-specific result contracts:
  - `EquityImportSeverity`
  - `EquityImportIssueCode`
  - `EquityImportRowError`
  - `EquityImportSummary`
  - `EquityImportResult`
- Added `src/lib/accountEquityCsvImport.ts` with `parseAccountEquityCsv(csvText, options)`.
- Added `src/lib/accountEquityStorage.ts` with localStorage helpers:
  - `saveImportedAccountEquityHistory`
  - `loadImportedAccountEquityHistory`
  - `clearImportedAccountEquityHistory`
  - optional import summary helpers for the future preview UI.
- Added `src/data/accountEquityCsvImportExamples.ts` with documented validation examples because no test framework exists yet.

### Parser Rules

- The parser requires a header row and logical fields for `date`, `equity`, and `percentChange`.
- Accepted header aliases include `date`/`Date`, `equity`/`Equity`, and percent-change variants such as `Percent Change`, `% Change`, `percent change`, and `pctChange`.
- Dates must be exact ISO `YYYY-MM-DD`; slash dates are intentionally rejected.
- Equity values accept plain numbers, quoted comma-formatted numbers, and quoted currency values such as `"$100,000.50"`.
- A malformed row like `2026-05-01,$100,000.50,0.35` is rejected as `malformed_csv_row` because the unquoted comma splits the row into extra cells.
- Percent values accept `0.35`, `0.35%`, `+0.35%`, and `-0.35%`, stored as numeric percent units.
- Duplicate dates block import. Out-of-order rows are allowed, sorted ascending, and reported as a warning.
- Unexpected columns are ignored with warnings. Fully blank rows are skipped.
- Parsing continues after row errors so the future UI can show as many issues as possible.

### Storage

- Imported account equity history is stored separately from `DailyDashboardSnapshot` and future exchange trade ledgers.
- LocalStorage keys:
  - `market-command:account-equity-history`
  - `market-command:account-equity-history:import-summary`
- Storage helpers are client-safe and tolerate unavailable or malformed localStorage data by returning `null` or no-oping.

### Current Boundaries

- No UI was added for CSV import.
- No Google Sheets connection, CSV upload backend, file watching, Supabase, exchange trade import, or dashboard redesign was added.
- Performance Review still renders from the existing mock-derived flow until a future UI/state task chooses imported local equity history at runtime.
- Build verification passed with `npm run build`.

## Performance Review CSV Import UI Findings - 2026-05-02

### Implementation

- `PerformanceModule` is now a client component because it owns file input, FileReader, import preview state, localStorage hydration, and imported/mock source switching.
- The server still provides the mock-derived `PerformanceSnapshot` first, preserving a stable initial render. The module then checks localStorage after mount for imported account equity history.
- Added a compact header action: `Import Equity CSV`.
- The import action triggers a hidden `.csv` file input; no backend upload or Google Sheets connection was added.
- Selected file text is read in-browser and parsed through `parseAccountEquityCsv`.
- The inline preview panel displays rows parsed, rows skipped, error count, warning count, date range, latest equity, source file name, and the first five validation issues.
- `Confirm Import` is disabled unless `result.ok === true`.
- Confirming saves records with `saveImportedAccountEquityHistory`, saves the optional import summary, recalculates Performance Review from imported records, and marks imported data as active.
- `Use Mock Data` appears only when imported data is active. It clears imported account equity history and returns the Performance Review to the server-provided mock-derived view model.

### Behavior

- On initial load, imported local account equity history takes precedence over mock account equity history when available.
- If no imported history exists, Performance Review remains on the existing mock-derived calculation flow.
- Import validation issues do not crash the dashboard; invalid CSVs show the parser result and block confirmation.
- File read errors and non-CSV file selections show a compact inline message.
- Imported account equity history remains separate from `DailyDashboardSnapshot` and future exchange trade ledgers.

### Boundaries

- No Google Sheets sync, Supabase, backend upload, exchange trade import, DailyDashboardSnapshot changes, or broader UI redesign was added.
- The import preview is intentionally inline and low-profile rather than modal-based.
- Build verification passed with `npm run build`.

## Performance Breakdown Display Cleanup Findings - 2026-05-02

- The prior Performance Breakdown layout became too crowded after adding Source and Status columns inside the narrow Performance Review panel.
- The cleanup uses grouped compact sections instead of a four-column table.
- `Account Equity` contains equity-history-derived metrics: Latest Equity, Equity Change, YTD Return, and Max Drawdown.
- `Trade Ledger` contains future exchange-ledger metrics: Trades, Win Rate, Profit Factor, and Avg Win / Loss.
- Trade-ledger metrics remain visible, but their pending status is now communicated once at the group level instead of repeated in every row.
- The row layout is now only metric/value, preventing Source and Status text wrapping from dominating the panel.
- This pass changed presentation only. CSV import behavior, parser behavior, localStorage behavior, mock/imported source switching, and calculation logic were not changed.
- Build verification passed with `npm run build`.

## Performance Review Source-State Polish Findings - 2026-05-02

- The CSV import flow worked, but the module did not make the active account-equity source obvious enough.
- Added a compact active-source strip inside Performance Review.
- Mock state now displays `Source: Mock Equity History` and a subdued `Mock Data` status badge.
- Imported state now displays `Source: Imported CSV` and a low-profile `Local CSV` status badge.
- The equity curve footer label is now source-aware: `Mock account equity curve` or `Local CSV equity curve`.
- The review note now reflects whether the account trajectory comes from mock equity history or imported local equity history.
- This pass did not change parser behavior, localStorage behavior, calculation utilities, import confirmation behavior, source switching logic, or unrelated modules.
- Build verification passed with `npm run build`.

## Exchange Trade Ledger Import Foundation Findings - 2026-05-03

### Implementation

- Added `src/types/tradeLedgerImport.ts` for exchange trade ledger import result contracts.
- Added `src/lib/exchangeTradeLedgerCsvImport.ts` with `parseExchangeTradeLedgerCsv(csvText, options)`.
- Added `src/lib/exchangeTradeLedgerStorage.ts` with localStorage helpers for imported exchange trade ledgers and optional import summaries.
- Added `src/lib/tradeLedgerCalculations.ts` for pure trade-ledger metrics.
- Added `src/data/exchangeTradeLedgerCsvImportExamples.ts` with documented CSV fixtures.
- `ExchangeTradeRecord` was extended minimally and source-compatibly: open/close direction values, `rawTime`, `importedAt`, `amountAsset`, and `filledQuantityAsset`.

### Import Contract And Validation

- CSV is the only implemented format for this foundation. XLSX remains future work.
- Accepted aliases cover futures/symbol, time, direction, margin mode, leverage, amount, order price, filled quantity, average filled price, closing PNL, fee, and status.
- Required columns for accepted close-trade parsing are futures, time, direction, filled quantity, average filled price, closing PNL, fee, and status.
- Times must be exact `YYYY-MM-DD HH:mm:ss`, interpreted as `America/Toronto`, and stored as ISO datetimes.
- Directions accepted by the parser are `Open Long`, `Open Short`, `Close Long`, and `Close Short`.
- Leverage values such as `12X`, quantity values such as `2.2 SOL`, and PNL/fee values such as `7.951 USDT` are parsed into numeric values.
- `Order Price = Market` is accepted and stored as `null`; numeric order prices are stored as numbers.
- Open rows and non-filled rows are ignored with warnings and are not stored as accepted close trade records.
- Close rows are accepted only when `Status = Filled` and direction is `Close Long` or `Close Short`.
- Accepted close rows require valid filled quantity, average filled price, closing PNL, and fee.
- Duplicate close rows block import using symbol, time, direction, filled quantity, average filled price, closing PNL, fee, and status.

### Metrics

- Trade-ledger metrics are calculated from accepted close rows only.
- Primary net realized PNL is after fees: `closingPnl - abs(fee)`.
- Gross closing PNL and total fees are preserved separately.
- Derived metrics include trade count, winning trades, losing trades, breakeven trades, win rate, gross profit, gross loss, average win, average loss, profit factor, symbol breakdown, long/short breakdown, date range, and latest trade time.
- Profit factor is `grossProfit / abs(grossLoss)` when gross loss is negative, otherwise `null`.

### Storage And Boundaries

- Imported exchange trade ledger records persist separately from account equity history and daily snapshots.
- Storage keys:
  - `market-command:exchange-trade-ledger`
  - `market-command:exchange-trade-ledger:import-summary`
- No UI, Performance Review wiring, exchange API integration, XLSX import, Supabase, DailyDashboardSnapshot changes, or account-equity mixing was added.
- Build verification passed with `npm run build`.

## Performance Review Trade Ledger Metrics Wiring Findings - 2026-05-03

### Implementation

- `PerformanceModule` now checks `loadImportedExchangeTradeLedger` after client mount, alongside the existing imported account equity hydration.
- Imported exchange trade ledger records are passed through `deriveTradeLedgerMetrics`; no trade-stat formulas were reimplemented inside the component.
- Account-equity behavior remains unchanged: imported account equity history still drives equity metrics when present, while the server-provided mock equity view model remains the fallback.
- Trade-ledger metrics are applied independently from account equity history and only when imported exchange close-trade records exist.
- `performanceReviewViewModel.ts` now maps optional `PerformanceReviewSnapshot.tradeStats` into the existing `PerformanceSnapshot` trade fields.
- A small view-model helper applies derived trade metrics to an existing `PerformanceSnapshot` so imported trade metrics can be shown even when account equity is still using mock data.

### Display

- The existing Trade Ledger group remains in place and now shows imported values for Trades, Win Rate, Profit Factor, and Avg Win / Loss.
- When no imported exchange trade ledger records exist, the Trade Ledger group remains `pending` with `N/A` values.
- A compact source line now reads `Trade Ledger: pending` or `Trade Ledger: imported`.
- Total Fees and Net Realized PnL were not added to the compact panel because the current frontend `PerformanceSnapshot` view model does not expose those fields.

### Boundaries

- No Import Trade Ledger button, file input, preview panel, confirm flow, parser/storage behavior change, DailyDashboardSnapshot change, Supabase integration, exchange API, XLSX support, dependency, or dashboard redesign was added.

## Performance Review Trade Ledger CSV Import UI Findings - 2026-05-03

### Implementation

- `PerformanceModule` now owns a second local CSV import lane for exchange trade ledger records.
- The new trade ledger import action uses a hidden `.csv` file input and browser `FileReader`; no backend upload was added.
- Selected CSV text is parsed through `parseExchangeTradeLedgerCsv` with the selected file name passed as `sourceName`.
- The trade ledger preview uses existing parser summary fields and does not recompute import statistics in the component.
- Confirming a valid import saves accepted close-trade records with `saveImportedExchangeTradeLedger` and stores the summary with `saveExchangeTradeLedgerImportSummary`.
- After confirm, Performance Review recalculates trade metrics from the confirmed records through the existing trade-ledger metric path.
- Clearing the trade ledger uses `clearImportedExchangeTradeLedger`, rebuilds the current Performance Review from the active account-equity source, and returns trade metrics to pending / `N/A`.

### Display

- The import preview is an inline compact panel, matching the existing account equity import preview treatment.
- Preview fields include rows parsed, rows skipped, errors, warnings, accepted closed trades, ignored rows, date range, symbols, gross closing PnL, total fees, and net realized PnL.
- Validation issues show severity, row number, and message, capped to the first five issues with an overflow count.
- `Import Equity CSV`, `Confirm Equity Import`, and `Use Mock Data` behavior remains intact.
- `Clear Trade Ledger` appears only when imported trade ledger metrics are active.

### Boundaries

- Imported exchange trade ledger records remain separate from imported account equity history and `DailyDashboardSnapshot`.
- No Supabase, exchange API, XLSX support, DailyDashboardSnapshot changes, parser/storage behavior changes, dependency additions, or dashboard redesign was added.
- Build verification passed with `npm run build`.

## Performance Review Local Data Flow Audit Findings - 2026-05-03

### Source Separation

- Account equity history, exchange trade ledger records, and daily snapshots remain separate local data stores.
- Daily snapshots are still keyed per date with `market-command:daily-snapshot:${date}` and are not touched by Performance Review imports.
- Imported account equity history is stored at `market-command:account-equity-history`.
- Imported account equity import summary is stored at `market-command:account-equity-history:import-summary`.
- Imported exchange trade ledger records are stored at `market-command:exchange-trade-ledger`.
- Imported exchange trade ledger import summary is stored at `market-command:exchange-trade-ledger:import-summary`.
- `clearImportedAccountEquityHistory` removes only the account equity keys.
- `clearImportedExchangeTradeLedger` removes only the exchange trade ledger keys.
- Both imported sources can coexist: account equity can drive equity metrics while imported exchange close records drive trade metrics.

### Source Priority

- Performance Review account metrics use imported account equity history after client mount when `loadImportedAccountEquityHistory` returns records.
- If imported account equity history is absent or malformed, Performance Review falls back to the server-provided mock-derived `PerformanceSnapshot`.
- Trade Ledger metrics use only imported exchange trade ledger records from `loadImportedExchangeTradeLedger`.
- If imported exchange trade ledger records are absent, malformed, or contain no accepted close trades, the Trade Ledger group remains `pending` with `N/A` values.

### Import Flow Audit

- Account equity CSV import remains a browser-only `FileReader` flow through `parseAccountEquityCsv`.
- Account equity confirmation saves parsed records and summary, recalculates account-equity-derived metrics, and preserves any active imported trade-ledger metrics.
- `Use Mock Data` clears only imported account equity history and keeps any imported trade ledger active.
- Trade ledger CSV import remains a browser-only `FileReader` flow through `parseExchangeTradeLedgerCsv`.
- Trade ledger confirmation saves accepted records and summary, recalculates trade-ledger-derived metrics, and preserves the active account equity source.
- `Clear Trade Ledger` clears only imported exchange trade ledger records and summary, then rebuilds Performance Review from the active account equity source.
- File type errors, FileReader failures, empty files, invalid CSV rows, and parser validation errors are represented as local preview/messages and do not crash the module.

### Calculation Audit

- Account return, equity curve, account equity change, and drawdown calculations consume only `AccountEquitySnapshot[]`.
- Trade count, win rate, average win/loss, profit factor, gross closing PnL, total fees, net realized PnL, symbol breakdown, and direction breakdown consume only accepted close `ExchangeTradeRecord[]`.
- Accepted trade-ledger rows remain limited to `Status = Filled` and `Direction = Close Long` or `Close Short`.
- Net realized PnL remains after fees using `closingPnl - abs(fee)`.
- Trade-ledger-only fields are not faked from account equity history.

### Fixes

- Patched the Performance Review note copy so pending/imported trade-ledger states no longer produce contradictory wording.

### Known Limitations

- There is still no automated test suite for parser, storage-shape, calculation, or view-model behavior.
- Stored import summaries are saved but not rehydrated into a persistent preview after page reload.
- localStorage has no schema versioning, migration layer, import history, export/backup flow, or cross-device sync.
- The compact Trade Ledger display does not yet show Total Fees or Net Realized PnL outside the import preview.
- No Supabase, Google Sheets sync, exchange API, XLSX support, or durable backend persistence exists yet.

### Recommended Next Phase

- Add focused tests for pure account-equity calculations, trade-ledger calculations, both CSV parsers, and the Performance Review view-model adapter before adding more sources.
- After tests, the next integration decision should be either compactly surfacing fees/net realized PnL in the Trade Ledger group or moving proven local source data toward durable persistence.

## CoinMarketCap Fear And Greed Integration Findings - 2026-05-03

### Current Structure Audit

- `FearGreedModule` keeps the existing compact horizontal sentiment indicator, historical stat row, and source/update line.
- `src/types/dashboard.ts` `FearGreedSnapshot` remains the frontend display view model consumed by the module.
- `src/types/dailySnapshot.ts` `FearGreedSnapshot` remains the saved daily snapshot model and was not modified.
- `src/data/mockDashboardData.ts` still provides the initial mock `FearGreedSnapshot` so server render and fallback behavior remain stable.
- Display-only behavior remains in the component: clamping the gauge marker and formatting the displayed update timestamp.
- Fetched/cache behavior now lives outside the view model: route fetch, CMC normalization, and browser stale cache helpers are separate from daily snapshot persistence.

### Implementation

- Added `src/types/fearGreed.ts` for CoinMarketCap sentiment source/API contracts:
  - `FearGreedReading`
  - `FearGreedApiResponse`
  - `FearGreedFetchResult`
- Added `src/lib/fearGreedNormalization.ts` as a pure helper for CMC response normalization.
- Added `src/lib/fearGreedStorage.ts` for client-safe browser stale cache helpers.
- Added the App Router route handler `GET /api/fear-greed`.
- `FearGreedModule` is now a client component only so it can fetch the internal route after mount and read/write browser localStorage.

### Server Route

- The route calls `https://pro-api.coinmarketcap.com/v3/fear-and-greed/historical?start=1&limit=365`.
- The CoinMarketCap API key is read only from `process.env.CMC_API_KEY`.
- The API key is sent only from the server route using the `X-CMC_PRO_API_KEY` header.
- The browser only calls the internal `/api/fear-greed` route and never receives the API key.
- The route returns controlled JSON errors for missing `CMC_API_KEY`, non-OK CMC responses, CMC rate limiting, malformed CMC data, and unexpected fetch failures.
- Local verification without `CMC_API_KEY` returned HTTP `503` and `{ "ok": false, "error": "missing_cmc_api_key" }`.

### Normalization And Derivation

- CMC readings are accepted from `data[]` items with `timestamp`, `value`, and `value_classification`.
- Timestamps are normalized from epoch seconds or milliseconds into ISO strings.
- Values are numeric, rounded, and clamped to `0..100`.
- Classifications are normalized to the dashboard labels: Extreme Fear, Fear, Neutral, Greed, and Extreme Greed.
- If a classification is malformed but the value is valid, the classification is derived from the numeric value.
- Readings are sorted newest-first with deterministic tie handling.
- Current value comes from the newest reading.
- Last week is the reading nearest to current minus 7 days.
- Last month is the reading nearest to current minus 30 days.
- Year high and year low are calculated across the trailing 365 returned readings.

### Cache And Fallback

- The server route keeps a module-level in-memory cache with a 12-hour TTL.
- If the provider fails after the server cache exists, the route can return the cached value as stale data.
- Browser stale cache uses localStorage key `market-command:fear-greed-cache`.
- Successful internal route responses are saved to browser stale cache.
- If route fetch or parsing fails on the client, `FearGreedModule` attempts to display the browser stale cache.
- If no route data and no browser stale cache exist, the module keeps the initial mock prop.

### Boundaries

- No dependencies were added.
- No Supabase, Google Sheets, exchange API, SPX API, XLSX support, Performance Review changes, or dashboard redesign was added.
- `DailyDashboardSnapshot` persistence was not changed.
- Daily command snapshots may later capture the currently displayed Fear & Greed value during an explicit save flow, but live API cache is not mixed into saved daily history.

### Known Limitations

- No automated tests exist yet for CMC normalization, route error behavior, or browser stale-cache behavior.
- The browser stale cache stores only the normalized display snapshot, not raw CMC history or route error metadata.
- The server memory cache resets when the Next.js process restarts.
- Without `CMC_API_KEY` and without browser stale cache, the UI intentionally remains on mock Fear & Greed data.

## Local CoinMarketCap Environment Setup Findings - 2026-05-03

- Added local `.env.local` with a blank `CMC_API_KEY=` placeholder; no real API key was added.
- Added `.env.example` with `CMC_API_KEY=your_coinmarketcap_api_key_here`.
- `.gitignore` already ignores `.env.local` through `.env*` and keeps `.env.example` trackable through `!.env.example`.
- `CMC_API_KEY` is required for live CoinMarketCap Fear & Greed API data.
- The key must stay server-side and must not be exposed in browser/client code.
- Restart the Next.js dev server after adding or changing `.env.local` so `process.env.CMC_API_KEY` is reloaded.
- If `CMC_API_KEY` is missing, the dashboard falls back to cached or mock Fear & Greed data.

## Gamma Snapshot Architecture Prep Findings - 2026-05-03

### Current Structure

- `GammaContextModule` remains presentational in this pass and is still driven by `dashboardData.gammaContext`.
- Gamma editing UI was intentionally not added yet; no Edit Gamma button, numeric inputs, screenshot upload, source URL UI, OCR, X/Twitter scraping, or live provider integration exists.
- `DailyDashboardSnapshot.gamma` is now prepared as the future persistence source for daily manual Gamma Context.

### Data Model

- `GammaSnapshot` now stores the key gamma read as named fields instead of labeled `levels[]`.
- Named gamma fields are `majorPositiveGamma`, `majorNegativeGamma`, `zeroGamma`, optional `spotReferencePrice`, `capturedAt`, `updatedAt`, `status`, `source`, and `sourceName`.
- The source convention for manual MVP gamma reads is `source: "manual"` with `sourceName: "@gexbot15"` on new draft snapshots.
- The parent `DailyDashboardSnapshot.tradingDate` remains the date association; `GammaSnapshot` does not duplicate the trading date.

### Legacy Compatibility

- `loadDailyDashboardSnapshot` normalizes loaded snapshots before returning them to consumers.
- Old localStorage snapshots with `gamma.levels[]` are accepted and mapped into named fields when labels match:
  - `Major Pos Gamma` maps to `majorPositiveGamma`.
  - `Major Neg Gamma` maps to `majorNegativeGamma`.
  - `Zero Gamma / Flip` maps to `zeroGamma`.
- Missing or unmappable legacy values resolve to `null` instead of throwing.

### Timing Behavior

- Gamma draft status uses a simple `America/Toronto` convention without a market-holiday calendar.
- Saturday and Sunday draft snapshots initialize as `market_closed`.
- Weekday draft snapshots before 10:05 AM ET initialize as `pending`.
- Weekday draft snapshots after 10:05 AM ET initialize as `not_checked` until manual values are saved in a future Gamma edit flow.

### Shared Snapshot State

- Active daily snapshot state has been lifted into `DailySnapshotProvider` and `useDailySnapshot`.
- The shared layer owns active date, active `DailyDashboardSnapshot`, saved snapshot dates, date loading, snapshot saving, and updater-based persistence.
- `TradingContextModule` now consumes this shared state for Synthesis Notes and Trading Checklist instead of owning duplicate daily snapshot state.
- This prepares Gamma Context to use the same active daily snapshot in the next implementation slice.

### Verification

- Build verification passed with `npm run build`.

## Manual Gamma Context Editing Findings - 2026-05-03

### Implementation

- `GammaContextModule` now reads the active daily gamma snapshot from `DailySnapshotProvider`.
- The existing `dashboardData.gammaContext` prop remains only for the presentation chart label and mock distribution context in this pass.
- Read-only Gamma Context displays the saved daily Major Positive Gamma, Major Negative Gamma, Zero Gamma / Flip, last checked timestamp, source name, status, and regime.
- The manual source convention remains `@gexbot15`, and saves set `source: "manual"`.

### Edit Flow

- Added compact `Edit Gamma`, `Save`, and `Cancel` controls to the module header action area.
- Edit mode exposes compact fields for Major Positive Gamma, Major Negative Gamma, Zero Gamma / Flip, Last Checked datetime, and status.
- Saving persists changes through the shared daily snapshot updater under the existing `market-command:daily-snapshot:${date}` storage key.
- Saving marks Gamma as `checked` when any manual gamma level is present; empty level inputs persist as `null`.
- Non-numeric gamma level values are blocked with a compact inline error.
- Cancel restores the current saved snapshot values and exits edit mode.

### Date Switching

- Gamma edit state resets when the active trading date changes.
- Unsaved Gamma edits are discarded on date switch, matching the current Synthesis Notes behavior.
- Saved Gamma values remain date-specific because they live inside the active `DailyDashboardSnapshot`.

### Boundaries

- No screenshot upload, tweet/source URL UI, OCR, X/Twitter scraping, live provider integration, new dependencies, separate Gamma storage keys, or dashboard redesign was added.
- Build verification passed with `npm run build`.

## Manual Gamma Context Workflow Audit Findings - 2026-05-03

### Shared State And Persistence

- Gamma Context reads from the active `DailyDashboardSnapshot.gamma` exposed by `DailySnapshotProvider`.
- Gamma saves use the provider's shared `updateSnapshot` path, which saves the full `DailyDashboardSnapshot`.
- No Gamma-specific localStorage key was introduced; the only Gamma persistence path is the existing `market-command:daily-snapshot:${date}` daily snapshot key.
- Gamma Context and Trading Context share the same active date and active daily snapshot state.

### Date-Specific Behavior

- Switching the active date through Trading Context loads that date's normalized daily snapshot, including Gamma.
- Unsaved Gamma edits reset on active date changes, matching the existing Synthesis Notes behavior.
- Saved Gamma values remain scoped to the selected daily snapshot date.

### Status And Source Behavior

- New draft Gamma status still follows the simple `America/Toronto` convention: weekend `market_closed`, weekday before 10:05 AM ET `pending`, weekday after 10:05 AM ET `not_checked`.
- Manual Gamma saves set `source` to `manual`.
- `sourceName` is preserved when present and falls back to `@gexbot15`.
- Saving one or more manual gamma levels marks Gamma status as `checked`.
- Empty gamma level inputs save as `null` without crashing.

### Legacy Compatibility

- Old saved snapshots with `gamma.levels[]` normalize on load.
- Legacy `Major Pos Gamma`, `Major Neg Gamma`, and `Zero Gamma / Flip` labels map to the new named fields when possible.
- Unmappable legacy values stay `null` and do not crash the dashboard.

### Fixes

- Patched Last Checked datetime save handling so invalid or partial datetime values show a compact error instead of throwing during ISO conversion.

### Regression Check

- Trading Context still consumes the shared daily snapshot provider for date switching, Synthesis Notes, and checklist toggles.
- Performance Review account-equity/trade-ledger localStorage flows remain separate from daily snapshot storage.
- Fear & Greed API/cache fallback remains separate from daily snapshot persistence.
- Build verification passed with `npm run build`.

## Whole-System Local MVP Audit Findings - 2026-05-03

### Source Separation

- Daily command reads persist only as `DailyDashboardSnapshot` objects under date-keyed daily snapshot storage.
- Imported account equity history persists separately from daily snapshots and exchange trade ledger records.
- Imported exchange trade ledger records persist separately from daily snapshots and account equity history.
- Fear & Greed route memory cache and browser stale cache remain separate from daily snapshots.
- No module currently writes raw imported performance source data or Fear & Greed cache data into `DailyDashboardSnapshot`.

### Daily Snapshot Behavior

- `DailySnapshotProvider` owns active date, active daily snapshot, saved snapshot dates, date loading, snapshot saving, and updater-based persistence.
- Trading Context and Gamma Context consume the same provider state.
- Date switching loads a saved snapshot for that date when available, otherwise it creates a draft snapshot from the default fixture/factory path.
- Synthesis Notes, Trading Checklist, and Gamma Snapshot all persist by active date through the shared daily snapshot key.
- Unsaved Synthesis Notes and Gamma edits reset on date changes.

### Performance Review Behavior

- Imported account equity history takes precedence over the server-provided mock equity view model after client mount.
- Clearing imported account equity history removes only account equity storage keys and rebuilds account metrics from mock data.
- Imported exchange trade ledger records independently populate Trade Ledger metrics when accepted close records exist.
- Clearing imported trade ledger records removes only trade ledger storage keys and returns the Trade Ledger display to pending / `N/A`.
- Account-equity calculations consume `AccountEquitySnapshot[]`; trade-ledger calculations consume accepted close `ExchangeTradeRecord[]`.

### Fear And Greed Behavior

- `FearGreedModule` renders the mock prop first, then fetches `/api/fear-greed` after mount.
- The CoinMarketCap API key is read only in the App Router route through `process.env.CMC_API_KEY`.
- Missing `CMC_API_KEY` returns a controlled route response and does not crash the dashboard.
- Successful route snapshots are stored only in the Fear & Greed browser stale cache.
- If route fetch/parsing fails, the module attempts browser stale cache and otherwise keeps the mock prop.

### LocalStorage Key Map

- Daily snapshots: `market-command:daily-snapshot:${date}`
- Account equity history: `market-command:account-equity-history`
- Account equity import summary: `market-command:account-equity-history:import-summary`
- Exchange trade ledger: `market-command:exchange-trade-ledger`
- Exchange trade ledger import summary: `market-command:exchange-trade-ledger:import-summary`
- Fear & Greed browser cache: `market-command:fear-greed-cache`

### Known Limitations

- No Supabase or durable multi-device persistence exists.
- No tests or test runner exist.
- No Google Sheets sync exists.
- No exchange API integration exists.
- No XLSX import exists.
- No Gamma screenshot upload, source URL UI, OCR, or automation exists.
- No live SPX/watchlist feed exists.
- No market holiday calendar exists; Gamma timing only distinguishes weekdays from Saturday/Sunday.
- localStorage has no schema versioning, migration layer, backup/export flow, import history, or cross-device sync.

### Audit Outcome

- No clear whole-system correctness bug required a code patch.
- Build verification passed with `npm run build`.

## FMP Quote Verification Prep Findings - 2026-05-03

### Environment

- Added `FMP_API_KEY=` to local `.env.local` as a blank placeholder; no real FMP API key was added.
- Added `FMP_API_KEY=your_financial_modeling_prep_api_key_here` to `.env.example`.
- `.env.local` remains ignored by `.gitignore` through the existing `.env*` rule.
- The existing CoinMarketCap environment behavior was not changed.

### Verification Helper

- Added `scripts/verify-fmp-quotes.mjs` as a temporary server-side-only symbol verification helper.
- The script manually reads `.env.local` from Node, never prints the API key, and exits without sending quote requests if `FMP_API_KEY` is missing or blank.
- The script prints terminal output only and does not write quote data to localStorage, docs, source files, temp files, or caches.
- The script uses no new dependencies and does not add a final `/api/market-quotes` route.

### Symbols To Verify

- `^GSPC` remains the first S&P 500 fallback/proxy candidate for the dashboard display symbol `SPX500`.
- `ESUSD` remains an experimental closer proxy candidate if FMP returns valid quote data.
- The full verification set is `^GSPC`, `ESUSD`, `GCUSD`, `CLUSD`, `DXUSD`, `CADUSD`, and `BTCUSD`.
- Verified quote results should be reviewed from terminal output first, then manually summarized into this findings file.

### Boundaries

- No UI wiring, dashboard redesign, market quote route, dependency addition, or DailyDashboardSnapshot write behavior was added.
- Live quote data remains outside `DailyDashboardSnapshot`.

## FMP Quote Symbol Verification Findings - 2026-05-03

### Script Patch

- Patched `scripts/verify-fmp-quotes.mjs` so requested symbols are de-duplicated before verification and terminal results are printed once per symbol.
- The verifier remains read-only: it prints terminal output only and does not write quote data to localStorage, docs, source files, temp files, or caches.
- No dependencies, UI wiring, or final `/api/market-quotes` route were added.

### Verified FMP Results

The key-backed read-only verification run returned one terminal result per requested symbol after the logging patch.

| Display Use | FMP Symbol | Result | Observed Fields | Notes |
| --- | --- | --- | --- | --- |
| Official S&P 500 fallback | `^GSPC` | Works | price, change, change %, volume, timestamp/asOf, name | Valid official S&P 500 index fallback for the `SPX500` display read. |
| E-Mini S&P 500 proxy | `ESUSD` | Works | price, change, change %, volume, timestamp/asOf, name | Valid closer proxy candidate for the user's SPX500/US500-style workflow. |
| Gold proxy | `GCUSD` | Works | price, change, change %, volume, timestamp/asOf, name | Valid gold futures proxy for the `XAUUSD` display row. |
| Bitcoin proxy | `BTCUSD` | Works | price, change, change %, volume, timestamp/asOf, name | Valid Bitcoin USD proxy for the `BTCUSDT` display row. |
| WTI proxy | `CLUSD` | Blocked | HTTP 402 Payment Required | Current FMP plan does not include this symbol. |
| Dollar index proxy | `DXUSD` | Blocked | HTTP 402 Payment Required | Current FMP plan does not include this symbol. |
| CAD/USD forex | `CADUSD` | Blocked | HTTP 402 Payment Required | Current FMP plan does not include this symbol. |

Sample reviewed terminal values from the verification run:

| FMP Symbol | Price | Change | Change % | Volume | As Of |
| --- | ---: | ---: | ---: | ---: | --- |
| `^GSPC` | 7230.12 | 21.11 | 0.29283 | 2918281000 | 2026-05-01T21:07:23.000Z |
| `ESUSD` | 7258 | 14.25 | 0.19672 | 1209116 | 2026-05-01T21:00:00.000Z |
| `GCUSD` | 4625.6 | -4 | -0.08640055 | 92065 | 2026-05-01T21:00:00.000Z |
| `BTCUSD` | 78853.41 | 183.855 | 0.23371 | 18792568832 | 2026-05-03T21:02:59.000Z |

### Final MVP Symbol Map

- `SPX500` display should use FMP `ESUSD` as primary and FMP `^GSPC` as fallback.
- `XAUUSD` display should use FMP `GCUSD` as a gold futures proxy.
- `BTCUSDT` display should use FMP `BTCUSD` as a Bitcoin USD proxy.
- `WTI` should remain mock/unavailable for MVP unless another free provider is added.
- `DXY` should remain mock/unavailable for MVP unless another free provider is added.
- `CADUSD` should remain mock/unavailable for MVP unless another free provider is added.

### Caveats

- `SPX500` remains the dashboard display symbol, but provider metadata must clearly label whether values came from FMP `ESUSD` or FMP `^GSPC`.
- `GCUSD` and `BTCUSD` are proxies for the existing display labels, not exact `XAUUSD` spot or `BTCUSDT` pair feeds.
- HTTP 402 symbols should not be retried aggressively in the MVP route; they should fall back quietly to mock/unavailable values until another provider is approved.

## Market Quote Route MVP Findings - 2026-05-03

### Implementation

- Added provider-agnostic market quote source contracts in `src/types/marketQuotes.ts`.
- Added pure FMP quote normalization helpers in `src/lib/fmpQuoteNormalization.ts`.
- Added the App Router route handler `GET /api/market-quotes`.
- The route reads `FMP_API_KEY` only on the server through `process.env.FMP_API_KEY`.
- No FMP key is exposed to browser/client code.

### Live MVP Symbols

- `SPX500` display uses FMP `ESUSD` as the primary source with source label `E-Mini S&P 500 proxy`.
- If FMP `ESUSD` fails or returns unusable data, `SPX500` falls back to FMP `^GSPC` with source label `S&P 500 index fallback`.
- `XAUUSD` display uses FMP `GCUSD` with source label `Gold futures proxy`.
- `BTCUSDT` display uses FMP `BTCUSD` with source label `BTC/USD proxy`.

### Unavailable MVP Symbols

- `WTI`, `DXY`, and `CADUSD` are returned as normalized `unavailable` rows.
- The route does not try FMP `CLUSD`, `DXUSD`, or `CADUSD` live because the current FMP plan returned HTTP 402 for those symbols during verification.
- Unavailable rows keep the future UI contract stable without pretending those symbols are live.

### Cache And Fallback

- The route keeps a module-level in-memory cache of the most recent successful normalized quote result.
- Fresh cache TTL is 5 minutes during weekday 9:30 AM to 4:00 PM `America/Toronto` market hours.
- Fresh cache TTL is 30 minutes outside those hours.
- If FMP fails after a successful route result exists, the route can return stale cached quotes with live rows marked `cached`.
- If no cache exists and FMP is unavailable, the route returns controlled JSON with unavailable rows for the full MVP watchlist shape.

### Boundaries

- No `MarketSituationModule` wiring, UI redesign, dependency addition, Twelve Data integration, or live charting was added.
- No quote data is written into `DailyDashboardSnapshot`.
- Live/cache market quote data remains separate from saved daily history; later daily capture should be explicit.

### Verification

- `npm run build` passed after adding the route.
- Local `GET /api/market-quotes` returned live FMP rows for `SPX500`, `XAUUSD`, and `BTCUSDT`, plus unavailable rows for `WTI`, `DXY`, and `CADUSD`.

## Market Situation Quote Hydration Findings - 2026-05-03

### Implementation

- Added client-safe browser stale cache helpers in `src/lib/marketQuoteStorage.ts`.
- Browser cache key is `market-command:market-quotes-cache`.
- Converted `MarketSituationModule` to a client component so it can fetch `/api/market-quotes` after mount.
- Initial render still uses the existing server-provided mock `MarketSituation` props and component-local mock watchlist rows.
- Successful route responses hydrate the SPX hero quote, chart quote label, and watchlist rows for available symbols.
- Successful route responses are saved only to the market quote browser stale cache.

### Fallback Behavior

- If `/api/market-quotes` fails, returns malformed data, or returns a non-OK result, the module attempts to load the browser stale cache.
- Browser stale-cache rows that were previously `live` are displayed as `cached`.
- If no browser stale cache exists, the module keeps the original mock data.
- `WTI`, `DXY`, and `CADUSD` preserve their mock display values while showing the route-provided `unavailable` status when route data exists.

### UI Behavior

- The current SPX module layout, chart placeholder, hero quote structure, and watchlist table were preserved.
- Added a compact `Market Quotes: live/cached/partial/mock` source badge in the module header action area.
- Watchlist rows show a subtle source/status line inside the existing table cells rather than adding new columns.
- Failures remain low-profile and do not create loud error panels.

### Boundaries

- No quote data is written into `DailyDashboardSnapshot`.
- No final market snapshot capture behavior, chart/candle data, websockets, Twelve Data integration, dependencies, or unrelated module changes were added.

### Verification

- `npm run build` passed after wiring the market quote hydration path.

## Market Quote Integration Audit Findings - 2026-05-03

### Route Behavior

- `/api/market-quotes` reads `FMP_API_KEY` only from server-side `process.env`.
- The route returns controlled JSON for missing key, provider failure, malformed quote rows, partial symbol failures, and full provider unavailability.
- Successful route verification returned:
  - `SPX500`: `live`, FMP `ESUSD`, `E-Mini S&P 500 proxy`.
  - `XAUUSD`: `live`, FMP `GCUSD`, `Gold futures proxy`.
  - `BTCUSDT`: `live`, FMP `BTCUSD`, `BTC/USD proxy`.
  - `WTI`: `unavailable`, mock fallback.
  - `DXY`: `unavailable`, mock fallback.
  - `CADUSD`: `unavailable`, mock fallback.
- `SPX500` still uses FMP `ESUSD` first and falls back to FMP `^GSPC` only if the ESUSD quote is unusable.
- Server-side in-memory cache remains route-local and separate from browser localStorage and daily snapshots.

### Client Hydration

- `MarketSituationModule` renders mock props and mock watchlist rows first.
- The module fetches `/api/market-quotes` only after client mount.
- Successful route responses hydrate the SPX hero quote, chart quote text, and watchlist rows.
- Successful route responses are saved to the browser stale cache under `market-command:market-quotes-cache`.
- Route failure or malformed route data falls back to browser stale cache when available.
- If no stale cache exists, the module remains on mock display data.

### Source Separation

- No market quote data is written into `DailyDashboardSnapshot`.
- The market quote browser stale cache is separate from daily snapshots, imported account equity history, exchange trade ledger records, and Fear & Greed cache data.
- The audit scan found market quote cache writes only in `src/lib/marketQuoteStorage.ts`.

### Display Logic

- Live rows display provider price, change, change percent, volume, source label, and row status.
- Unavailable rows keep mock display values but are labeled as unavailable with mock fallback source.
- Module source state is `partial` for the current MVP route because supported symbols are live while `WTI`, `DXY`, and `CADUSD` are intentionally unavailable.
- Cached route fallback displays cached rows as `cached`.
- Partial/unavailable quote coverage remains visually low-profile; no loud error panel was added.

### Fixes

- Reused the stricter runtime `MarketQuotesFetchResult` validator from `marketQuoteStorage` inside `MarketSituationModule`.
- This prevents a malformed successful route payload from being accepted and saved to browser stale cache.

### Known Limitations

- No automated tests exist for market quote normalization, route fallback, server cache behavior, or browser stale-cache behavior.
- Missing-key route behavior was confirmed by source audit, not a separate dev-server restart with a blank env.
- Server memory cache resets when the Next.js process restarts.
- `WTI`, `DXY`, and `CADUSD` require another free provider, different FMP plan, or continued mock/unavailable treatment.
- No chart/candle hydration, websocket feed, Twelve Data fallback, or explicit daily market snapshot capture exists yet.

## SPX Watchlist Metadata Polish Findings - 2026-05-03

### Display Changes

- Watchlist row metadata was shortened to concise source/status labels:
  - `SPX500`: `proxy / live` or `fallback / live` depending on provider symbol.
  - `XAUUSD`: `futures / live`.
  - `BTCUSDT`: `proxy / live`.
  - `WTI`, `DXY`, and `CADUSD`: `mock / unavailable`.
- The module-level quote state badge now uses compact copy such as `quotes: partial`, `quotes: live`, `quotes: cached`, or `quotes: mock`.
- Metadata styling is smaller, lighter, and more muted so quote values remain dominant in the compact watchlist table.

### Boundaries

- This was a display-polish-only pass.
- No `/api/market-quotes` behavior, market quote storage/cache logic, normalized quote types, providers, dependencies, chart area, or DailyDashboardSnapshot behavior changed.

### Verification

- `npm run build` passed after the metadata polish.

## Twelve Data Quote Verification Prep Findings - 2026-05-03

### Environment

- Added `TWELVE_DATA_API_KEY=` to local `.env.local` as a blank placeholder; no real Twelve Data API key was added.
- Added `TWELVE_DATA_API_KEY=your_twelve_data_api_key_here` to `.env.example`.
- `.env.local` remains ignored by `.gitignore` through the existing `.env*` rule.
- Existing FMP and CoinMarketCap environment behavior was not changed.

### Verification Helper

- Added `scripts/verify-twelve-quotes.mjs` as a temporary server-side-only symbol verification helper.
- The script manually reads `.env.local` from Node, never prints the API key, and exits without sending requests if `TWELVE_DATA_API_KEY` is missing or blank.
- The script prints terminal output only and does not write quote data to localStorage, caches, source files, docs, or daily snapshots.
- The script uses no new dependencies and does not modify `/api/market-quotes`.

### Symbols To Verify

- Quote targets: `WTI/USD`, `DXY`, `CAD/USD`, `XAU/USD`, and `BTC/USD`.
- Symbol-search targets: `WTI`, `DXY`, `CAD/USD`, `XAU/USD`, and `BTC/USD`.
- Primary goal is to determine whether Twelve Data can cover currently unavailable `WTI`, `DXY`, and `CADUSD`.
- `XAU/USD` and `BTC/USD` are optional fallback confirmations only; the existing FMP route remains unchanged.

### Verified Twelve Data Results

- Key-backed Twelve Data verification was run after `TWELVE_DATA_API_KEY` was manually added.
- Working quote symbols:
  - `CAD/USD` works and can support the `CADUSD` display row as CAD/USD forex.
  - `XAU/USD` works and can support the `XAUUSD` display row as gold spot.
  - `BTC/USD` works and can support `BTCUSDT` as a BTC/USD proxy fallback.
- Blocked or unavailable symbols:
  - `WTI/USD` returned a plan restriction and is available starting with Twelve Data Grow or Venture.
  - `DXY` quote failed as an invalid symbol.
  - `DXY` symbol search did not return a usable US Dollar Index symbol.
- Search findings support the working symbols above and do not identify a usable Twelve Data DXY candidate for MVP.

### Updated MVP Provider Map

- `SPX500`
  - Primary: FMP `ESUSD`.
  - Fallback: FMP `^GSPC`.
  - Label: E-Mini S&P 500 proxy / S&P 500 index fallback.
- `XAUUSD`
  - Primary: Twelve Data `XAU/USD`.
  - Fallback: FMP `GCUSD`.
  - Label: Gold spot / gold futures fallback.
- `BTCUSDT`
  - Primary: FMP `BTCUSD`.
  - Fallback: Twelve Data `BTC/USD`.
  - Label: BTC/USD proxy.
- `CADUSD`
  - Primary: Twelve Data `CAD/USD`.
  - Fallback: mock/unavailable.
  - Label: CAD/USD forex.
- `WTI`
  - Remains mock/unavailable for MVP.
  - Reason: Twelve Data `WTI/USD` requires Grow/Venture and FMP `CLUSD` is blocked on the current FMP plan.
- `DXY`
  - Remains mock/unavailable for MVP.
  - Reason: Twelve Data `DXY` is invalid/not found and FMP `DXUSD` is blocked on the current FMP plan.

### Remaining Limitations

- `/api/market-quotes` was not modified during the verification-documentation step; the next implementation step should use the provider mix documented above.
- Twelve Data should be integrated only for the verified provider mix: `XAU/USD`, `CAD/USD`, and optional `BTC/USD` fallback.
- No quote data has been written into `DailyDashboardSnapshot`.

## Mixed Provider Market Quote Route Findings - 2026-05-03

### Implementation

- Added `src/lib/twelveQuoteNormalization.ts` for pure Twelve Data quote normalization into the existing `MarketQuote` shape.
- Expanded `MarketQuoteProvider` to include `twelve`.
- Expanded `MarketQuotesFetchResult.source` and browser stale-cache validation to allow mixed `Financial Modeling Prep + Twelve Data` route results.
- Updated `GET /api/market-quotes` to read both `FMP_API_KEY` and `TWELVE_DATA_API_KEY` server-side only.
- No provider keys are exposed to browser/client code.

### Provider Map Now Used By Route

- `SPX500`
  - Primary: FMP `ESUSD`, source label `E-Mini S&P 500 proxy`.
  - Fallback: FMP `^GSPC`, source label `S&P 500 index fallback`.
- `XAUUSD`
  - Primary: Twelve Data `XAU/USD`, source label `Gold spot`.
  - Fallback: FMP `GCUSD`, source label `Gold futures fallback`.
- `BTCUSDT`
  - Primary: FMP `BTCUSD`, source label `BTC/USD proxy`.
  - Fallback: Twelve Data `BTC/USD`, source label `BTC/USD proxy`.
- `CADUSD`
  - Primary: Twelve Data `CAD/USD`, source label `CAD/USD forex`.
  - Fallback: unavailable/mock.
- `WTI` and `DXY`
  - Remain unavailable/mock for MVP.
  - The route does not call FMP or Twelve Data for these rows.

### Fallback Behavior

- If `TWELVE_DATA_API_KEY` is missing, `XAUUSD` can still fall back to FMP `GCUSD`, `BTCUSDT` can stay on FMP `BTCUSD`, and `CADUSD` becomes unavailable.
- If FMP fails but Twelve Data works, `XAUUSD` and `CADUSD` can remain live through Twelve Data, and `BTCUSDT` can use Twelve Data fallback.
- If both providers fail and server cache exists, the route can return stale cached quotes.
- If both providers fail and no server cache exists, the route returns controlled JSON with unavailable rows.

### Verification

- `npm run build` passed after mixed provider integration.
- Local `GET /api/market-quotes` returned:
  - `SPX500`: live, FMP `ESUSD`, `E-Mini S&P 500 proxy`.
  - `XAUUSD`: live, Twelve Data `XAU/USD`, `Gold spot`.
  - `BTCUSDT`: live, FMP `BTCUSD`, `BTC/USD proxy`.
  - `CADUSD`: live, Twelve Data `CAD/USD`, `CAD/USD forex`.
  - `WTI`: unavailable, mock fallback.
  - `DXY`: unavailable, mock fallback.

### Boundaries

- No `MarketSituationModule` layout redesign, chart/candle data, websocket feed, dependencies, or DailyDashboardSnapshot writes were added.
- Browser stale cache key remains `market-command:market-quotes-cache`.

## Mixed Provider Market Quote Stabilization Audit Findings - 2026-05-03

### Provider Behavior

- `SPX500` uses FMP `ESUSD` as primary and falls back to FMP `^GSPC` only when the primary quote is unusable.
- `XAUUSD` uses Twelve Data `XAU/USD` as primary and falls back to FMP `GCUSD` only when the primary quote is unusable.
- `BTCUSDT` uses FMP `BTCUSD` as primary and falls back to Twelve Data `BTC/USD` only when the primary quote is unusable.
- `CADUSD` uses Twelve Data `CAD/USD`; if that quote is unusable, the route returns an unavailable row.
- `WTI` and `DXY` are constructed from static unavailable/mock rows and do not trigger FMP or Twelve Data provider calls.

### API Key Safety

- `FMP_API_KEY` and `TWELVE_DATA_API_KEY` are read only in `src/app/api/market-quotes/route.ts` through server-side `process.env`.
- Client code calls only the internal `/api/market-quotes` route and does not call FMP or Twelve Data directly.
- The audit scan found no provider keys in client components and no client-side references to provider endpoints.

### Fallback And Cache Behavior

- Missing `TWELVE_DATA_API_KEY` still allows FMP-backed `SPX500`, FMP fallback `XAUUSD`, and FMP primary `BTCUSDT`; `CADUSD` becomes unavailable.
- Missing `FMP_API_KEY` still allows Twelve-backed `XAUUSD`, Twelve fallback `BTCUSDT`, and Twelve-backed `CADUSD`; `SPX500` becomes an error row unless stale server cache is available.
- Missing both keys returns controlled JSON and uses stale server cache if available.
- Provider request failures, malformed FMP rows, malformed Twelve rows, and missing provider prices normalize to error rows and then fall through to the approved fallback path where one exists.
- Partial provider success returns `ok: true` when at least one live quote exists and annotates the result with `partial_market_quote_failure` when any quote row is an error.
- Stale server cache fallback marks previously live rows as `cached` and remains separate from browser localStorage.

### Client Hydration And Display

- `MarketSituationModule` renders server-provided mock market props and component-local mock watchlist rows before hydration.
- After mount, the module fetches `/api/market-quotes`, validates the payload with `isMarketQuotesFetchResult`, and saves successful route results to `market-command:market-quotes-cache`.
- If the route fails, returns non-OK, or returns malformed data, the module loads browser stale cache and marks previously live rows as `cached`.
- If browser stale cache is unavailable, the module stays on mock display data.
- Module-level quote state reports `mock`, `live`, `partial`, or `cached`; the current MVP mixed route is normally `partial` because `WTI` and `DXY` are intentionally unavailable while supported rows are live.
- Row metadata remains compact and now uses ASCII separators such as `proxy / live`, `spot / live`, `forex / live`, and `mock / unavailable`.
- `WTI` and `DXY` keep mock display values only as quiet placeholders and are explicitly labeled unavailable.

### Source Separation

- No market quote data is written into `DailyDashboardSnapshot`.
- Market quote browser cache writes are isolated to `market-command:market-quotes-cache`.
- Fear & Greed cache storage, account equity import storage, and exchange trade ledger storage are untouched by market quote hydration.

### Fixes

- Patched `getErrorStatus` so the combined `missing_market_quote_api_keys` route error returns service-unavailable semantics when no stale cache exists.
- Patched the watchlist metadata separator to remove a mojibake separator artifact.
- `npm run build` passed after the stabilization audit.

### Known Limitations

- No automated tests exist yet for market quote normalization, route fallback branches, server cache behavior, or browser stale-cache behavior.
- Server cache remains in-memory and resets when the Next.js process restarts.
- `WTI` and `DXY` still require another provider, a plan change, or continued unavailable/mock treatment.
- The SPX chart remains a code-native placeholder; no candle/chart feed, websocket, or explicit daily market snapshot capture exists.

## Account Equity Return Semantics Fix Findings - 2026-05-04

### Root Cause

- Imported account equity rows used `AccountEquitySnapshot.percentChange` for the CSV's third column.
- The user's Google Sheet third column is cumulative/total return from starting equity, not daily percent change.
- `derivePerformanceReviewSnapshot` used the latest imported `percentChange` directly as `dailyReturnPercent`, so a cumulative value such as `192%` appeared in the top Daily card.

### Corrected Source Semantics

- `AccountEquitySnapshot` now stores the imported return column as `cumulativeReturnPercent`.
- The CSV parser still accepts existing headers including `Percent Change`, `% Change`, `percentChange`, and `pctChange`, but maps them into cumulative-return semantics.
- The parser also accepts explicit cumulative/total return headers: `cumulativeReturnPercent`, `totalReturnPercent`, `cumulativeReturn`, and `totalReturn`.
- Existing browser localStorage account equity records with old `percentChange` fields are normalized to `cumulativeReturnPercent` on load.

### Corrected Metric Definitions

- Daily return now derives from equity values using latest equity versus the previous available row.
- Weekly return, Monthly return, YTD return, equity curve, max drawdown, latest equity, and account equity change continue to derive from equity values only.
- The imported cumulative-return column remains source context and is not used as the Daily card value.

### Verification

- The observed example `292.81` to `291.79` now calculates Daily as roughly `-0.35%` instead of using the imported cumulative `192%`.
- `npm run build` passed after the source model, parser, storage migration, calculation, fixture, and documentation updates.

## Account Equity Testing Foundation Findings - 2026-05-04

### Test Framework

- Added Vitest as the first automated test framework.
- Added `vitest.config.ts` with Node test environment and `@/*` alias support.
- Added `npm run test` as the test command.

### Parser Coverage

- `src/lib/accountEquityCsvImport.test.ts` covers valid account equity CSV parsing, record IDs, `csv_import` source, shared `importedAt`, cumulative-return semantics, legacy header aliases, explicit cumulative/total return aliases, equity parsing, percent parsing, blank row skipping, date validation, equity validation, cumulative-return validation, duplicate date blocking, out-of-order row sorting, unexpected column warnings, and malformed unquoted comma rows.

### Calculation Coverage

- `src/lib/performanceReviewCalculations.test.ts` covers Daily, Weekly, Monthly, and YTD return derivation from equity values, account equity change via the view-model adapter, max drawdown, and out-of-order input handling.
- The Daily test protects the real regression: imported cumulative values such as `192%` must not become the Daily card value.

### Fixes Found During Test Setup

- Added parser aliases for `Cumulative Return %` and `Total Return %`; their normalized headers include `%`, so they needed explicit support in addition to `cumulativeReturnPercent`, `totalReturnPercent`, `cumulativeReturn`, and `totalReturn`.

### Verification

- `npm run test` passed with 2 test files and 31 tests.

## Exchange Trade Ledger Testing Foundation Findings - 2026-05-04

### Parser Coverage

- `src/lib/exchangeTradeLedgerCsvImport.test.ts` covers valid Filled close-long and close-short imports, accepted record metadata, numeric parsing for leverage/amount/order price/filled quantity/average price/closing PNL/fee, header aliases, Toronto-local `YYYY-MM-DD HH:mm:ss` parsing, raw time preservation, invalid and unsupported time formats, direction handling, status handling, ignored open/non-filled rows, close-row validation errors, duplicate close-row skipping, unexpected column warnings, blank row skipping, and accepted-record sorting.
- The duplicate-row tests protect warning-based exact duplicate skipping and non-deduping when optional export fields differ.
- Ignored rows are covered as warnings that do not fail import unless true row errors are also present.

### Calculation Coverage

- `src/lib/tradeLedgerCalculations.test.ts` covers `getTradeNetPnl`, `isAcceptedCloseTrade`, and `deriveTradeLedgerMetrics`.
- Calculation tests cover after-fee net PnL, gross closing PNL versus net realized PNL, absolute fee summing, trade/win/loss/breakeven counts, win rate, gross profit/loss, average win/loss, profit factor null fallback, symbol breakdown, long/short direction breakdown, accepted-trade sorting for date range/latest trade, ignored non-accepted rows, and empty-input safe defaults.

### Fixes Found During Test Setup

- No parser or calculation behavior bugs were found during this pass, so no production code was changed.

### Verification

- `npm run test` passed with 4 test files and 81 tests.
- `npm run build` passed after the test and documentation updates.

## Trade Ledger Import Preview Priority Findings - 2026-05-04

### Root Cause

- The Trade Ledger import preview rendered `tradeLedgerImportResult.issues.slice(0, 5)` in parser issue order.
- Large real imports can produce thousands of expected ignored-row warnings before the smaller set of blocking errors, making the fix-required rows difficult to see.

### Display Change

- Trade Ledger preview issues are now grouped by severity with `Errors` first and `Warnings` second.
- The preview shows compact error and warning totals before the grouped list.
- Error rows and warning rows have independent preview limits; warnings remain visible but no longer dominate the top of the preview.
- Each group keeps its own hidden-count message when more issues exist than are shown.

### Import Behavior

- Confirm Import remains gated by `tradeLedgerImportResult.ok`.
- Parser behavior already defines `ok` from blocking errors only, so warnings alone do not block import.
- No parser accepted-row rules, validation rules, trade calculations, or storage boundaries changed.

## Exact Duplicate Trade Ledger Row Handling Findings - 2026-05-04

### Behavior Change

- Exact duplicate Filled close-trade rows are now skipped with `duplicate_trade` warnings instead of blocking import as errors.
- The duplicate warning includes the original matching row number where possible, for example `Duplicate close trade row skipped; matches row 80.`
- Duplicate skipped rows increment `rowsSkipped`, are excluded from `records`, and do not count toward `acceptedClosedTrades`.
- `result.ok` remains true when duplicate warnings are the only issues, so Confirm Import stays enabled.

### Metric Safety

- Because duplicate rows are not added to accepted records, they do not affect trade count, win rate, gross closing PNL, total fees, net realized PNL, average win/loss, profit factor, symbol breakdown, or direction breakdown.
- Duplicate detection was tightened to include optional export fields such as margin mode, leverage, amount, order price, and filled quantity asset so non-identical close rows are not auto-deduped.

### Boundaries

- Account equity duplicate-date blocking was not changed.
- Trade calculation formulas, accepted close-trade rules, open/non-filled warning behavior, and storage boundaries were not changed.

## Live Data Normalization Testing Foundation Findings - 2026-05-04

### Fear & Greed Coverage

- `src/lib/fearGreedNormalization.test.ts` covers CMC response normalization into the dashboard `FearGreedSnapshot`, newest/oldest payload sorting, malformed reading skipping, numeric string support, current 0..100 clamping behavior, fallback classification derivation, nearest last-week/last-month selection, high/low derivation, short history behavior, and empty/malformed safe null results.

### Market Quote Coverage

- `src/lib/fmpQuoteNormalization.test.ts` covers FMP payload parsing, valid quote mapping, numeric string parsing, `changesPercentage` and `changePercentage`, missing optional volume/timestamp fields, missing/invalid price errors, unavailable fallback quote creation, and `isUsableMarketQuote`.
- `src/lib/twelveQuoteNormalization.test.ts` covers Twelve Data payload parsing, valid quote mapping, numeric string parsing, `percent_change` and `percentChange`, missing optional volume/timestamp fields, passed-through labels for `XAU/USD`, `CAD/USD`, and `BTC/USD`, provider error payloads, and missing/invalid close price errors.

### Runtime Validator Coverage

- `src/lib/marketQuoteStorage.test.ts` covers the pure `isMarketQuotesFetchResult` validator for valid mixed-provider payloads, missing quote maps, quote arrays, invalid statuses, invalid numeric fields, invalid providers, invalid source labels, and invalid `updatedAt`.

### Fixes Found During Test Setup

- Patched `isMarketQuotesFetchResult` so `quotes` arrays are rejected. The app route contract is a symbol-keyed quote map, and accepting arrays would allow malformed successful route payloads into the browser stale cache.

### Remaining Untested Areas

- API route fallback behavior, server cache behavior, provider fetch failure branches, browser localStorage save/load paths, and component hydration behavior remain outside this pure-normalization test pass.

## API Route Fallback Testing Foundation Findings - 2026-05-04

### Fear & Greed Route Coverage

- Added `src/app/api/fear-greed/route.test.ts` for direct `GET` handler coverage.
- Tests cover missing `CMC_API_KEY` with no cache, successful CMC response normalization, stale server-cache fallback after provider failure, CMC rate-limit status handling, and invalid CMC payload handling.
- The stale-cache test forces module cache expiry with fake timers so it exercises the fallback branch instead of fresh-cache short-circuit behavior.

### Market Quote Route Coverage

- Added `src/app/api/market-quotes/route.test.ts` for direct `GET` handler coverage.
- Tests cover missing `FMP_API_KEY` and `TWELVE_DATA_API_KEY`, mixed provider success, symbol-keyed quote-map shape, SPX fallback from FMP `ESUSD` to FMP `^GSPC`, XAU fallback from Twelve Data `XAU/USD` to FMP `GCUSD`, stale server-cache fallback after total provider failure, and partial provider failure.
- The market stale-cache test advances past the active-hours TTL and confirms previously live rows return as `cached` while static `WTI` and `DXY` rows remain `unavailable`.

### Isolation And Provider Safety

- Tests use `vi.resetModules()` before fresh route imports to prevent module-level in-memory caches from leaking across unrelated cases.
- Tests set only the needed provider environment variables and restore previous `process.env` values after each case.
- `global.fetch` is mocked for every provider path; no CoinMarketCap, Financial Modeling Prep, or Twelve Data network requests are made.

### Fixes And Remaining Gaps

- No production route behavior bugs were found during this slice, so no route code changes were needed.
- At this checkpoint, remaining live-data test gaps were browser localStorage save/load paths and component hydration behavior.

## Browser Storage Testing Foundation Findings - 2026-05-04

### Test Environment Strategy

- Added `src/test/localStorageMock.ts` as a minimal in-memory `Storage` implementation for Node-based Vitest tests.
- The suite continues to use the existing Node Vitest environment; no jsdom dependency or config change was added.
- Storage-unavailable behavior is tested by removing the mocked `window`, matching the helpers' existing `canUseLocalStorage` guard behavior.

### Live Data Browser Cache Coverage

- `src/lib/fearGreedStorage.test.ts` covers `market-command:fear-greed-cache` save/load, missing key, malformed JSON, invalid snapshot shape, clearing, and unavailable localStorage guards.
- `src/lib/marketQuoteStorage.test.ts` now also covers `market-command:market-quotes-cache` save/load, missing key, malformed JSON, invalid route payload shape, symbol-keyed quote-map enforcement, unsupported status rejection, clearing, and unavailable localStorage guards.

### Daily Snapshot Storage Coverage

- `src/lib/dailySnapshotStorage.test.ts` covers `market-command:daily-snapshot:${date}` save/load, storage key format, malformed JSON fallback, trading-date mismatch rejection, date listing from matching snapshot keys only, and unavailable localStorage guards.
- The daily snapshot storage tests also verify that loaded legacy Gamma snapshots with `levels[]` normalize into named `majorPositiveGamma`, `majorNegativeGamma`, and `zeroGamma` fields.

### Performance Source Storage Coverage

- `src/lib/accountEquityStorage.test.ts` covers `market-command:account-equity-history` and `market-command:account-equity-history:import-summary` save/load behavior, malformed JSON handling, summary validation, clearing both keys, unavailable localStorage guards, and old `percentChange` record migration to `cumulativeReturnPercent`.
- `src/lib/exchangeTradeLedgerStorage.test.ts` covers `market-command:exchange-trade-ledger` and `market-command:exchange-trade-ledger:import-summary` save/load behavior, malformed JSON handling, invalid record rejection, summary validation, clearing both keys, and unavailable localStorage guards.

### Fixes And Remaining Gaps

- No production storage behavior bugs were found during this slice, so no storage code changes were needed.
- The remaining documented test gap is component hydration behavior for live-data modules.
