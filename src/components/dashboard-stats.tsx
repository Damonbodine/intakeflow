"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { StatCard } from "@/components/stat-card";
import { Users, FolderKanban, FileText, GraduationCap } from "lucide-react";

export function DashboardStats() {
  const stats = useQuery(api.dashboard.getAdminStats);

  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Clients"
        value={stats.totalClients ?? 0}
        icon={Users}
      />
      <StatCard
        label="Active Programs"
        value={stats.totalPrograms ?? 0}
        icon={FolderKanban}
      />
      <StatCard
        label="Active Applications"
        value={stats.activeApplications ?? 0}
        icon={FileText}
        trend={Array.isArray(stats.recentApplications) ? `${stats.recentApplications.length} this month` : undefined}
        trendDirection="neutral"
      />
      <StatCard
        label="Active Enrollments"
        value={stats.activeEnrollments ?? 0}
        icon={GraduationCap}
      />
    </div>
  );
}
