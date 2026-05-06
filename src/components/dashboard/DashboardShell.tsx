import { GammaContextModule } from "@/components/dashboard/GammaContextModule";
import { DailySnapshotProvider } from "@/components/dashboard/DailySnapshotProvider";
import { FearGreedModule } from "@/components/dashboard/FearGreedModule";
import { MarketSnapshotCaptureControl } from "@/components/dashboard/MarketSnapshotCaptureControl";
import { MarketSituationModule } from "@/components/dashboard/MarketSituationModule";
import { PerformanceModule } from "@/components/dashboard/PerformanceModule";
import { TradingContextModule } from "@/components/dashboard/TradingContextModule";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { DashboardData } from "@/types/dashboard";
import { formatPrice } from "@/lib/formatters";

interface DashboardShellProps {
  data: DashboardData;
}

function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York"
  }).format(new Date(value));
}

export function DashboardShell({ data }: DashboardShellProps) {
  return (
    <main className="dashboardShell">
      <div className="dashboardWorkspace">
        <header className="topBar">
          <div className="topBar__identity">
            <span className="brandMark">[JC]</span>
            <div>
              <h1>Market Command</h1>
              <span>Private command center</span>
            </div>
          </div>
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
              <strong>{formatGeneratedAt(data.generatedAt)}</strong>
            </div>
            <div>
              <span>Risk state</span>
              <strong>{data.marketSituation.riskState}</strong>
            </div>
            <div>
              <span>{data.marketSituation.symbol}</span>
              <strong>{formatPrice(data.marketSituation.latestDailyClose)}</strong>
            </div>
            <StatusBadge tone="neutral">data: mock</StatusBadge>
          </div>
        </header>

        <DailySnapshotProvider>
          <div className="dashboardGrid">
            <div className="dashboardSlot dashboardSlot--capture">
              <MarketSnapshotCaptureControl />
            </div>
            <div id="performance" className="dashboardSlot dashboardSlot--performance">
              <PerformanceModule performance={data.performance} />
            </div>
            <div id="market" className="dashboardSlot dashboardSlot--market">
              <MarketSituationModule market={data.marketSituation} />
            </div>
            <div id="gamma" className="dashboardSlot dashboardSlot--gamma">
              <GammaContextModule gamma={data.gammaContext} />
              <FearGreedModule fearGreed={data.fearGreed} />
            </div>
            <div id="context" className="dashboardSlot dashboardSlot--context">
              <TradingContextModule context={data.tradingContext} />
            </div>
          </div>
        </DailySnapshotProvider>
      </div>
    </main>
  );
}
