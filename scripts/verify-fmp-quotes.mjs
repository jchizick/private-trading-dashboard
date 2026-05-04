import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const FMP_QUOTE_ENDPOINT = "https://financialmodelingprep.com/stable/quote";
const DEFAULT_SYMBOLS_TO_VERIFY = Array.from(
  new Set(["^GSPC", "ESUSD", "GCUSD", "CLUSD", "DXUSD", "CADUSD", "BTCUSD"])
);

function getSymbolsToVerify() {
  const cliSymbols = process.argv.slice(2).map((symbol) => symbol.trim()).filter(Boolean);

  return Array.from(new Set(cliSymbols.length > 0 ? cliSymbols : DEFAULT_SYMBOLS_TO_VERIFY));
}

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

function formatAsOf(timestamp) {
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
    return "N/A";
  }

  const milliseconds = timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1000;
  const date = new Date(milliseconds);

  return Number.isNaN(date.getTime()) ? "N/A" : date.toISOString();
}

function formatValue(value) {
  return value === null || value === undefined || value === "" ? "N/A" : String(value);
}

function normalizeQuotePayload(payload) {
  if (Array.isArray(payload)) {
    return payload[0] ?? null;
  }

  if (payload && typeof payload === "object") {
    return payload;
  }

  return null;
}

async function verifySymbol(symbol, apiKey) {
  const url = new URL(FMP_QUOTE_ENDPOINT);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("apikey", apiKey);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();

      return {
        symbol,
        ok: false,
        error: `HTTP ${response.status} ${response.statusText}`,
        detail: errorBody.slice(0, 240)
      };
    }

    const payload = await response.json();
    const quote = normalizeQuotePayload(payload);

    if (!quote || Object.keys(quote).length === 0) {
      return {
        symbol,
        ok: false,
        error: "empty_quote_payload"
      };
    }

    return {
      symbol,
      ok: true,
      providerSymbol: quote.symbol ?? symbol,
      name: quote.name ?? null,
      price: quote.price ?? null,
      change: quote.change ?? null,
      changePercent: quote.changePercentage ?? quote.changesPercentage ?? null,
      volume: quote.volume ?? null,
      timestamp: quote.timestamp ?? null,
      asOf: formatAsOf(quote.timestamp)
    };
  } catch (error) {
    return {
      symbol,
      ok: false,
      error: error instanceof Error ? error.message : "unknown_fetch_error"
    };
  }
}

function printResult(result) {
  console.log(`\n${result.symbol}`);

  if (!result.ok) {
    console.log("  Status: ERROR");
    console.log(`  Error: ${result.error}`);

    if (result.detail) {
      console.log(`  Detail: ${result.detail}`);
    }

    return;
  }

  console.log("  Status: OK");
  console.log(`  Provider Symbol: ${formatValue(result.providerSymbol)}`);
  console.log(`  Name: ${formatValue(result.name)}`);
  console.log(`  Price: ${formatValue(result.price)}`);
  console.log(`  Change: ${formatValue(result.change)}`);
  console.log(`  Change %: ${formatValue(result.changePercent)}`);
  console.log(`  Volume: ${formatValue(result.volume)}`);
  console.log(`  Timestamp: ${formatValue(result.timestamp)}`);
  console.log(`  As Of: ${formatValue(result.asOf)}`);
}

function printResults(results) {
  const printedSymbols = new Set();

  for (const result of results) {
    if (printedSymbols.has(result.symbol)) {
      continue;
    }

    printedSymbols.add(result.symbol);
    printResult(result);
  }
}

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  const localEnv = readEnvFile(envPath);
  const apiKey = process.env.FMP_API_KEY || localEnv.FMP_API_KEY || "";

  if (!apiKey.trim()) {
    console.log("FMP_API_KEY is missing or blank.");
    console.log("Add your Financial Modeling Prep key to .env.local as FMP_API_KEY=...");
    console.log("No quote requests were sent.");
    return;
  }

  console.log("FMP quote verification");
  console.log("Read-only terminal output only. No quote data will be written to files, caches, or localStorage.");
  const symbolsToVerify = getSymbolsToVerify();

  console.log(`Symbols: ${symbolsToVerify.join(", ")}`);

  const results = [];

  for (const symbol of symbolsToVerify) {
    const result = await verifySymbol(symbol, apiKey.trim());
    results.push(result);
  }

  printResults(results);
}

main().catch((error) => {
  console.error("Unexpected verifier failure.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
