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
      <aside className="sideRail" aria-label="Dashboard navigation">
        <div className="brandMark">[MC]</div>
        <nav>
          <a
            href="#performance"
            aria-label="Performance"
            aria-current="page"
            className="sideRail__link sideRail__link--active"
          >
            <span>PERF</span>
          </a>
          <a href="#market" aria-label="SPX market situation" className="sideRail__link">
            <span>SPX</span>
          </a>
          <a href="#gamma" aria-label="Gamma context" className="sideRail__link">
            <span>GAMMA</span>
          </a>
          <a href="#context" aria-label="Trading context" className="sideRail__link">
            <span>CONTEXT</span>
          </a>
        </nav>
        <div className="sideRail__status" aria-label="Local dashboard status">
          <div>
            <span>Data</span>
            <strong>Mock</strong>
          </div>
          <div>
            <span>Feed</span>
            <strong>Local</strong>
          </div>
        </div>
      </aside>

      <div className="dashboardWorkspace">
        <header className="topBar">
          <div className="topBar__identity">
            <h1>Market Command</h1>
            <span>Private dashboard</span>
          </div>
          <div className="topBar__telemetry" aria-label="Session telemetry">
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
            <StatusBadge tone="positive">Mock data</StatusBadge>
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
