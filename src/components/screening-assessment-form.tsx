"use client";

import { useState, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ScreeningAssessmentFormProps {
  intakeFormId: Id<"intakeForms">;
  clientName: string;
}

const scoreFields = [
  { key: "housingNeedScore", label: "Housing Need" },
  { key: "employmentNeedScore", label: "Employment Need" },
  { key: "healthNeedScore", label: "Health Need" },
  { key: "mentalHealthNeedScore", label: "Mental Health Need" },
  { key: "substanceNeedScore", label: "Substance Abuse Need" },
];

const screeningResults = ["Eligible", "Ineligible", "NeedsMoreInfo", "Deferred"];

export function ScreeningAssessmentForm({ intakeFormId, clientName }: ScreeningAssessmentFormProps) {
  const router = useRouter();
  const completeIntake = useMutation(api.intakeForms.complete);
  const updateIntake = useMutation(api.intakeForms.update);

  const [scores, setScores] = useState<Record<string, number>>({
    housingNeedScore: 0,
    employmentNeedScore: 0,
    healthNeedScore: 0,
    mentalHealthNeedScore: 0,
    substanceNeedScore: 0,
  });
  const [presentingNeeds, setPresentingNeeds] = useState("");
  const [screeningResult, setScreeningResult] = useState("");
  const [screeningNotes, setScreeningNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const overallScore = useMemo(() => {
    const values = Object.values(scores);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10;
  }, [scores]);

  const handleScoreChange = (key: string, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0 && num <= 10) {
      setScores((prev) => ({ ...prev, [key]: num }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screeningResult) return;

    setIsSubmitting(true);
    try {
      const formData = JSON.stringify({ ...scores, presentingNeeds });
      await updateIntake({ id: intakeFormId, formData, notes: screeningNotes });
      await completeIntake({
        id: intakeFormId,
        screeningResult,
        notes: screeningNotes,
      });
      router.push("/screening");
    } catch (error) {
      console.error("Failed to complete screening:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Needs Assessment for {clientName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scoreFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label} (0-10)</Label>
                <Input
                  id={field.key}
                  type="number"
                  min={0}
                  max={10}
                  value={scores[field.key]}
                  onChange={(e) => handleScoreChange(field.key, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Overall Assessment Score</p>
            <p className="text-3xl font-bold text-primary">{overallScore}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="presentingNeeds">Presenting Needs</Label>
            <Textarea
              id="presentingNeeds"
              placeholder="Describe the client's presenting needs..."
              value={presentingNeeds}
              onChange={(e) => setPresentingNeeds(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Screening Decision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="screeningResult">Screening Result</Label>
            <Select onValueChange={(v: string | null) => v !== null && setScreeningResult(v)} value={screeningResult}>
              <SelectTrigger>
                <SelectValue placeholder="Select screening result" />
              </SelectTrigger>
              <SelectContent>
                {screeningResults.map((result) => (
                  <SelectItem key={result} value={result}>{result}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="screeningNotes">Notes</Label>
            <Textarea
              id="screeningNotes"
              placeholder="Additional screening notes..."
              value={screeningNotes}
              onChange={(e) => setScreeningNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={!screeningResult || isSubmitting}>
          {isSubmitting ? "Submitting..." : "Complete Screening"}
        </Button>
      </div>
    </form>
  );
}
