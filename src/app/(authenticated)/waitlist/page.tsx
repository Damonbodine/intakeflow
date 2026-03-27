"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { WaitlistDataTable } from "@/components/waitlist-data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function WaitlistPage() {
  const programs = useQuery(api.programs.list, {});
  const [selectedProgram, setSelectedProgram] = useState<string>("");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Waitlist</h1>
      <div className="mb-4">
        <Select onValueChange={(v) => v !== null && setSelectedProgram(v)} value={selectedProgram}>
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
        <WaitlistDataTable programId={selectedProgram as Id<"programs">} />
      ) : (
        <p className="text-muted-foreground">Select a program to view its waitlist.</p>
      )}
    </div>
  );
}
