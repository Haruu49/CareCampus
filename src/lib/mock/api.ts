import { ALERTS, APPOINTMENTS, METRICS, NOTIFICATIONS, STUDENTS } from "./data";
import type { DashboardData } from "./types";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock data access. A real backend replaces this module; callers only depend
 * on the DashboardData shape. `demo` lets reviewers preview error and empty
 * states via /?demo=error or /?demo=empty.
 */
export async function getDashboard(demo?: string): Promise<DashboardData> {
  await wait(700);
  if (demo === "error") throw new Error("Mock data service unavailable");

  const students = Object.fromEntries(STUDENTS.map((s) => [s.id, s]));
  if (demo === "empty") {
    return {
      metrics: METRICS.map((m) => ({ ...m, value: "0", context: "Nothing to show yet" })),
      alerts: [],
      appointments: [],
      students,
      notifications: [],
    };
  }
  return { metrics: METRICS, alerts: ALERTS, appointments: APPOINTMENTS, students, notifications: NOTIFICATIONS };
}

export function searchStudents(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return STUDENTS.filter((s) => `${s.name} ${s.program} ${s.faculty}`.toLowerCase().includes(q)).slice(0, 6);
}
