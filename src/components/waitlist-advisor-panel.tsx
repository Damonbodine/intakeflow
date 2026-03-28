"use client";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb } from "lucide-react";
import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";

interface Recommendation {
  clientName: string;
  rank: number;
  reason: string;
  priorityScore: number;
  waitDays: number;
  fitScore: string;
}

interface WaitlistAdvisorPanelProps {
  programId: Id<"programs">;
}

export function WaitlistAdvisorPanel({ programId }: WaitlistAdvisorPanelProps) {
  const generateRecommendations = useAction(api.ai.generateWaitlistRecommendations);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    recommendations: Recommendation[];
    summary: string;
  } | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const data = await generateRecommendations({ programId });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate recommendations");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-emerald-500" />
          AI Waitlist Advisor
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? "Analyzing..." : result ? "Refresh" : "Get Recommendations"}
        </Button>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive mb-2">{error}</p>}
        {isGenerating ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : result ? (
          <div className="space-y-3">
            {result.summary && (
              <p className="text-sm text-muted-foreground">{result.summary}</p>
            )}
            {result.recommendations.length > 0 ? (
              <div className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="rounded-md border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">#{rec.rank}</span>
                        <span className="font-medium text-sm">{rec.clientName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs">Score: {rec.priorityScore}</Badge>
                        <Badge
                          variant={rec.fitScore === "High" ? "default" : rec.fitScore === "Medium" ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {rec.fitScore} Fit
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.reason}</p>
                    <p className="text-xs text-muted-foreground">Waiting {rec.waitDays} days</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recommendations available.</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click &quot;Get Recommendations&quot; to analyze the waitlist and get AI-powered enrollment suggestions.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
