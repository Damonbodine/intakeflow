"use client";
import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";

interface PriorityScoreCardProps {
  clientId: Id<"clients">;
  intakeFormId?: Id<"intakeForms">;
}

export function PriorityScoreCard({ clientId, intakeFormId }: PriorityScoreCardProps) {
  const scoreData = useQuery(api.aiHelpers.getPriorityScore, { clientId });
  const generateScore = useAction(api.ai.generatePriorityScore);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!intakeFormId) return;
    setIsGenerating(true);
    setError(null);
    try {
      await generateScore({ clientId, intakeFormId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate score");
    } finally {
      setIsGenerating(false);
    }
  };

  const factors = scoreData?.factors ? JSON.parse(scoreData.factors) : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          AI Priority Score
        </CardTitle>
        {intakeFormId && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? "Analyzing..." : scoreData ? "Regenerate" : "Generate"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive mb-2">{error}</p>}
        {scoreData === undefined ? (
          <Skeleton className="h-20 w-full" />
        ) : scoreData ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold">{scoreData.score}</span>
              <span className="text-muted-foreground text-sm">/100</span>
              <Badge variant={scoreData.score > 70 ? "destructive" : scoreData.score > 40 ? "secondary" : "default"}>
                {scoreData.score > 70 ? "High Priority" : scoreData.score > 40 ? "Medium" : "Low"}
              </Badge>
            </div>
            {scoreData.summary && (
              <p className="text-sm text-muted-foreground">{scoreData.summary}</p>
            )}
            {factors.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Factor Breakdown</p>
                {factors.map((f: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{f.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{f.value}</span>
                      <Badge variant="outline" className="text-xs">{f.contribution}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Generated {new Date(scoreData.generatedAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {intakeFormId
              ? "No AI priority score yet. Click Generate to analyze this client."
              : "Complete an intake form to enable AI priority scoring."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
