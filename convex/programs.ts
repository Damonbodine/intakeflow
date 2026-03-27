import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    category: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    let programs;
    if (args.category && args.status) {
      programs = await ctx.db
        .query("programs")
        .withIndex("by_category_status", (q) =>
          q.eq("category", args.category as any).eq("status", args.status as any)
        )
        .collect();
    } else if (args.category) {
      programs = await ctx.db
        .query("programs")
        .withIndex("by_category", (q) => q.eq("category", args.category as any))
        .collect();
    } else if (args.status) {
      programs = await ctx.db
        .query("programs")
        .withIndex("by_status", (q) => q.eq("status", args.status as any))
        .collect();
    } else {
      programs = await ctx.db.query("programs").collect();
    }

    return await Promise.all(
      programs.map(async (p) => {
        const manager = await ctx.db.get(p.managerId);
        return { ...p, managerName: manager?.name ?? "Unassigned" };
      })
    );
  },
});

export const getById = query({
  args: { id: v.id("programs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const program = await ctx.db.get(args.id);
    if (!program) return null;

    const manager = await ctx.db.get(program.managerId);
    return { ...program, managerName: manager?.name ?? "Unassigned" };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.string(),
    status: v.optional(v.string()),
    capacity: v.number(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    eligibilityCriteria: v.optional(v.string()),
    managerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!currentUser) throw new Error("User not found");

    const now = Date.now();
    const id = await ctx.db.insert("programs", {
      name: args.name,
      description: args.description,
      category: args.category as any,
      status: (args.status as any) ?? "Draft",
      totalCapacity: args.capacity,
      currentEnrollment: 0,
      waitlistCount: 0,
      managerId: args.managerId ?? currentUser._id,
      location: undefined,
      startDate: args.startDate ? new Date(args.startDate).getTime() : now,
      endDate: args.endDate ? new Date(args.endDate).getTime() : undefined,
      eligibilityCriteria: args.eligibilityCriteria,
      requiresScreening: true,
      isRecurring: false,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: currentUser._id,
      action: "Create",
      entityType: "programs",
      entityId: id,
      details: `Created program: ${args.name}`,
      createdAt: now,
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("programs"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    status: v.optional(v.string()),
    capacity: v.optional(v.number()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    eligibilityCriteria: v.optional(v.string()),
    managerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Program not found");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.category !== undefined) updates.category = args.category as any;
    if (args.status !== undefined) updates.status = args.status as any;
    if (args.capacity !== undefined) updates.totalCapacity = args.capacity;
    if (args.startDate !== undefined) updates.startDate = new Date(args.startDate).getTime();
    if (args.endDate !== undefined) updates.endDate = new Date(args.endDate).getTime();
    if (args.eligibilityCriteria !== undefined) updates.eligibilityCriteria = args.eligibilityCriteria;
    if (args.managerId !== undefined) updates.managerId = args.managerId;

    await ctx.db.patch(args.id, updates);

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "Update",
        entityType: "programs",
        entityId: args.id,
        details: `Updated program: ${args.name ?? existing.name}`,
        createdAt: Date.now(),
      });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("programs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Program not found");

    await ctx.db.delete(args.id);

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "Delete",
        entityType: "programs",
        entityId: args.id,
        details: `Deleted program: ${existing.name}`,
        createdAt: Date.now(),
      });
    }
  },
});