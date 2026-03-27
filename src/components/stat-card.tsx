"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, trend, trendDirection = "neutral", icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn("rounded-lg", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p
            className={cn(
              "text-xs mt-1",
              trendDirection === "up" && "text-green-600",
              trendDirection === "down" && "text-destructive",
              trendDirection === "neutral" && "text-muted-foreground"
            )}
          >
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
