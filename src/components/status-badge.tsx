"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  Active: "bg-green-100 text-green-800 hover:bg-green-100",
  Enrolled: "bg-green-100 text-green-800 hover:bg-green-100",
  Eligible: "bg-green-100 text-green-800 hover:bg-green-100",
  Housed: "bg-green-100 text-green-800 hover:bg-green-100",
  Completed: "bg-green-100 text-green-800 hover:bg-green-100",
  Approved: "bg-green-100 text-green-800 hover:bg-green-100",

  Applied: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  Screening: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  Submitted: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  UnderReview: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  InProgress: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  Transitional: "bg-blue-100 text-blue-800 hover:bg-blue-100",

  Waitlisted: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  Pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  OnHold: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  AtRisk: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  NeedsMoreInfo: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  Deferred: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  Waiting: "bg-amber-100 text-amber-800 hover:bg-amber-100",

  Rejected: "bg-red-100 text-red-800 hover:bg-red-100",
  Discharged: "bg-red-100 text-red-800 hover:bg-red-100",
  Critical: "bg-red-100 text-red-800 hover:bg-red-100",
  Homeless: "bg-red-100 text-red-800 hover:bg-red-100",
  Ineligible: "bg-red-100 text-red-800 hover:bg-red-100",

  Draft: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  Archived: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  Inactive: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  Shelter: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  Unknown: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  Full: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  Transferred: "bg-gray-100 text-gray-800 hover:bg-gray-100",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] ?? "bg-gray-100 text-gray-800 hover:bg-gray-100";

  return (
    <Badge className={cn(style, "font-medium", className)}>
      {status}
    </Badge>
  );
}
