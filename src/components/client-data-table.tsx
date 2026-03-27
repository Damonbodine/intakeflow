"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { Search } from "lucide-react";

export function ClientDataTable() {
  const [search, setSearch] = useState("");
  const clients = useQuery(api.clients.list, search ? { search } : {});

  if (!clients) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {clients.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
          No clients found. Create a new client to get started.
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Housing Status</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client: any) => (
                <TableRow key={client._id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link href={`/clients/${client._id}`} className="font-medium text-primary hover:underline">
                      {client.firstName} {client.lastName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{client.phone ?? "--"}</TableCell>
                  <TableCell>
                    <StatusBadge status={client.housingStatus ?? "Unknown"} />
                  </TableCell>
                  <TableCell>
                    {client.riskScore !== undefined && client.riskScore !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${Math.min(client.riskScore * 10, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{client.riskScore}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : "--"}
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
