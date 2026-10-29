import type { AppointmentStatus, VisibleStatus } from "@/lib/mock/types";

const TONE: Record<VisibleStatus["tone"], string> = {
  neutral: "bg-background text-ink-soft border border-line",
  crisis: "bg-crisis-tint text-crisis",
  warn: "bg-warn-tint text-warn",
  ok: "bg-ok-tint text-ok",
  info: "bg-info-tint text-info",
};

export function StatusBadge({ status }: { status: VisibleStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[status.tone]}`}>
      {status.label}
    </span>
  );
}

export const APPOINTMENT_STATUS: Record<AppointmentStatus, { label: string; cls: string }> = {
  scheduled: { label: "Scheduled", cls: "bg-info-tint text-info" },
  "checked-in": { label: "Checked in", cls: "bg-primary-tint text-primary-strong" },
  completed: { label: "Completed", cls: "bg-ok-tint text-ok" },
  "no-show": { label: "No-show", cls: "bg-crisis-tint text-crisis" },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const s = APPOINTMENT_STATUS[status];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}
