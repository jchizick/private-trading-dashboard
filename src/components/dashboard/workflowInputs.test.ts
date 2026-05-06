/**
 * @vitest-environment jsdom
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DailySnapshotProvider
} from "@/components/dashboard/DailySnapshotProvider";
import { PerformanceModule } from "@/components/dashboard/PerformanceModule";
import { TradingContextModule } from "@/components/dashboard/TradingContextModule";
import { dashboardData } from "@/data/mockDashboardData";
import { getDailySnapshotStorageKey } from "@/lib/dailySnapshotStorage";
import { createLocalStorageMock, type LocalStorageMock } from "@/test/localStorageMock";
import type { DailyDashboardSnapshot } from "@/types/dailySnapshot";

const ACCOUNT_EQUITY_HISTORY_STORAGE_KEY = "market-command:account-equity-history";
const EXCHANGE_TRADE_LEDGER_STORAGE_KEY = "market-command:exchange-trade-ledger";
const may4Now = "2026-05-04T14:30:00.000Z";

function setupLocalStorage(initialStore: Record<string, string> = {}) {
  const localStorage = createLocalStorageMock(initialStore);

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: localStorage
  });

  return localStorage;
}

function WorkflowHarness() {
  return React.createElement(
    DailySnapshotProvider,
    null,
    React.createElement(TradingContextModule, { context: dashboardData.tradingContext }),
    React.createElement(PerformanceModule, { performance: dashboardData.performance })
  );
}

async function renderHarness(container: HTMLElement) {
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(WorkflowHarness));
  });
  await act(async () => {
    await Promise.resolve();
  });

  return root;
}

function clickButton(container: HTMLElement, label: string, scopeSelector?: string) {
  const scope = scopeSelector ? container.querySelector(scopeSelector) : container;
  const button = Array.from(scope?.querySelectorAll("button") ?? [])
    .find((candidate) => candidate.textContent === label);

  if (!button) {
    throw new Error(`Button not found: ${label}`);
  }

  button.click();
}

function getSavedSnapshot(localStorage: LocalStorageMock, tradingDate: string) {
  return JSON.parse(localStorage.getItem(getDailySnapshotStorageKey(tradingDate)) ?? "{}") as DailyDashboardSnapshot;
}

function setFieldValue(field: HTMLInputElement | HTMLSelectElement, value: string) {
  const prototype = field instanceof HTMLInputElement
    ? HTMLInputElement.prototype
    : HTMLSelectElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

  valueSetter?.call(field, value);
  field.dispatchEvent(new Event(field instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
}

async function switchDate(container: HTMLElement, tradingDate: string) {
  const input = container.querySelector<HTMLInputElement>("input[aria-label='Active trading date']");

  if (!input) {
    throw new Error("Active trading date input not found.");
  }

  await act(async () => {
    setFieldValue(input, tradingDate);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

describe("manual workflow inputs", () => {
  let localStorage: LocalStorageMock;
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    vi.setSystemTime(new Date(may4Now));
    container = document.createElement("div");
    document.body.replaceChildren(container);
    localStorage = setupLocalStorage({
      [ACCOUNT_EQUITY_HISTORY_STORAGE_KEY]: JSON.stringify([{ id: "imported-equity" }]),
      [EXCHANGE_TRADE_LEDGER_STORAGE_KEY]: JSON.stringify([{ id: "imported-ledger" }])
    });
    root = null;
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }

    vi.useRealTimers();
    document.body.replaceChildren();
    localStorage.clear();
  });

  it("saves, cancels, and date-isolates market bias selections", async () => {
    root = await renderHarness(container);

    await act(async () => {
      clickButton(container, "Edit", ".synthesisActions");
    });

    const biasSelect = container.querySelector<HTMLSelectElement>(".synthesisField--bias select");

    expect(biasSelect).not.toBeNull();

    await act(async () => {
      setFieldValue(biasSelect!, "Bearish");
    });
    await act(async () => {
      clickButton(container, "Cancel", ".synthesisActions");
    });

    expect(localStorage.getItem(getDailySnapshotStorageKey("2026-05-04"))).toBeNull();
    expect(container.textContent).toContain("Long Selective");

    await act(async () => {
      clickButton(container, "Edit", ".synthesisActions");
    });
    await act(async () => {
      const select = container.querySelector<HTMLSelectElement>(".synthesisField--bias select");
      setFieldValue(select!, "Bearish");
    });
    await act(async () => {
      clickButton(container, "Save", ".synthesisActions");
    });

    expect(getSavedSnapshot(localStorage, "2026-05-04").synthesis.marketBias).toBe("Bearish");

    await switchDate(container, "2026-05-05");

    expect(container.textContent).toContain("Long Selective");

    await act(async () => {
      clickButton(container, "Edit", ".synthesisActions");
    });
    await act(async () => {
      const select = container.querySelector<HTMLSelectElement>(".synthesisField--bias select");
      setFieldValue(select!, "Neutral");
    });
    await act(async () => {
      clickButton(container, "Save", ".synthesisActions");
    });

    expect(getSavedSnapshot(localStorage, "2026-05-05").synthesis.marketBias).toBe("Neutral");

    await switchDate(container, "2026-05-04");

    expect(container.textContent).toContain("Bearish");
    expect(getSavedSnapshot(localStorage, "2026-05-05").synthesis.marketBias).toBe("Neutral");
  });

  it("saves, loads, clears, and date-isolates current position without touching imported source storage", async () => {
    const importedEquityBefore = localStorage.getItem(ACCOUNT_EQUITY_HISTORY_STORAGE_KEY);
    const importedLedgerBefore = localStorage.getItem(EXCHANGE_TRADE_LEDGER_STORAGE_KEY);

    root = await renderHarness(container);

    expect(container.textContent).toContain("Current Position: none logged");

    await act(async () => {
      clickButton(container, "Edit", ".currentPositionPanel");
    });

    const fields = Array.from(container.querySelectorAll<HTMLInputElement>(".currentPositionEditor input"));
    const sideSelect = container.querySelector<HTMLSelectElement>(".currentPositionEditor select");

    await act(async () => {
      setFieldValue(fields[0], "SOL");
      setFieldValue(fields[1], "10");
      setFieldValue(fields[2], "158.64");
      setFieldValue(fields[3], "Runner at resistance.");
      setFieldValue(sideSelect!, "Long");
    });
    await act(async () => {
      clickButton(container, "Save", ".currentPositionPanel");
    });

    const may4 = getSavedSnapshot(localStorage, "2026-05-04");

    expect(may4.currentPosition).toMatchObject({
      symbol: "SOL",
      side: "Long",
      leverage: "10x",
      pnlPercent: 158.64,
      note: "Runner at resistance."
    });
    expect(container.textContent).toContain("SOL / LONG 10x / +158.64% PnL");
    expect(localStorage.getItem(ACCOUNT_EQUITY_HISTORY_STORAGE_KEY)).toBe(importedEquityBefore);
    expect(localStorage.getItem(EXCHANGE_TRADE_LEDGER_STORAGE_KEY)).toBe(importedLedgerBefore);

    await switchDate(container, "2026-05-05");

    expect(container.textContent).toContain("Current Position: none logged");

    await switchDate(container, "2026-05-04");

    expect(container.textContent).toContain("SOL / LONG 10x / +158.64% PnL");

    await act(async () => {
      clickButton(container, "Edit", ".currentPositionPanel");
    });
    await act(async () => {
      clickButton(container, "Clear", ".currentPositionPanel");
    });

    expect(getSavedSnapshot(localStorage, "2026-05-04").currentPosition).toBeNull();
    expect(container.textContent).toContain("Current Position: none logged");
  });
});
