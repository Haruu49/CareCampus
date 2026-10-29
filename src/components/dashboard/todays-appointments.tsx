"use client";

import { useEffect, useState } from "react";
import { CalendarX2, MapPin } from "lucide-react";
import type { Appointment, AppointmentStatus, Student } from "@/lib/mock/types";
import { Card, EmptyState } from "@/components/ui/states";

const STATUS: Record<AppointmentStatus, { label: string; cls: string }> = {
  scheduled: { label: "Scheduled", cls: "bg-info-tint text-info" },
  "checked-in": { label: "Checked in", cls: "bg-primary-tint text-primary-strong" },
  completed: { label: "Completed", cls: "bg-ok-tint text-ok" },
  "no-show": { label: "No-show", cls: "bg-crisis-tint text-crisis" },
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const fmt = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

export function TodaysAppointments({ appointments, students }: { appointments: Appointment[]; students: Record<string, Student> }) {
  // Resolved on the client so server and client render the same markup first.
  const [nowMin, setNowMin] = useState<number | null>(null);
  const [dateLabel, setDateLabel] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNowMin(d.getHours() * 60 + d.getMinutes());
      setDateLabel(d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }));
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const nextId =
    nowMin === null ? null : appointments.find((a) => a.status === "scheduled" && toMinutes(a.start) + a.minutes > nowMin)?.id;

  return (
    <Card>
      <div className="border-b border-line px-4 py-3 sm:px-5">
        <h2 className="text-base font-semibold">Today’s appointments</h2>
        <p className="min-h-4 text-xs text-ink-soft">{dateLabel}</p>
      </div>
      {appointments.length === 0 ? (
        <EmptyState icon={CalendarX2} title="No appointments today" body="Your schedule is clear. Walk-ins will show up here as they’re booked." />
      ) : (
        <ol className="divide-y divide-line">
          {appointments.map((a) => {
            const student = students[a.studentId];
            const st = STATUS[a.status];
            const isNext = a.id === nextId;
            return (
              <li key={a.id} className={`flex gap-3 px-4 py-3 sm:px-5 ${isNext ? "bg-primary-tint/50" : ""}`}>
                <div className="w-16 shrink-0 text-sm">
                  <p className="font-medium">{fmt(a.start)}</p>
                  <p className="text-xs text-ink-soft">{a.minutes} min</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{student.name}</p>
                  <p className="text-xs text-ink-soft">{a.type}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft">
                    <MapPin aria-hidden className="h-3 w-3" />
                    {a.room}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
                  {isNext && <span className="text-xs font-medium text-primary-strong">Up next</span>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
