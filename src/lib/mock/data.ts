import type { AppNotification, Appointment, Metric, PriorityAlert, Student } from "./types";
import { STUDENT_RECORDS } from "./students";

// All people here are invented for this prototype. Any resemblance to real
// students is coincidental. Do not replace with real records. The dashboard's
// simple Student list is derived from the full records in students.ts.

export const STUDENTS: Student[] = STUDENT_RECORDS.map((r) => ({
  id: r.id,
  name: r.name,
  program: r.program,
  faculty: r.faculty,
  year: r.year,
}));

export const METRICS: Metric[] = [
  { id: "caseload", label: "Active caseload", value: "42", context: "3 closed this month", tone: "neutral" },
  { id: "flagged", label: "Flagged this week", value: "7", context: "2 need review today", tone: "crisis" },
  { id: "upcoming", label: "Upcoming appointments", value: "11", context: "Next 7 days", tone: "neutral" },
  { id: "noshow", label: "No-show rate", value: "8%", context: "Down from 12% last month", tone: "ok" },
];

export const ALERTS: PriorityAlert[] = [
  {
    id: "a1",
    studentId: "s3",
    kind: "crisis",
    title: "Crisis follow-up due",
    reason: "Walk-in session on Monday; the agreed 48-hour check-in has not been logged.",
    signals: [
      "Crisis / walk-in session logged Mon 09:40",
      "Follow-up was set for within 48 hours",
      "No contact recorded since",
    ],
    nextAction: "Call or message to check in today",
    due: "Overdue by 4 h",
  },
  {
    id: "a2",
    studentId: "s6",
    kind: "crisis",
    title: "Safety plan review",
    reason: "Safety plan is due for its scheduled review and the student missed the last appointment.",
    signals: ["Safety plan review date: today", "Last appointment marked no-show (Thu)", "Concern level raised to High at last session"],
    nextAction: "Offer a same-day slot or phone check-in",
    due: "Due today",
  },
  {
    id: "a3",
    studentId: "s2",
    kind: "academic",
    title: "GPA dropped sharply",
    reason: "Term GPA fell 0.9 points versus last term, and one course was failed.",
    signals: ["GPA 3.1 → 2.2 (manual entry, Oct 21)", "1 failed course: MECH 2040", "Probation threshold: 2.0"],
    nextAction: "Invite to a check-in and loop in advisor with consent",
    due: "This week",
  },
  {
    id: "a4",
    studentId: "s9",
    kind: "attendance",
    title: "Two missed appointments",
    reason: "Two appointments in a row were missed without notice.",
    signals: ["No-show Oct 22", "No-show Oct 27", "No reply to reminder messages"],
    nextAction: "Send a gentle outreach message and offer a new time",
    due: "This week",
  },
  {
    id: "a5",
    studentId: "s5",
    kind: "followup",
    title: "Follow-up after intake",
    reason: "Intake completed last week; no second session has been booked.",
    signals: ["Intake completed Oct 22", "Follow-up recommended within 10 days", "No upcoming appointment"],
    nextAction: "Book a first individual session",
    due: "In 2 days",
  },
  {
    id: "a6",
    studentId: "s10",
    kind: "academic",
    title: "Near probation threshold",
    reason: "Cumulative GPA is 0.2 above the probation threshold.",
    signals: ["Cumulative GPA 2.2 (sample import, Oct 15)", "Probation threshold: 2.0", "Two courses in progress below B"],
    nextAction: "Review study-support options at next session",
    due: "Next session",
  },
];

// Times are "today". The mock "now" is not used here; the UI marks the next
// appointment relative to the viewer's clock.
export const APPOINTMENTS: Appointment[] = [
  { id: "p1", studentId: "s7", start: "09:00", minutes: 50, type: "Intake", status: "completed", room: "Room 204" },
  { id: "p2", studentId: "s1", start: "10:00", minutes: 50, type: "Individual", status: "completed", room: "Room 204" },
  { id: "p3", studentId: "s4", start: "11:00", minutes: 50, type: "Individual", status: "no-show", room: "Room 204" },
  { id: "p4", studentId: "s8", start: "13:00", minutes: 50, type: "Career", status: "scheduled", room: "Room 206" },
  { id: "p5", studentId: "s2", start: "14:00", minutes: 50, type: "Individual", status: "scheduled", room: "Room 204" },
  { id: "p6", studentId: "s3", start: "15:30", minutes: 90, type: "Group", status: "scheduled", room: "Wellness Hall" },
  { id: "p7", studentId: "s6", start: "16:30", minutes: 30, type: "Walk-in / Crisis", status: "scheduled", room: "Room 201" },
];

export const NOTIFICATIONS: AppNotification[] = [
  { id: "n1", text: "Crisis follow-up for Lina Varga is overdue.", time: "10 min ago", read: false },
  { id: "n2", text: "Weekly academic data import finished (sample CSV).", time: "1 h ago", read: false },
  { id: "n3", text: "Your 15:30 group session has 6 confirmed attendees.", time: "Yesterday", read: true },
];
