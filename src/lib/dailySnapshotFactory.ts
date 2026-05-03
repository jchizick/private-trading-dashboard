import { mockDailyDashboardSnapshot } from "@/data/mockDailySnapshot";
import { createDefaultGammaSnapshotForDate, normalizeGammaSnapshot } from "@/lib/gammaSnapshot";
import type { DailyDashboardSnapshot, SynthesisNotes } from "@/types/dailySnapshot";

export const DEFAULT_DAILY_SNAPSHOT_TRADING_DATE = mockDailyDashboardSnapshot.tradingDate;

export function cloneSynthesisNotes(synthesis: SynthesisNotes): SynthesisNotes {
  return { ...synthesis };
}

export function cloneDailySnapshot(snapshot: DailyDashboardSnapshot): DailyDashboardSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as DailyDashboardSnapshot;
}

export function normalizeDailyDashboardSnapshot(snapshot: DailyDashboardSnapshot): DailyDashboardSnapshot {
  return {
    ...snapshot,
    gamma: normalizeGammaSnapshot(snapshot.gamma, snapshot.tradingDate, snapshot.updatedAt)
  };
}

export function createDailySnapshotForDate(tradingDate: string): DailyDashboardSnapshot {
  const now = new Date().toISOString();
  const snapshot = normalizeDailyDashboardSnapshot(cloneDailySnapshot(mockDailyDashboardSnapshot));

  return {
    ...snapshot,
    id: `daily-snapshot-${tradingDate}`,
    tradingDate,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    sessionState: {
      ...snapshot.sessionState,
      lastUpdatedAt: now
    },
    synthesis: {
      ...snapshot.synthesis,
      updatedAt: now
    },
    checklist: snapshot.checklist.map((item) => ({
      ...item,
      updatedAt: now
    })),
    gamma: createDefaultGammaSnapshotForDate(tradingDate, now),
    performanceReview: {
      ...snapshot.performanceReview,
      asOfDate: tradingDate
    }
  };
}
