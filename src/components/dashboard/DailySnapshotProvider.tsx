"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  createDailySnapshotForDate,
  DEFAULT_DAILY_SNAPSHOT_TRADING_DATE
} from "@/lib/dailySnapshotFactory";
import {
  getLocalTradingDate,
  listDailyDashboardSnapshotDates,
  loadDailyDashboardSnapshot,
  saveDailyDashboardSnapshot
} from "@/lib/dailySnapshotStorage";
import type {
  FearGreedCaptureCandidate,
  MarketCaptureCandidate
} from "@/lib/dailyMarketSnapshotCapture";
import {
  buildFearGreedSnapshotFromCaptureCandidate,
  buildSpxSnapshotFromCaptureCandidate
} from "@/lib/dailyMarketSnapshotCapture";
import type { DailyDashboardSnapshot } from "@/types/dailySnapshot";

interface DailySnapshotContextValue {
  activeDate: string;
  dailySnapshot: DailyDashboardSnapshot;
  savedSnapshotDates: string[];
  currentMarketCaptureCandidate: MarketCaptureCandidate | null;
  currentFearGreedCaptureCandidate: FearGreedCaptureCandidate | null;
  canCaptureMarketSnapshot: boolean;
  loadSnapshotForDate: (tradingDate: string) => void;
  saveSnapshot: (snapshot: DailyDashboardSnapshot) => void;
  updateSnapshot: (updater: (snapshot: DailyDashboardSnapshot) => DailyDashboardSnapshot) => void;
  refreshSavedSnapshotDates: () => void;
  publishMarketCaptureCandidate: (candidate: MarketCaptureCandidate | null) => void;
  publishFearGreedCaptureCandidate: (candidate: FearGreedCaptureCandidate | null) => void;
  captureMarketSnapshot: () => void;
}

const DailySnapshotContext = createContext<DailySnapshotContextValue | null>(null);

function getInitialSnapshot() {
  return createDailySnapshotForDate(DEFAULT_DAILY_SNAPSHOT_TRADING_DATE);
}

export function DailySnapshotProvider({ children }: { children: ReactNode }) {
  const [dailySnapshot, setDailySnapshot] = useState<DailyDashboardSnapshot>(() => getInitialSnapshot());
  const [activeDate, setActiveDate] = useState(DEFAULT_DAILY_SNAPSHOT_TRADING_DATE);
  const [savedSnapshotDates, setSavedSnapshotDates] = useState<string[]>([]);
  const [currentMarketCaptureCandidate, setCurrentMarketCaptureCandidate] =
    useState<MarketCaptureCandidate | null>(null);
  const [currentFearGreedCaptureCandidate, setCurrentFearGreedCaptureCandidate] =
    useState<FearGreedCaptureCandidate | null>(null);

  const publishMarketCaptureCandidate = useCallback((candidate: MarketCaptureCandidate | null) => {
    setCurrentMarketCaptureCandidate(candidate);
  }, []);

  const publishFearGreedCaptureCandidate = useCallback((candidate: FearGreedCaptureCandidate | null) => {
    setCurrentFearGreedCaptureCandidate(candidate);
  }, []);

  const refreshSavedSnapshotDates = useCallback(() => {
    setSavedSnapshotDates(listDailyDashboardSnapshotDates());
  }, []);

  const loadSnapshotForDate = useCallback((tradingDate: string) => {
    const storedSnapshot = loadDailyDashboardSnapshot(tradingDate);
    const nextSnapshot = storedSnapshot ?? createDailySnapshotForDate(tradingDate);

    setDailySnapshot(nextSnapshot);
    setActiveDate(nextSnapshot.tradingDate);
    refreshSavedSnapshotDates();
  }, [refreshSavedSnapshotDates]);

  const saveSnapshot = useCallback((snapshot: DailyDashboardSnapshot) => {
    setDailySnapshot(snapshot);
    setActiveDate(snapshot.tradingDate);
    saveDailyDashboardSnapshot(snapshot);
    refreshSavedSnapshotDates();
  }, [refreshSavedSnapshotDates]);

  const updateSnapshot = useCallback((updater: (snapshot: DailyDashboardSnapshot) => DailyDashboardSnapshot) => {
    const nextSnapshot = updater(dailySnapshot);
    saveSnapshot(nextSnapshot);
  }, [dailySnapshot, saveSnapshot]);

  const captureMarketSnapshot = useCallback(() => {
    if (!currentMarketCaptureCandidate && !currentFearGreedCaptureCandidate) {
      return;
    }

    const capturedAt = new Date().toISOString();

    updateSnapshot((snapshot) => ({
      ...snapshot,
      status: "saved" as const,
      updatedAt: capturedAt,
      spx: currentMarketCaptureCandidate
        ? buildSpxSnapshotFromCaptureCandidate(currentMarketCaptureCandidate, capturedAt)
        : snapshot.spx,
      fearGreed: currentFearGreedCaptureCandidate
        ? buildFearGreedSnapshotFromCaptureCandidate(currentFearGreedCaptureCandidate, capturedAt)
        : snapshot.fearGreed
    }));
  }, [currentFearGreedCaptureCandidate, currentMarketCaptureCandidate, updateSnapshot]);

  useEffect(() => {
    loadSnapshotForDate(getLocalTradingDate());
  }, [loadSnapshotForDate]);

  const canCaptureMarketSnapshot = !!currentMarketCaptureCandidate || !!currentFearGreedCaptureCandidate;

  const contextValue = useMemo(
    () => ({
      activeDate,
      dailySnapshot,
      savedSnapshotDates,
      currentMarketCaptureCandidate,
      currentFearGreedCaptureCandidate,
      canCaptureMarketSnapshot,
      loadSnapshotForDate,
      saveSnapshot,
      updateSnapshot,
      refreshSavedSnapshotDates,
      publishMarketCaptureCandidate,
      publishFearGreedCaptureCandidate,
      captureMarketSnapshot
    }),
    [
      activeDate,
      dailySnapshot,
      savedSnapshotDates,
      currentMarketCaptureCandidate,
      currentFearGreedCaptureCandidate,
      canCaptureMarketSnapshot,
      loadSnapshotForDate,
      saveSnapshot,
      updateSnapshot,
      refreshSavedSnapshotDates,
      publishMarketCaptureCandidate,
      publishFearGreedCaptureCandidate,
      captureMarketSnapshot
    ]
  );

  return (
    <DailySnapshotContext.Provider value={contextValue}>
      {children}
    </DailySnapshotContext.Provider>
  );
}

export function useDailySnapshot() {
  const context = useContext(DailySnapshotContext);

  if (!context) {
    throw new Error("useDailySnapshot must be used inside DailySnapshotProvider");
  }

  return context;
}
