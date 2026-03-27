"use client";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";
export default function ScreeningPage() {
  const applications = useQuery(api.applications.list, {});
  const screening = applications?.filter((a: any) => a.status === "Screening") ?? [];
  return (<div><h1 className="text-2xl font-bold mb-6">Screening Queue</h1>
    {screening.length === 0 ? <p className="text-muted-foreground">No applications pending screening.</p> :
    <Table><TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Program</TableHead><TableHead>Urgency</TableHead><TableHead>Submitted</TableHead><TableHead></TableHead></TableRow></TableHeader>
    <TableBody>{screening.map((a: any) => (<TableRow key={a._id}><TableCell className="font-medium">{a.clientId}</TableCell><TableCell>{a.programId}</TableCell><TableCell><StatusBadge status={a.urgencyLevel}/></TableCell><TableCell className="text-muted-foreground">{new Date(a.submittedAt).toLocaleDateString()}</TableCell><TableCell><Link href={"/screening/"+a._id} className="text-primary hover:underline">Screen</Link></TableCell></TableRow>))}</TableBody></Table>}
  </div>);
}
