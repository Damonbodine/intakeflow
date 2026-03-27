import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByProgram = query({
  args: { programId: v.id("programs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const entries = await ctx.db
      .query("waitlistEntries")
      .withIndex("by_programId_status", (q) =>
        q.eq("programId", args.programId).eq("status", "Active")
      )
      .collect();

    // Sort by priorityScore descending
    entries.sort((a, b) => b.priorityScore - a.priorityScore);

    return await Promise.all(
      entries.map(async (entry, index) => {
        const client = await ctx.db.get(entry.clientId);
        const application = await ctx.db.get(entry.applicationId);
        return {
          ...entry,
          position: index + 1,
          clientName: client ? `${client.firstName} ${client.lastName}` : "Unknown",
          applicationStatus: application?.status ?? "Unknown",
        };
      })
    );
  },
});

export const listByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const entries = await ctx.db
      .query("waitlistEntries")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    return await Promise.all(
      entries.map(async (entry) => {
        const program = await ctx.db.get(entry.programId);
        return {
          ...entry,
          programName: program?.name ?? "Unknown",
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    programId: v.id("programs"),
    applicationId: v.optional(v.id("applications")),
    priorityScore: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get current max position for program waitlist
    const existingEntries = await ctx.db
      .query("waitlistEntries")
      .withIndex("by_programId_status", (q) =>
        q.eq("programId", args.programId).eq("status", "Active")
      )
      .collect();

    const maxPosition = existingEntries.reduce((max, e) => Math.max(max, e.position), 0);
    const now = Date.now();

    // If applicationId not provided, find or throw
    let applicationId = args.applicationId;
    if (!applicationId) {
      const app = await ctx.db
        .query("applications")
        .withIndex("by_clientId_programId", (q) =>
          q.eq("clientId", args.clientId).eq("programId", args.programId)
        )
        .first();
      if (!app) throw new Error("No application found for this client and program");
      applicationId = app._id;
    }

    const id = await ctx.db.insert("waitlistEntries", {
      applicationId,
      programId: args.programId,
      clientId: args.clientId,
      position: maxPosition + 1,
      priorityScore: args.priorityScore ?? 0,
      status: "Active",
      addedAt: now,
      createdAt: now,
    });

    // Increment program waitlist count
    const program = await ctx.db.get(args.programId);
    if (program) {
      await ctx.db.patch(args.programId, {
        waitlistCount: program.waitlistCount + 1,
        updatedAt: now,
      });
    }

    // Update application status
    if (applicationId) {
      await ctx.db.patch(applicationId, {
        status: "Waitlisted",
        updatedAt: now,
      });
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "Create",
        entityType: "waitlistEntries",
        entityId: id,
        details: "Added to waitlist",
        createdAt: now,
      });
    }

    return id;
  },
});

export const promote = mutation({
  args: { id: v.id("waitlistEntries") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const entry = await ctx.db.get(args.id);
    if (!entry) throw new Error("Waitlist entry not found");
    if (entry.status !== "Active") throw new Error("Entry is not active");

    const program = await ctx.db.get(entry.programId);
    if (!program) throw new Error("Program not found");

    // Check capacity
    if (program.currentEnrollment >= program.totalCapacity) {
      throw new Error("Program is at full capacity");
    }

    const now = Date.now();

    // Mark waitlist entry as promoted
    await ctx.db.patch(args.id, {
      status: "Promoted",
      promotedAt: now,
    });

    // Create enrollment
    const enrollmentId = await ctx.db.insert("enrollments", {
      clientId: entry.clientId,
      programId: entry.programId,
      applicationId: entry.applicationId,
      startDate: now,
      status: "Active",
      createdAt: now,
      updatedAt: now,
    });

    // Update application status
    await ctx.db.patch(entry.applicationId, {
      status: "Enrolled",
      enrolledAt: now,
      updatedAt: now,
    });

    // Update program counts
    await ctx.db.patch(entry.programId, {
      currentEnrollment: program.currentEnrollment + 1,
      waitlistCount: Math.max(0, program.waitlistCount - 1),
      updatedAt: now,
    });

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "Enroll",
        entityType: "waitlistEntries",
        entityId: args.id,
        details: "Promoted from waitlist to enrollment",
        createdAt: now,
      });
    }

    return enrollmentId;
  },
});

export const withdraw = mutation({
  args: {
    id: v.id("waitlistEntries"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const entry = await ctx.db.get(args.id);
    if (!entry) throw new Error("Waitlist entry not found");

    const now = Date.now();
    await ctx.db.patch(args.id, { status: "Withdrawn" });

    // Update application status
    await ctx.db.patch(entry.applicationId, {
      status: "Withdrawn",
      updatedAt: now,
    });

    // Decrement program waitlist count
    const program = await ctx.db.get(entry.programId);
    if (program) {
      await ctx.db.patch(entry.programId, {
        waitlistCount: Math.max(0, program.waitlistCount - 1),
        updatedAt: now,
      });
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "StatusChange",
        entityType: "waitlistEntries",
        entityId: args.id,
        details: `Withdrawn from waitlist${args.reason ? `: ${args.reason}` : ""}`,
        createdAt: now,
      });
    }
  },
});

export const updatePriority = mutation({
  args: {
    id: v.id("waitlistEntries"),
    priorityScore: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const entry = await ctx.db.get(args.id);
    if (!entry) throw new Error("Waitlist entry not found");

    await ctx.db.patch(args.id, { priorityScore: args.priorityScore });

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "Update",
        entityType: "waitlistEntries",
        entityId: args.id,
        details: `Priority score updated to ${args.priorityScore}`,
        createdAt: Date.now(),
      });
    }
  },
});