# Market Command MVP Handoff
Location: docs/mvp_handoff.md
## Current MVP Summary

Market Command is a local/live private trading dashboard built with Next.js App Router, React, and TypeScript. The current MVP combines local daily command-state persistence, manual workflow controls, CSV-based performance inputs, and server-side live data proxies.

Currently working:

- Daily snapshot localStorage persistence by trading date.
- Daily snapshot date switching and archive access.
- Editable Synthesis Notes.
- Toggleable Trading Checklist statuses.
- Editable Gamma Snapshot fields.
- Performance Review account equity CSV import.
- Performance Review exchange trade ledger CSV import.
- Derived account equity and closed-trade metrics.
- CoinMarketCap Fear & Greed API integration through `/api/fear-greed`.
- FMP and Twelve Data market quote integration through `/api/market-quotes`.

Important architecture boundaries:

- `src/types/dashboard.ts` is the frontend view-model layer by default.
- `DailyDashboardSnapshot` is the persistence center for daily command reads.
- Account equity imports stay separate from daily snapshots.
- Exchange trade ledger imports stay separate from account equity history and daily snapshots.
- Fear & Greed live/cache data stays separate from daily snapshots until the explicit capture action is clicked.
- Market quote live/cache data stays separate from daily snapshots until the explicit capture action is clicked.
- Provider API keys stay server-side.

## Local Setup

Install dependencies:

```powershell
npm install
```

Create a local environment file:

```powershell
Copy-Item .env.example .env.local
```

Fill any available API keys in `.env.local`, then start the development server:

```powershell
npm run dev
```

Open the local app at:

```text
http://localhost:3000
```

Run production build verification:

```powershell
npm run build
```

Run automated tests:

```powershell
npm run test
```

Run TypeScript checking:

```powershell
npm run typecheck
```

Run the full local verification sequence:

```powershell
npm run verify
```

## Environment Variables

`.env.example` contains placeholders for:

```text
CMC_API_KEY=your_coinmarketcap_api_key_here
FMP_API_KEY=your_financial_modeling_prep_api_key_here
TWELVE_DATA_API_KEY=your_twelve_data_api_key_here
DASHBOARD_PASSWORD=
```

Rules:

- Keep `.env.local` local and do not commit it.
- `CMC_API_KEY` is read only by `/api/fear-greed`.
- `FMP_API_KEY` is read only by `/api/market-quotes`.
- `TWELVE_DATA_API_KEY` is read only by `/api/market-quotes`.
- `DASHBOARD_PASSWORD` powers the app-level password gate and must stay server-side.
- Client components call internal app routes only; they do not call external providers directly.

## Deployment Notes

The assumed deployment target is Vercel.

Before deploying:

- Add `CMC_API_KEY`, `FMP_API_KEY`, `TWELVE_DATA_API_KEY`, and `DASHBOARD_PASSWORD` in Vercel Project Settings.
- Set the keys for every environment you plan to use, including Production and Preview.
- Redeploy after changing environment variables; existing deployments do not automatically receive changed values.
- Keep provider keys server-side only. Do not create `NEXT_PUBLIC_` provider keys.
- Run `npm run verify` locally before deployment.

Current deployment status:

- Production deployment is live on Vercel.
- Vercel Standard Protection is enabled where available on the Hobby plan.
- App-level password protection is active in production.
- Anonymous production access is blocked and redirects to `/login`.

Security:

- App-level password protection is enabled via `DASHBOARD_PASSWORD`.
- Auth uses the signed httpOnly cookie `trading_dashboard_auth`.
- Anonymous users are redirected to `/login` before accessing dashboard routes.
- Provider API keys remain server-side only and are stored in Vercel environment variables.
- Production password protection was verified after the Vercel redeploy.
- Supabase and external auth providers are intentionally deferred for a later phase.

Deployment limitations:

- Persistence is localStorage-only. Saved daily snapshots, imports, and browser caches are tied to the user's browser/device.
- Server memory caches for `/api/fear-greed` and `/api/market-quotes` are best-effort and not durable storage. They can reset when the server process or deployment runtime resets.

## Manual Daily Workflow

Use the dashboard as a daily command read:

1. Select or create the active trading date in Trading Context.
2. Review the live/mock market context, Fear & Greed, Gamma Context, and Performance Review.
3. Edit Synthesis Notes with the current bias, what matters today, conditions to watch, invalidation, and operator note.
4. Toggle Trading Checklist items as external tools are checked.
5. Around the 10:05 AM ET gamma check convention, edit Gamma Snapshot with Major Positive Gamma, Major Negative Gamma, Zero Gamma / Flip, status, and last checked time.
6. Save edits into the date-specific daily snapshot.

Date behavior:

- Daily snapshots are keyed by trading date.
- Switching dates loads that date's saved snapshot or creates a draft from the mock daily snapshot template.
- Saved snapshot dates are inferred from localStorage keys.
- Switching dates discards unsaved Synthesis Notes and Gamma edit drafts.

Gamma behavior:

- Gamma values persist inside `DailyDashboardSnapshot.gamma`.
- There is no separate Gamma storage key.
- Weekend drafts default to `market_closed`.
- Weekday drafts default to `pending` before 10:05 AM ET and `not_checked` after 10:05 AM ET when no manual gamma levels exist.

Market snapshot capture behavior:

- `Capture Market Snapshot` saves the currently displayed SPX/watchlist quote context and Fear & Greed read into the active date's `DailyDashboardSnapshot`.
- Live/cache route hydration does not write to daily snapshots by itself.
- Capturing again overwrites the active date's prior captured market and sentiment fields without a confirmation modal.
- Source and status labels are preserved exactly, so mock, cached, partial, and live reads remain distinguishable.

## Import Workflows

### Account Equity CSV

Use Performance Review's account equity import control for account-level equity history.

Required logical columns:

- `date`
- `equity`
- `cumulativeReturnPercent`

Accepted header aliases:

- Date: `date`
- Equity: `equity`
- Cumulative return: `cumulativeReturnPercent`, `totalReturnPercent`, `totalReturn`, `cumulativeReturn`
- Legacy sheet aliases accepted as cumulative return: `Percent Change`, `percentChange`, `% Change`, `pctChange`

Accepted values:

- Dates must be valid `YYYY-MM-DD`.
- Equity must be numeric and may include commas or a leading `$` when quoted if needed.
- Cumulative return percent may be numeric or end with `%`.
- The imported cumulative return column is stored for source context; Daily, Weekly, Monthly, and YTD return cards are derived from equity values.

Behavior:

- Rows are sorted by date after import.
- Duplicate dates block import.
- Out-of-order rows create a warning.
- Unexpected columns are ignored with warnings.
- Imported account equity history drives account-level Performance Review metrics.
- Daily return is calculated from latest equity versus the previous available equity row, not from the imported cumulative-return column.
- Clearing account equity removes only account equity history and its import summary.
- Clearing account equity does not remove exchange trade ledger data.

### Exchange Trade Ledger CSV

Use Performance Review's trade ledger import control for exchange closed-trade records.

Required logical columns:

- `futures`
- `time`
- `direction`
- `filledQuantity`
- `averageFilledPrice`
- `closingPnl`
- `fee`
- `status`

Common accepted header aliases:

- Futures: `Futures`, `Symbol`, `Market`, `Contract`, `Pair`
- Time: `Time`, `Datetime`, `Created Time`, `Filled Time`, `Executed At`
- Direction: `Direction`, `Side`, `Trade Direction`
- Filled quantity: `Filled Quantity`, `Filled Qty`, `Executed Quantity`, `Executed Qty`
- Average filled price: `Avg Filled Price`, `Average Filled Price`, `Avg Price`
- Closing PNL: `Closing PNL`, `Closed PNL`, `Realized PnL`
- Fee: `Fee`, `Trading Fee`, `Fees`
- Status: `Status`, `Order Status`

Optional accepted columns include margin mode, leverage, amount, and order price.

Accepted closed-trade rule:

- `Status = Filled`
- `Direction = Close Long` or `Close Short`

Ignored rows:

- `Open Long` and `Open Short` rows are ignored for closed-trade metrics.
- Non-filled rows are ignored for closed-trade metrics.

Expected value formats:

- Time must be `YYYY-MM-DD HH:mm:ss` and is interpreted as `America/Toronto`.
- Direction must be `Open Long`, `Open Short`, `Close Long`, or `Close Short`.
- Leverage may use values like `12X`.
- Quantities, closing PNL, and fees may include an asset suffix, such as `2.2 SOL` or `7.951 USDT`.
- `Order Price` may be `Market`.

Behavior:

- Accepted close rows produce trade count, win/loss/breakeven counts, win rate, gross closing PNL, fees, net realized PNL, average win/loss, profit factor, symbol breakdown, and direction breakdown.
- Net realized PNL uses `closingPnl - abs(fee)`.
- Exact duplicate close rows are skipped with warnings, are not imported, and are not counted in metrics.
- Clearing trade ledger removes only exchange trade ledger records and its import summary.
- Clearing trade ledger does not remove account equity history.

## Live Data Behavior

### Fear & Greed

Route:

- `/api/fear-greed`

Provider:

- CoinMarketCap Crypto Fear and Greed Index.

Cache and fallback:

- The route uses server-side `CMC_API_KEY`.
- Successful route data is cached in server memory and browser localStorage.
- Missing key, provider failure, or malformed payload falls back to stale cache when available.
- If no cache exists, the module keeps the initial mock data.
- Fear & Greed data is not written into daily snapshots automatically.
- `Capture Market Snapshot` saves the currently displayed value, classification, history fields, source timestamp, and captured timestamp into the active daily snapshot.

### Market Quotes

Route:

- `/api/market-quotes`

Providers:

- Financial Modeling Prep.
- Twelve Data.

Supported live symbol map:

- `SPX500`: FMP `ESUSD` primary, FMP `^GSPC` fallback.
- `XAUUSD`: Twelve Data `XAU/USD` primary, FMP `GCUSD` fallback.
- `VIX`: FMP `^VIX`.
- `EURUSD`: FMP `EURUSD`.
- `CADUSD`: Twelve Data `CAD/USD`.
- `BTCUSDT`: FMP `BTCUSD` primary, Twelve Data `BTC/USD` fallback.

Cache and fallback:

- The route uses server-side `FMP_API_KEY` and `TWELVE_DATA_API_KEY`.
- Server memory cache TTL is 5 minutes during weekday 9:30 AM to 4:00 PM America/Toronto market hours.
- Server memory cache TTL is 30 minutes outside those hours.
- Provider failures can fall back to stale server cache.
- Client hydration saves successful route results to browser localStorage.
- Route failure falls back to browser stale cache.
- If no browser cache exists, the module falls back to mock display data.
- Market quote data is not written into daily snapshots automatically.
- `Capture Market Snapshot` saves the currently displayed six-symbol watchlist, `SPX500` primary quote, quote source state, provider/source/status metadata, and captured timestamp into the active daily snapshot.

## Storage Key Map

localStorage keys:

- Daily snapshots: `market-command:daily-snapshot:${date}`
- Account equity history: `market-command:account-equity-history`
- Account equity import summary: `market-command:account-equity-history:import-summary`
- Exchange trade ledger: `market-command:exchange-trade-ledger`
- Exchange trade ledger import summary: `market-command:exchange-trade-ledger:import-summary`
- Fear & Greed browser cache: `market-command:fear-greed-cache`
- Market quotes browser cache: `market-command:market-quotes-cache`

Server memory caches:

- Fear & Greed route cache lives only in the running Next.js process.
- Market quotes route cache lives only in the running Next.js process.
- Server memory caches reset when the process or deployment runtime resets.

## Dependency And Audit Status

- Runtime package versions are pinned in `package.json` and `package-lock.json`.
- `jsdom` is pinned as a dev-only dependency for focused DashboardShell hydration tests.
- `npm audit --audit-level=moderate` currently reports 2 moderate PostCSS advisories through Next.
- Do not run `npm audit fix --force`; npm reports that the force path would install an unsafe/breaking Next downgrade.
- Revisit the audit through a compatible Next upgrade when a patched release path is available.

## Known Limitations

- No Supabase or durable multi-device persistence.
- Minimal app-level password authentication only; Supabase/Auth provider integration is deferred.
- Automated test coverage exists for account equity CSV import, equity return calculations, exchange trade ledger CSV import, trade ledger calculations, Fear & Greed normalization, FMP/Twelve quote normalization, market quote payload validation, API route fallback behavior, localStorage/cache helper behavior, integrated DashboardShell hydration behavior, and explicit market snapshot capture behavior.
- Broader component interaction tests and end-to-end smoke tests are still pending.
- No Google Sheets sync.
- No exchange API integration.
- No XLSX import.
- No Gamma screenshot upload, OCR, source URL workflow, or X/Twitter scraping.
- No websocket feed.
- No real candle/chart feed.
- Captured market snapshot display is still minimal; richer historical comparison views are deferred.

## Recommended Roadmap

1. Expand tests beyond import/calculation/normalization, route fallback, storage-helper, hydration, and capture coverage to focused interaction smoke tests and view-model adapters.
2. Add richer historical display for captured market/sentiment reads after the workflow proves useful.
3. Add Supabase persistence and application authentication.
4. Add Google Sheets sync for account equity history.
5. Add Gamma screenshot/source URL workflow after manual Gamma entry remains stable.
