"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, UserX } from "lucide-react";
import { useRole } from "@/components/shell/role-context";
import { Card, EmptyState, ErrorState } from "@/components/ui/states";
import { StatusBadge } from "@/components/ui/status-badge";
import { fetchStudentProfile, isDenied, type StudentProfileView } from "@/lib/auth/access";
import { CURRENT_USER_ID } from "@/lib/mock/students";
import { ROLE_LABELS, type Gated } from "@/lib/mock/types";
import { DeniedPanel } from "./denied-panel";
import {
  AcademicSection,
  ConsentSummary,
  DocumentsSection,
  NotesSection,
  ReferralsSection,
  SessionsSection,
} from "./sections";

type TabId = "academic" | "sessions" | "notes" | "documents" | "referrals";
const TABS: { id: TabId; label: string }[] = [
  { id: "academic", label: "Academic Standing" },
  { id: "sessions", label: "Session History" },
  { id: "notes", label: "Clinical Notes" },
  { id: "documents", label: "Documents" },
  { id: "referrals", label: "Referrals" },
];

function Gate<T>({ value, render }: { value: Gated<T>; render: (v: T) => React.ReactNode }) {
  return isDenied(value) ? <DeniedPanel denied={value} /> : <>{render(value as T)}</>;
}

export function StudentProfile({ id }: { id: string }) {
  const { role } = useRole();
  const [reloadKey, setReloadKey] = useState(0);
  const currentKey = `${role}:${id}:${reloadKey}`;
  const [loaded, setLoaded] = useState<{ key: string; view: StudentProfileView | null; error: boolean }>({
    key: "",
    view: null,
    error: false,
  });
  const loading = loaded.key !== currentKey;
  const view = loading ? undefined : loaded.view;
  const error = !loading && loaded.error;
  const [tab, setTab] = useState<TabId>("academic");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchStudentProfile(role, CURRENT_USER_ID, id)
      .then((v) => !cancelled && setLoaded({ key: currentKey, view: v, error: false }))
      .catch(() => !cancelled && setLoaded({ key: currentKey, view: null, error: true }));
    return () => {
      cancelled = true;
    };
  }, [role, id, reloadKey, currentKey]);

  const isTabRestricted = (t: TabId): boolean => {
    if (!view) return false;
    const map: Record<TabId, Gated<unknown>> = {
      academic: view.academic,
      sessions: view.sessions,
      notes: view.notes,
      documents: view.documents,
      referrals: view.referrals,
    };
    return isDenied(map[t]);
  };

  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = (index + dir + TABS.length) % TABS.length;
    setTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  if (error) {
    return (
      <>
        <BackLink />
        <ErrorState title="Couldn’t load this profile" body="The mock data service didn’t respond. Nothing has changed." onRetry={() => setReloadKey((k) => k + 1)} />
      </>
    );
  }

  if (view === null) {
    return (
      <>
        <BackLink />
        <Card>
          <EmptyState icon={UserX} title="Student not found" body="This record doesn’t exist in the prototype data." />
        </Card>
      </>
    );
  }

  if (view === undefined) {
    return (
      <>
        <BackLink />
        <div role="status" aria-label="Loading profile" className="space-y-4">
          <span className="sr-only">Loading profile…</span>
          <div className="skeleton h-28" />
          <div className="skeleton h-10 w-full max-w-lg" />
          <div className="skeleton h-72" />
        </div>
      </>
    );
  }

  return (
    <>
      <BackLink />

      <Card className="mb-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint text-lg font-semibold text-primary-strong"
            >
              {view.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
            </span>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-ink">{view.name}</h1>
              <p className="text-sm text-ink-soft">
                {view.pronouns} · {view.program} · {view.faculty} · Year {view.year}
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">
                {isDenied(view.studentNumber) ? "Student number restricted" : view.studentNumber} · Counsellor: {view.assignedCounsellorName}
              </p>
            </div>
          </div>
          <div className="text-right">
            <StatusBadge status={view.status} />
            <p className="mt-1 text-xs text-ink-soft">Viewing as {ROLE_LABELS[role]}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 border-t border-line pt-4 sm:grid-cols-3">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-soft">Contact</p>
            <Gate
              value={view.contact}
              render={(c) => (
                <div className="text-sm">
                  <p className="truncate">{c.email}</p>
                  <p className="text-ink-soft">{c.phone}</p>
                </div>
              )}
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-soft">Consent</p>
            <Gate value={view.consent} render={(c) => <ConsentSummary consent={c} />} />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-soft">Intake &amp; scheduling</p>
            <Gate
              value={view.intake}
              render={(intk) => (
                <div className="text-sm">
                  <p>Intake {intk.intakeDate}</p>
                  <p className="text-ink-soft">{intk.presentingReasonCategory}</p>
                  <p className="text-ink-soft">Next: {intk.nextAppointment ?? "None scheduled"}</p>
                </div>
              )}
            />
          </div>
        </div>
      </Card>

      <div role="tablist" aria-label="Student record sections" className="mb-3 flex flex-wrap gap-1 border-b border-line">
        {TABS.map((t, i) => {
          const restricted = isTabRestricted(t.id);
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onTabKeyDown(e, i)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                selected
                  ? "border-primary text-primary-strong"
                  : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {t.label}
              {restricted && <Lock aria-label="restricted" className="h-3 w-3" />}
            </button>
          );
        })}
      </div>

      <Card className="p-5">
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "academic" && <Gate value={view.academic} render={(a) => <AcademicSection academic={a} />} />}
          {tab === "sessions" && <Gate value={view.sessions} render={(s) => <SessionsSection sessions={s} />} />}
          {tab === "notes" && <Gate value={view.notes} render={(n) => <NotesSection notes={n} />} />}
          {tab === "documents" && <Gate value={view.documents} render={(d) => <DocumentsSection documents={d} />} />}
          {tab === "referrals" && (
            <Gate value={view.referrals} render={(r) => <ReferralsSection referrals={r} academicOnly={role === "advisor"} />} />
          )}
        </div>
      </Card>
    </>
  );
}

function BackLink() {
  return (
    <Link href="/caseload" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
      <ArrowLeft aria-hidden className="h-4 w-4" />
      Back to caseload
    </Link>
  );
}
