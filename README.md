# Market Command

Market Command is a private Next.js trading dashboard for a local daily command workflow. It combines local daily notes/checklists, CSV-based performance review, manual gamma context, and server-side live data proxies for sentiment and market quotes.

For the full operating handoff, see [docs/mvp_handoff.md](docs/mvp_handoff.md).

## Local Setup

Install dependencies:

```powershell
npm install
```

Create a local env file:

```powershell
Copy-Item .env.example .env.local
```

Fill any available provider keys in `.env.local`, then start the app:

```powershell
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

`.env.example` lists the supported keys:

```text
CMC_API_KEY=your_coinmarketcap_api_key_here
FMP_API_KEY=your_financial_modeling_prep_api_key_here
TWELVE_DATA_API_KEY=your_twelve_data_api_key_here
```

Provider keys must stay server-side. Client components call only internal routes such as `/api/fear-greed` and `/api/market-quotes`; they must not call external providers or read provider keys directly.

## Commands

```powershell
npm run dev
npm run test
npm run typecheck
npm run build
npm run verify
```

Use `npm run verify` before handoff or deployment. It runs tests, TypeScript checking, and the production build.

## Architecture Boundaries

- `DailyDashboardSnapshot` is the local daily command state center.
- Account equity history stays separate from daily snapshots.
- Exchange trade ledger records stay separate from account equity history and daily snapshots.
- Fear & Greed live/cache data stays separate from daily snapshots.
- Market quote live/cache data stays separate from daily snapshots.
- Provider API keys are read only by server-side route handlers.

## Deployment Notes

Vercel is the assumed deployment target. Add `CMC_API_KEY`, `FMP_API_KEY`, and `TWELVE_DATA_API_KEY` in Vercel Project Settings for the environments you use, including Production and Preview. Redeploy after changing env vars.

The current server memory caches are best-effort only and are not durable deployment storage. Browser localStorage remains the only persistence layer for the private MVP.

## Private MVP Limitations

- No authentication.
- No Supabase or durable multi-device persistence.
- No Google Sheets sync.
- No exchange API integration.
- No XLSX import.
- No Gamma screenshot upload, OCR, or X/Twitter automation.
- No websocket or candle/chart feed.
- No explicit daily market snapshot capture.

Before exposing the app on the public internet, enable Vercel Deployment Protection or add a simple auth layer.
