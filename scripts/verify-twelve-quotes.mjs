import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const TWELVE_QUOTE_ENDPOINT = "https://api.twelvedata.com/quote";
const TWELVE_SYMBOL_SEARCH_ENDPOINT = "https://api.twelvedata.com/symbol_search";
const QUOTE_SYMBOLS_TO_VERIFY = Array.from(
  new Set(["WTI/USD", "DXY", "CAD/USD", "XAU/USD", "BTC/USD"])
);
const SEARCH_SYMBOLS_TO_VERIFY = Array.from(
  new Set(["WTI", "DXY", "CAD/USD", "XAU/USD", "BTC/USD"])
);

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const entries = {};
  const contents = fs.readFileSync(filePath, "utf8");

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

function formatValue(value) {
  return value === null || value === undefined || value === "" ? "N/A" : String(value);
}

function formatAsOf(timestamp) {
  if (timestamp === null || timestamp === undefined || timestamp === "") {
    return "N/A";
  }

  const numericTimestamp = typeof timestamp === "number" ? timestamp : Number(timestamp);

  if (!Number.isFinite(numericTimestamp)) {
    return "N/A";
  }

  const milliseconds = numericTimestamp > 1_000_000_000_000
    ? numericTimestamp
    : numericTimestamp * 1000;
  const date = new Date(milliseconds);

  return Number.isNaN(date.getTime()) ? "N/A" : date.toISOString();
}

function getProviderMessage(payload) {
  if (!payload || typeof payload !== "object") {
    return "N/A";
  }

  return payload.message ?? payload.status ?? "N/A";
}

async function fetchJson(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });
  const text = await response.text();

  try {
    return {
      httpOk: response.ok,
      httpStatus: response.status,
      payload: text ? JSON.parse(text) : null,
      rawText: text
    };
  } catch {
    return {
      httpOk: response.ok,
      httpStatus: response.status,
      payload: null,
      rawText: text
    };
  }
}

async function verifyQuote(symbol, apiKey) {
  const url = new URL(TWELVE_QUOTE_ENDPOINT);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("apikey", apiKey);

  try {
    const result = await fetchJson(url);
    const payload = result.payload;

    if (!result.httpOk || !payload || payload.status === "error" || payload.code) {
      return {
        symbol,
        ok: false,
        httpStatus: result.httpStatus,
        error: getProviderMessage(payload),
        detail: result.rawText.slice(0, 240)
      };
    }

    return {
      symbol,
      ok: true,
      httpStatus: result.httpStatus,
      providerSymbol: payload.symbol ?? symbol,
      name: payload.name ?? null,
      exchange: payload.exchange ?? null,
      price: payload.close ?? null,
      change: payload.change ?? null,
      changePercent: payload.percent_change ?? payload.percentChange ?? null,
      volume: payload.volume ?? null,
      timestamp: payload.timestamp ?? null,
      datetime: payload.datetime ?? null,
      asOf: formatAsOf(payload.timestamp),
      providerStatus: payload.status ?? "ok",
      providerMessage: getProviderMessage(payload)
    };
  } catch (error) {
    return {
      symbol,
      ok: false,
      error: error instanceof Error ? error.message : "unknown_fetch_error"
    };
  }
}

async function verifySymbolSearch(symbol, apiKey) {
  const url = new URL(TWELVE_SYMBOL_SEARCH_ENDPOINT);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("apikey", apiKey);

  try {
    const result = await fetchJson(url);
    const payload = result.payload;

    if (!result.httpOk || !payload || payload.status === "error" || payload.code) {
      return {
        symbol,
        ok: false,
        httpStatus: result.httpStatus,
        error: getProviderMessage(payload),
        detail: result.rawText.slice(0, 240)
      };
    }

    const data = Array.isArray(payload.data) ? payload.data : [];

    return {
      symbol,
      ok: true,
      httpStatus: result.httpStatus,
      matches: data.slice(0, 5).map((item) => ({
        symbol: item.symbol ?? null,
        instrumentName: item.instrument_name ?? null,
        exchange: item.exchange ?? null,
        micCode: item.mic_code ?? null,
        country: item.country ?? null
      }))
    };
  } catch (error) {
    return {
      symbol,
      ok: false,
      error: error instanceof Error ? error.message : "unknown_fetch_error"
    };
  }
}

function printQuoteResult(result) {
  console.log(`\nQuote: ${result.symbol}`);

  if (!result.ok) {
    console.log("  Status: ERROR");
    console.log(`  HTTP Status: ${formatValue(result.httpStatus)}`);
    console.log(`  Provider Message: ${formatValue(result.error)}`);

    if (result.detail) {
      console.log(`  Detail: ${result.detail}`);
    }

    return;
  }

  console.log("  Status: OK");
  console.log(`  HTTP Status: ${formatValue(result.httpStatus)}`);
  console.log(`  Provider Symbol: ${formatValue(result.providerSymbol)}`);
  console.log(`  Name: ${formatValue(result.name)}`);
  console.log(`  Exchange: ${formatValue(result.exchange)}`);
  console.log(`  Price: ${formatValue(result.price)}`);
  console.log(`  Change: ${formatValue(result.change)}`);
  console.log(`  Change %: ${formatValue(result.changePercent)}`);
  console.log(`  Volume: ${formatValue(result.volume)}`);
  console.log(`  Timestamp: ${formatValue(result.timestamp)}`);
  console.log(`  Datetime: ${formatValue(result.datetime)}`);
  console.log(`  As Of: ${formatValue(result.asOf)}`);
  console.log(`  Provider Status: ${formatValue(result.providerStatus)}`);
  console.log(`  Provider Message: ${formatValue(result.providerMessage)}`);
}

function printSearchResult(result) {
  console.log(`\nSearch: ${result.symbol}`);

  if (!result.ok) {
    console.log("  Status: ERROR");
    console.log(`  HTTP Status: ${formatValue(result.httpStatus)}`);
    console.log(`  Provider Message: ${formatValue(result.error)}`);

    if (result.detail) {
      console.log(`  Detail: ${result.detail}`);
    }

    return;
  }

  console.log("  Status: OK");
  console.log(`  HTTP Status: ${formatValue(result.httpStatus)}`);

  if (result.matches.length === 0) {
    console.log("  Matches: none");
    return;
  }

  for (const [index, match] of result.matches.entries()) {
    console.log(
      `  Match ${index + 1}: ${formatValue(match.symbol)} | ${formatValue(match.instrumentName)} | ${formatValue(match.exchange)} | ${formatValue(match.micCode)} | ${formatValue(match.country)}`
    );
  }
}

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  const localEnv = readEnvFile(envPath);
  const apiKey = process.env.TWELVE_DATA_API_KEY || localEnv.TWELVE_DATA_API_KEY || "";

  if (!apiKey.trim()) {
    console.log("TWELVE_DATA_API_KEY is missing or blank.");
    console.log("Add your Twelve Data key to .env.local as TWELVE_DATA_API_KEY=...");
    console.log("No quote or symbol-search requests were sent.");
    return;
  }

  console.log("Twelve Data quote verification");
  console.log("Read-only terminal output only. No quote data will be written to files, caches, localStorage, or daily snapshots.");
  console.log(`Quote symbols: ${QUOTE_SYMBOLS_TO_VERIFY.join(", ")}`);
  console.log(`Search symbols: ${SEARCH_SYMBOLS_TO_VERIFY.join(", ")}`);

  for (const symbol of QUOTE_SYMBOLS_TO_VERIFY) {
    printQuoteResult(await verifyQuote(symbol, apiKey.trim()));
  }

  for (const symbol of SEARCH_SYMBOLS_TO_VERIFY) {
    printSearchResult(await verifySymbolSearch(symbol, apiKey.trim()));
  }
}

main().catch((error) => {
  console.error("Unexpected Twelve Data verifier failure.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
