/**
 * @vitest-environment jsdom
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DailySnapshotProvider,
  useDailySnapshot
} from "@/components/dashboard/DailySnapshotProvider";
import { GammaContextModule } from "@/components/dashboard/GammaContextModule";
import { dashboardData } from "@/data/mockDashboardData";
import { createDailySnapshotForDate } from "@/lib/dailySnapshotFactory";
import { getDailySnapshotStorageKey } from "@/lib/dailySnapshotStorage";
import {
  GAMMA_IMAGE_MAX_BYTES,
  validateGammaImageFile
} from "@/lib/gammaImageUpload";
import { createLocalStorageMock, type LocalStorageMock } from "@/test/localStorageMock";
import type { DailyDashboardSnapshot } from "@/types/dailySnapshot";

const may4Now = "2026-05-04T15:00:00.000Z";
const may5Now = "2026-05-05T15:00:00.000Z";
const may4Image = "data:image/png;base64,bWF5NA==";
const may5Image = "data:image/webp;base64,bWF5NQ==";

class TestFileReader {
  result: string | ArrayBuffer | null = null;
  onload: ((this: FileReader, event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((this: FileReader, event: ProgressEvent<FileReader>) => void) | null = null;

  readAsDataURL(file: File) {
    void file.arrayBuffer().then((buffer) => {
      this.result = `data:${file.type};base64,${Buffer.from(buffer).toString("base64")}`;
      this.onload?.call(this as unknown as FileReader, new ProgressEvent("load") as ProgressEvent<FileReader>);
    });
  }
}

function setupLocalStorage(initialStore: Record<string, string> = {}) {
  const localStorage = createLocalStorageMock(initialStore);

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: localStorage
  });

  return localStorage;
}

function createStoredSnapshot(
  tradingDate: string,
  overrides: Partial<DailyDashboardSnapshot["gamma"]> = {}
) {
  const snapshot = createDailySnapshotForDate(tradingDate);

  return {
    ...snapshot,
    status: "saved" as const,
    gamma: {
      ...snapshot.gamma,
      status: "checked" as const,
      source: "manual" as const,
      sourceName: "@gexbot15",
      majorPositiveGamma: 7310,
      majorNegativeGamma: 7190,
      zeroGamma: 7248.5,
      capturedAt: `${tradingDate}T14:05:00.000Z`,
      updatedAt: `${tradingDate}T14:05:00.000Z`,
      ...overrides
    }
  };
}

function GammaHarness() {
  const { activeDate, loadSnapshotForDate } = useDailySnapshot();

  return React.createElement(
    "div",
    null,
    React.createElement("span", { "data-testid": "active-date" }, activeDate),
    React.createElement("button", { type: "button", onClick: () => loadSnapshotForDate("2026-05-05") }, "may5"),
    React.createElement("button", { type: "button", onClick: () => loadSnapshotForDate("2026-05-04") }, "may4"),
    React.createElement(GammaContextModule, { gamma: dashboardData.gammaContext })
  );
}

async function renderHarness(container: HTMLElement) {
  const root = createRoot(container);

  await act(async () => {
    root.render(
      React.createElement(
        DailySnapshotProvider,
        null,
        React.createElement(GammaHarness)
      )
    );
  });
  await act(async () => {
    await Promise.resolve();
  });

  return root;
}

async function uploadFile(container: HTMLElement, file: File) {
  const input = container.querySelector<HTMLInputElement>(".gammaImageUpload__input");

  if (!input) {
    throw new Error("Gamma image input was not rendered.");
  }

  Object.defineProperty(input, "files", {
    configurable: true,
    value: [file]
  });

  await act(async () => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

function getSavedSnapshot(localStorage: LocalStorageMock, tradingDate: string) {
  return JSON.parse(localStorage.getItem(getDailySnapshotStorageKey(tradingDate)) ?? "{}") as DailyDashboardSnapshot;
}

describe("Gamma Context image upload", () => {
  let localStorage: LocalStorageMock;
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    vi.setSystemTime(new Date(may4Now));
    vi.stubGlobal("FileReader", TestFileReader);
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
    vi.unstubAllGlobals();
    document.body.replaceChildren();
    localStorage?.clear();
  });

  it("uploads a valid image into the active daily gamma snapshot and preserves manual levels", async () => {
    const storedSnapshot = createStoredSnapshot("2026-05-04");
    localStorage = setupLocalStorage({
      [getDailySnapshotStorageKey("2026-05-04")]: JSON.stringify(storedSnapshot)
    });
    root = await renderHarness(container);

    await uploadFile(container, new File(["gamma-chart"], "gamma.png", { type: "image/png" }));

    const saved = getSavedSnapshot(localStorage, "2026-05-04");

    expect(saved.updatedAt).toBe(may4Now);
    expect(saved.gamma).toMatchObject({
      source: "uploaded_image",
      sourceName: "@gexbot15",
      distributionImageUrl: "data:image/png;base64,Z2FtbWEtY2hhcnQ=",
      majorPositiveGamma: 7310,
      majorNegativeGamma: 7190,
      zeroGamma: 7248.5,
      capturedAt: "2026-05-04T14:05:00.000Z",
      updatedAt: may4Now
    });
    expect(container.querySelector<HTMLImageElement>(".gammaImagePreview img")?.src).toBe(
      "data:image/png;base64,Z2FtbWEtY2hhcnQ="
    );
  });

  it("loads date-specific saved gamma images and keeps uploads isolated by active date", async () => {
    const may4 = createStoredSnapshot("2026-05-04", {
      source: "uploaded_image",
      distributionImageUrl: may4Image
    });
    const may5 = createStoredSnapshot("2026-05-05", {
      source: "uploaded_image",
      distributionImageUrl: may5Image,
      majorPositiveGamma: 7400
    });
    localStorage = setupLocalStorage({
      [getDailySnapshotStorageKey("2026-05-04")]: JSON.stringify(may4),
      [getDailySnapshotStorageKey("2026-05-05")]: JSON.stringify(may5)
    });
    root = await renderHarness(container);

    expect(container.querySelector<HTMLImageElement>(".gammaImagePreview img")?.src).toBe(may4Image);

    vi.setSystemTime(new Date(may5Now));
    await act(async () => {
      Array.from(container.querySelectorAll("button"))
        .find((button) => button.textContent === "may5")
        ?.click();
    });

    expect(container.querySelector<HTMLImageElement>(".gammaImagePreview img")?.src).toBe(may5Image);

    await uploadFile(container, new File(["new-may-five"], "gamma.webp", { type: "image/webp" }));

    const savedMay4 = getSavedSnapshot(localStorage, "2026-05-04");
    const savedMay5 = getSavedSnapshot(localStorage, "2026-05-05");

    expect(savedMay4.gamma.distributionImageUrl).toBe(may4Image);
    expect(savedMay4.gamma.majorPositiveGamma).toBe(7310);
    expect(savedMay5.gamma.distributionImageUrl).toBe("data:image/webp;base64,bmV3LW1heS1maXZl");
    expect(savedMay5.gamma.majorPositiveGamma).toBe(7400);
  });

  it("uses the saved gamma updated time for uploaded images without a captured time", async () => {
    const storedSnapshot = createStoredSnapshot("2026-05-04", {
      source: "uploaded_image",
      distributionImageUrl: may4Image,
      capturedAt: null,
      updatedAt: may4Now
    });
    localStorage = setupLocalStorage({
      [getDailySnapshotStorageKey("2026-05-04")]: JSON.stringify(storedSnapshot)
    });
    root = await renderHarness(container);

    expect(container.textContent).toContain("Last checked: May 4, 11:00 AM EDT");
    expect(container.textContent).not.toContain("Last checked n/a");
  });

  it("clears only the uploaded image from the active gamma snapshot", async () => {
    const storedSnapshot = createStoredSnapshot("2026-05-04", {
      source: "uploaded_image",
      distributionImageUrl: may4Image
    });
    localStorage = setupLocalStorage({
      [getDailySnapshotStorageKey("2026-05-04")]: JSON.stringify(storedSnapshot)
    });
    root = await renderHarness(container);

    await act(async () => {
      Array.from(container.querySelectorAll("button"))
        .find((button) => button.textContent === "Clear Image")
        ?.click();
    });

    const saved = getSavedSnapshot(localStorage, "2026-05-04");

    expect(saved.gamma.distributionImageUrl).toBeUndefined();
    expect(saved.gamma).toMatchObject({
      source: "manual",
      sourceName: "@gexbot15",
      majorPositiveGamma: 7310,
      majorNegativeGamma: 7190,
      zeroGamma: 7248.5,
      capturedAt: "2026-05-04T14:05:00.000Z"
    });
    expect(container.querySelector(".gammaImagePreview img")).toBeNull();
    expect(container.querySelector(".gammaChart")).not.toBeNull();
  });

  it("rejects invalid file types without persisting an image", async () => {
    const storedSnapshot = createStoredSnapshot("2026-05-04");
    localStorage = setupLocalStorage({
      [getDailySnapshotStorageKey("2026-05-04")]: JSON.stringify(storedSnapshot)
    });
    root = await renderHarness(container);

    await uploadFile(container, new File(["nope"], "gamma.txt", { type: "text/plain" }));

    const saved = getSavedSnapshot(localStorage, "2026-05-04");

    expect(container.textContent).toContain("Choose a PNG, JPG, or WEBP image.");
    expect(saved.gamma.distributionImageUrl).toBeUndefined();
  });

  it("rejects oversized files in validation helper logic", () => {
    expect(validateGammaImageFile({ type: "image/jpeg", size: GAMMA_IMAGE_MAX_BYTES + 1 })).toEqual({
      ok: false,
      error: "Image must be 3 MB or smaller."
    });
  });
});
