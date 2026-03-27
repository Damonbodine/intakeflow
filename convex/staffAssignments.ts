import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const assignments = await ctx.db.query("staffAssignments").collect();

    return await Promise.all(
      assignments.map(async (a) => {
        const staff = await ctx.db.get(a.staffId);
        const program = await ctx.db.get(a.programId);
        return {
          ...a,
          staffName: staff?.name ?? "Unknown",
          programName: program?.name ?? "Unknown",
        };
      })
    );
  },
});

export const listByProgram = query({
  args: { programId: v.id("programs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const assignments = await ctx.db
      .query("staffAssignments")
      .withIndex("by_programId", (q) => q.eq("programId", args.programId))
      .collect();

    return await Promise.all(
      assignments.map(async (a) => {
        const staff = await ctx.db.get(a.staffId);
        return {
          ...a,
          staffName: staff?.name ?? "Unknown",
        };
      })
    );
  },
});

export const listByStaff = query({
  args: { staffId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const assignments = await ctx.db
      .query("staffAssignments")
      .withIndex("by_staffId", (q) => q.eq("staffId", args.staffId))
      .collect();

    return await Promise.all(
      assignments.map(async (a) => {
        const program = await ctx.db.get(a.programId);
        return {
          ...a,
          programName: program?.name ?? "Unknown",
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    staffId: v.id("users"),
    programId: v.id("programs"),
    role: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const id = await ctx.db.insert("staffAssignments", {
      staffId: args.staffId,
      programId: args.programId,
      role: args.role as any,
      caseloadCount: 0,
      maxCaseload: 25,
      isActive: true,
      startDate: args.startDate ? new Date(args.startDate).getTime() : now,
      endDate: args.endDate ? new Date(args.endDate).getTime() : undefined,
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
        entityType: "staffAssignments",
        entityId: id,
        details: "Staff assigned to program",
        createdAt: now,
      });
    }

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("staffAssignments"),
    role: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Staff assignment not found");

    const updates: Record<string, unknown> = {};
    if (args.role !== undefined) updates.role = args.role as any;
    if (args.startDate !== undefined) updates.startDate = new Date(args.startDate).getTime();
    if (args.endDate !== undefined) updates.endDate = new Date(args.endDate).getTime();

    await ctx.db.patch(args.id, updates);

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "Update",
        entityType: "staffAssignments",
        entityId: args.id,
        details: "Staff assignment updated",
        createdAt: Date.now(),
      });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("staffAssignments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Staff assignment not found");

    await ctx.db.delete(args.id);

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "Delete",
        entityType: "staffAssignments",
        entityId: args.id,
        details: "Staff assignment removed",
        createdAt: Date.now(),
      });
    }
  },
});