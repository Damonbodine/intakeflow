export const dynamic = 'force-dynamic';

import { DemoModeStartButton } from "@/components/demo-mode";
import { DashboardStats } from "@/components/dashboard-stats";

export default function DashboardPage() {
  return (
    <div className="space-y-6" data-demo="dashboard-overview">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <DemoModeStartButton />
      </div>
      <DashboardStats />
    </div>
  );
}
