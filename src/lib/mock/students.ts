import type {
  AcademicStanding,
  CaseStatusKey,
  ClinicalNote,
  CourseResult,
  Referral,
  SessionEntry,
  StaffMember,
  StudentRecord,
  TermGpa,
} from "./types";

// Every person and record below is INVENTED for this prototype. Emails use the
// reserved .example domain and phone numbers use the 555-01xx test range so the
// data is obviously fictional. Do not replace with real student records.

export const STAFF: StaffMember[] = [
  { id: "u1", name: "Dr. Amira Okafor", role: "counsellor", initials: "AO" },
  { id: "u2", name: "Dr. Daniel Reyes", role: "counsellor", initials: "DR" },
  { id: "u3", name: "Sophie Lindgren", role: "counsellor", initials: "SL" },
  { id: "u4", name: "Dr. Marcus Bellweather", role: "admin", initials: "MB" },
];

/** The signed-in user in this prototype (see the account menu). */
export const CURRENT_USER_ID = "u1";

export const COUNSELLORS = STAFF.filter((s) => s.role === "counsellor");

export function staffName(id: string): string {
  return STAFF.find((s) => s.id === id)?.name ?? "Unassigned";
}

interface Seed {
  id: string;
  name: string;
  pronouns: string;
  program: string;
  faculty: string;
  year: number;
  counsellor: string;
  status: CaseStatusKey;
  lastContact: string;
  gpa: number;
  concern: SessionEntry["concern"];
}

const TERM_LABELS = ["2024 Fall", "2025 Winter", "2025 Spring", "2025 Fall"];

function makeTerms(cumulative: number, status: CaseStatusKey): TermGpa[] {
  // A gentle trajectory ending near the cumulative GPA; academic-risk dips.
  const end = cumulative;
  const start = status === "academic-risk" ? end + 0.9 : end - 0.2;
  return TERM_LABELS.map((term, i) => {
    const t = i / (TERM_LABELS.length - 1);
    const value = start + (end - start) * t + (i === 2 ? 0.1 : 0);
    return { term, gpa: Math.max(0, Math.round(value * 100) / 100) };
  });
}

function makeCourses(status: CaseStatusKey): CourseResult[] {
  const base: CourseResult[] = [
    { code: "CORE 210", title: "Research Methods", grade: "B", status: "passed" },
    { code: "ELEC 180", title: "Statistics I", grade: "B-", status: "passed" },
    { code: "SEMR 305", title: "Seminar in Practice", grade: "—", status: "in-progress" },
  ];
  if (status === "academic-risk") {
    return [
      { code: "CORE 240", title: "Advanced Topics", grade: "F", status: "failed" },
      { code: "ELEC 210", title: "Quantitative Analysis", grade: "D", status: "passed" },
      ...base.slice(2),
    ];
  }
  return base;
}

function standingFor(gpa: number, status: CaseStatusKey): AcademicStanding {
  if (status === "academic-risk") return gpa < 2.0 ? "Probation" : "Probation Risk";
  if (gpa < 2.5) return "Academic Warning";
  return "Good Standing";
}

function makeSessions(seed: Seed): SessionEntry[] {
  const list: SessionEntry[] = [
    {
      id: `${seed.id}-se1`,
      date: "2025-10-06",
      type: "Intake",
      concern: "moderate",
      followUp: "2025-10-20",
      summary: "Initial intake; mapped presenting concerns and agreed on goals.",
    },
    {
      id: `${seed.id}-se2`,
      date: "2025-10-20",
      type: "Individual",
      concern: seed.concern,
      followUp: seed.status === "crisis-followup" ? "2025-10-28" : "2025-11-03",
      summary: "Reviewed coping strategies and progress toward goals.",
    },
  ];
  if (seed.status === "crisis-followup") {
    list.push({
      id: `${seed.id}-se3`,
      date: "2025-10-27",
      type: "Walk-in / Crisis",
      concern: "high",
      followUp: "2025-10-29",
      summary: "Unscheduled check-in; reviewed safety plan and immediate supports.",
    });
  }
  return list;
}

function makeNotes(seed: Seed): ClinicalNote[] {
  return [
    {
      id: `${seed.id}-note1`,
      date: seed.status === "crisis-followup" ? "2025-10-27" : "2025-10-20",
      author: staffName(seed.counsellor),
      presentingConcern: "Academic stress with sleep disruption over the past three weeks.",
      history: "No prior counselling history on file. Strong peer support network reported.",
      riskAssessment:
        seed.status === "crisis-followup"
          ? "Transient distress at walk-in; no current intent or plan. Agreed to safety plan and 48-hour check-in."
          : "No indicators of risk to self or others at this session.",
      safetyPlan:
        seed.status === "crisis-followup"
          ? "Warning signs, internal coping steps, two trusted contacts, and campus after-hours line recorded."
          : "Not indicated at this time.",
      note: "Fictional sample note for prototype review. Contains no real clinical information.",
    },
  ];
}

function makeReferrals(seed: Seed): Referral[] {
  if (seed.status === "academic-risk") {
    return [
      {
        id: `${seed.id}-ref1`,
        target: "Academic Advising",
        date: "2025-10-22",
        status: "Sent",
        academic: true,
        reason: "Coordinate study-support plan after sharp GPA drop.",
      },
    ];
  }
  if (seed.status === "crisis-followup") {
    return [
      {
        id: `${seed.id}-ref1`,
        target: "Psychiatry",
        date: "2025-10-27",
        status: "Pending consent",
        academic: false,
        reason: "Assessment requested following walk-in; awaiting release-of-information consent.",
      },
    ];
  }
  return [];
}

function build(seed: Seed): StudentRecord {
  const academicRisk = seed.status === "academic-risk";
  return {
    id: seed.id,
    name: seed.name,
    pronouns: seed.pronouns,
    studentNumber: `S-2023-${seed.id.replace("s", "").padStart(4, "0")}`,
    program: seed.program,
    faculty: seed.faculty,
    year: seed.year,
    email: `${seed.name.toLowerCase().replace(/[^a-z]+/g, ".")}@university.example`,
    phone: `+1 555-01${seed.id.replace("s", "").padStart(2, "0")}`,
    assignedCounsellorId: seed.counsellor,
    caseStatus: seed.status,
    lastContact: seed.lastContact,
    consent: {
      counselling: seed.status !== "closed",
      academicShare: academicRisk,
      releaseOfInfo: seed.status === "crisis-followup" ? false : academicRisk,
      updatedOn: "2025-10-06",
    },
    academic: {
      standing: standingFor(seed.gpa, seed.status),
      cumulativeGpa: seed.gpa,
      probationThreshold: 2.0,
      terms: makeTerms(seed.gpa, seed.status),
      courses: makeCourses(seed.status),
      source: "Manual entry (prototype)",
      updatedOn: "2025-10-21",
    },
    sessions: makeSessions(seed),
    notes: makeNotes(seed),
    documents: [
      { id: `${seed.id}-doc1`, name: "Consent to counselling.pdf", kind: "Consent form", addedOn: "2025-10-06" },
      { id: `${seed.id}-doc2`, name: "Intake questionnaire.pdf", kind: "Intake", addedOn: "2025-10-06" },
    ],
    referrals: makeReferrals(seed),
    intake: {
      intakeDate: "2025-10-06",
      referredBy: seed.status === "academic-risk" ? "Faculty advisor" : "Self-referral",
      presentingReasonCategory: academicRisk ? "Academic stress" : "General wellbeing",
      preferredContact: "Email",
      nextAppointment: seed.status === "closed" ? undefined : "2025-10-29 14:00",
    },
  };
}

const SEEDS: Seed[] = [
  { id: "s1", name: "Maren Ostrowski", pronouns: "she/her", program: "Biology", faculty: "Science", year: 2, counsellor: "u1", status: "active-case", lastContact: "2025-10-20", gpa: 3.2, concern: "low" },
  { id: "s2", name: "Tobias Adeyemi", pronouns: "he/him", program: "Mechanical Engineering", faculty: "Engineering", year: 3, counsellor: "u2", status: "academic-risk", lastContact: "2025-10-21", gpa: 2.2, concern: "moderate" },
  { id: "s3", name: "Lina Varga", pronouns: "she/her", program: "Psychology", faculty: "Arts & Social Sciences", year: 1, counsellor: "u1", status: "crisis-followup", lastContact: "2025-10-27", gpa: 2.9, concern: "high" },
  { id: "s4", name: "Jonas Whitfield", pronouns: "he/him", program: "Economics", faculty: "Business", year: 4, counsellor: "u2", status: "closed", lastContact: "2025-09-30", gpa: 3.4, concern: "low" },
  { id: "s5", name: "Priya Nandakumar", pronouns: "she/her", program: "Computer Science", faculty: "Engineering", year: 2, counsellor: "u1", status: "active-case", lastContact: "2025-10-22", gpa: 3.0, concern: "moderate" },
  { id: "s6", name: "Elio Marchetti", pronouns: "he/him", program: "Architecture", faculty: "Design", year: 3, counsellor: "u1", status: "crisis-followup", lastContact: "2025-10-24", gpa: 2.8, concern: "high" },
  { id: "s7", name: "Sana Qureshi", pronouns: "she/her", program: "Nursing", faculty: "Health Sciences", year: 1, counsellor: "u1", status: "active-case", lastContact: "2025-10-23", gpa: 3.1, concern: "low" },
  { id: "s8", name: "Caleb Durand", pronouns: "he/him", program: "History", faculty: "Arts & Social Sciences", year: 2, counsellor: "u3", status: "active-case", lastContact: "2025-10-18", gpa: 3.3, concern: "low" },
  { id: "s9", name: "Noor Haddad", pronouns: "she/her", program: "Chemistry", faculty: "Science", year: 4, counsellor: "u1", status: "active-case", lastContact: "2025-10-15", gpa: 2.7, concern: "moderate" },
  { id: "s10", name: "Freya Lindqvist", pronouns: "she/her", program: "Marketing", faculty: "Business", year: 3, counsellor: "u3", status: "academic-risk", lastContact: "2025-10-15", gpa: 2.2, concern: "low" },
  { id: "s11", name: "Hassan Darwish", pronouns: "he/him", program: "Civil Engineering", faculty: "Engineering", year: 2, counsellor: "u2", status: "academic-risk", lastContact: "2025-10-19", gpa: 2.1, concern: "moderate" },
  { id: "s12", name: "Beatrix Kovac", pronouns: "she/her", program: "Fine Arts", faculty: "Design", year: 4, counsellor: "u3", status: "closed", lastContact: "2025-09-12", gpa: 3.5, concern: "low" },
  { id: "s13", name: "Owen Castellanos", pronouns: "he/him", program: "Philosophy", faculty: "Arts & Social Sciences", year: 1, counsellor: "u1", status: "active-case", lastContact: "2025-10-25", gpa: 3.0, concern: "low" },
];

export const STUDENT_RECORDS: StudentRecord[] = SEEDS.map(build);

export const STUDENT_RECORD_MAP: Record<string, StudentRecord> = Object.fromEntries(
  STUDENT_RECORDS.map((r) => [r.id, r]),
);
