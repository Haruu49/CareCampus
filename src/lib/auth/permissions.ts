import type { Role } from "@/lib/mock/types";

// ---------------------------------------------------------------------------
// Centralized mock authorization — PROTOTYPE ONLY.
//
// This module is the single source of truth for what each staff role may see.
// The access layer (access.ts) consults it and REDACTS data before it reaches
// any component, so permission is enforced in application logic, not merely by
// hiding UI. In a real deployment these checks must run on the server/data
// layer behind an approved identity provider. Switching roles in this
// prototype does not authenticate anyone.
// ---------------------------------------------------------------------------

export type Permission =
  | "caseload.view"
  | "student.identity"
  | "student.contact"
  | "student.consent"
  | "student.academic"
  | "student.riskStatus.clinical"
  | "student.sessions"
  | "student.notes"
  | "student.documents"
  | "student.referrals"
  | "student.intake"
  | "calendar.view"
  /** See WHO and WHAT sits in another staff member's calendar slot. */
  | "calendar.allStaffDetail";

const CLINICAL: Permission[] = [
  "caseload.view",
  "calendar.view",
  "student.identity",
  "student.contact",
  "student.consent",
  "student.academic",
  "student.riskStatus.clinical",
  "student.sessions",
  "student.notes",
  "student.documents",
  "student.referrals",
  "student.intake",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Clinical Director / Admin: authorized clinical supervisor — full access.
  admin: [...CLINICAL, "calendar.allStaffDetail"],
  // Counsellor: full access; note CONTENT is additionally gated to the
  // assigned counsellor (see canSeeNotes), and a colleague's calendar slots
  // show as busy without naming the student.
  counsellor: [...CLINICAL],
  // Academic Advisor: academic-risk information only. No clinical risk, no
  // notes, sessions, documents, intake, or contact details. Attendance at
  // counselling is itself sensitive, so the calendar is closed to this role.
  advisor: ["caseload.view", "student.identity", "student.consent", "student.academic", "student.referrals"],
  // Front Desk / Intake: intake and scheduling only. No academic detail, no
  // clinical risk, no notes, sessions, documents, or referrals. Booking is
  // their job, so they see the whole centre's schedule.
  frontdesk: [
    "caseload.view",
    "student.identity",
    "student.contact",
    "student.consent",
    "student.intake",
    "calendar.view",
    "calendar.allStaffDetail",
  ],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Human-readable reason shown in a permission-denied panel. */
export function denyReason(role: Role, what: string): string {
  const label: Record<Role, string> = {
    admin: "Clinical Director / Admin",
    counsellor: "Counsellor",
    advisor: "Academic Advisor",
    frontdesk: "Front Desk / Intake",
  };
  return `${what} is not available to the ${label[role]} role.`;
}
