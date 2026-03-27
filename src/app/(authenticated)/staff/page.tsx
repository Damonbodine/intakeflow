"use client";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
export default function StaffPage() {
  const assignments = useQuery(api.staffAssignments.list);
  if (!assignments) return <div className="p-4 text-muted-foreground">Loading...</div>;
  return (<div><h1 className="text-2xl font-bold mb-6">Staff</h1>
    <Table><TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Program</TableHead><TableHead>Role</TableHead><TableHead>Caseload</TableHead></TableRow></TableHeader>
    <TableBody>{assignments.map((a: any) => (<TableRow key={a._id}><TableCell className="font-medium">{a.staffId}</TableCell><TableCell>{a.programId}</TableCell><TableCell>{a.role}</TableCell><TableCell><div className="flex items-center gap-2"><Progress value={(a.caseloadCount/a.maxCaseload)*100} className="w-20"/><span className="text-sm text-muted-foreground">{a.caseloadCount}/{a.maxCaseload}</span></div></TableCell></TableRow>))}</TableBody></Table>
  </div>);
}
