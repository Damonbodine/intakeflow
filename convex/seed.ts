import { internalMutation } from "./_generated/server";

export const seedAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Idempotent check — skip if data already exists
    const existing = await ctx.db.query("users").take(1);
    if (existing.length > 0) return;

    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
    const threeMonthsAgo = now - 90 * 24 * 60 * 60 * 1000;
    const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;

    // ── 1. Users (one per role) ──────────────────────────────────
    const adminId = await ctx.db.insert("users", {
      clerkId: "user_admin_001",
      name: "Sarah Johnson",
      email: "sarah@intakeflow.org",
      phone: "512-555-0101",
      role: "Admin",
      isActive: true,
      department: "Administration",
      title: "Executive Director",
      createdAt: sixMonthsAgo,
      updatedAt: now,
    });

    const pmId = await ctx.db.insert("users", {
      clerkId: "user_pm_001",
      name: "Marcus Rivera",
      email: "marcus@intakeflow.org",
      phone: "512-555-0102",
      role: "ProgramManager",
      isActive: true,
      department: "Programs",
      title: "Senior Program Manager",
      createdAt: sixMonthsAgo,
      updatedAt: now,
    });

    const workerId = await ctx.db.insert("users", {
      clerkId: "user_worker_001",
      name: "Priya Nair",
      email: "priya@intakeflow.org",
      phone: "512-555-0103",
      role: "IntakeWorker",
      isActive: true,
      department: "Intake Services",
      title: "Intake Specialist",
      createdAt: threeMonthsAgo,
      updatedAt: now,
    });

    // ── 2. Clients ───────────────────────────────────────────────
    const mariaId = await ctx.db.insert("clients", {
      firstName: "Maria",
      lastName: "Garcia",
      dateOfBirth: new Date("1988-03-15").getTime(),
      gender: "Female",
      ethnicity: "Hispanic/Latino",
      primaryLanguage: "Spanish",
      email: "maria.garcia@email.com",
      phone: "512-555-2001",
      address: "1204 E 7th St",
      city: "Austin",
      state: "TX",
      zipCode: "78702",
      householdSize: 3,
      incomeLevel: "BelowPoverty",
      housingStatus: "AtRisk",
      veteranStatus: false,
      disabilityStatus: false,
      emergencyContactName: "Carlos Garcia",
      emergencyContactPhone: "512-555-2002",
      riskScore: 72,
      createdAt: oneMonthAgo,
      updatedAt: now,
    });

    const johnId = await ctx.db.insert("clients", {
      firstName: "John",
      lastName: "Smith",
      dateOfBirth: new Date("1975-11-02").getTime(),
      gender: "Male",
      ethnicity: "White",
      primaryLanguage: "English",
      phone: "512-555-2003",
      address: "Salvation Army Shelter, 501 E 8th St",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      householdSize: 1,
      incomeLevel: "NoIncome",
      housingStatus: "Homeless",
      veteranStatus: true,
      disabilityStatus: true,
      emergencyContactName: "VA Crisis Line",
      emergencyContactPhone: "988",
      riskScore: 91,
      createdAt: twoWeeksAgo,
      updatedAt: now,
    });

    const aishaId = await ctx.db.insert("clients", {
      firstName: "Aisha",
      lastName: "Patel",
      dateOfBirth: new Date("1995-07-22").getTime(),
      gender: "Female",
      ethnicity: "South Asian",
      primaryLanguage: "English",
      email: "aisha.patel@email.com",
      phone: "512-555-2005",
      address: "3401 Guadalupe St Apt 204",
      city: "Austin",
      state: "TX",
      zipCode: "78705",
      householdSize: 2,
      incomeLevel: "LowIncome",
      housingStatus: "Transitional",
      veteranStatus: false,
      disabilityStatus: false,
      riskScore: 55,
      createdAt: oneMonthAgo,
      updatedAt: now,
    });

    // ClientUser linked to Maria
    const clientUserId = await ctx.db.insert("users", {
      clerkId: "user_client_001",
      name: "Maria Garcia",
      email: "maria.garcia@email.com",
      phone: "512-555-2001",
      role: "ClientUser",
      isActive: true,
      clientId: mariaId,
      createdAt: oneMonthAgo,
      updatedAt: now,
    });

    // ── 3. Programs ──────────────────────────────────────────────
    const housingProgId = await ctx.db.insert("programs", {
      name: "Housing First Initiative",
      description: "Rapid rehousing program providing transitional housing, case management, and rental assistance for individuals experiencing homelessness.",
      category: "Housing",
      totalCapacity: 25,
      currentEnrollment: 18,
      waitlistCount: 3,
      managerId: pmId,
      location: "1500 E Ben White Blvd, Austin, TX 78741",
      startDate: sixMonthsAgo,
      eligibilityCriteria: "Must be currently homeless or at imminent risk. Income below 30% AMI. Austin/Travis County resident.",
      status: "Active",
      requiresScreening: true,
      isRecurring: false,
      createdAt: sixMonthsAgo,
      updatedAt: now,
    });

    const workforceProgId = await ctx.db.insert("programs", {
      name: "Workforce Development Program",
      description: "12-week job readiness program including resume workshops, interview prep, digital literacy training, and employer connections.",
      category: "Employment",
      totalCapacity: 30,
      currentEnrollment: 22,
      waitlistCount: 1,
      managerId: pmId,
      location: "3000 S IH-35 Suite 200, Austin, TX 78704",
      startDate: threeMonthsAgo,
      eligibilityCriteria: "Must be 18+. Unemployed or underemployed. Low to moderate income.",
      status: "Active",
      requiresScreening: true,
      isRecurring: true,
      createdAt: threeMonthsAgo,
      updatedAt: now,
    });

    const mentalHealthProgId = await ctx.db.insert("programs", {
      name: "Mental Health Counseling",
      description: "Individual and group counseling services for adults dealing with depression, anxiety, PTSD, and crisis stabilization.",
      category: "MentalHealth",
      totalCapacity: 15,
      currentEnrollment: 15,
      waitlistCount: 4,
      managerId: pmId,
      location: "2200 W Cesar Chavez St, Austin, TX 78703",
      startDate: sixMonthsAgo,
      eligibilityCriteria: "Must be 18+. Referral from healthcare provider or self-referral with screening.",
      status: "Full",
      requiresScreening: true,
      isRecurring: true,
      createdAt: sixMonthsAgo,
      updatedAt: now,
    });

    const foodProgId = await ctx.db.insert("programs", {
      name: "Emergency Food Pantry",
      description: "Weekly food distribution program providing groceries and prepared meals to individuals and families in need. No appointment necessary.",
      category: "FoodAssistance",
      totalCapacity: 100,
      currentEnrollment: 67,
      waitlistCount: 0,
      managerId: pmId,
      location: "800 E 12th St, Austin, TX 78702",
      startDate: sixMonthsAgo,
      eligibilityCriteria: "Open to all. No income verification required.",
      status: "Active",
      requiresScreening: false,
      isRecurring: true,
      createdAt: sixMonthsAgo,
      updatedAt: now,
    });

    // ── 4. Applications ──────────────────────────────────────────
    const mariaAppId = await ctx.db.insert("applications", {
      clientId: mariaId,
      programId: housingProgId,
      status: "Applied",
      priorityScore: 72,
      submittedAt: oneWeekAgo,
      assignedWorkerId: workerId,
      referralSource: "CommunityOrg",
      notes: "Single mother with two children, facing eviction in 30 days. Referred by St. David's Community Outreach.",
      urgencyLevel: "High",
      createdAt: oneWeekAgo,
      updatedAt: now,
    });

    const johnAppId = await ctx.db.insert("applications", {
      clientId: johnId,
      programId: mentalHealthProgId,
      status: "Screening",
      priorityScore: 91,
      submittedAt: twoWeeksAgo,
      screeningCompletedAt: oneWeekAgo,
      assignedWorkerId: workerId,
      referralSource: "Healthcare",
      notes: "Veteran with PTSD and chronic physical disability. Currently in emergency shelter. Referred by VA hospital social worker.",
      urgencyLevel: "Critical",
      createdAt: twoWeeksAgo,
      updatedAt: now,
    });

    const aishaAppId = await ctx.db.insert("applications", {
      clientId: aishaId,
      programId: workforceProgId,
      status: "Waitlisted",
      priorityScore: 55,
      submittedAt: oneMonthAgo,
      assignedWorkerId: workerId,
      referralSource: "SelfReferral",
      notes: "Recently completed GED. Looking to transition from part-time retail to full-time career-track employment.",
      urgencyLevel: "Medium",
      createdAt: oneMonthAgo,
      updatedAt: now,
    });

    // Maria's existing enrollment in Food Pantry
    const mariaFoodAppId = await ctx.db.insert("applications", {
      clientId: mariaId,
      programId: foodProgId,
      status: "Enrolled",
      submittedAt: oneMonthAgo,
      enrolledAt: oneMonthAgo,
      assignedWorkerId: workerId,
      referralSource: "SelfReferral",
      urgencyLevel: "Medium",
      createdAt: oneMonthAgo,
      updatedAt: oneMonthAgo,
    });

    // ── 5. Waitlist Entry ────────────────────────────────────────
    await ctx.db.insert("waitlistEntries", {
      applicationId: aishaAppId,
      programId: workforceProgId,
      clientId: aishaId,
      position: 1,
      priorityScore: 55,
      estimatedWaitDays: 21,
      status: "Active",
      addedAt: oneMonthAgo,
      createdAt: oneMonthAgo,
    });

    // ── 6. Enrollment ────────────────────────────────────────────
    await ctx.db.insert("enrollments", {
      clientId: mariaId,
      programId: foodProgId,
      applicationId: mariaFoodAppId,
      assignedStaffId: workerId,
      startDate: oneMonthAgo,
      status: "Active",
      progressNotes: "Attending weekly pickups consistently.",
      lastContactDate: oneWeekAgo,
      createdAt: oneMonthAgo,
      updatedAt: now,
    });

    // ── 7. Staff Assignments ─────────────────────────────────────
    await ctx.db.insert("staffAssignments", {
      staffId: pmId,
      programId: housingProgId,
      role: "PrimaryManager",
      caseloadCount: 0,
      maxCaseload: 0,
      isActive: true,
      startDate: sixMonthsAgo,
      createdAt: sixMonthsAgo,
    });

    await ctx.db.insert("staffAssignments", {
      staffId: workerId,
      programId: housingProgId,
      role: "IntakeSpecialist",
      caseloadCount: 8,
      maxCaseload: 15,
      isActive: true,
      startDate: threeMonthsAgo,
      createdAt: threeMonthsAgo,
    });

    // ── 8. Program Slots ─────────────────────────────────────────
    await ctx.db.insert("programSlots", {
      programId: housingProgId,
      slotType: "General",
      totalCapacity: 20,
      filledCount: 15,
      description: "Standard housing slots",
      isActive: true,
      createdAt: sixMonthsAgo,
    });

    await ctx.db.insert("programSlots", {
      programId: housingProgId,
      slotType: "Priority",
      totalCapacity: 3,
      filledCount: 2,
      description: "Priority slots for veterans and disabled individuals",
      eligibilityNotes: "Must have veteran or disability status",
      isActive: true,
      createdAt: sixMonthsAgo,
    });

    await ctx.db.insert("programSlots", {
      programId: housingProgId,
      slotType: "Emergency",
      totalCapacity: 2,
      filledCount: 1,
      description: "Emergency placement slots",
      eligibilityNotes: "Risk score above 85",
      isActive: true,
      createdAt: sixMonthsAgo,
    });

    // ── 9. Notifications ─────────────────────────────────────────
    await ctx.db.insert("notifications", {
      userId: workerId,
      type: "ApplicationReceived",
      title: "New Application: Maria Garcia",
      message: "Maria Garcia has applied to the Housing First Initiative. Priority score: 72. Please review and begin screening.",
      link: "/applications",
      isRead: false,
      createdAt: oneWeekAgo,
    });

    await ctx.db.insert("notifications", {
      userId: pmId,
      type: "WaitlistUpdate",
      title: "Waitlist Update: Workforce Development",
      message: "Aisha Patel has been added to the Workforce Development Program waitlist at position 1. Estimated wait: 21 days.",
      link: "/programs",
      isRead: true,
      createdAt: oneMonthAgo,
    });

    await ctx.db.insert("notifications", {
      userId: adminId,
      type: "SystemAlert",
      title: "Mental Health Counseling at Full Capacity",
      message: "The Mental Health Counseling program has reached full capacity (15/15). 4 clients are currently waitlisted.",
      link: "/programs",
      isRead: false,
      createdAt: oneWeekAgo,
    });

    // ── 10. Intake Form ──────────────────────────────────────────
    await ctx.db.insert("intakeForms", {
      clientId: johnId,
      workerId: workerId,
      applicationId: johnAppId,
      formType: "Screening",
      presentingNeeds: "Veteran experiencing homelessness with PTSD symptoms including nightmares, hypervigilance, and social withdrawal. Physical disability limits mobility. Needs immediate mental health support and eventual housing placement.",
      housingNeedScore: 9,
      employmentNeedScore: 6,
      healthNeedScore: 8,
      mentalHealthNeedScore: 10,
      substanceNeedScore: 3,
      overallAssessmentScore: 91,
      screeningResult: "Eligible",
      screeningNotes: "High priority case. Meets all eligibility criteria. Recommend immediate enrollment when slot becomes available.",
      completedAt: oneWeekAgo,
      status: "Completed",
      createdAt: twoWeeksAgo,
    });

    // ── 11. Audit Logs ───────────────────────────────────────────
    await ctx.db.insert("auditLogs", {
      userId: workerId,
      action: "Create",
      entityType: "applications",
      entityId: "seed_maria_app",
      details: "Created application for Maria Garcia to Housing First Initiative",
      createdAt: oneWeekAgo,
    });

    await ctx.db.insert("auditLogs", {
      userId: workerId,
      action: "StatusChange",
      entityType: "applications",
      entityId: "seed_john_app",
      previousValue: "Applied",
      details: "Changed status from Applied to Screening for John Smith",
      createdAt: oneWeekAgo,
    });
  },
});
