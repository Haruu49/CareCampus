import { APPOINTMENTS } from "./data";
import { COUNSELLORS, STUDENT_RECORDS } from "./students";
import type { AppointmentStatus, AppointmentType, ScheduledAppointment } from "./types";

// Invented schedule data for this prototype. A real backend replaces this
// module; callers only depend on the ScheduledAppointment shape. The week is
// generated deterministically from (staff, date) so navigating away and back
// always shows the same schedule, and any week has plausible content.

// ---------------------------------------------------------------------------
// Local-date helpers. These deliberately avoid Date#toISOString, which shifts
// to UTC and can land on the wrong day either side of midnight.
// ---------------------------------------------------------------------------

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

/** Monday of the week containing `iso`. */
export function mondayOf(iso: string): string {
  const d = fromISO(iso);
  const dow = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return toISO(d);
}

export function weekDays(weekStart: string): string[] {
  return [0, 1, 2, 3, 4].map((i) => addDays(weekStart, i));
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** 24h "HH:MM" to a readable 12h label. */
export const formatTime = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

/** The booking day the grid renders, 09:00–17:30. */
export const DAY_START_MIN = toMinutes("09:00");
export const DAY_END_MIN = toMinutes("17:30");

// ---------------------------------------------------------------------------
// Deterministic generation
// ---------------------------------------------------------------------------

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

const SLOT_STARTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

const TYPE_POOL: AppointmentType[] = [
  "Individual",
  "Individual",
  "Individual",
  "Individual",
  "Intake",
  "Group",
  "Career",
  "Walk-in / Crisis",
];

/** Each counsellor works out of their own room, so rooms never double-book. */
const PRIMARY_ROOM: Record<string, string> = { u1: "Room 204", u2: "Room 206", u3: "Room 201" };
const GROUP_ROOM = "Wellness Hall";

const DURATION: Record<AppointmentType, number> = {
  Individual: 50,
  Intake: 50,
  Career: 50,
  Group: 90,
  "Walk-in / Crisis": 30,
};

function statusFor(date: string, today: string, rnd: () => number): AppointmentStatus {
  if (date > today) return "scheduled";
  if (date < today) return rnd() < 0.12 ? "no-show" : "completed";
  // Today: a mix, so the day view shows progress through the day.
  return rnd() < 0.35 ? "completed" : "scheduled";
}

function dayFor(staffId: string, date: string, today: string): ScheduledAppointment[] {
  const rnd = seeded(`${staffId}|${date}`);
  const caseload = STUDENT_RECORDS.filter((r) => r.assignedCounsellorId === staffId);
  if (caseload.length === 0) return [];

  // Pick a deterministic subset of the day's slots.
  const starts = [...SLOT_STARTS].sort(() => rnd() - 0.5).slice(0, 3 + Math.floor(rnd() * 4));
  starts.sort((a, b) => toMinutes(a) - toMinutes(b));

  const used = new Set<string>();
  return starts.map((start) => {
    const free = caseload.filter((r) => !used.has(r.id));
    const student = (free.length > 0 ? free : caseload)[Math.floor(rnd() * (free.length > 0 ? free.length : caseload.length))];
    used.add(student.id);
    const type = TYPE_POOL[Math.floor(rnd() * TYPE_POOL.length)];
    return {
      id: `${staffId}-${date}-${start}`,
      date,
      start,
      minutes: DURATION[type],
      studentId: student.id,
      staffId,
      type,
      status: statusFor(date, today, rnd),
      room: type === "Group" ? GROUP_ROOM : (PRIMARY_ROOM[staffId] ?? "Room 201"),
    };
  });
}

/**
 * Today's appointments for the signed-in counsellor are the same seven the
 * dashboard shows, so the two screens never contradict each other.
 */
function dashboardDay(staffId: string, date: string): ScheduledAppointment[] {
  return APPOINTMENTS.map((a) => ({
    id: a.id,
    date,
    start: a.start,
    minutes: a.minutes,
    studentId: a.studentId,
    staffId,
    type: a.type,
    status: a.status,
    room: a.room,
  }));
}

const DASHBOARD_STAFF_ID = "u1";

/** Every appointment in the Mon–Fri week starting `weekStart`, all staff. */
export function appointmentsForWeek(weekStart: string, today: string): ScheduledAppointment[] {
  const out: ScheduledAppointment[] = [];
  for (const date of weekDays(weekStart)) {
    for (const staff of COUNSELLORS) {
      out.push(
        ...(date === today && staff.id === DASHBOARD_STAFF_ID ? dashboardDay(staff.id, date) : dayFor(staff.id, date, today)),
      );
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || toMinutes(a.start) - toMinutes(b.start));
}
