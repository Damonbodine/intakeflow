"use client";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Id } from "@convex/_generated/dataModel";

export function ApplicationForm() {
  const create = useMutation(api.applications.create);
  const clients = useQuery(api.clients.list, {});
  const programs = useQuery(api.programs.list, {});
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientId, setClientId] = useState("");
  const [programId, setProgramId] = useState("");
  const [priorityLevel, setPriorityLevel] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      await create({
        clientId: clientId as Id<"clients">,
        programId: programId as Id<"programs">,
        priorityLevel: priorityLevel || undefined,
        notes: (fd.get("notes") as string) || undefined,
      });
      router.push("/applications");
    } finally { setIsSubmitting(false); }
  };

  if (!clients || !programs) return <div className="p-4 text-muted-foreground">Loading...</div>;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader><CardTitle>Submit Application</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Client</Label>
            <Select value={clientId} onValueChange={(v) => v !== null && setClientId(v)}><SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
              <SelectContent>{clients.map((c: any) => (<SelectItem key={c._id} value={c._id}>{c.firstName} {c.lastName}</SelectItem>))}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Program</Label>
            <Select value={programId} onValueChange={(v) => v !== null && setProgramId(v)}><SelectTrigger><SelectValue placeholder="Select program..." /></SelectTrigger>
              <SelectContent>{programs.map((p: any) => (<SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>))}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Urgency Level</Label>
            <Select value={priorityLevel} onValueChange={(v) => v !== null && setPriorityLevel(v)}><SelectTrigger><SelectValue placeholder="Select urgency..." /></SelectTrigger>
              <SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Critical">Critical</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" placeholder="Additional notes..." /></div>
          <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? "Submitting..." : "Submit Application"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
