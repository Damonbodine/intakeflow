"use client";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Progress } from "@/components/ui/progress";
import type { Id } from "@convex/_generated/dataModel";

export default function ProgramDetailPage() {
  const params = useParams();
  const program = useQuery(api.programs.getById, { id: params.id as Id<"programs"> });

  if (program === undefined) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!program) return <div className="p-8 text-muted-foreground">Program not found</div>;

  const utilization = program.totalCapacity > 0 ? Math.round((program.currentEnrollment / program.totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">{program.name}</h1>
        <StatusBadge status={program.status} />
      </div>
      <p className="text-muted-foreground">{program.description}</p>
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Enrollment</p>
            <p className="text-2xl font-bold">{program.currentEnrollment}/{program.totalCapacity}</p>
            <Progress value={utilization} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Waitlisted</p>
            <p className="text-2xl font-bold">{program.waitlistCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Category</p>
            <p className="text-2xl font-bold">{program.category}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
