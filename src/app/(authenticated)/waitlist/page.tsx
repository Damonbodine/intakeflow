"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { WaitlistDataTable } from "@/components/waitlist-data-table";
import { WaitlistAdvisorPanel } from "@/components/waitlist-advisor-panel";
import { CommunicationDrafter } from "@/components/communication-drafter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function WaitlistPage() {
  const programs = useQuery(api.programs.list, {});
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<{
    id: Id<"clients">;
    name: string;
  } | null>(null);

  const waitlistEntries = useQuery(
    api.waitlistEntries.listByProgram,
    selectedProgram ? { programId: selectedProgram as Id<"programs"> } : "skip"
  );

  return (
    <div className="space-y-6" data-demo="waitlist-workspace">
      <h1 className="text-2xl font-bold">Waitlist</h1>
      <div className="mb-4">
        <Select onValueChange={(v) => { if (v) { setSelectedProgram(v); setSelectedClient(null); } }} value={selectedProgram}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Select a program..." />
          </SelectTrigger>
          <SelectContent>
            {programs?.map((p: any) => (
              <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedProgram ? (
        <div className="space-y-6">
          <WaitlistDataTable programId={selectedProgram as Id<"programs">} />
          <div className="grid grid-cols-2 gap-6">
            <WaitlistAdvisorPanel programId={selectedProgram as Id<"programs">} />
            <div className="space-y-4">
              {waitlistEntries && waitlistEntries.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Select a client to draft communication:</p>
                  <Select
                    value={selectedClient?.id ?? ""}
                    onValueChange={(v) => {
                      if (!v) return;
                      const entry = waitlistEntries.find((e: any) => e.clientId === v);
                      if (entry) setSelectedClient({ id: v as Id<"clients">, name: entry.clientName });
                    }}
                  >
                    <SelectTrigger className="w-72">
                      <SelectValue placeholder="Select client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {waitlistEntries.map((e: any) => (
                        <SelectItem key={e.clientId} value={e.clientId}>{e.clientName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {selectedClient && (
                <CommunicationDrafter
                  clientId={selectedClient.id}
                  programId={selectedProgram as Id<"programs">}
                  clientName={selectedClient.name}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground">Select a program to view its waitlist.</p>
      )}
    </div>
  );
}
