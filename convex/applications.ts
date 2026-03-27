import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    status: v.optional(v.string()),
    programId: v.optional(v.id("programs")),
    assignedWorkerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    let applications;
    if (args.programId && args.status) {
      applications = await ctx.db
        .query("applications")
        .withIndex("by_programId_status", (q) =>
          q.eq("programId", args.programId!).eq("status", args.status as any)
        )
        .collect();
    } else if (args.programId) {
      applications = await ctx.db
        .query("applications")
        .withIndex("by_programId", (q) => q.eq("programId", args.programId!))
        .collect();
    } else if (args.status) {
      applications = await ctx.db
        .query("applications")
        .withIndex("by_status", (q) => q.eq("status", args.status as any))
        .collect();
    } else if (args.assignedWorkerId) {
      applications = await ctx.db
        .query("applications")
        .withIndex("by_assignedWorkerId", (q) => q.eq("assignedWorkerId", args.assignedWorkerId!))
        .collect();
    } else {
      applications = await ctx.db.query("applications").collect();
    }

    return await Promise.all(
      applications.map(async (app) => {
        const client = await ctx.db.get(app.clientId);
        const program = await ctx.db.get(app.programId);
        const worker = app.assignedWorkerId ? await ctx.db.get(app.assignedWorkerId) : null;
        return {
          ...app,
          clientName: client ? `${client.firstName} ${client.lastName}` : "Unknown",
          programName: program?.name ?? "Unknown",
          assignedWorkerName: worker?.name ?? undefined,
        };
      })
    );
  },
});

export const getById = query({
  args: { id: v.id("applications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const app = await ctx.db.get(args.id);
    if (!app) return null;

    const client = await ctx.db.get(app.clientId);
    const program = await ctx.db.get(app.programId);
    const worker = app.assignedWorkerId ? await ctx.db.get(app.assignedWorkerId) : null;

    return {
      ...app,
      clientName: client ? `${client.firstName} ${client.lastName}` : "Unknown",
      programName: program?.name ?? "Unknown",
      assignedWorkerName: worker?.name ?? undefined,
    };
  },
});

export const listByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const applications = await ctx.db
      .query("applications")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    return await Promise.all(
      applications.map(async (app) => {
        const program = await ctx.db.get(app.programId);
        return { ...app, programName: program?.name ?? "Unknown" };
      })
    );
  },
});

export const listByProgram = query({
  args: { programId: v.id("programs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const applications = await ctx.db
      .query("applications")
      .withIndex("by_programId", (q) => q.eq("programId", args.programId))
      .collect();

    return await Promise.all(
      applications.map(async (app) => {
        const client = await ctx.db.get(app.clientId);
        return {
          ...app,
          clientName: client ? `${client.firstName} ${client.lastName}` : "Unknown",
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    programId: v.id("programs"),
    notes: v.optional(v.string()),
    priorityLevel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check for duplicate: same client + program with active status
    const existing = await ctx.db
      .query("applications")
      .withIndex("by_clientId_programId", (q) =>
        q.eq("clientId", args.clientId).eq("programId", args.programId)
      )
      .collect();

    const activeStatuses = ["Applied", "Screening", "Waitlisted", "Enrolled", "Active"];
    const duplicate = existing.find((app) => activeStatuses.includes(app.status));
    if (duplicate) {
      throw new Error("Client already has an active application for this program");
    }

    const now = Date.now();
    const urgency = (args.priorityLevel as "Low" | "Medium" | "High" | "Critical") ?? "Medium";

    const id = await ctx.db.insert("applications", {
      clientId: args.clientId,
      programId: args.programId,
      status: "Applied",
      submittedAt: now,
      urgencyLevel: urgency,
      notes: args.notes,
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
        entityType: "applications",
        entityId: id,
        details: "Application submitted",
        createdAt: now,
      });
    }

    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("applications"),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Application not found");

    const previousStatus = existing.status;
    const now = Date.now();
    const updates: Record<string, unknown> = {
      status: args.status as any,
      updatedAt: now,
    };

    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.status === "Screening") updates.screeningCompletedAt = undefined;
    if (args.status === "Enrolled") updates.enrolledAt = now;
    if (args.status === "Completed" || args.status === "Discharged") updates.completedAt = now;

    await ctx.db.patch(args.id, updates);

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "StatusChange",
        entityType: "applications",
        entityId: args.id,
        previousValue: previousStatus,
        details: `Status changed from ${previousStatus} to ${args.status}`,
        createdAt: now,
      });
    }
  },
});

export const assignWorker = mutation({
  args: {
    id: v.id("applications"),
    assignedWorkerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Application not found");

    await ctx.db.patch(args.id, {
      assignedWorkerId: args.assignedWorkerId,
      updatedAt: Date.now(),
    });

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    const worker = await ctx.db.get(args.assignedWorkerId);
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "Update",
        entityType: "applications",
        entityId: args.id,
        details: `Assigned worker: ${worker?.name ?? "Unknown"}`,
        createdAt: Date.now(),
      });
    }

    // Notify the assigned worker
    await ctx.db.insert("notifications", {
      userId: args.assignedWorkerId,
      type: "ApplicationReceived",
      title: "New Application Assigned",
      message: `You have been assigned a new application to review.`,
      link: `/applications/${args.id}`,
      isRead: false,
      relatedEntityId: args.id as string,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("applications"),
    notes: v.optional(v.string()),
    priorityLevel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Application not found");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.priorityLevel !== undefined) updates.urgencyLevel = args.priorityLevel as any;

    await ctx.db.patch(args.id, updates);

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "Update",
        entityType: "applications",
        entityId: args.id,
        details: "Updated application",
        createdAt: Date.now(),
      });
    }
  },
});