"use client";

import {
  createContext,
  useContext,
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
import type { DailyDashboardSnapshot } from "@/types/dailySnapshot";

interface DailySnapshotContextValue {
  activeDate: string;
  dailySnapshot: DailyDashboardSnapshot;
  savedSnapshotDates: string[];
  loadSnapshotForDate: (tradingDate: string) => void;
  saveSnapshot: (snapshot: DailyDashboardSnapshot) => void;
  updateSnapshot: (updater: (snapshot: DailyDashboardSnapshot) => DailyDashboardSnapshot) => void;
  refreshSavedSnapshotDates: () => void;
}

const DailySnapshotContext = createContext<DailySnapshotContextValue | null>(null);

function getInitialSnapshot() {
  return createDailySnapshotForDate(DEFAULT_DAILY_SNAPSHOT_TRADING_DATE);
}

export function DailySnapshotProvider({ children }: { children: ReactNode }) {
  const [dailySnapshot, setDailySnapshot] = useState<DailyDashboardSnapshot>(() => getInitialSnapshot());
  const [activeDate, setActiveDate] = useState(DEFAULT_DAILY_SNAPSHOT_TRADING_DATE);
  const [savedSnapshotDates, setSavedSnapshotDates] = useState<string[]>([]);

  function refreshSavedSnapshotDates() {
    setSavedSnapshotDates(listDailyDashboardSnapshotDates());
  }

  function loadSnapshotForDate(tradingDate: string) {
    const storedSnapshot = loadDailyDashboardSnapshot(tradingDate);
    const nextSnapshot = storedSnapshot ?? createDailySnapshotForDate(tradingDate);

    setDailySnapshot(nextSnapshot);
    setActiveDate(nextSnapshot.tradingDate);
    refreshSavedSnapshotDates();
  }

  function saveSnapshot(snapshot: DailyDashboardSnapshot) {
    setDailySnapshot(snapshot);
    setActiveDate(snapshot.tradingDate);
    saveDailyDashboardSnapshot(snapshot);
    refreshSavedSnapshotDates();
  }

  function updateSnapshot(updater: (snapshot: DailyDashboardSnapshot) => DailyDashboardSnapshot) {
    const nextSnapshot = updater(dailySnapshot);
    saveSnapshot(nextSnapshot);
  }

  useEffect(() => {
    loadSnapshotForDate(getLocalTradingDate());
  }, []);

  const contextValue = useMemo(
    () => ({
      activeDate,
      dailySnapshot,
      savedSnapshotDates,
      loadSnapshotForDate,
      saveSnapshot,
      updateSnapshot,
      refreshSavedSnapshotDates
    }),
    [activeDate, dailySnapshot, savedSnapshotDates]
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
