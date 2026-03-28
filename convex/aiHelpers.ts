import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Internal Queries (called by AI actions) ─────────────────────────

export const getClientInternal = internalQuery({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getIntakeFormInternal = internalQuery({
  args: { id: v.id("intakeForms") },
  handler: async (ctx, args) => {
    const form = await ctx.db.get(args.id);
    if (!form) return null;
    const application = form.applicationId ? await ctx.db.get(form.applicationId) : null;
    return { ...form, urgencyLevel: application?.urgencyLevel };
  },
});

export const getProgramInternal = internalQuery({
  args: { id: v.id("programs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getWaitlistByProgramInternal = internalQuery({
  args: { programId: v.id("programs") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("waitlistEntries")
      .withIndex("by_programId_status", (q) =>
        q.eq("programId", args.programId).eq("status", "Active")
      )
      .collect();
    entries.sort((a, b) => b.priorityScore - a.priorityScore);
    return await Promise.all(
      entries.map(async (entry, index) => {
        const client = await ctx.db.get(entry.clientId);
        return {
          ...entry,
          position: index + 1,
          clientName: client ? `${client.firstName} ${client.lastName}` : "Unknown",
        };
      })
    );
  },
});

export const getWaitlistByClientInternal = internalQuery({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("waitlistEntries")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
    return await Promise.all(
      entries.map(async (entry) => {
        const program = await ctx.db.get(entry.programId);
        return { ...entry, programName: program?.name ?? "Unknown" };
      })
    );
  },
});

// ─── Internal Mutations (store AI results) ───────────────────────────

export const savePriorityScore = internalMutation({
  args: {
    clientId: v.id("clients"),
    intakeFormId: v.id("intakeForms"),
    score: v.number(),
    factors: v.string(),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("aiPriorityScores")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        intakeFormId: args.intakeFormId,
        score: args.score,
        factors: args.factors,
        summary: args.summary,
        generatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("aiPriorityScores", {
        clientId: args.clientId,
        intakeFormId: args.intakeFormId,
        score: args.score,
        factors: args.factors,
        summary: args.summary,
        generatedAt: Date.now(),
      });
    }

    await ctx.db.patch(args.clientId, {
      riskScore: args.score,
      updatedAt: Date.now(),
    });
  },
});

export const saveNeedsAssessment = internalMutation({
  args: {
    clientId: v.id("clients"),
    intakeFormId: v.id("intakeForms"),
    presentingNeeds: v.string(),
    strengths: v.string(),
    barriers: v.string(),
    recommendedPrograms: v.string(),
    safetyConcerns: v.string(),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("aiNeedsAssessments")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        intakeFormId: args.intakeFormId,
        presentingNeeds: args.presentingNeeds,
        strengths: args.strengths,
        barriers: args.barriers,
        recommendedPrograms: args.recommendedPrograms,
        safetyConcerns: args.safetyConcerns,
        summary: args.summary,
        generatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("aiNeedsAssessments", {
        clientId: args.clientId,
        intakeFormId: args.intakeFormId,
        presentingNeeds: args.presentingNeeds,
        strengths: args.strengths,
        barriers: args.barriers,
        recommendedPrograms: args.recommendedPrograms,
        safetyConcerns: args.safetyConcerns,
        summary: args.summary,
        generatedAt: Date.now(),
      });
    }
  },
});

// ─── Public Queries (called by UI) ──────────────────────────────────

export const getPriorityScore = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("aiPriorityScores")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .first();
  },
});

export const getNeedsAssessment = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("aiNeedsAssessments")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .first();
  },
});
