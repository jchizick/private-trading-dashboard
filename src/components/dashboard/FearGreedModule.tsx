"use client";

import { useEffect, useState } from "react";
import { SectionPanel } from "@/components/ui/SectionPanel";
import { loadFearGreedCache, saveFearGreedCache } from "@/lib/fearGreedStorage";
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
  const value = clampGaugeValue(currentFearGreed.value);

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
