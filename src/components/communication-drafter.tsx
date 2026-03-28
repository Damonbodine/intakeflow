"use client";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail } from "lucide-react";
import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";

interface CommunicationDrafterProps {
  clientId: Id<"clients">;
  programId: Id<"programs">;
  clientName: string;
}

export function CommunicationDrafter({ clientId, programId, clientName }: CommunicationDrafterProps) {
  const draftCommunication = useAction(api.ai.draftClientCommunication);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [communicationType, setCommunicationType] = useState("status_update");
  const [draft, setDraft] = useState<{
    subject: string;
    body: string;
    estimatedWaitInfo: string;
    interimResources: string[];
  } | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const data = await draftCommunication({ clientId, programId, communicationType });
      setDraft(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to draft communication");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Mail className="h-4 w-4 text-blue-500" />
          AI Communication Drafter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Select value={communicationType} onValueChange={(v) => v && setCommunicationType(v)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status_update">Status Update</SelectItem>
              <SelectItem value="welcome_message">Welcome Message</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
              <SelectItem value="slot_available">Slot Available</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? "Drafting..." : "Draft for " + clientName}
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {isGenerating ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : draft ? (
          <div className="space-y-3">
            <div className="rounded-md border p-3 space-y-2">
              <p className="text-sm font-medium">Subject: {draft.subject}</p>
              <div className="text-sm whitespace-pre-wrap">{draft.body}</div>
            </div>
            {draft.estimatedWaitInfo && (
              <div className="text-sm">
                <span className="text-muted-foreground">Estimated Wait: </span>
                {draft.estimatedWaitInfo}
              </div>
            )}
            {draft.interimResources && draft.interimResources.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Suggested Interim Resources</p>
                <div className="flex flex-wrap gap-1.5">
                  {draft.interimResources.map((r, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{r}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
