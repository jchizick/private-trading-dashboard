import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { dashboardData } from "@/data/mockDashboardData";

export default function Home() {
  return <DashboardShell data={dashboardData} />;
}
