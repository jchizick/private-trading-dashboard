import { GammaContextModule } from "@/components/dashboard/GammaContextModule";
import { DailySnapshotProvider } from "@/components/dashboard/DailySnapshotProvider";
import { FearGreedModule } from "@/components/dashboard/FearGreedModule";
import { MarketSnapshotCaptureControl } from "@/components/dashboard/MarketSnapshotCaptureControl";
import { MarketSituationModule } from "@/components/dashboard/MarketSituationModule";
import { PerformanceModule } from "@/components/dashboard/PerformanceModule";
import { TopBarTelemetry } from "@/components/dashboard/TopBarTelemetry";
import { TradingContextModule } from "@/components/dashboard/TradingContextModule";
import type { DashboardData } from "@/types/dashboard";

interface DashboardShellProps {
  data: DashboardData;
}

export function DashboardShell({ data }: DashboardShellProps) {
  return (
    <main className="dashboardShell">
      <div className="dashboardWorkspace">
        <DailySnapshotProvider>
          <header className="topBar">
            <div className="topBar__identity">
              <span className="brandMark">[JC]</span>
              <div>
                <h1>Market Command</h1>
                <span>Private command center</span>
              </div>
            </div>
            <TopBarTelemetry market={data.marketSituation} />
          </header>

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
