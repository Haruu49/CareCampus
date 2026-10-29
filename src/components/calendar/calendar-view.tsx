"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, CalendarX2, ChevronLeft, ChevronRight, Lock, MapPin, SlidersHorizontal, User } from "lucide-react";
import { useRole } from "@/components/shell/role-context";
import { DeniedPanel } from "@/components/profile/denied-panel";
import { PageHeader } from "@/components/ui/page-header";
import { Card, EmptyState, ErrorState } from "@/components/ui/states";
import { APPOINTMENT_STATUS, AppointmentStatusBadge } from "@/components/ui/status-badge";
import { fetchSchedule, isDenied } from "@/lib/auth/access";
import { CURRENT_USER_ID } from "@/lib/mock/students";
import {
  DAY_END_MIN,
  DAY_START_MIN,
  addDays,
  formatTime,
  fromISO,
  mondayOf,
  toISO,
  toMinutes,
  weekDays,
} from "@/lib/mock/schedule";
import type { AppointmentType, CalendarSlot, Denied, ScheduleView } from "@/lib/mock/types";
import { ROLE_LABELS } from "@/lib/mock/types";

/** One grid row is 30 minutes tall. */
const ROW_MIN = 30;
const ROW_H = 44;
const ROWS = (DAY_END_MIN - DAY_START_MIN) / ROW_MIN;

const TYPES: AppointmentType[] = ["Individual", "Group", "Walk-in / Crisis", "Intake", "Career"];

const TYPE_TONE: Record<AppointmentType, string> = {
  Individual: "border-primary/30 bg-primary-tint text-primary-strong",
  Intake: "border-info/30 bg-info-tint text-info",
  Group: "border-warn/30 bg-warn-tint text-warn",
  Career: "border-ok/30 bg-ok-tint text-ok",
  "Walk-in / Crisis": "border-crisis/30 bg-crisis-tint text-crisis",
};

const ALL = "all";

const endTime = (start: string, minutes: number) => {
  const m = toMinutes(start) + minutes;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

const shortDay = (iso: string) => fromISO(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
const longDay = (iso: string) => fromISO(iso).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

function weekLabel(from: string, to: string) {
  // Both ends spelled out in full, so the label reads correctly in any locale.
  const left = fromISO(from).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const right = fromISO(to).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `${left} – ${right}`;
}

/** The viewer's clock, resolved after mount so server and client agree. */
function useNow() {
  const [now, setNow] = useState<{ today: string; minutes: number } | null>(null);
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow({ today: toISO(d), minutes: d.getHours() * 60 + d.getMinutes() });
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function CalendarView() {
  const { role } = useRole();
  const now = useNow();
  const today = now?.today ?? null;

  const [view, setView] = useState<"week" | "day">("week");
  const [staffId, setStaffId] = useState(CURRENT_USER_ID);
  const [type, setType] = useState(ALL);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Until the viewer navigates, the week and day follow the viewer's clock, so
  // both stay null through the server render and resolve together on mount.
  const [pickedWeek, setPickedWeek] = useState<string | null>(null);
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const weekStart = pickedWeek ?? (today ? mondayOf(today) : null);
  const day = pickedDay ?? (weekStart && today && weekDays(weekStart).includes(today) ? today : weekStart);

  const currentKey = `${role}:${weekStart}:${today}:${reloadKey}`;
  const [loaded, setLoaded] = useState<{ key: string; schedule: ScheduleView | null; denied: string | null; error: boolean }>({
    key: "",
    schedule: null,
    denied: null,
    error: false,
  });

  useEffect(() => {
    if (!weekStart || !today) return;
    let cancelled = false;
    const demo = new URLSearchParams(window.location.search).get("demo") ?? undefined;
    fetchSchedule(role, CURRENT_USER_ID, weekStart, today, demo)
      .then((result) => {
        if (cancelled) return;
        if (isDenied(result)) setLoaded({ key: currentKey, schedule: null, denied: result.reason, error: false });
        else setLoaded({ key: currentKey, schedule: result, denied: null, error: false });
      })
      .catch(() => !cancelled && setLoaded({ key: currentKey, schedule: null, denied: null, error: true }));
    return () => {
      cancelled = true;
    };
  }, [role, weekStart, today, reloadKey, currentKey]);

  const settled = loaded.key === currentKey && weekStart !== null;
  const schedule = settled ? loaded.schedule : null;
  const denied = settled ? loaded.denied : null;
  const error = settled && loaded.error;

  const days = schedule?.days ?? [];
  const staff = schedule?.staff ?? [];

  const visible = useMemo(() => {
    if (!schedule) return [];
    if (type === ALL) return schedule.slots;
    // A type filter can only match slots whose contents this role may see.
    return schedule.slots.filter((slot) => !isDenied(slot.detail) && slot.detail.type === type);
  }, [schedule, type]);

  const selected = useMemo(() => visible.find((s) => s.id === selectedId) ?? null, [visible, selectedId]);

  const goToday = () => {
    setPickedWeek(null);
    setPickedDay(null);
    setSelectedId(null);
  };

  const goTo = (week: string, dayISO: string) => {
    setPickedWeek(week);
    setPickedDay(dayISO);
    setSelectedId(null);
  };

  const step = (dir: -1 | 1) => {
    if (!weekStart) return;
    if (view === "week") {
      const next = addDays(weekStart, dir * 7);
      goTo(next, weekDays(next)[0]);
      return;
    }
    const index = weekDays(weekStart).indexOf(day ?? weekStart) + dir;
    if (index < 0 || index > 4) {
      const next = addDays(weekStart, dir * 7);
      goTo(next, weekDays(next)[dir === 1 ? 0 : 4]);
      return;
    }
    goTo(weekStart, weekDays(weekStart)[index]);
  };

  const selectCls = "h-9 rounded-lg border border-line bg-surface px-2.5 text-sm text-ink focus-visible:border-primary";
  const navBtnCls =
    "flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft hover:bg-background";

  const columns: { key: string; label: string; sublabel: string; isToday: boolean; slots: CalendarSlot[] }[] =
    view === "week"
      ? days.map((d) => ({
          key: d,
          label: shortDay(d),
          sublabel: d === today ? "Today" : "",
          isToday: d === today,
          slots: visible.filter((s) => s.date === d && s.staffId === staffId),
        }))
      : staff.map((member) => ({
          key: member.id,
          label: member.initials,
          sublabel: member.mine ? "You" : member.name.replace(/^Dr\.\s*/, "").split(" ").slice(-1)[0],
          isToday: day === today,
          slots: visible.filter((s) => s.date === day && s.staffId === member.id),
        }));

  // Summary counts describe what this view actually renders, not the whole week.
  const shown = columns.flatMap((column) => column.slots);
  const redactedCount = shown.filter((slot) => isDenied(slot.detail)).length;
  const span = view === "week" ? "this week" : "this day";

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Individual, group and walk-in appointments. Who a colleague is seeing stays on their calendar unless your role is allowed to know."
        actions={
          <div role="group" aria-label="Calendar view" className="flex rounded-lg border border-line bg-surface p-0.5">
            {(["week", "day"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setView(v);
                  setSelectedId(null);
                }}
                aria-pressed={view === v}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
                  view === v ? "bg-primary text-white" : "text-ink-soft hover:text-ink"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        }
      />

      {denied ? (
        <Card className="p-4">
          <DeniedPanel denied={{ denied: true, reason: denied }} />
        </Card>
      ) : (
        <>
          <Card className="mb-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => step(-1)} className={navBtnCls} aria-label={`Previous ${view}`}>
                  <ChevronLeft aria-hidden className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => step(1)} className={navBtnCls} aria-label={`Next ${view}`}>
                  <ChevronRight aria-hidden className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={goToday}
                  className="h-9 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink hover:bg-background"
                >
                  Today
                </button>
                <p className="ml-1 min-h-5 text-sm font-medium text-ink" aria-live="polite">
                  {!weekStart || days.length === 0
                    ? ""
                    : view === "week"
                      ? weekLabel(days[0], days[4])
                      : longDay(day ?? days[0])}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SlidersHorizontal aria-hidden className="h-4 w-4 text-ink-soft" />
                {view === "week" && (
                  <select aria-label="Show calendar for" className={selectCls} value={staffId} onChange={(e) => setStaffId(e.target.value)}>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.mine ? `${member.name} (you)` : member.name}
                      </option>
                    ))}
                  </select>
                )}
                <select aria-label="Filter by appointment type" className={selectCls} value={type} onChange={(e) => setType(e.target.value)}>
                  <option value={ALL}>All types</option>
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {type !== ALL && (
                  <button type="button" onClick={() => setType(ALL)} className="text-sm font-medium text-primary hover:underline">
                    Clear
                  </button>
                )}
              </div>
            </div>
            {view === "day" && (
              <p className="mt-2 text-xs text-ink-soft">Showing every counsellor side by side for this day.</p>
            )}
          </Card>

          {error ? (
            <ErrorState
              title="Couldn’t load the calendar"
              body="The mock schedule service didn’t respond. Nothing has changed."
              onRetry={() => setReloadKey((k) => k + 1)}
            />
          ) : !schedule ? (
            <div role="status" aria-label="Loading calendar" className="space-y-2">
              <span className="sr-only">Loading calendar…</span>
              <div className="skeleton h-12" />
              <div className="skeleton h-[31rem]" />
            </div>
          ) : (
            <>
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 text-sm">
                  <p className="text-ink-soft" aria-live="polite">
                    {`${shown.length} ${shown.length === 1 ? "appointment" : "appointments"} ${span}`}
                    <span className="hidden sm:inline"> · viewing as {ROLE_LABELS[role]}</span>
                  </p>
                  {redactedCount > 0 && (
                    <p className="flex items-center gap-1.5 text-xs text-ink-soft">
                      <Lock aria-hidden className="h-3.5 w-3.5" />
                      {redactedCount} private to another counsellor
                    </p>
                  )}
                </div>

                {shown.length === 0 ? (
                  <EmptyState
                    icon={CalendarX2}
                    title={type === ALL ? `Nothing booked ${span}` : `No ${type.toLowerCase()} appointments ${span}`}
                    body={
                      type === ALL
                        ? "Appointments booked here will appear on the grid."
                        : "Try a different type, or clear the filter to see everything booked."
                    }
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <div className="flex min-w-[42rem]">
                      {/* Time gutter */}
                      <div className="w-16 shrink-0 border-r border-line">
                        <div className="h-12 border-b border-line" />
                        <div className="relative" style={{ height: ROWS * ROW_H }}>
                          {Array.from({ length: ROWS }).map((_, i) => {
                            const minutes = DAY_START_MIN + i * ROW_MIN;
                            return (
                              <div
                                key={i}
                                className="absolute inset-x-0 border-b border-line/60 pr-2 text-right"
                                style={{ top: i * ROW_H, height: ROW_H }}
                              >
                                {minutes % 60 === 0 && (
                                  <span className="text-xs text-ink-soft">
                                    {formatTime(`${String(Math.floor(minutes / 60)).padStart(2, "0")}:00`)}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {columns.map((column) => (
                        <div key={column.key} className="min-w-0 flex-1 border-r border-line last:border-r-0">
                          <div
                            className={`flex h-12 flex-col items-center justify-center border-b border-line ${
                              column.isToday && view === "week" ? "bg-primary-tint/60" : ""
                            }`}
                          >
                            <span className="text-sm font-medium text-ink">{column.label}</span>
                            <span className="min-h-4 text-xs text-ink-soft">{column.sublabel}</span>
                          </div>
                          <div
                            role="group"
                            aria-label={view === "week" ? longDay(column.key) : `${column.sublabel} ${column.label}`}
                            className="relative"
                            style={{ height: ROWS * ROW_H }}
                          >
                            {Array.from({ length: ROWS }).map((_, i) => (
                              <div
                                key={i}
                                aria-hidden
                                className="absolute inset-x-0 border-b border-line/60"
                                style={{ top: i * ROW_H, height: ROW_H }}
                              />
                            ))}

                            {column.isToday && now && now.minutes > DAY_START_MIN && now.minutes < DAY_END_MIN && (
                              <div
                                aria-hidden
                                className="absolute inset-x-0 z-10 border-t-2 border-crisis"
                                style={{ top: ((now.minutes - DAY_START_MIN) / ROW_MIN) * ROW_H }}
                              >
                                <span className="absolute -left-0.5 -top-1 h-2 w-2 rounded-full bg-crisis" />
                              </div>
                            )}

                            {column.slots.map((slot) => (
                              <SlotBlock
                                key={slot.id}
                                slot={slot}
                                selected={slot.id === selectedId}
                                onSelect={() => setSelectedId(slot.id === selectedId ? null : slot.id)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              <SlotDetail slot={selected} />
              <Legend />
            </>
          )}
        </>
      )}
    </>
  );
}

function SlotBlock({ slot, selected, onSelect }: { slot: CalendarSlot; selected: boolean; onSelect: () => void }) {
  const top = ((toMinutes(slot.start) - DAY_START_MIN) / ROW_MIN) * ROW_H + 2;
  const height = (slot.minutes / ROW_MIN) * ROW_H - 4;
  const time = `${formatTime(slot.start)}–${formatTime(endTime(slot.start, slot.minutes))}`;

  // Redacted slots carry a Denied marker instead of contents.
  const gated = slot.detail;
  const detail = isDenied(gated) ? null : gated;

  const tone = detail
    ? `${TYPE_TONE[detail.type]} ${detail.status === "completed" ? "opacity-60" : ""} ${
        detail.status === "no-show" ? "ring-1 ring-crisis/40" : ""
      }`
    : "border-line bg-background text-ink-soft";

  const label = detail
    ? `${time}, ${detail.studentName}, ${detail.type}, ${detail.room}, ${APPOINTMENT_STATUS[detail.status].label}`
    : `${time}, busy, ${slot.staffName}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={label}
      style={{ top, height }}
      className={`absolute left-1 right-1 z-20 overflow-hidden rounded-lg border px-2 py-1 text-left transition-shadow hover:shadow-sm ${tone} ${
        selected ? "ring-2 ring-primary ring-offset-1" : ""
      }`}
    >
      <span className="block truncate text-xs font-medium">{formatTime(slot.start)}</span>
      {detail ? (
        <>
          <span className="block truncate text-xs font-semibold">{detail.studentName}</span>
          {height > 50 && <span className="block truncate text-xs">{detail.type}</span>}
        </>
      ) : (
        <span className="flex items-center gap-1 truncate text-xs">
          <Lock aria-hidden className="h-3 w-3 shrink-0" />
          Busy
        </span>
      )}
    </button>
  );
}

function SlotDetail({ slot }: { slot: CalendarSlot | null }) {
  if (!slot) {
    return (
      <p className="mt-4 text-sm text-ink-soft">
        Select an appointment to see its details.
      </p>
    );
  }

  const time = `${formatTime(slot.start)} – ${formatTime(endTime(slot.start, slot.minutes))}`;
  const gated = slot.detail;
  const detail = isDenied(gated) ? null : gated;

  return (
    <Card className="mt-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{time}</p>
          <p className="text-xs text-ink-soft">
            {longDay(slot.date)} · {slot.minutes} min · {slot.staffName}
            {slot.mine && " (you)"}
          </p>
        </div>
        {detail && <AppointmentStatusBadge status={detail.status} />}
      </div>

      <div className="mt-3">
        {detail ? (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <Link href={`/caseload/${detail.studentId}`} className="flex items-center gap-1.5 font-medium text-primary hover:underline">
              <User aria-hidden className="h-4 w-4" />
              {detail.studentName}
            </Link>
            <span className="flex items-center gap-1.5 text-ink-soft">
              <CalendarDays aria-hidden className="h-4 w-4" />
              {detail.type}
            </span>
            <span className="flex items-center gap-1.5 text-ink-soft">
              <MapPin aria-hidden className="h-4 w-4" />
              {detail.room}
            </span>
          </div>
        ) : (
          <DeniedPanel denied={gated as Denied} />
        )}
      </div>
    </Card>
  );
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-soft">
      {TYPES.map((t) => (
        <span key={t} className="flex items-center gap-1.5">
          <span aria-hidden className={`h-3 w-3 rounded border ${TYPE_TONE[t]}`} />
          {t}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="h-3 w-3 rounded border border-line bg-background" />
        Busy (private)
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="h-3 w-3 rounded border border-crisis/40 ring-1 ring-crisis/40" />
        No-show
      </span>
    </div>
  );
}
