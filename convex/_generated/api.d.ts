/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as aiHelpers from "../aiHelpers.js";
import type * as applications from "../applications.js";
import type * as auditLogs from "../auditLogs.js";
import type * as clients from "../clients.js";
import type * as dashboard from "../dashboard.js";
import type * as enrollments from "../enrollments.js";
import type * as intakeForms from "../intakeForms.js";
import type * as notifications from "../notifications.js";
import type * as programSlots from "../programSlots.js";
import type * as programs from "../programs.js";
import type * as seed from "../seed.js";
import type * as staffAssignments from "../staffAssignments.js";
import type * as users from "../users.js";
import type * as waitlistEntries from "../waitlistEntries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  aiHelpers: typeof aiHelpers;
  applications: typeof applications;
  auditLogs: typeof auditLogs;
  clients: typeof clients;
  dashboard: typeof dashboard;
  enrollments: typeof enrollments;
  intakeForms: typeof intakeForms;
  notifications: typeof notifications;
  programSlots: typeof programSlots;
  programs: typeof programs;
  seed: typeof seed;
  staffAssignments: typeof staffAssignments;
  users: typeof users;
  waitlistEntries: typeof waitlistEntries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
