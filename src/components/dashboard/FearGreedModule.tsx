"use client";

import { useEffect, useMemo, useState } from "react";
import { useDailySnapshot } from "@/components/dashboard/DailySnapshotProvider";
import { SectionPanel } from "@/components/ui/SectionPanel";
import { loadFearGreedCache, saveFearGreedCache } from "@/lib/fearGreedStorage";
import type { FearGreedLabel } from "@/types/dailySnapshot";
import type { FearGreedSnapshot } from "@/types/dashboard";
import type { FearGreedFetchResult } from "@/types/fearGreed";

interface FearGreedModuleProps {
  fearGreed: FearGreedSnapshot;
}

function clampGaugeValue(value: number) {
  return Math.max(0, Math.min(100, value));
}

function formatLastUpdated(value: string) {
  const parsedDate = new Date(value);

  if (!Number.isFinite(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short"
  }).format(parsedDate);
}

export function FearGreedModule({ fearGreed }: FearGreedModuleProps) {
  const [currentFearGreed, setCurrentFearGreed] = useState(fearGreed);
  const { publishFearGreedCaptureCandidate } = useDailySnapshot();
  const value = clampGaugeValue(currentFearGreed.value);
  const fearGreedCaptureCandidate = useMemo(() => ({
    source: currentFearGreed.source,
    value,
    label: currentFearGreed.label as FearGreedLabel,
    lastWeek: currentFearGreed.lastWeek,
    lastMonth: currentFearGreed.lastMonth,
    yearHigh: currentFearGreed.yearHigh,
    yearLow: currentFearGreed.yearLow,
    updatedAt: currentFearGreed.lastUpdatedAt
  }), [currentFearGreed, value]);

  useEffect(() => {
    let isMounted = true;

    async function loadFearGreed() {
      try {
        const response = await fetch("/api/fear-greed", {
          cache: "no-store"
        });
        const result = (await response.json()) as FearGreedFetchResult;

        if (!isMounted) {
          return;
        }

        if (result.ok && result.snapshot) {
          setCurrentFearGreed(result.snapshot);
          saveFearGreedCache(result.snapshot);
          return;
        }
      } catch {
        // Fall through to local stale cache, then the mock prop.
      }

      if (!isMounted) {
        return;
      }

      const cachedSnapshot = loadFearGreedCache();

      if (cachedSnapshot) {
        setCurrentFearGreed(cachedSnapshot);
      }
    }

    loadFearGreed();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    publishFearGreedCaptureCandidate(fearGreedCaptureCandidate);

    return () => {
      publishFearGreedCaptureCandidate(null);
    };
  }, [fearGreedCaptureCandidate, publishFearGreedCaptureCandidate]);

  return (
    <SectionPanel
      title="Fear & Greed"
      description="Compact CMC sentiment context."
      className="sectionPanel--sentiment"
    >
      <div className="sentimentBar" aria-label={`${currentFearGreed.source}: ${value} ${currentFearGreed.label}`}>
        <div className="sentimentBar__readout">
          <span>Current</span>
          <strong>{value}</strong>
          <em>{currentFearGreed.label}</em>
        </div>
        <div className="sentimentBar__trackWrap">
          <div className="sentimentBar__track">
            <span className="sentimentBar__marker" style={{ left: `${value}%` }} />
          </div>
          <div className="sentimentBar__scale" aria-hidden="true">
            <span>Fear</span>
            <span>Neutral</span>
            <span>Greed</span>
          </div>
        </div>
      </div>

      <div className="sentimentStats">
        <div>
          <span>Last week</span>
          <strong>{currentFearGreed.lastWeek}</strong>
        </div>
        <div>
          <span>Last month</span>
          <strong>{currentFearGreed.lastMonth}</strong>
        </div>
        <div>
          <span>Year high</span>
          <strong>{currentFearGreed.yearHigh}</strong>
        </div>
        <div>
          <span>Year low</span>
          <strong>{currentFearGreed.yearLow}</strong>
        </div>
      </div>

      <p className="sentimentSource">
        {currentFearGreed.source} / Updated {formatLastUpdated(currentFearGreed.lastUpdatedAt)}
      </p>
    </SectionPanel>
  );
}
