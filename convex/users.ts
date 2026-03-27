import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    return user;
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db.query("users").collect();
  },
});

export const createOrUpdate = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    const name = [args.firstName, args.lastName].filter(Boolean).join(" ") || "User";
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name,
        ...(args.role ? { role: args.role as "Admin" | "ProgramManager" | "IntakeWorker" | "ClientUser" } : {}),
        ...(args.imageUrl !== undefined ? { avatarUrl: args.imageUrl } : {}),
        lastLoginAt: now,
        updatedAt: now,
      });
      return existing._id;
    }

    const id = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name,
      role: (args.role as "Admin" | "ProgramManager" | "IntakeWorker" | "ClientUser") || "ClientUser",
      isActive: true,
      avatarUrl: args.imageUrl,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: id,
      action: "Create",
      entityType: "users",
      entityId: id,
      details: "User account created",
      createdAt: now,
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    role: v.optional(v.string()),
    phone: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("User not found");

    const { id, firstName, lastName, imageUrl, ...rest } = args;
    const updates: Record<string, unknown> = { ...rest, updatedAt: Date.now() };

    if (firstName !== undefined || lastName !== undefined) {
      const fName = firstName ?? existing.name.split(" ")[0] ?? "";
      const lName = lastName ?? existing.name.split(" ").slice(1).join(" ") ?? "";
      updates.name = [fName, lName].filter(Boolean).join(" ");
    }
    if (args.role) {
      updates.role = args.role as "Admin" | "ProgramManager" | "IntakeWorker" | "ClientUser";
    }
    if (imageUrl !== undefined) {
      updates.avatarUrl = imageUrl;
    }

    await ctx.db.patch(id, updates);

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "Update",
        entityType: "users",
        entityId: id,
        details: `Updated user profile`,
        createdAt: Date.now(),
      });
    }
  },
});