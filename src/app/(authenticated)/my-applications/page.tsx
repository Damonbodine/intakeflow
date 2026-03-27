"use client";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
export default function MyApplicationsPage() {
  const user = useQuery(api.users.getCurrentUser);
  const applications = useQuery(api.applications.listByClient, user?.clientId ? { clientId: user.clientId } : "skip");
  if (!applications) return <div className="p-4 text-muted-foreground">Loading...</div>;
  if (applications.length === 0) return <div className="p-8 text-center text-muted-foreground">You have no applications yet.</div>;
  return (<div><h1 className="text-2xl font-bold mb-6">My Applications</h1>
    <Table><TableHeader><TableRow><TableHead>Program</TableHead><TableHead>Status</TableHead><TableHead>Submitted</TableHead></TableRow></TableHeader>
    <TableBody>{applications.map((a: any) => (<TableRow key={a._id}><TableCell className="font-medium">{a.programId}</TableCell><TableCell><StatusBadge status={a.status}/></TableCell><TableCell className="text-muted-foreground">{new Date(a.submittedAt).toLocaleDateString()}</TableCell></TableRow>))}</TableBody></Table>
  </div>);
}
