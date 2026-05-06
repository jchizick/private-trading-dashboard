"use client";

import { useEffect, useMemo, useState } from "react";
import { useDailySnapshot } from "@/components/dashboard/DailySnapshotProvider";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatPrice } from "@/lib/formatters";
import type { MarketSituation } from "@/types/dashboard";

interface TopBarTelemetryProps {
  market: MarketSituation;
}

function formatDashboardTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Toronto"
  }).format(value);
}

export function TopBarTelemetry({ market }: TopBarTelemetryProps) {
  const { currentMarketCaptureCandidate } = useDailySnapshot();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const spxQuote = useMemo(() => (
    currentMarketCaptureCandidate?.watchlist.find((row) => (
      row.displaySymbol === "SPX500" &&
      row.price !== null &&
      (row.status === "live" || row.status === "cached")
    )) ?? null
  ), [currentMarketCaptureCandidate]);
  const spxPrice = spxQuote?.price ?? market.latestDailyClose;
  const dataLabel = spxQuote ? `data: ${spxQuote.status}` : "data: mock";

  useEffect(() => {
    setCurrentTime(new Date());

    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="topBar__telemetry" aria-label="Session telemetry">
      <div>
        <span>Access</span>
        <strong>Private</strong>
      </div>
      <div>
        <span>Mode</span>
        <strong>Focused</strong>
      </div>
      <div>
        <span>Updated</span>
        <strong>{currentTime ? formatDashboardTime(currentTime) : "Syncing"}</strong>
      </div>
      <div>
        <span>Risk state</span>
        <strong>{market.riskState}</strong>
      </div>
      <div>
        <span>SPX500</span>
        <strong>{formatPrice(spxPrice)}</strong>
      </div>
      <StatusBadge tone={spxQuote?.status === "live" ? "positive" : "neutral"}>{dataLabel}</StatusBadge>
    </div>
  );
}
