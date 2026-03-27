import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    status: v.optional(v.string()),
    programId: v.optional(v.id("programs")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    let enrollments;
    if (args.programId && args.status) {
      enrollments = await ctx.db
        .query("enrollments")
        .withIndex("by_programId_status", (q) =>
          q.eq("programId", args.programId!).eq("status", args.status as any)
        )
        .collect();
    } else if (args.programId) {
      enrollments = await ctx.db
        .query("enrollments")
        .withIndex("by_programId", (q) => q.eq("programId", args.programId!))
        .collect();
    } else if (args.status) {
      enrollments = await ctx.db
        .query("enrollments")
        .withIndex("by_status", (q) => q.eq("status", args.status as any))
        .collect();
    } else {
      enrollments = await ctx.db.query("enrollments").collect();
    }

    return await Promise.all(
      enrollments.map(async (enr) => {
        const client = await ctx.db.get(enr.clientId);
        const program = await ctx.db.get(enr.programId);
        const staff = enr.assignedStaffId ? await ctx.db.get(enr.assignedStaffId) : null;
        return {
          ...enr,
          clientName: client ? `${client.firstName} ${client.lastName}` : "Unknown",
          programName: program?.name ?? "Unknown",
          assignedStaffName: staff?.name ?? undefined,
        };
      })
    );
  },
});

export const getById = query({
  args: { id: v.id("enrollments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const enrollment = await ctx.db.get(args.id);
    if (!enrollment) return null;

    const client = await ctx.db.get(enrollment.clientId);
    const program = await ctx.db.get(enrollment.programId);
    const staff = enrollment.assignedStaffId ? await ctx.db.get(enrollment.assignedStaffId) : null;

    return {
      ...enrollment,
      clientName: client ? `${client.firstName} ${client.lastName}` : "Unknown",
      programName: program?.name ?? "Unknown",
      assignedStaffName: staff?.name ?? undefined,
    };
  },
});

export const listByProgram = query({
  args: { programId: v.id("programs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_programId", (q) => q.eq("programId", args.programId))
      .collect();

    return await Promise.all(
      enrollments.map(async (enr) => {
        const client = await ctx.db.get(enr.clientId);
        return {
          ...enr,
          clientName: client ? `${client.firstName} ${client.lastName}` : "Unknown",
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

    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    return await Promise.all(
      enrollments.map(async (enr) => {
        const program = await ctx.db.get(enr.programId);
        return {
          ...enr,
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
    startDate: v.string(),
    expectedEndDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const program = await ctx.db.get(args.programId);
    if (!program) throw new Error("Program not found");

    // Check capacity
    if (program.currentEnrollment >= program.totalCapacity) {
      throw new Error("Program is at full capacity. Client must be added to the waitlist.");
    }

    // Check screening requirement
    if (program.requiresScreening && args.applicationId) {
      const intakeForm = await ctx.db
        .query("intakeForms")
        .withIndex("by_applicationId", (q) => q.eq("applicationId", args.applicationId!))
        .first();
      if (!intakeForm || intakeForm.status !== "Completed") {
        throw new Error("Screening must be completed before enrollment");
      }
      if (intakeForm.screeningResult === "Ineligible") {
        throw new Error("Client was found ineligible during screening");
      }
    }

    const now = Date.now();
    const id = await ctx.db.insert("enrollments", {
      clientId: args.clientId,
      programId: args.programId,
      applicationId: args.applicationId ?? ("" as any),
      startDate: new Date(args.startDate).getTime(),
      expectedEndDate: args.expectedEndDate ? new Date(args.expectedEndDate).getTime() : undefined,
      status: "Active",
      progressNotes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    // Update program enrollment count
    await ctx.db.patch(args.programId, {
      currentEnrollment: program.currentEnrollment + 1,
      status: program.currentEnrollment + 1 >= program.totalCapacity ? "Full" : program.status,
      updatedAt: now,
    });

    // Update application status if provided
    if (args.applicationId) {
      await ctx.db.patch(args.applicationId, {
        status: "Enrolled",
        enrolledAt: now,
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
        action: "Enroll",
        entityType: "enrollments",
        entityId: id,
        details: `Enrolled in program: ${program.name}`,
        createdAt: now,
      });
    }

    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("enrollments"),
    status: v.string(),
    endDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const enrollment = await ctx.db.get(args.id);
    if (!enrollment) throw new Error("Enrollment not found");

    const previousStatus = enrollment.status;
    const now = Date.now();

    const updates: Record<string, unknown> = {
      status: args.status as any,
      updatedAt: now,
    };
    if (args.endDate) updates.actualEndDate = new Date(args.endDate).getTime();
    if (args.notes) updates.dischargeReason = args.notes;

    await ctx.db.patch(args.id, updates);

    // If completing or discharging, decrement enrollment count and auto-promote from waitlist
    if (
      (args.status === "Completed" || args.status === "Discharged") &&
      previousStatus === "Active"
    ) {
      const program = await ctx.db.get(enrollment.programId);
      if (program) {
        await ctx.db.patch(enrollment.programId, {
          currentEnrollment: Math.max(0, program.currentEnrollment - 1),
          status: program.status === "Full" ? "Active" : program.status,
          updatedAt: now,
        });

        // Auto-promote highest priority waitlist entry
        const waitlistEntries = await ctx.db
          .query("waitlistEntries")
          .withIndex("by_programId_status", (q) =>
            q.eq("programId", enrollment.programId).eq("status", "Active")
          )
          .collect();

        if (waitlistEntries.length > 0) {
          // Find highest priority
          waitlistEntries.sort((a, b) => b.priorityScore - a.priorityScore);
          const topEntry = waitlistEntries[0];

          // Promote: create enrollment
          const newEnrollmentId = await ctx.db.insert("enrollments", {
            clientId: topEntry.clientId,
            programId: topEntry.programId,
            applicationId: topEntry.applicationId,
            startDate: now,
            status: "Active",
            createdAt: now,
            updatedAt: now,
          });

          // Update waitlist entry
          await ctx.db.patch(topEntry._id, {
            status: "Promoted",
            promotedAt: now,
          });

          // Update application
          await ctx.db.patch(topEntry.applicationId, {
            status: "Enrolled",
            enrolledAt: now,
            updatedAt: now,
          });

          // Update program counts (enrollment goes back up, waitlist goes down)
          const updatedProgram = await ctx.db.get(enrollment.programId);
          if (updatedProgram) {
            await ctx.db.patch(enrollment.programId, {
              currentEnrollment: updatedProgram.currentEnrollment + 1,
              waitlistCount: Math.max(0, updatedProgram.waitlistCount - 1),
              updatedAt: now,
            });
          }

          // Notify promoted client
          const client = await ctx.db.get(topEntry.clientId);
          const clientUser = client
            ? await ctx.db
                .query("users")
                .filter((q) => q.eq(q.field("clientId"), topEntry.clientId))
                .first()
            : null;
          if (clientUser) {
            await ctx.db.insert("notifications", {
              userId: clientUser._id,
              type: "EnrollmentConfirmed",
              title: "Enrollment Confirmed",
              message: `You have been promoted from the waitlist and enrolled in ${program.name}.`,
              link: `/enrollments/${newEnrollmentId}`,
              isRead: false,
              relatedEntityId: newEnrollmentId as string,
              createdAt: now,
            });
          }
        }
      }

      // Update the application status for the discharged/completed enrollment
      if (enrollment.applicationId) {
        await ctx.db.patch(enrollment.applicationId, {
          status: args.status as any,
          completedAt: now,
          updatedAt: now,
        });
      }
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: args.status === "Discharged" ? "Discharge" : "StatusChange",
        entityType: "enrollments",
        entityId: args.id,
        previousValue: previousStatus,
        details: `Enrollment status changed from ${previousStatus} to ${args.status}`,
        createdAt: now,
      });
    }
  },
});

export const assignStaff = mutation({
  args: {
    id: v.id("enrollments"),
    staffId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const enrollment = await ctx.db.get(args.id);
    if (!enrollment) throw new Error("Enrollment not found");

    // Check staff caseload
    const staffAssignment = await ctx.db
      .query("staffAssignments")
      .withIndex("by_staffId_programId", (q) =>
        q.eq("staffId", args.staffId).eq("programId", enrollment.programId)
      )
      .first();

    if (staffAssignment && staffAssignment.caseloadCount >= staffAssignment.maxCaseload) {
      throw new Error("Staff member has reached maximum caseload for this program");
    }

    await ctx.db.patch(args.id, {
      assignedStaffId: args.staffId,
      updatedAt: Date.now(),
    });

    // Increment staff caseload
    if (staffAssignment) {
      await ctx.db.patch(staffAssignment._id, {
        caseloadCount: staffAssignment.caseloadCount + 1,
      });
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    const staff = await ctx.db.get(args.staffId);
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "Update",
        entityType: "enrollments",
        entityId: args.id,
        details: `Assigned staff: ${staff?.name ?? "Unknown"}`,
        createdAt: Date.now(),
      });
    }
  },
});

export const update = mutation({
  args: {
    id: v.id("enrollments"),
    startDate: v.optional(v.string()),
    expectedEndDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Enrollment not found");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.startDate) updates.startDate = new Date(args.startDate).getTime();
    if (args.expectedEndDate) updates.expectedEndDate = new Date(args.expectedEndDate).getTime();
    if (args.notes !== undefined) updates.progressNotes = args.notes;

    await ctx.db.patch(args.id, updates);

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "Update",
        entityType: "enrollments",
        entityId: args.id,
        details: "Updated enrollment",
        createdAt: Date.now(),
      });
    }
  },
});