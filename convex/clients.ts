import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const allClients = await ctx.db.query("clients").collect();

    if (!args.search) return allClients;

    const q = args.search.toLowerCase();
    return allClients.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  },
});

export const getById = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const client = await ctx.db.get(args.id);
    if (!client) return null;

    const applications = await ctx.db
      .query("applications")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.id))
      .collect();

    const applicationsWithPrograms = await Promise.all(
      applications.map(async (app) => {
        const program = await ctx.db.get(app.programId);
        return { ...app, programName: program?.name ?? "Unknown" };
      })
    );

    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.id))
      .collect();

    const enrollmentsWithPrograms = await Promise.all(
      enrollments.map(async (enr) => {
        const program = await ctx.db.get(enr.programId);
        return { ...enr, programName: program?.name ?? "Unknown" };
      })
    );

    return { ...client, applications: applicationsWithPrograms, enrollments: enrollmentsWithPrograms };
  },
});

export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const id = await ctx.db.insert("clients", {
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      phone: args.phone ?? "",
      dateOfBirth: args.dateOfBirth ? new Date(args.dateOfBirth).getTime() : now,
      gender: "PreferNotToSay",
      primaryLanguage: "English",
      householdSize: 1,
      incomeLevel: "NoIncome",
      housingStatus: "Housed",
      veteranStatus: false,
      disabilityStatus: false,
      address: args.address,
      createdAt: now,
      updatedAt: now,
    });

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "Create",
        entityType: "clients",
        entityId: id,
        details: `Created client ${args.firstName} ${args.lastName}`,
        createdAt: now,
      });
    }

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("clients"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Client not found");

    const { id, dateOfBirth, notes, ...rest } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (rest.firstName !== undefined) updates.firstName = rest.firstName;
    if (rest.lastName !== undefined) updates.lastName = rest.lastName;
    if (rest.email !== undefined) updates.email = rest.email;
    if (rest.phone !== undefined) updates.phone = rest.phone;
    if (rest.address !== undefined) updates.address = rest.address;
    if (dateOfBirth !== undefined) updates.dateOfBirth = new Date(dateOfBirth).getTime();

    await ctx.db.patch(id, updates);

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "Update",
        entityType: "clients",
        entityId: id,
        details: `Updated client record`,
        createdAt: Date.now(),
      });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Client not found");

    await ctx.db.delete(args.id);

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "Delete",
        entityType: "clients",
        entityId: args.id,
        details: `Deleted client ${existing.firstName} ${existing.lastName}`,
        createdAt: Date.now(),
      });
    }
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const allClients = await ctx.db.query("clients").collect();
    const q = args.query.toLowerCase();
    return allClients.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  },
});