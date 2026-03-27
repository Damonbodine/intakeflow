"use client";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import type { Id } from "@convex/_generated/dataModel";

export default function ClientDetailPage() {
  const params = useParams();
  const client = useQuery(api.clients.getById, { id: params.id as Id<"clients"> });

  if (client === undefined) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!client) return <div className="p-8 text-muted-foreground">Client not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{client.firstName} {client.lastName}</h1>
        {client.riskScore !== undefined && (
          <Badge variant={client.riskScore > 70 ? "destructive" : client.riskScore > 40 ? "secondary" : "default"}>
            Risk Score: {client.riskScore}
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Demographics</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span>{client.gender}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Language</span><span>{client.primaryLanguage}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Household Size</span><span>{client.householdSize}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Income Level</span><span>{client.incomeLevel}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Housing Status</span><StatusBadge status={client.housingStatus} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{client.phone}</span></div>
            {client.email && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{client.email}</span></div>}
            {client.address && <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span>{client.address}, {client.city} {client.state} {client.zipCode}</span></div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
