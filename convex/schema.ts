import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("Admin"), v.literal("ProgramManager"), v.literal("IntakeWorker"), v.literal("ClientUser")),
    department: v.optional(v.string()),
    title: v.optional(v.string()),
    isActive: v.boolean(),
    clientId: v.optional(v.id("clients")),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_isActive", ["isActive"]),
  clients: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.number(),
    gender: v.union(v.literal("Male"), v.literal("Female"), v.literal("NonBinary"), v.literal("Other"), v.literal("PreferNotToSay")),
    ethnicity: v.optional(v.string()),
    primaryLanguage: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    householdSize: v.number(),
    incomeLevel: v.union(v.literal("NoIncome"), v.literal("BelowPoverty"), v.literal("LowIncome"), v.literal("ModerateIncome"), v.literal("AboveModerate")),
    housingStatus: v.union(v.literal("Housed"), v.literal("AtRisk"), v.literal("Homeless"), v.literal("Transitional"), v.literal("Shelter")),
    veteranStatus: v.boolean(),
    disabilityStatus: v.boolean(),
    emergencyContactName: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
    riskScore: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_lastName", ["lastName"])
    .index("by_phone", ["phone"])
    .index("by_incomeLevel", ["incomeLevel"])
    .index("by_housingStatus", ["housingStatus"]),
  programs: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.union(v.literal("Housing"), v.literal("FoodAssistance"), v.literal("MentalHealth"), v.literal("Substance"), v.literal("Employment"), v.literal("Education"), v.literal("LegalAid"), v.literal("YouthServices"), v.literal("SeniorServices"), v.literal("Other")),
    totalCapacity: v.number(),
    currentEnrollment: v.number(),
    waitlistCount: v.number(),
    managerId: v.id("users"),
    location: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    eligibilityCriteria: v.optional(v.string()),
    status: v.union(v.literal("Draft"), v.literal("Active"), v.literal("Full"), v.literal("Suspended"), v.literal("Completed"), v.literal("Archived")),
    requiresScreening: v.boolean(),
    isRecurring: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_managerId", ["managerId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_category_status", ["category", "status"]),
  applications: defineTable({
    clientId: v.id("clients"),
    programId: v.id("programs"),
    status: v.union(v.literal("Applied"), v.literal("Screening"), v.literal("Waitlisted"), v.literal("Enrolled"), v.literal("Active"), v.literal("Completed"), v.literal("Discharged"), v.literal("Rejected"), v.literal("Withdrawn")),
    priorityScore: v.optional(v.number()),
    submittedAt: v.number(),
    screeningCompletedAt: v.optional(v.number()),
    enrolledAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    assignedWorkerId: v.optional(v.id("users")),
    referralSource: v.optional(v.union(v.literal("SelfReferral"), v.literal("CommunityOrg"), v.literal("GovernmentAgency"), v.literal("Healthcare"), v.literal("School"), v.literal("Other"))),
    notes: v.optional(v.string()),
    urgencyLevel: v.union(v.literal("Low"), v.literal("Medium"), v.literal("High"), v.literal("Critical")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clientId", ["clientId"])
    .index("by_programId", ["programId"])
    .index("by_status", ["status"])
    .index("by_assignedWorkerId", ["assignedWorkerId"])
    .index("by_programId_status", ["programId", "status"])
    .index("by_clientId_programId", ["clientId", "programId"]),
  waitlistEntries: defineTable({
    applicationId: v.id("applications"),
    programId: v.id("programs"),
    clientId: v.id("clients"),
    position: v.number(),
    priorityScore: v.number(),
    estimatedWaitDays: v.optional(v.number()),
    status: v.union(v.literal("Active"), v.literal("Promoted"), v.literal("Expired"), v.literal("Withdrawn")),
    addedAt: v.number(),
    promotedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_applicationId", ["applicationId"])
    .index("by_programId", ["programId"])
    .index("by_clientId", ["clientId"])
    .index("by_status", ["status"])
    .index("by_programId_status", ["programId", "status"]),
  intakeForms: defineTable({
    clientId: v.id("clients"),
    workerId: v.id("users"),
    applicationId: v.optional(v.id("applications")),
    formType: v.union(v.literal("InitialIntake"), v.literal("NeedsAssessment"), v.literal("Screening"), v.literal("Reassessment")),
    presentingNeeds: v.string(),
    housingNeedScore: v.number(),
    employmentNeedScore: v.number(),
    healthNeedScore: v.number(),
    mentalHealthNeedScore: v.number(),
    substanceNeedScore: v.optional(v.number()),
    overallAssessmentScore: v.number(),
    screeningResult: v.optional(v.union(v.literal("Eligible"), v.literal("Ineligible"), v.literal("NeedsMoreInfo"), v.literal("Deferred"))),
    screeningNotes: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    status: v.union(v.literal("Draft"), v.literal("InProgress"), v.literal("Completed")),
    createdAt: v.number(),
  })
    .index("by_clientId", ["clientId"])
    .index("by_workerId", ["workerId"])
    .index("by_applicationId", ["applicationId"])
    .index("by_status", ["status"]),
  enrollments: defineTable({
    clientId: v.id("clients"),
    programId: v.id("programs"),
    applicationId: v.id("applications"),
    assignedStaffId: v.optional(v.id("users")),
    startDate: v.number(),
    expectedEndDate: v.optional(v.number()),
    actualEndDate: v.optional(v.number()),
    status: v.union(v.literal("Active"), v.literal("OnHold"), v.literal("Completed"), v.literal("Discharged"), v.literal("Transferred")),
    dischargeReason: v.optional(v.string()),
    progressNotes: v.optional(v.string()),
    lastContactDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clientId", ["clientId"])
    .index("by_programId", ["programId"])
    .index("by_applicationId", ["applicationId"])
    .index("by_assignedStaffId", ["assignedStaffId"])
    .index("by_status", ["status"])
    .index("by_programId_status", ["programId", "status"])
    .index("by_clientId_programId", ["clientId", "programId"]),
  staffAssignments: defineTable({
    staffId: v.id("users"),
    programId: v.id("programs"),
    role: v.union(v.literal("PrimaryManager"), v.literal("CaseWorker"), v.literal("IntakeSpecialist"), v.literal("Counselor"), v.literal("Support")),
    caseloadCount: v.number(),
    maxCaseload: v.number(),
    isActive: v.boolean(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_staffId", ["staffId"])
    .index("by_programId", ["programId"])
    .index("by_staffId_programId", ["staffId", "programId"]),
  programSlots: defineTable({
    programId: v.id("programs"),
    slotType: v.union(v.literal("General"), v.literal("Priority"), v.literal("Reserved"), v.literal("Emergency")),
    totalCapacity: v.number(),
    filledCount: v.number(),
    description: v.optional(v.string()),
    eligibilityNotes: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_programId", ["programId"]),
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("ApplicationReceived"), v.literal("StatusChange"), v.literal("WaitlistUpdate"), v.literal("EnrollmentConfirmed"), v.literal("ScreeningScheduled"), v.literal("SlotAvailable"), v.literal("DischargeNotice"), v.literal("SystemAlert")),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
    isRead: v.boolean(),
    relatedEntityId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"]),
  auditLogs: defineTable({
    userId: v.id("users"),
    action: v.union(v.literal("Create"), v.literal("Update"), v.literal("Delete"), v.literal("StatusChange"), v.literal("Enroll"), v.literal("Discharge"), v.literal("Login"), v.literal("Export")),
    entityType: v.string(),
    entityId: v.string(),
    previousValue: v.optional(v.string()),
    details: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_entityType", ["entityType"])
    .index("by_action", ["action"])
    .index("by_entityType_entityId", ["entityType", "entityId"]),
});