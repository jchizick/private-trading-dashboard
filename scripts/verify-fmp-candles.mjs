import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const FMP_CANDLE_ENDPOINT = "https://financialmodelingprep.com/stable/historical-chart/30min";
const DEFAULT_SYMBOLS_TO_VERIFY = Array.from(new Set(["ESUSD", "^GSPC"]));
const DEFAULT_LOOKBACK_DAYS = 7;

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

function getTorontoDate(offsetDays = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getDateRange() {
  return {
    from: process.env.FMP_CANDLE_FROM?.trim() || getTorontoDate(-DEFAULT_LOOKBACK_DAYS),
    to: process.env.FMP_CANDLE_TO?.trim() || getTorontoDate()
  };
}

function formatValue(value) {
  return value === null || value === undefined || value === "" ? "N/A" : String(value);
}

function parseCandlePayload(payload) {
  if (Array.isArray(payload)) {
    return payload.filter((row) => row && typeof row === "object");
  }

  return [];
}

function getProviderError(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  return payload.message ?? payload.error ?? payload["Error Message"] ?? JSON.stringify(payload).slice(0, 240);
}

function getRowOrder(rows) {
  if (rows.length < 2) {
    return "not enough rows";
  }

  const firstDate = String(rows[0].date ?? "");
  const secondDate = String(rows[1].date ?? "");

  if (!firstDate || !secondDate || firstDate === secondDate) {
    return "unknown";
  }

  return firstDate > secondDate ? "newest-first" : "oldest-first";
}

async function verifySymbol({ symbol, apiKey, from, to }) {
  const url = new URL(FMP_CANDLE_ENDPOINT);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  url.searchParams.set("apikey", apiKey);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });
    const responseText = await response.text();
    let payload = null;
    let parsedJson = true;

    try {
      payload = responseText ? JSON.parse(responseText) : null;
    } catch {
      parsedJson = false;
      payload = null;
    }

    const rows = parseCandlePayload(payload);
    const providerError = getProviderError(payload) ??
      (!parsedJson && responseText ? responseText.slice(0, 240) : null);

    return {
      symbol,
      ok: response.ok && rows.length > 0,
      httpStatus: `${response.status} ${response.statusText}`,
      providerSymbol: symbol,
      rowCount: rows.length,
      firstRow: rows[0] ?? null,
      lastRow: rows.at(-1) ?? null,
      latestRow: getRowOrder(rows) === "oldest-first" ? rows.at(-1) ?? null : rows[0] ?? null,
      rowOrder: getRowOrder(rows),
      providerError,
      planRestricted: response.status === 402 || /payment required|plan|subscription|premium/i.test(providerError ?? "")
    };
  } catch (error) {
    return {
      symbol,
      ok: false,
      httpStatus: "request_failed",
      providerSymbol: symbol,
      rowCount: 0,
      firstRow: null,
      lastRow: null,
      latestRow: null,
      rowOrder: "unknown",
      providerError: error instanceof Error ? error.message : "unknown_fetch_error",
      planRestricted: false
    };
  }
}

function printCandle(label, row) {
  console.log(`  ${label} Date: ${formatValue(row?.date)}`);
  console.log(`  ${label} Open: ${formatValue(row?.open)}`);
  console.log(`  ${label} High: ${formatValue(row?.high)}`);
  console.log(`  ${label} Low: ${formatValue(row?.low)}`);
  console.log(`  ${label} Close: ${formatValue(row?.close)}`);
  console.log(`  ${label} Volume: ${formatValue(row?.volume)}`);
}

function printResult(result) {
  console.log(`\n${result.symbol}`);
  console.log(`  Provider Symbol: ${result.providerSymbol}`);
  console.log(`  Status: ${result.ok ? "OK" : "ERROR"}`);
  console.log(`  HTTP Status: ${result.httpStatus}`);
  console.log(`  Candle Rows: ${result.rowCount}`);
  console.log(`  First Row Date: ${formatValue(result.firstRow?.date)}`);
  console.log(`  Last Row Date: ${formatValue(result.lastRow?.date)}`);
  console.log(`  Row Order: ${result.rowOrder}`);
  console.log(`  Plan Restricted: ${result.planRestricted ? "yes" : "no"}`);

  if (result.providerError) {
    console.log(`  Provider Error: ${result.providerError}`);
  }

  printCandle("Latest Row", result.latestRow);
}

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  const localEnv = readEnvFile(envPath);
  const apiKey = process.env.FMP_API_KEY || localEnv.FMP_API_KEY || "";

  if (!apiKey.trim()) {
    console.log("FMP_API_KEY is missing or blank.");
    console.log("Add your Financial Modeling Prep key to .env.local as FMP_API_KEY=...");
    console.log("No candle requests were sent.");
    return;
  }

  const { from, to } = getDateRange();
  const symbolsToVerify = getSymbolsToVerify();

  console.log("FMP 30-minute candle verification");
  console.log("Read-only terminal output only. No candle data will be written to files, caches, or localStorage.");
  console.log(`Endpoint: ${FMP_CANDLE_ENDPOINT}`);
  console.log(`Range: ${from} to ${to}`);
  console.log(`Symbols: ${symbolsToVerify.join(", ")}`);

  const results = [];

  for (const symbol of symbolsToVerify) {
    const result = await verifySymbol({
      symbol,
      apiKey: apiKey.trim(),
      from,
      to
    });
    results.push(result);
  }

  for (const result of results) {
    printResult(result);
  }
}

main().catch((error) => {
  console.error("Unexpected verifier failure.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
