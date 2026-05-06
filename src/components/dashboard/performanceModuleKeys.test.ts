/**
 * @vitest-environment jsdom
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PerformanceModule } from "@/components/dashboard/PerformanceModule";
import type { PerformanceSnapshot } from "@/types/dashboard";

const performanceWithRepeatedWeekdays: PerformanceSnapshot = {
  accountEquityCurvePercent: [
    { label: "Tue", date: "2026-05-05", valuePercent: 0 },
    { label: "Tue", date: "2026-05-12", valuePercent: 1.2 },
    { label: "Tue", date: "2026-05-19", valuePercent: 0.7 }
  ],
  latestEquity: 100700,
  accountEquityChange: 700,
  dailyPerformancePercent: 0.3,
  weeklyPerformancePercent: 1.2,
  monthlyPerformancePercent: 0.7,
  ytdPerformancePercent: 4.2,
  accountDrawdownPercent: -0.4,
  winRatePercent: null,
  averageRiskReward: null,
  profitFactor: null,
  tradeCount: null,
  averageWin: null,
  averageLoss: null,
  reviewTags: ["discipline", "discipline"],
  notes: "Repeated labels should not become React keys.",
  lastUpdatedAt: "2026-05-19T14:30:00.000Z",
  sourceCoverage: {
    accountEquityHistory: true,
    exchangeTradeLedger: false
  }
};

function getDuplicateKeyMessages(spy: ReturnType<typeof vi.spyOn>) {
  return (spy.mock.calls as unknown[][])
    .map((call) => call.map((part) => String(part)).join(" "))
    .filter((message) => /Encountered two children with the same key/i.test(message));
}

describe("PerformanceModule React keys", () => {
  let container: HTMLDivElement;
  let root: Root | null;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.replaceChildren(container);
    root = null;
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }

    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it("does not use repeated weekday labels as equity curve keys", async () => {
    root = createRoot(container);

    await act(async () => {
      root?.render(React.createElement(PerformanceModule, { performance: performanceWithRepeatedWeekdays }));
    });

    expect(getDuplicateKeyMessages(consoleErrorSpy)).toEqual([]);
  });
});
