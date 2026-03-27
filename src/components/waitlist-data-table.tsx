"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUp } from "lucide-react";

interface WaitlistDataTableProps {
  programId?: Id<"programs">;
}

export function WaitlistDataTable({ programId }: WaitlistDataTableProps = {}) {
  const entries = useQuery(api.waitlistEntries.listByProgram, programId ? { programId } : "skip");
  const promote = useMutation(api.waitlistEntries.promote);

  if (!entries) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        No clients on the waitlist for this program.
      </div>
    );
  }

  const handlePromote = async (id: Id<"waitlistEntries">) => {
    try {
      await promote({ id });
    } catch (error) {
      console.error("Failed to promote waitlist entry:", error);
    }
  };

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Priority Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="w-24">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry: any, index: number) => (
            <TableRow key={entry._id}>
              <TableCell>
                <Badge variant="secondary" className="font-mono">
                  {index + 1}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                {entry.clientName ?? "Unknown Client"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-12 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-amber-500"
                      style={{ width: `${Math.min((entry.priorityScore ?? 0) * 10, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{entry.priorityScore ?? 0}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {entry.status ?? "Waiting"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {entry.addedAt
                  ? new Date(entry.addedAt).toLocaleDateString()
                  : entry._creationTime
                    ? new Date(entry._creationTime).toLocaleDateString()
                    : "--"}
              </TableCell>
              <TableCell>
                {index === 0 && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handlePromote(entry._id)}
                    className="gap-1"
                  >
                    <ArrowUp className="h-3 w-3" />
                    Promote
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
