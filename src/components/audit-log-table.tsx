"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const actionTypes = ["All", "Create", "Update", "Delete", "StatusChange", "Login", "Logout"];
const entityTypes = [
  "All",
  "Client",
  "Program",
  "Application",
  "Enrollment",
  "WaitlistEntry",
  "IntakeForm",
  "StaffAssignment",
  "User",
];

const actionBadgeColors: Record<string, string> = {
  Create: "bg-green-100 text-green-800",
  Update: "bg-blue-100 text-blue-800",
  Delete: "bg-red-100 text-red-800",
  StatusChange: "bg-amber-100 text-amber-800",
  Login: "bg-indigo-100 text-indigo-800",
  Logout: "bg-gray-100 text-gray-800",
};

export function AuditLogTable() {
  const [actionFilter, setActionFilter] = useState<string | undefined>(undefined);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | undefined>(undefined);

  const auditLogs = useQuery(api.auditLogs.list, {
    ...(actionFilter && actionFilter !== "All" ? { action: actionFilter } : {}),
    ...(entityTypeFilter && entityTypeFilter !== "All" ? { entityType: entityTypeFilter } : {}),
  });

  if (!auditLogs) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <Select onValueChange={(v: any) => setActionFilter(v === "All" ? undefined : String(v))}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            {actionTypes.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(v: any) => setEntityTypeFilter(v === "All" ? undefined : String(v))}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Entities" />
          </SelectTrigger>
          <SelectContent>
            {entityTypes.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {auditLogs.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
          No audit log entries found.
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log: any) => (
                <TableRow key={log._id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {log._creationTime
                      ? new Date(log._creationTime).toLocaleString()
                      : "--"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.userName ?? "System"}
                  </TableCell>
                  <TableCell>
                    <Badge className={actionBadgeColors[log.action] ?? "bg-gray-100 text-gray-800"}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{log.entityType}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {log.details ?? "--"}
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
