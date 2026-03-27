import { query } from "./_generated/server";
import { v } from "convex/values";

export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { totalPrograms: 0, totalClients: 0, activeApplications: 0, activeEnrollments: 0, waitlistCount: 0, recentApplications: [] };

    const programs = await ctx.db.query("programs").collect();
    const clients = await ctx.db.query("clients").collect();

    const activeApplications = await ctx.db
      .query("applications")
      .withIndex("by_status", (q) => q.eq("status", "Applied"))
      .collect();
    const screeningApplications = await ctx.db
      .query("applications")
      .withIndex("by_status", (q) => q.eq("status", "Screening"))
      .collect();

    const activeEnrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .collect();

    const totalWaitlist = programs.reduce((sum, p) => sum + p.waitlistCount, 0);

    // Get recent applications (last 10)
    const allApplications = await ctx.db.query("applications").collect();
    allApplications.sort((a, b) => b.createdAt - a.createdAt);
    const recentApps = allApplications.slice(0, 10);

    const recentApplications = await Promise.all(
      recentApps.map(async (app) => {
        const client = await ctx.db.get(app.clientId);
        const program = await ctx.db.get(app.programId);
        return {
          _id: app._id,
          clientName: client ? `${client.firstName} ${client.lastName}` : "Unknown",
          programName: program?.name ?? "Unknown",
          status: app.status,
          submittedAt: app.submittedAt,
          urgencyLevel: app.urgencyLevel,
        };
      })
    );

    return {
      totalPrograms: programs.length,
      totalClients: clients.length,
      activeApplications: activeApplications.length + screeningApplications.length,
      activeEnrollments: activeEnrollments.length,
      waitlistCount: totalWaitlist,
      recentApplications,
    };
  },
});

export const getManagerStats = query({
  args: { managerId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { managedPrograms: [], programApplications: 0, programEnrollments: 0, programWaitlist: 0, recentActivity: [] };

    const managedPrograms = await ctx.db
      .query("programs")
      .withIndex("by_managerId", (q) => q.eq("managerId", args.managerId))
      .collect();

    let totalApplications = 0;
    let totalEnrollments = 0;
    let totalWaitlist = 0;
    const allActivity: Array<{ _id: string; type: string; description: string; createdAt: number }> = [];

    for (const program of managedPrograms) {
      const apps = await ctx.db
        .query("applications")
        .withIndex("by_programId", (q) => q.eq("programId", program._id))
        .collect();
      const activeApps = apps.filter((a) => ["Applied", "Screening", "Waitlisted"].includes(a.status));
      totalApplications += activeApps.length;

      const enrollments = await ctx.db
        .query("enrollments")
        .withIndex("by_programId_status", (q) => q.eq("programId", program._id).eq("status", "Active"))
        .collect();
      totalEnrollments += enrollments.length;

      totalWaitlist += program.waitlistCount;

      // Collect recent activity from applications
      for (const app of apps.slice(-5)) {
        const client = await ctx.db.get(app.clientId);
        allActivity.push({
          _id: app._id as string,
          type: "application",
          description: `${client ? `${client.firstName} ${client.lastName}` : "Unknown"} - ${app.status} (${program.name})`,
          createdAt: app.updatedAt,
        });
      }
    }

    allActivity.sort((a, b) => b.createdAt - a.createdAt);

    return {
      managedPrograms: managedPrograms.map((p) => ({
        _id: p._id,
        name: p.name,
        status: p.status,
        currentEnrollment: p.currentEnrollment,
        totalCapacity: p.totalCapacity,
        waitlistCount: p.waitlistCount,
      })),
      programApplications: totalApplications,
      programEnrollments: totalEnrollments,
      programWaitlist: totalWaitlist,
      recentActivity: allActivity.slice(0, 10),
    };
  },
});

export const getIntakeWorkerStats = query({
  args: { workerId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { assignedApplications: 0, pendingReviews: 0, completedScreenings: 0, recentAssignments: [] };

    const assignedApps = await ctx.db
      .query("applications")
      .withIndex("by_assignedWorkerId", (q) => q.eq("assignedWorkerId", args.workerId))
      .collect();

    const pendingReviews = assignedApps.filter((a) => ["Applied", "Screening"].includes(a.status)).length;

    const completedForms = await ctx.db
      .query("intakeForms")
      .withIndex("by_workerId", (q) => q.eq("workerId", args.workerId))
      .collect();
    const completedScreenings = completedForms.filter((f) => f.status === "Completed").length;

    // Recent assignments sorted by date
    const recentApps = [...assignedApps].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 10);
    const recentAssignments = await Promise.all(
      recentApps.map(async (app) => {
        const client = await ctx.db.get(app.clientId);
        const program = await ctx.db.get(app.programId);
        return {
          _id: app._id,
          clientName: client ? `${client.firstName} ${client.lastName}` : "Unknown",
          programName: program?.name ?? "Unknown",
          status: app.status,
          urgencyLevel: app.urgencyLevel,
          submittedAt: app.submittedAt,
        };
      })
    );

    return {
      assignedApplications: assignedApps.length,
      pendingReviews,
      completedScreenings,
      recentAssignments,
    };
  },
});