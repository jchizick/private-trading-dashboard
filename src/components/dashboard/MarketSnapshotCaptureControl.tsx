"use client";

import { useDailySnapshot } from "@/components/dashboard/DailySnapshotProvider";
import type { DailyDashboardSnapshot } from "@/types/dailySnapshot";

function formatCapturedAt(value: string | null | undefined) {
  if (!value) {
    return "Market snapshot pending";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return `Market snapshot captured ${value}`;
  }

  return `Market snapshot captured ${new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short"
  }).format(date)}`;
}

function getLatestCapturedAt(spxCapturedAt: string | null | undefined, fearGreedCapturedAt: string | null | undefined) {
  const timestamps = [spxCapturedAt, fearGreedCapturedAt]
    .filter((value): value is string => !!value)
    .map((value) => ({
      value,
      time: new Date(value).getTime()
    }))
    .filter((entry) => Number.isFinite(entry.time));

  if (timestamps.length === 0) {
    return spxCapturedAt ?? fearGreedCapturedAt ?? null;
  }

  return timestamps.sort((a, b) => b.time - a.time)[0].value;
}

function getActiveSnapshotCapturedAt(snapshot: DailyDashboardSnapshot) {
  if (snapshot.status !== "saved") {
    return null;
  }

  const createdAtTime = new Date(snapshot.createdAt).getTime();
  const capturedAtValues = [
    snapshot.spx.capturedAt,
    snapshot.fearGreed.capturedAt
  ].filter((value) => {
    const capturedAtTime = new Date(value).getTime();

    return Number.isFinite(capturedAtTime) && (
      !Number.isFinite(createdAtTime) || capturedAtTime >= createdAtTime
    );
  });

  return getLatestCapturedAt(capturedAtValues[0], capturedAtValues[1]);
}

export function MarketSnapshotCaptureControl() {
  const {
    dailySnapshot,
    canCaptureMarketSnapshot,
    currentMarketCaptureCandidate,
    currentFearGreedCaptureCandidate,
    captureMarketSnapshot
  } = useDailySnapshot();
  const capturedAt = getActiveSnapshotCapturedAt(dailySnapshot);
  const sourceState = currentMarketCaptureCandidate?.quoteSourceState ?? "pending";
  const sentimentState = currentFearGreedCaptureCandidate ? "ready" : "pending";

  return (
    <div className="marketSnapshotCapture" aria-label="Daily market snapshot capture">
      <div className="marketSnapshotCapture__status">
        <span>{formatCapturedAt(capturedAt)}</span>
        <small>
          Quotes: {sourceState} / Sentiment: {sentimentState}
        </small>
      </div>
      <button
        className="terminalButton terminalButton--primary"
        type="button"
        onClick={captureMarketSnapshot}
        disabled={!canCaptureMarketSnapshot}
      >
        Capture Market Snapshot
      </button>
    </div>
  );
}
