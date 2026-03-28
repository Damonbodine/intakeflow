"use client";
import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, AlertTriangle } from "lucide-react";
import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";

interface NeedsAssessmentPanelProps {
  clientId: Id<"clients">;
  intakeFormId?: Id<"intakeForms">;
}

function AssessmentSection({ title, items, variant }: { title: string; items: string[]; variant?: "destructive" }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            {variant === "destructive" && <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NeedsAssessmentPanel({ clientId, intakeFormId }: NeedsAssessmentPanelProps) {
  const assessment = useQuery(api.aiHelpers.getNeedsAssessment, { clientId });
  const generateAssessment = useAction(api.ai.generateNeedsAssessment);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!intakeFormId) return;
    setIsGenerating(true);
    setError(null);
    try {
      await generateAssessment({ clientId, intakeFormId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate assessment");
    } finally {
      setIsGenerating(false);
    }
  };

  const presentingNeeds = assessment?.presentingNeeds ? JSON.parse(assessment.presentingNeeds) : [];
  const strengths = assessment?.strengths ? JSON.parse(assessment.strengths) : [];
  const barriers = assessment?.barriers ? JSON.parse(assessment.barriers) : [];
  const recommendedPrograms = assessment?.recommendedPrograms ? JSON.parse(assessment.recommendedPrograms) : [];
  const safetyConcerns = assessment?.safetyConcerns ? JSON.parse(assessment.safetyConcerns) : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-500" />
          AI Needs Assessment
        </CardTitle>
        {intakeFormId && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : assessment ? "Regenerate" : "Generate"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive mb-2">{error}</p>}
        {assessment === undefined ? (
          <Skeleton className="h-32 w-full" />
        ) : assessment ? (
          <div className="space-y-4">
            {assessment.summary && (
              <p className="text-sm text-muted-foreground">{assessment.summary}</p>
            )}
            {safetyConcerns.length > 0 && (
              <div className="rounded-md bg-destructive/10 p-3">
                <AssessmentSection title="Immediate Safety Concerns" items={safetyConcerns} variant="destructive" />
              </div>
            )}
            <AssessmentSection title="Presenting Needs" items={presentingNeeds} />
            <AssessmentSection title="Strengths & Resources" items={strengths} />
            <AssessmentSection title="Barriers to Service" items={barriers} />
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recommended Programs</p>
              <div className="flex flex-wrap gap-1.5">
                {recommendedPrograms.map((p: string, i: number) => (
                  <Badge key={i} variant="secondary">{p}</Badge>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Generated {new Date(assessment.generatedAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {intakeFormId
              ? "No needs assessment yet. Click Generate to analyze this client."
              : "Complete an intake form to enable AI needs assessment."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
