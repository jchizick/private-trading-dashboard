/**
 * @vitest-environment jsdom
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DailySnapshotProvider } from "@/components/dashboard/DailySnapshotProvider";
import { TradingContextModule } from "@/components/dashboard/TradingContextModule";
import { dashboardData } from "@/data/mockDashboardData";
import { createDailySnapshotForDate } from "@/lib/dailySnapshotFactory";
import { getDailySnapshotStorageKey } from "@/lib/dailySnapshotStorage";
import { createLocalStorageMock, type LocalStorageMock } from "@/test/localStorageMock";
import type { DailyDashboardSnapshot, MarketNewsItem } from "@/types/dailySnapshot";

const may4Now = "2026-05-04T14:30:00.000Z";

function MarketNewsHarness() {
  return React.createElement(
    DailySnapshotProvider,
    null,
    React.createElement(TradingContextModule, { context: dashboardData.tradingContext })
  );
}

function setupLocalStorage(initialStore: Record<string, string> = {}) {
  const localStorage = createLocalStorageMock(initialStore);

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: localStorage
  });

  return localStorage;
}

async function renderHarness(container: HTMLElement) {
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(MarketNewsHarness));
  });
  await act(async () => {
    await Promise.resolve();
  });

  return root;
}

function getMarketNewsPanel(container: HTMLElement) {
  const panel = container.querySelector<HTMLElement>("section[aria-label='Market news']");

  if (!panel) {
    throw new Error("Market news panel not found.");
  }

  return panel;
}

function clickButton(container: HTMLElement, label: string, scopeSelector = "section[aria-label='Market news']") {
  const scope = container.querySelector(scopeSelector);
  const button = Array.from(scope?.querySelectorAll("button") ?? [])
    .find((candidate) => candidate.textContent === label);

  if (!button) {
    throw new Error(`Button not found: ${label}`);
  }

  button.click();
}

function setFieldValue(field: HTMLInputElement | HTMLSelectElement, value: string) {
  const prototype = field instanceof HTMLInputElement
    ? HTMLInputElement.prototype
    : HTMLSelectElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

  valueSetter?.call(field, value);
  field.dispatchEvent(new Event(field instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
}

function getSavedSnapshot(localStorage: LocalStorageMock, tradingDate: string) {
  return JSON.parse(localStorage.getItem(getDailySnapshotStorageKey(tradingDate)) ?? "{}") as DailyDashboardSnapshot;
}

function createSnapshotWithNews(tradingDate: string, marketNews: MarketNewsItem[]) {
  return {
    ...createDailySnapshotForDate(tradingDate),
    status: "saved" as const,
    marketNews
  };
}

describe("Trading Context market news module", () => {
  let localStorage: LocalStorageMock;
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    vi.setSystemTime(new Date(may4Now));
    container = document.createElement("div");
    document.body.replaceChildren(container);
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

  it("renders saved news items for the active dashboard date with category tags", async () => {
    const snapshot = createSnapshotWithNews("2026-05-04", [
      {
        id: "news-spx",
        date: "2026-05-04",
        headline: "SPX futures hold above overnight value.",
        source: "Market Desk",
        category: "equities",
        timestamp: "08:55 ET"
      },
      {
        id: "news-dollar",
        date: "2026-05-04",
        headline: "Dollar firms before US services data.",
        source: "Macro Wire",
        category: "fx"
      },
      {
        id: "news-other-date",
        date: "2026-05-05",
        headline: "Tomorrow headline should stay out of the active read.",
        source: "Tomorrow Desk",
        category: "macro"
      }
    ]);
    localStorage = setupLocalStorage({
      [getDailySnapshotStorageKey("2026-05-04")]: JSON.stringify(snapshot)
    });

    root = await renderHarness(container);

    const panel = getMarketNewsPanel(container);
    const tags = Array.from(panel.querySelectorAll(".newsFeed__item .statusBadge"))
      .map((tag) => tag.textContent);

    expect(panel.textContent).toContain("SPX futures hold above overnight value.");
    expect(panel.textContent).toContain("Market Desk / 08:55 ET");
    expect(panel.textContent).toContain("Dollar firms before US services data.");
    expect(panel.textContent).not.toContain("Tomorrow headline should stay out of the active read.");
    expect(tags).toEqual(["EQUITIES", "FX"]);
  });

  it("renders the empty state when no curated market news is saved", async () => {
    localStorage = setupLocalStorage();

    root = await renderHarness(container);

    const panel = getMarketNewsPanel(container);

    expect(panel.textContent).toContain("NO CURATED MARKET NEWS YET");
    expect(panel.querySelectorAll(".newsFeed__item")).toHaveLength(0);
  });

  it("adds, edits, saves, and persists a curated news item", async () => {
    localStorage = setupLocalStorage();
    root = await renderHarness(container);

    await act(async () => {
      clickButton(container, "Edit");
    });
    await act(async () => {
      clickButton(container, "Add headline");
    });

    const panel = getMarketNewsPanel(container);
    const inputs = Array.from(panel.querySelectorAll<HTMLInputElement>(".marketNewsEditor input"));
    const categorySelect = panel.querySelector<HTMLSelectElement>(".marketNewsEditor select");

    await act(async () => {
      setFieldValue(inputs[0], "Oil extends bid after inventory draw.");
      setFieldValue(categorySelect!, "energy");
      setFieldValue(inputs[1], "Energy Desk");
      setFieldValue(inputs[2], "https://example.com/oil");
      setFieldValue(inputs[3], "10:15 ET");
    });
    await act(async () => {
      clickButton(container, "Save");
    });

    const savedSnapshot = getSavedSnapshot(localStorage, "2026-05-04");

    expect(savedSnapshot.marketNews).toMatchObject([
      {
        date: "2026-05-04",
        headline: "Oil extends bid after inventory draw.",
        source: "Energy Desk",
        category: "energy",
        url: "https://example.com/oil",
        timestamp: "10:15 ET"
      }
    ]);
    expect(getMarketNewsPanel(container).textContent).toContain("ENERGY");
  });

  it("cancels draft edits without persisting them", async () => {
    const snapshot = createSnapshotWithNews("2026-05-04", [
      {
        id: "news-original",
        date: "2026-05-04",
        headline: "Rates stay contained into the cash open.",
        source: "Rates Desk",
        category: "rates"
      }
    ]);
    localStorage = setupLocalStorage({
      [getDailySnapshotStorageKey("2026-05-04")]: JSON.stringify(snapshot)
    });
    root = await renderHarness(container);

    await act(async () => {
      clickButton(container, "Edit");
    });

    const headlineInput = getMarketNewsPanel(container).querySelector<HTMLInputElement>(".marketNewsEditor input");

    await act(async () => {
      setFieldValue(headlineInput!, "Unsaved rates rewrite.");
    });
    await act(async () => {
      clickButton(container, "Cancel");
    });

    expect(getMarketNewsPanel(container).textContent).toContain("Rates stay contained into the cash open.");
    expect(getMarketNewsPanel(container).textContent).not.toContain("Unsaved rates rewrite.");
    expect(getSavedSnapshot(localStorage, "2026-05-04").marketNews[0].headline)
      .toBe("Rates stay contained into the cash open.");
  });

  it("deletes a news item from the persisted snapshot", async () => {
    const snapshot = createSnapshotWithNews("2026-05-04", [
      {
        id: "news-delete",
        date: "2026-05-04",
        headline: "Crypto majors rotate lower at range highs.",
        source: "Flow Brief",
        category: "crypto"
      }
    ]);
    localStorage = setupLocalStorage({
      [getDailySnapshotStorageKey("2026-05-04")]: JSON.stringify(snapshot)
    });
    root = await renderHarness(container);

    await act(async () => {
      clickButton(container, "Edit");
    });
    await act(async () => {
      clickButton(container, "Delete");
    });
    await act(async () => {
      clickButton(container, "Save");
    });

    expect(getSavedSnapshot(localStorage, "2026-05-04").marketNews).toEqual([]);
    expect(getMarketNewsPanel(container).textContent).toContain("NO CURATED MARKET NEWS YET");
  });
});
