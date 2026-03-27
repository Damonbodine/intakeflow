import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByProgram = query({
  args: { programId: v.id("programs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("programSlots")
      .withIndex("by_programId", (q) => q.eq("programId", args.programId))
      .collect();
  },
});

export const create = mutation({
  args: {
    programId: v.id("programs"),
    totalSlots: v.number(),
    availableSlots: v.number(),
    period: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const id = await ctx.db.insert("programSlots", {
      programId: args.programId,
      slotType: "General",
      totalCapacity: args.totalSlots,
      filledCount: args.totalSlots - args.availableSlots,
      description: args.period,
      eligibilityNotes: args.notes,
      isActive: true,
      createdAt: now,
    });

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "Create",
        entityType: "programSlots",
        entityId: id,
        details: `Created program slot with ${args.totalSlots} total slots`,
        createdAt: now,
      });
    }

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("programSlots"),
    totalSlots: v.optional(v.number()),
    availableSlots: v.optional(v.number()),
    period: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Program slot not found");

    const updates: Record<string, unknown> = {};
    if (args.totalSlots !== undefined) updates.totalCapacity = args.totalSlots;
    if (args.availableSlots !== undefined) updates.filledCount = (args.totalSlots ?? existing.totalCapacity) - args.availableSlots;
    if (args.period !== undefined) updates.description = args.period;
    if (args.notes !== undefined) updates.eligibilityNotes = args.notes;

    await ctx.db.patch(args.id, updates);

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "Update",
        entityType: "programSlots",
        entityId: args.id,
        details: "Program slot updated",
        createdAt: Date.now(),
      });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("programSlots") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Program slot not found");

    await ctx.db.delete(args.id);

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "Delete",
        entityType: "programSlots",
        entityId: args.id,
        details: "Program slot removed",
        createdAt: Date.now(),
      });
    }
  },
});