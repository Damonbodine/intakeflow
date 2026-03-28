"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "next/navigation";
import { withPreservedDemoQuery } from "@/lib/demo";

const statusOptions = ["All", "Draft", "Submitted", "UnderReview", "Screening", "Approved", "Rejected", "Waitlisted", "Enrolled"];

export function ApplicationDataTable() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const searchParams = useSearchParams();
  const applications = useQuery(
    api.applications.list,
    statusFilter && statusFilter !== "All" ? { status: statusFilter } : {}
  );

  if (!applications) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4" data-demo="applications-table">
      <div className="flex items-center gap-4">
        <Select onValueChange={(v: any) => setStatusFilter(v === "All" ? undefined : String(v))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
          No applications found.
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app: any, index: number) => (
                <TableRow key={app._id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link
                      href={withPreservedDemoQuery(`/applications/${app._id}`, searchParams)}
                      className="font-medium text-primary hover:underline"
                      data-demo={index === 0 ? "primary-application-link" : undefined}
                    >
                      {app.clientName ?? "Unknown Client"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {app.programName ?? "Unknown Program"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={app.status} />
                  </TableCell>
                  <TableCell>
                    {app.priorityLevel && (
                      <Badge
                        variant={app.priorityLevel === "Critical" ? "destructive" : "secondary"}
                        className={app.priorityLevel === "High" ? "bg-amber-100 text-amber-800 hover:bg-amber-100" : ""}
                      >
                        {app.priorityLevel}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {app.submittedAt
                      ? new Date(app.submittedAt).toLocaleDateString()
                      : app._creationTime
                        ? new Date(app._creationTime).toLocaleDateString()
                        : "--"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
