"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import * as Popover from "@radix-ui/react-popover";
import { CalendarPlus, Check, ChevronDown, ChevronUp, PartyPopper, Undo2 } from "lucide-react";
import type { AlertKind, PriorityAlert, Student } from "@/lib/mock/types";
import { Card, EmptyState } from "@/components/ui/states";

const KIND: Record<AlertKind, { label: string; badge: string; bar: string }> = {
  crisis: { label: "Crisis follow-up", badge: "bg-crisis-tint text-crisis", bar: "bg-crisis" },
  academic: { label: "Academic", badge: "bg-warn-tint text-warn", bar: "bg-warn" },
  attendance: { label: "Attendance", badge: "bg-info-tint text-info", bar: "bg-info" },
  followup: { label: "Follow-up", badge: "bg-primary-tint text-primary-strong", bar: "bg-primary" },
};

const FILTERS: { id: "all" | AlertKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "crisis", label: "Crisis" },
  { id: "academic", label: "Academic" },
  { id: "attendance", label: "Attendance" },
  { id: "followup", label: "Follow-up" },
];

const FOLLOW_UP_OPTIONS = ["Tomorrow", "In 3 days", "Next week"];

// Crisis flags always sort first, then the order they were given.
const RANK: Record<AlertKind, number> = { crisis: 0, academic: 1, attendance: 2, followup: 3 };

interface AlertState {
  reviewed: boolean;
  scheduled?: string;
}

export function PriorityList({ alerts, students }: { alerts: PriorityAlert[]; students: Record<string, Student> }) {
  const [filter, setFilter] = useState<"all" | AlertKind>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [state, setState] = useState<Record<string, AlertState>>({});
  const [announce, setAnnounce] = useState("");

  const sorted = useMemo(
    () =>
      [...alerts].sort((a, b) => {
        const ra = state[a.id]?.reviewed ? 10 : 0;
        const rb = state[b.id]?.reviewed ? 10 : 0;
        return ra + RANK[a.kind] - (rb + RANK[b.kind]);
      }),
    [alerts, state],
  );
  const visible = sorted.filter((a) => filter === "all" || a.kind === filter);
  const openCount = alerts.filter((a) => !state[a.id]?.reviewed).length;

  const update = (id: string, patch: Partial<AlertState>, message: string) => {
    setState((prev) => ({ ...prev, [id]: { ...prev[id], reviewed: prev[id]?.reviewed ?? false, ...patch } }));
    setAnnounce(message);
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-base font-semibold">My Priority List</h2>
          <p className="text-xs text-ink-soft">
            {alerts.length === 0 ? "Nothing flagged" : `${openCount} of ${alerts.length} still to review`} · Flags are prompts to look closer,
            not assessments.
          </p>
        </div>
        <div role="group" aria-label="Filter priority list" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filter === f.id
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-surface text-ink-soft hover:border-primary/40 hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>

      {alerts.length === 0 ? (
        <EmptyState icon={PartyPopper} title="No students flagged" body="When a student needs attention this week, they’ll appear here with the reason." />
      ) : visible.length === 0 ? (
        <EmptyState icon={Check} title="Nothing in this category" body="Try another filter to see the rest of your list." />
      ) : (
        <ul className="divide-y divide-line">
          {visible.map((alert) => {
            const student = students[alert.studentId];
            const s = state[alert.id];
            const reviewed = s?.reviewed;
            const isOpen = expanded === alert.id;
            const kind = KIND[alert.kind];
            return (
              <li key={alert.id} className={`relative px-4 py-4 sm:px-5 ${reviewed ? "bg-background/60" : ""}`}>
                <span aria-hidden className={`absolute inset-y-3 left-0 w-1 rounded-r ${reviewed ? "bg-line" : kind.bar}`} />
                <div className={reviewed ? "opacity-60" : ""}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${kind.badge}`}>{kind.label}</span>
                    <span className="text-xs text-ink-soft">{alert.due}</span>
                    {reviewed && <span className="text-xs font-medium text-ok">Reviewed</span>}
                  </div>
                  <p className="mt-2 text-sm">
                    <Link href={`/caseload/${alert.studentId}`} className="font-semibold text-ink hover:underline">
                      {student.name}
                    </Link>
                    <span className="text-ink-soft">
                      {" "}
                      · {student.program}, Year {student.year}
                    </span>
                  </p>
                  <p className="mt-1 text-sm font-medium text-ink">{alert.title}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">{alert.reason}</p>
                  <p className="mt-2 text-sm">
                    <span className="font-medium text-ink">Next: </span>
                    <span className="text-ink-soft">{s?.scheduled ? `Follow-up scheduled — ${s.scheduled}` : alert.nextAction}</span>
                  </p>
                </div>

                {isOpen && (
                  <div id={`why-${alert.id}`} className="mt-3 rounded-lg border border-line bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Why this is flagged</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
                      {alert.signals.map((sig) => (
                        <li key={sig}>{sig}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-ink-soft">Review these signals yourself; this flag does not replace your judgement.</p>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`why-${alert.id}`}
                    onClick={() => setExpanded(isOpen ? null : alert.id)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-strong hover:bg-primary-tint"
                  >
                    Why flagged
                    {isOpen ? <ChevronUp aria-hidden className="h-3.5 w-3.5" /> : <ChevronDown aria-hidden className="h-3.5 w-3.5" />}
                  </button>

                  <Popover.Root>
                    <Popover.Trigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink hover:border-primary/40"
                      >
                        <CalendarPlus aria-hidden className="h-3.5 w-3.5" />
                        Schedule follow-up
                      </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content align="start" sideOffset={6} className="z-50 w-48 rounded-xl border border-line bg-surface p-1 shadow-lg">
                        {FOLLOW_UP_OPTIONS.map((opt) => (
                          <Popover.Close asChild key={opt}>
                            <button
                              type="button"
                              onClick={() => update(alert.id, { scheduled: opt }, `Follow-up for ${student.name} set for ${opt.toLowerCase()}.`)}
                              className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-primary-tint"
                            >
                              {opt}
                            </button>
                          </Popover.Close>
                        ))}
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>

                  {reviewed ? (
                    <button
                      type="button"
                      onClick={() => update(alert.id, { reviewed: false }, `${student.name} moved back to to-review.`)}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-background"
                    >
                      <Undo2 aria-hidden className="h-3.5 w-3.5" />
                      Undo
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => update(alert.id, { reviewed: true }, `${student.name} marked reviewed.`)}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-white hover:bg-primary-strong"
                    >
                      <Check aria-hidden className="h-3.5 w-3.5" />
                      Mark reviewed
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
