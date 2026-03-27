import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    action: v.optional(v.string()),
    entityType: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    let logs;
    if (args.action) {
      logs = await ctx.db
        .query("auditLogs")
        .withIndex("by_action", (q) => q.eq("action", args.action as any))
        .collect();
    } else if (args.entityType) {
      logs = await ctx.db
        .query("auditLogs")
        .withIndex("by_entityType", (q) => q.eq("entityType", args.entityType!))
        .collect();
    } else if (args.userId) {
      logs = await ctx.db
        .query("auditLogs")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId!))
        .collect();
    } else {
      logs = await ctx.db.query("auditLogs").collect();
    }

    // Apply date filters
    if (args.startDate) {
      const startTs = new Date(args.startDate).getTime();
      logs = logs.filter((l) => l.createdAt >= startTs);
    }
    if (args.endDate) {
      const endTs = new Date(args.endDate).getTime();
      logs = logs.filter((l) => l.createdAt <= endTs);
    }

    // Sort by createdAt descending
    logs.sort((a, b) => b.createdAt - a.createdAt);

    // Resolve user names
    return await Promise.all(
      logs.map(async (log) => {
        const user = await ctx.db.get(log.userId);
        return {
          ...log,
          userName: user?.name ?? "Unknown",
        };
      })
    );
  },
});

export const getById = query({
  args: { id: v.id("auditLogs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const log = await ctx.db.get(args.id);
    if (!log) return null;

    const user = await ctx.db.get(log.userId);
    return { ...log, userName: user?.name ?? "Unknown" };
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    details: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const id = await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: args.action as any,
      entityType: args.entityType,
      entityId: args.entityId,
      details: args.details,
      createdAt: Date.now(),
    });

    return id;
  },
});