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

    let forms;
    if (args.status) {
      forms = await ctx.db
        .query("intakeForms")
        .withIndex("by_status", (q) => q.eq("status", args.status as any))
        .collect();
    } else {
      forms = await ctx.db.query("intakeForms").collect();
    }

    // If programId filter, we need to join through applications
    if (args.programId) {
      const programApps = await ctx.db
        .query("applications")
        .withIndex("by_programId", (q) => q.eq("programId", args.programId!))
        .collect();
      const appIds = new Set(programApps.map((a) => a._id as string));
      forms = forms.filter((f) => f.applicationId && appIds.has(f.applicationId as string));
    }

    return await Promise.all(
      forms.map(async (form) => {
        const client = await ctx.db.get(form.clientId);
        const worker = await ctx.db.get(form.workerId);
        return {
          ...form,
          clientName: client ? `${client.firstName} ${client.lastName}` : "Unknown",
          workerName: worker?.name ?? "Unknown",
        };
      })
    );
  },
});

export const getById = query({
  args: { id: v.id("intakeForms") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const form = await ctx.db.get(args.id);
    if (!form) return null;

    const client = await ctx.db.get(form.clientId);
    const worker = await ctx.db.get(form.workerId);
    const application = form.applicationId ? await ctx.db.get(form.applicationId) : null;
    const program = application ? await ctx.db.get(application.programId) : null;

    return {
      ...form,
      clientName: client ? `${client.firstName} ${client.lastName}` : "Unknown",
      workerName: worker?.name ?? "Unknown",
      programName: program?.name ?? undefined,
    };
  },
});

export const listByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("intakeForms")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});

export const getByApplication = query({
  args: { applicationId: v.id("applications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("intakeForms")
      .withIndex("by_applicationId", (q) => q.eq("applicationId", args.applicationId))
      .first();
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    applicationId: v.id("applications"),
    programId: v.id("programs"),
    formData: v.optional(v.string()),
    notes: v.optional(v.string()),
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
    const id = await ctx.db.insert("intakeForms", {
      clientId: args.clientId,
      workerId: currentUser._id,
      applicationId: args.applicationId,
      formType: "InitialIntake",
      presentingNeeds: args.notes ?? "",
      housingNeedScore: 0,
      employmentNeedScore: 0,
      healthNeedScore: 0,
      mentalHealthNeedScore: 0,
      overallAssessmentScore: 0,
      status: "Draft",
      createdAt: now,
    });

    // Update application status to Screening
    await ctx.db.patch(args.applicationId, {
      status: "Screening",
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      userId: currentUser._id,
      action: "Create",
      entityType: "intakeForms",
      entityId: id,
      details: "Intake form created",
      createdAt: now,
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("intakeForms"),
    formData: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Intake form not found");

    const updates: Record<string, unknown> = { status: "InProgress" as const };
    if (args.notes !== undefined) updates.presentingNeeds = args.notes;

    // If formData is provided, parse scores from it
    if (args.formData) {
      try {
        const data = JSON.parse(args.formData);
        if (data.housingNeedScore !== undefined) updates.housingNeedScore = data.housingNeedScore;
        if (data.employmentNeedScore !== undefined) updates.employmentNeedScore = data.employmentNeedScore;
        if (data.healthNeedScore !== undefined) updates.healthNeedScore = data.healthNeedScore;
        if (data.mentalHealthNeedScore !== undefined) updates.mentalHealthNeedScore = data.mentalHealthNeedScore;
        if (data.substanceNeedScore !== undefined) updates.substanceNeedScore = data.substanceNeedScore;
        if (data.screeningNotes !== undefined) updates.screeningNotes = data.screeningNotes;
      } catch {
        // formData is not JSON, treat as notes
        updates.screeningNotes = args.formData;
      }
    }

    await ctx.db.patch(args.id, updates);

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "Update",
        entityType: "intakeForms",
        entityId: args.id,
        details: "Intake form updated",
        createdAt: Date.now(),
      });
    }
  },
});

export const complete = mutation({
  args: {
    id: v.id("intakeForms"),
    screeningResult: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const form = await ctx.db.get(args.id);
    if (!form) throw new Error("Intake form not found");

    // Compute overall assessment score
    const scores = [
      form.housingNeedScore,
      form.employmentNeedScore,
      form.healthNeedScore,
      form.mentalHealthNeedScore,
    ];
    if (form.substanceNeedScore !== undefined) scores.push(form.substanceNeedScore);
    const overallAssessmentScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    // Compute priority score: overallAssessmentScore * 0.7 + urgencyValue * 0.3
    let urgencyValue = 30; // default Medium
    if (form.applicationId) {
      const application = await ctx.db.get(form.applicationId);
      if (application) {
        const urgencyMap: Record<string, number> = {
          Low: 10,
          Medium: 30,
          High: 60,
          Critical: 100,
        };
        urgencyValue = urgencyMap[application.urgencyLevel] ?? 30;
      }
    }
    const priorityScore = Math.round(overallAssessmentScore * 0.7 + urgencyValue * 0.3);

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "Completed",
      completedAt: now,
      overallAssessmentScore: Math.round(overallAssessmentScore),
      screeningResult: args.screeningResult as any,
      screeningNotes: args.notes ?? form.screeningNotes,
    });

    // Update application with screening result and priority score
    if (form.applicationId) {
      const newStatus = args.screeningResult === "Eligible" ? "Screening" : "Screening";
      await ctx.db.patch(form.applicationId, {
        priorityScore,
        screeningCompletedAt: now,
        status: newStatus,
        updatedAt: now,
      });
    }

    // Update client risk score
    await ctx.db.patch(form.clientId, {
      riskScore: priorityScore,
      updatedAt: now,
    });

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (currentUser) {
      await ctx.db.insert("auditLogs", {
        userId: currentUser._id,
        action: "StatusChange",
        entityType: "intakeForms",
        entityId: args.id,
        details: `Screening completed: ${args.screeningResult}, priority score: ${priorityScore}`,
        createdAt: now,
      });
    }
  },
});