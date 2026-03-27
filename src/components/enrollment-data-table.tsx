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

const statusOptions = ["All", "Active", "Completed", "Discharged", "OnHold", "Transferred"];

export function EnrollmentDataTable() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const enrollments = useQuery(
    api.enrollments.list,
    statusFilter && statusFilter !== "All" ? { status: statusFilter } : {}
  );

  if (!enrollments) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
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

      {enrollments.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
          No enrollments found.
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Assigned Staff</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment: any) => (
                <TableRow key={enrollment._id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link href={`/enrollments/${enrollment._id}`} className="font-medium text-primary hover:underline">
                      {enrollment.clientName ?? "Unknown Client"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {enrollment.programName ?? "Unknown Program"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={enrollment.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {enrollment.startDate
                      ? new Date(enrollment.startDate).toLocaleDateString()
                      : "--"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {enrollment.assignedStaffName ?? "Unassigned"}
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
