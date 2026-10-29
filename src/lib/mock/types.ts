export type Role = "counsellor" | "admin" | "advisor" | "frontdesk";

export const ROLE_LABELS: Record<Role, string> = {
  counsellor: "Counsellor",
  admin: "Clinical Director / Admin",
  advisor: "Academic Advisor",
  frontdesk: "Front Desk / Intake",
};

export interface Student {
  id: string;
  name: string;
  program: string;
  faculty: string;
  year: number;
}

export type AlertKind = "crisis" | "academic" | "followup" | "attendance";

export interface PriorityAlert {
  id: string;
  studentId: string;
  kind: AlertKind;
  title: string;
  /** Plain-language reason shown on the card and in "why this is flagged". */
  reason: string;
  /** Underlying signals staff can review; the flag is never a diagnosis. */
  signals: string[];
  nextAction: string;
  due: string;
}

export type AppointmentType = "Individual" | "Group" | "Walk-in / Crisis" | "Intake" | "Career";
export type AppointmentStatus = "scheduled" | "checked-in" | "completed" | "no-show";

export interface Appointment {
  id: string;
  studentId: string;
  /** 24h "HH:MM" local time, today. */
  start: string;
  minutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  room: string;
}

export interface Metric {
  id: string;
  label: string;
  value: string;
  context: string;
  tone: "neutral" | "crisis" | "warn" | "ok";
}

export interface AppNotification {
  id: string;
  text: string;
  time: string;
  read: boolean;
}

export interface DashboardData {
  metrics: Metric[];
  alerts: PriorityAlert[];
  appointments: Appointment[];
  students: Record<string, Student>;
  notifications: AppNotification[];
}

// ---------------------------------------------------------------------------
// Step 2: caseload + student records
// ---------------------------------------------------------------------------

export interface StaffMember {
  id: string;
  name: string;
  role: Role;
  initials: string;
}

export type CaseStatusKey = "active-case" | "academic-risk" | "crisis-followup" | "closed";

export interface ConsentState {
  /** Consent to receive counselling services. */
  counselling: boolean;
  /** Consent to share academic-risk information with academic advisors. */
  academicShare: boolean;
  /** Release-of-information consent for external referrals. */
  releaseOfInfo: boolean;
  updatedOn: string;
}

export interface TermGpa {
  term: string;
  gpa: number;
}

export interface CourseResult {
  code: string;
  title: string;
  grade: string;
  status: "passed" | "failed" | "in-progress";
}

export type AcademicStanding = "Good Standing" | "Academic Warning" | "Probation Risk" | "Probation";

export interface AcademicSummary {
  standing: AcademicStanding;
  cumulativeGpa: number;
  probationThreshold: number;
  terms: TermGpa[];
  courses: CourseResult[];
  source: string;
  updatedOn: string;
}

export type ConcernLevel = "low" | "moderate" | "high";

/** Session timeline entry (clinical metadata; gated to clinical roles). */
export interface SessionEntry {
  id: string;
  date: string;
  type: AppointmentType;
  concern: ConcernLevel;
  followUp?: string;
  summary: string;
}

/** Confidential clinical note. Contents never leave the clinical roles. */
export interface ClinicalNote {
  id: string;
  date: string;
  author: string;
  presentingConcern: string;
  history: string;
  riskAssessment: string;
  safetyPlan: string;
  note: string;
}

export interface StudentDocument {
  id: string;
  name: string;
  kind: string;
  addedOn: string;
}

export type ReferralTarget = "Academic Advising" | "Disability Services" | "Psychiatry" | "External Provider";

export interface Referral {
  id: string;
  target: ReferralTarget;
  date: string;
  status: "Pending consent" | "Sent" | "Accepted" | "Declined";
  /** Academic-only referrals are visible to the Academic Advisor role. */
  academic: boolean;
  reason: string;
}

export interface IntakeInfo {
  intakeDate: string;
  referredBy: string;
  /** Non-clinical category only (e.g. "Academic stress"). */
  presentingReasonCategory: string;
  preferredContact: string;
  nextAppointment?: string;
}

/** Full server-side record. The access layer redacts it per role. */
export interface StudentRecord {
  id: string;
  name: string;
  pronouns: string;
  studentNumber: string;
  program: string;
  faculty: string;
  year: number;
  email: string;
  phone: string;
  assignedCounsellorId: string;
  caseStatus: CaseStatusKey;
  lastContact: string;
  consent: ConsentState;
  academic: AcademicSummary;
  sessions: SessionEntry[];
  notes: ClinicalNote[];
  documents: StudentDocument[];
  referrals: Referral[];
  intake: IntakeInfo;
}

/** Returned in place of a field the current role may not see. */
export interface Denied {
  denied: true;
  reason: string;
}

export type Gated<T> = T | Denied;

export interface VisibleStatus {
  key: string;
  label: string;
  tone: "neutral" | "crisis" | "warn" | "ok" | "info";
}
