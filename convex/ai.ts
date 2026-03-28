import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal as _internal } from "./_generated/api";
// Break circular type inference by widening the type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const internal = _internal as any;

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY environment variable is not set");

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ─── Smart Priority Scorer ───────────────────────────────────────────

export const generatePriorityScore = action({
  args: { clientId: v.id("clients"), intakeFormId: v.id("intakeForms") },
  handler: async (ctx, args) => {
    const client = await ctx.runQuery(internal.aiHelpers.getClientInternal, { id: args.clientId });
    if (!client) throw new Error("Client not found");

    const intakeForm = await ctx.runQuery(internal.aiHelpers.getIntakeFormInternal, { id: args.intakeFormId });
    if (!intakeForm) throw new Error("Intake form not found");

    const systemPrompt = `You are a social services priority assessment AI. Analyze client intake data and produce a priority score from 1-100 (100 = highest priority/most urgent need). Return ONLY valid JSON with this exact structure:
{
  "score": <number 1-100>,
  "factors": [
    {"name": "<factor name>", "weight": <number 1-10>, "value": "<assessment>", "contribution": <number>}
  ],
  "summary": "<2-3 sentence summary>"
}`;

    const userPrompt = `Client: ${client.firstName} ${client.lastName}
Housing Status: ${client.housingStatus}
Income Level: ${client.incomeLevel}
Household Size: ${client.householdSize}
Veteran: ${client.veteranStatus ? "Yes" : "No"}
Disability: ${client.disabilityStatus ? "Yes" : "No"}

Intake Assessment Scores:
- Housing Need: ${intakeForm.housingNeedScore}/10
- Employment Need: ${intakeForm.employmentNeedScore}/10
- Health Need: ${intakeForm.healthNeedScore}/10
- Mental Health Need: ${intakeForm.mentalHealthNeedScore}/10
${intakeForm.substanceNeedScore !== undefined ? `- Substance Need: ${intakeForm.substanceNeedScore}/10` : ""}
- Overall Assessment: ${intakeForm.overallAssessmentScore}/100

Presenting Needs: ${intakeForm.presentingNeeds}
Screening Result: ${intakeForm.screeningResult ?? "Pending"}`;

    const aiResponse = await callOpenRouter(systemPrompt, userPrompt);

    let parsed;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] ?? aiResponse);
    } catch {
      parsed = { score: intakeForm.overallAssessmentScore, factors: [], summary: "AI parsing failed — using assessment score as fallback." };
    }

    await ctx.runMutation(internal.aiHelpers.savePriorityScore, {
      clientId: args.clientId,
      intakeFormId: args.intakeFormId,
      score: Math.min(100, Math.max(1, parsed.score)),
      factors: JSON.stringify(parsed.factors ?? []),
      summary: parsed.summary ?? "",
    });

    return parsed;
  },
});

// ─── Needs Assessment Generator ──────────────────────────────────────

export const generateNeedsAssessment = action({
  args: { clientId: v.id("clients"), intakeFormId: v.id("intakeForms") },
  handler: async (ctx, args) => {
    const client = await ctx.runQuery(internal.aiHelpers.getClientInternal, { id: args.clientId });
    if (!client) throw new Error("Client not found");

    const intakeForm = await ctx.runQuery(internal.aiHelpers.getIntakeFormInternal, { id: args.intakeFormId });
    if (!intakeForm) throw new Error("Intake form not found");

    const systemPrompt = `You are a social services needs assessment AI. Generate a structured needs assessment from client intake data. Return ONLY valid JSON with this exact structure:
{
  "presentingNeeds": ["<need 1>", "<need 2>"],
  "strengths": ["<strength 1>", "<strength 2>"],
  "barriers": ["<barrier 1>", "<barrier 2>"],
  "recommendedPrograms": ["<program type 1>", "<program type 2>"],
  "safetyConcerns": ["<concern 1>"] or [],
  "summary": "<brief narrative summary>"
}`;

    const userPrompt = `Client: ${client.firstName} ${client.lastName}
Housing Status: ${client.housingStatus}
Income Level: ${client.incomeLevel}
Household Size: ${client.householdSize}
Veteran: ${client.veteranStatus ? "Yes" : "No"}
Disability: ${client.disabilityStatus ? "Yes" : "No"}
Gender: ${client.gender}
Language: ${client.primaryLanguage}

Intake Scores:
- Housing: ${intakeForm.housingNeedScore}/10
- Employment: ${intakeForm.employmentNeedScore}/10
- Health: ${intakeForm.healthNeedScore}/10
- Mental Health: ${intakeForm.mentalHealthNeedScore}/10
${intakeForm.substanceNeedScore !== undefined ? `- Substance: ${intakeForm.substanceNeedScore}/10` : ""}

Presenting Needs: ${intakeForm.presentingNeeds}
Screening Result: ${intakeForm.screeningResult ?? "Pending"}
${intakeForm.screeningNotes ? `Screening Notes: ${intakeForm.screeningNotes}` : ""}`;

    const aiResponse = await callOpenRouter(systemPrompt, userPrompt);

    let parsed;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] ?? aiResponse);
    } catch {
      parsed = {
        presentingNeeds: [intakeForm.presentingNeeds || "Unable to parse"],
        strengths: [],
        barriers: [],
        recommendedPrograms: [],
        safetyConcerns: [],
        summary: "AI parsing failed — review intake data manually.",
      };
    }

    await ctx.runMutation(internal.aiHelpers.saveNeedsAssessment, {
      clientId: args.clientId,
      intakeFormId: args.intakeFormId,
      presentingNeeds: JSON.stringify(parsed.presentingNeeds ?? []),
      strengths: JSON.stringify(parsed.strengths ?? []),
      barriers: JSON.stringify(parsed.barriers ?? []),
      recommendedPrograms: JSON.stringify(parsed.recommendedPrograms ?? []),
      safetyConcerns: JSON.stringify(parsed.safetyConcerns ?? []),
      summary: parsed.summary ?? "",
    });

    return parsed;
  },
});

// ─── Waitlist Optimization Advisor ───────────────────────────────────

export const generateWaitlistRecommendations = action({
  args: { programId: v.id("programs") },
  handler: async (ctx, args) => {
    const program = await ctx.runQuery(internal.aiHelpers.getProgramInternal, { id: args.programId });
    if (!program) throw new Error("Program not found");

    const waitlistEntries = await ctx.runQuery(internal.aiHelpers.getWaitlistByProgramInternal, { programId: args.programId });

    if (!waitlistEntries || waitlistEntries.length === 0) {
      return { recommendations: [], summary: "No clients on waitlist." };
    }

    const availableSlots = program.totalCapacity - program.currentEnrollment;
    if (availableSlots <= 0) {
      return { recommendations: [], summary: "Program is at full capacity. No slots available." };
    }

    const systemPrompt = `You are a social services waitlist optimization AI. Analyze the waitlist and recommend which clients should be enrolled when slots open. Consider priority score, wait time, and program fit. Return ONLY valid JSON:
{
  "recommendations": [
    {
      "clientName": "<name>",
      "rank": <number>,
      "reason": "<why this client should be next>",
      "priorityScore": <number>,
      "waitDays": <number>,
      "fitScore": "High" | "Medium" | "Low"
    }
  ],
  "summary": "<brief summary of recommendations>"
}`;

    const now = Date.now();
    const clientList = waitlistEntries
      .map((e: any) => {
        const waitDays = Math.round((now - e.addedAt) / (1000 * 60 * 60 * 24));
        return `- ${e.clientName}: Priority Score ${e.priorityScore}, Waiting ${waitDays} days, Position #${e.position}`;
      })
      .join("\n");

    const userPrompt = `Program: ${program.name}
Category: ${program.category}
Available Slots: ${availableSlots}
${program.eligibilityCriteria ? `Eligibility: ${program.eligibilityCriteria}` : ""}

Waitlist (${waitlistEntries.length} clients):
${clientList}

Recommend the top ${Math.min(availableSlots, waitlistEntries.length)} clients for enrollment.`;

    const aiResponse = await callOpenRouter(systemPrompt, userPrompt);

    let parsed;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] ?? aiResponse);
    } catch {
      parsed = {
        recommendations: waitlistEntries.slice(0, availableSlots).map((e: any, i: number) => ({
          clientName: e.clientName,
          rank: i + 1,
          reason: "Highest priority on waitlist",
          priorityScore: e.priorityScore,
          waitDays: Math.round((now - e.addedAt) / (1000 * 60 * 60 * 24)),
          fitScore: "Medium",
        })),
        summary: "AI parsing failed — showing clients by priority score.",
      };
    }

    return parsed;
  },
});

// ─── Client Communication Drafter ────────────────────────────────────

export const draftClientCommunication = action({
  args: {
    clientId: v.id("clients"),
    programId: v.id("programs"),
    communicationType: v.string(),
  },
  handler: async (ctx, args) => {
    const client = await ctx.runQuery(internal.aiHelpers.getClientInternal, { id: args.clientId });
    if (!client) throw new Error("Client not found");

    const program = await ctx.runQuery(internal.aiHelpers.getProgramInternal, { id: args.programId });
    if (!program) throw new Error("Program not found");

    const waitlistEntries = await ctx.runQuery(internal.aiHelpers.getWaitlistByClientInternal, { clientId: args.clientId });
    const entry = waitlistEntries?.find((e: any) => e.programId === args.programId);

    const systemPrompt = `You are a compassionate social services communication AI. Draft a personalized status update for a client on a program waitlist. The tone should be warm, professional, and empathetic. Return ONLY valid JSON:
{
  "subject": "<email/message subject>",
  "body": "<full message body>",
  "estimatedWaitInfo": "<estimated wait time description>",
  "interimResources": ["<resource 1>", "<resource 2>"]
}`;

    const now = Date.now();
    const waitDays = entry ? Math.round((now - entry.addedAt) / (1000 * 60 * 60 * 24)) : 0;
    const position = entry?.position ?? 0;
    const estimatedDays = entry?.estimatedWaitDays ?? null;

    const userPrompt = `Client: ${client.firstName} ${client.lastName}
Program: ${program.name} (${program.category})
Communication Type: ${args.communicationType}
Current Waitlist Position: #${position}
Days Waiting: ${waitDays}
${estimatedDays ? `Estimated Wait: ${estimatedDays} days` : "Estimated Wait: Unknown"}
Program Capacity: ${program.currentEnrollment}/${program.totalCapacity}
Waitlist Size: ${program.waitlistCount}

Draft a ${args.communicationType} for this client about their waitlist status.`;

    const aiResponse = await callOpenRouter(systemPrompt, userPrompt);

    let parsed;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] ?? aiResponse);
    } catch {
      parsed = {
        subject: `Waitlist Update — ${program.name}`,
        body: `Dear ${client.firstName},\n\nThis is an update regarding your position on the waitlist for ${program.name}. You are currently #${position} on the waitlist. We will notify you as soon as a spot becomes available.\n\nThank you for your patience.`,
        estimatedWaitInfo: estimatedDays ? `Approximately ${estimatedDays} days` : "We are unable to provide an estimate at this time",
        interimResources: [],
      };
    }

    return parsed;
  },
});
