import { STUDENT_RECORDS, STUDENT_RECORD_MAP, staffName } from "@/lib/mock/students";
import type {
  AcademicSummary,
  ClinicalNote,
  ConsentState,
  Denied,
  Gated,
  IntakeInfo,
  Referral,
  Role,
  SessionEntry,
  StudentDocument,
  StudentRecord,
  VisibleStatus,
} from "@/lib/mock/types";
import { can, denyReason, type Permission } from "./permissions";

// The access layer turns full StudentRecords into role-specific VIEWS. Fields a
// role may not see are replaced with a Denied marker here, in the data layer —
// components receive already-redacted data. This mirrors what a server/data
// layer must enforce in production.

export function isDenied<T>(value: Gated<T>): value is Denied {
  return typeof value === "object" && value !== null && (value as Denied).denied === true;
}

function gate<T>(role: Role, permission: Permission, label: string, value: T): Gated<T> {
  return can(role, permission) ? value : { denied: true, reason: denyReason(role, label) };
}

/**
 * Note CONTENT is visible only to the Clinical Director/Admin and to the
 * counsellor the student is assigned to (least privilege).
 */
export function canSeeNotes(role: Role, record: StudentRecord, currentUserId: string): boolean {
  if (!can(role, "student.notes")) return false;
  if (role === "admin") return true;
  if (role === "counsellor") return record.assignedCounsellorId === currentUserId;
  return false;
}

/** Status badge the role is allowed to see; clinical/academic risk is redacted. */
export function visibleStatus(role: Role, record: StudentRecord): VisibleStatus {
  const status = record.caseStatus;
  if (status === "closed") return { key: "closed", label: "Closed Case", tone: "neutral" };

  if (status === "crisis-followup") {
    // Clinical risk — only clinical roles see the real flag.
    if (can(role, "student.riskStatus.clinical")) {
      return { key: "crisis", label: "Crisis Follow-up", tone: "crisis" };
    }
    return { key: "active", label: "Active Case", tone: "info" };
  }

  if (status === "academic-risk") {
    // Academic risk — clinical roles and advisors see it; front desk does not.
    if (can(role, "student.academic")) {
      return { key: "academic", label: "Academic Probation Risk", tone: "warn" };
    }
    return { key: "active", label: "Active Case", tone: "info" };
  }

  return { key: "active", label: "Active Case", tone: "info" };
}

export interface CaseloadRow {
  id: string;
  name: string;
  pronouns: string;
  program: string;
  faculty: string;
  year: number;
  assignedCounsellorId: string;
  assignedCounsellorName: string;
  status: VisibleStatus;
  lastContact: string;
}

function toRow(role: Role, record: StudentRecord): CaseloadRow {
  return {
    id: record.id,
    name: record.name,
    pronouns: record.pronouns,
    program: record.program,
    faculty: record.faculty,
    year: record.year,
    assignedCounsellorId: record.assignedCounsellorId,
    assignedCounsellorName: staffName(record.assignedCounsellorId),
    status: visibleStatus(role, record),
    lastContact: record.lastContact,
  };
}

export interface StudentProfileView {
  id: string;
  name: string;
  pronouns: string;
  program: string;
  faculty: string;
  year: number;
  status: VisibleStatus;
  assignedCounsellorName: string;
  studentNumber: Gated<string>;
  contact: Gated<{ email: string; phone: string }>;
  consent: Gated<ConsentState>;
  academic: Gated<AcademicSummary>;
  sessions: Gated<SessionEntry[]>;
  notes: Gated<ClinicalNote[]>;
  documents: Gated<StudentDocument[]>;
  referrals: Gated<Referral[]>;
  intake: Gated<IntakeInfo>;
}

function buildProfile(role: Role, currentUserId: string, record: StudentRecord): StudentProfileView {
  // Academic advisors only ever see consented academic-risk referrals.
  const referralsForRole: Referral[] =
    role === "advisor" ? record.referrals.filter((r) => r.academic) : record.referrals;

  return {
    id: record.id,
    name: record.name,
    pronouns: record.pronouns,
    program: record.program,
    faculty: record.faculty,
    year: record.year,
    status: visibleStatus(role, record),
    assignedCounsellorName: staffName(record.assignedCounsellorId),
    studentNumber: gate(role, "student.identity", "The student number", record.studentNumber),
    contact: gate(role, "student.contact", "Contact details", { email: record.email, phone: record.phone }),
    consent: gate(role, "student.consent", "Consent details", record.consent),
    academic: gate(role, "student.academic", "Academic standing", record.academic),
    sessions: gate(role, "student.sessions", "Session history", record.sessions),
    notes: canSeeNotes(role, record, currentUserId)
      ? record.notes
      : {
          denied: true,
          reason:
            role === "counsellor"
              ? "These notes belong to another counsellor's caseload. Only the assigned counsellor or a clinical supervisor can open them."
              : denyReason(role, "Clinical note contents"),
        },
    documents: gate(role, "student.documents", "Documents", record.documents),
    referrals: gate(role, "student.referrals", "Referrals", referralsForRole),
    intake: gate(role, "student.intake", "Intake and scheduling details", record.intake),
  };
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Caseload rows for a role. `demo` previews states: "error" | "empty". */
export async function fetchCaseload(role: Role, demo?: string): Promise<CaseloadRow[]> {
  await wait(500);
  if (!can(role, "caseload.view")) throw new Error("Not permitted to view the caseload");
  if (demo === "error") throw new Error("Mock caseload service unavailable");
  if (demo === "empty") return [];
  return STUDENT_RECORDS.map((r) => toRow(role, r));
}

export async function fetchStudentProfile(
  role: Role,
  currentUserId: string,
  id: string,
): Promise<StudentProfileView | null> {
  await wait(450);
  const record = STUDENT_RECORD_MAP[id];
  if (!record) return null;
  return buildProfile(role, currentUserId, record);
}
