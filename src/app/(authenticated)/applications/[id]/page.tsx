"use client";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import type { Id } from "@convex/_generated/dataModel";

export default function ApplicationDetailPage() {
  const params = useParams();
  const application = useQuery(api.applications.getById, { id: params.id as Id<"applications"> });
  if (application === undefined) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!application) return <div className="p-8 text-muted-foreground">Application not found</div>;

  return (
    <div className="space-y-6" data-demo="application-detail">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Application Detail</h1>
        <StatusBadge status={application.status} />
      </div>
      <Card>
        <CardContent className="pt-6 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Urgency</span><StatusBadge status={application.urgencyLevel} /></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Submitted</span><span>{new Date(application.submittedAt).toLocaleDateString()}</span></div>
          {application.notes && <div><span className="text-muted-foreground">Notes:</span> <span>{application.notes}</span></div>}
        </CardContent>
      </Card>
    </div>
  );
}
