import { COUNSELLORS, STUDENT_RECORDS, STUDENT_RECORD_MAP, staffName } from "@/lib/mock/students";
import { appointmentsForWeek, weekDays } from "@/lib/mock/schedule";
import type {
  AcademicSummary,
  CalendarSlot,
  ClinicalNote,
  ConsentState,
  Denied,
  Gated,
  IntakeInfo,
  Referral,
  Role,
  ScheduleView,
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

// ---------------------------------------------------------------------------
// Calendar
//
// Time, duration and owner are never redacted: a counsellor has to be able to
// see that a colleague is booked at 14:00 in order to find cover or a room.
// WHO is in the slot and WHAT kind of appointment it is are gated, because an
// appointment type like "Walk-in / Crisis" discloses clinical information.
// ---------------------------------------------------------------------------

/** Whether this role may see the contents of a slot, given whose slot it is. */
export function canSeeSlotDetail(role: Role, slotStaffId: string, currentUserId: string): boolean {
  if (!can(role, "calendar.view")) return false;
  if (can(role, "calendar.allStaffDetail")) return true;
  return slotStaffId === currentUserId;
}

/**
 * The week's schedule as a role sees it. Returns a Denied marker rather than
 * throwing when the role has no calendar access at all, so the page can
 * explain itself instead of showing an error.
 *
 * `today` is supplied by the caller (resolved from the viewer's clock) so the
 * data layer stays deterministic and free of hidden clock reads.
 */
export async function fetchSchedule(
  role: Role,
  currentUserId: string,
  weekStart: string,
  today: string,
  demo?: string,
): Promise<Gated<ScheduleView>> {
  await wait(500);
  if (!can(role, "calendar.view")) {
    return {
      denied: true,
      reason: `${denyReason(role, "The counselling calendar")} Attendance at counselling is confidential, so appointment times are not shared outside the counselling team.`,
    };
  }
  if (demo === "error") throw new Error("Mock schedule service unavailable");

  const days = weekDays(weekStart);
  const staff = COUNSELLORS.map((s) => ({
    id: s.id,
    name: s.name,
    initials: s.initials,
    mine: s.id === currentUserId,
  }));

  if (demo === "empty") return { weekStart, days, staff, slots: [] };

  const slots: CalendarSlot[] = appointmentsForWeek(weekStart, today).map((a) => {
    const visible = canSeeSlotDetail(role, a.staffId, currentUserId);
    const student = STUDENT_RECORD_MAP[a.studentId];
    return {
      id: a.id,
      date: a.date,
      start: a.start,
      minutes: a.minutes,
      staffId: a.staffId,
      staffName: staffName(a.staffId),
      mine: a.staffId === currentUserId,
      detail: visible
        ? {
            studentId: a.studentId,
            studentName: student?.name ?? "Unknown student",
            type: a.type,
            status: a.status,
            room: a.room,
          }
        : {
            denied: true,
            reason: `This slot is on ${staffName(a.staffId)}'s calendar. Only the assigned counsellor, a clinical supervisor or the front desk can see who it is with.`,
          },
    };
  });

  return { weekStart, days, staff, slots };
}
