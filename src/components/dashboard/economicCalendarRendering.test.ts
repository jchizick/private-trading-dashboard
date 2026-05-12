/**
 * @vitest-environment jsdom
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DailySnapshotProvider } from "@/components/dashboard/DailySnapshotProvider";
import { TradingContextModule } from "@/components/dashboard/TradingContextModule";
import { dashboardData } from "@/data/mockDashboardData";
import { createLocalStorageMock, type LocalStorageMock } from "@/test/localStorageMock";

function CalendarHarness() {
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
    root.render(React.createElement(CalendarHarness));
  });
  await act(async () => {
    await Promise.resolve();
  });

  return root;
}

function getCalendar(container: HTMLElement) {
  const calendar = container.querySelector<HTMLElement>("section[aria-label='Economic calendar']");

  if (!calendar) {
    throw new Error("Economic calendar panel not found.");
  }

  return calendar;
}

function setFieldValue(field: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;

  valueSetter?.call(field, value);
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
}

async function switchDate(container: HTMLElement, tradingDate: string) {
  const input = container.querySelector<HTMLInputElement>("input[aria-label='Active trading date']");

  if (!input) {
    throw new Error("Active trading date input not found.");
  }

  await act(async () => {
    setFieldValue(input, tradingDate);
  });
}

describe("Trading Context economic calendar rendering", () => {
  let localStorage: LocalStorageMock;
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T14:00:00.000Z"));
    container = document.createElement("div");
    document.body.replaceChildren(container);
    localStorage = setupLocalStorage();
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

  it("filters events by the selected dashboard date", async () => {
    root = await renderHarness(container);

    expect(getCalendar(container).textContent).toContain("ISM Manufacturing PMI");

    await switchDate(container, "2026-05-04");

    const calendarText = getCalendar(container).textContent ?? "";

    expect(calendarText).toContain("BOC Gov Macklem Speaks");
    expect(calendarText).not.toContain("ISM Manufacturing PMI");
  });

  it("renders currency as the calendar tag instead of impact", async () => {
    root = await renderHarness(container);

    const calendar = getCalendar(container);
    const tags = Array.from(calendar.querySelectorAll(".calendarFeed__item .statusBadge"))
      .map((tag) => tag.textContent);

    expect(tags).toEqual(["USD", "USD", "USD"]);
    expect(calendar.textContent).not.toMatch(/\b(high|medium|low)\b/i);
  });

  it("renders the empty state when no watched macro events match the selected date", async () => {
    vi.setSystemTime(new Date("2026-05-02T14:00:00.000Z"));

    root = await renderHarness(container);

    const calendar = getCalendar(container);

    expect(calendar.textContent).toContain("NO WATCHED MACRO EVENTS TODAY");
    expect(calendar.querySelectorAll(".calendarFeed__item")).toHaveLength(0);
  });
});
