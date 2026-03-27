"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { Users } from "lucide-react";

const categories = [
  "All",
  "Housing",
  "FoodAssistance",
  "MentalHealth",
  "Substance",
  "Employment",
  "Education",
  "LegalAid",
  "YouthServices",
  "SeniorServices",
  "Other",
];

export function ProgramCardGrid() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const programs = useQuery(
    api.programs.list,
    {
      ...(category && category !== "All" ? { category } : {}),
      ...(statusFilter && statusFilter !== "All" ? { status: statusFilter } : {}),
    }
  );

  if (!programs) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select onValueChange={(v: any) => setCategory(v === "All" ? undefined : String(v))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(v: any) => setStatusFilter(v === "All" ? undefined : String(v))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Full">Full</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {programs.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
          No programs found matching your filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program: any) => {
            const enrolled = program.currentEnrollment ?? 0;
            const capacity = program.totalCapacity ?? 1;
            const utilization = Math.round((enrolled / capacity) * 100);

            return (
              <Card key={program._id} className="rounded-lg flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">{program.category}</Badge>
                    <StatusBadge status={program.status ?? "Active"} />
                  </div>
                  <CardTitle className="mt-2 text-lg">
                    <Link href={`/programs/${program._id}`} className="hover:text-primary hover:underline">
                      {program.name}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {program.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className="font-medium">{enrolled} / {capacity}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                    {program.waitlistCount !== undefined && program.waitlistCount > 0 && (
                      <div className="flex items-center gap-1 text-sm text-amber-600">
                        <Users className="h-3 w-3" />
                        {program.waitlistCount} on waitlist
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Link href={`/programs/${program._id}`} className="w-full">
                    <Button
                      variant={utilization >= 100 ? "secondary" : "default"}
                      className="w-full"
                    >
                      {utilization >= 100 ? "Join Waitlist" : "View Program"}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
