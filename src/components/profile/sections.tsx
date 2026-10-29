import { CheckCircle2, FileText, XCircle } from "lucide-react";
import type {
  AcademicSummary,
  ClinicalNote,
  ConsentState,
  IntakeInfo,
  Referral,
  SessionEntry,
  StudentDocument,
} from "@/lib/mock/types";
import { EmptyState } from "@/components/ui/states";

const CONCERN: Record<SessionEntry["concern"], string> = {
  low: "bg-ok-tint text-ok",
  moderate: "bg-warn-tint text-warn",
  high: "bg-crisis-tint text-crisis",
};

export function ConsentRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 aria-hidden className="h-4 w-4 text-ok" />
      ) : (
        <XCircle aria-hidden className="h-4 w-4 text-ink-soft" />
      )}
      <span className={ok ? "text-ink" : "text-ink-soft"}>{label}</span>
      <span className="sr-only">{ok ? "granted" : "not granted"}</span>
    </div>
  );
}

export function ConsentSummary({ consent }: { consent: ConsentState }) {
  return (
    <div className="space-y-1.5">
      <ConsentRow ok={consent.counselling} label="Consent to counselling" />
      <ConsentRow ok={consent.academicShare} label="Share academic-risk info with advisors" />
      <ConsentRow ok={consent.releaseOfInfo} label="Release of information (referrals)" />
      <p className="pt-1 text-xs text-ink-soft">Updated {consent.updatedOn}</p>
    </div>
  );
}

export function AcademicSection({ academic }: { academic: AcademicSummary }) {
  const maxGpa = 4;
  const atRisk = academic.cumulativeGpa <= academic.probationThreshold + 0.3;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4">
        <div>
          <p className="text-xs text-ink-soft">Standing</p>
          <p className="text-sm font-medium">{academic.standing}</p>
        </div>
        <div>
          <p className="text-xs text-ink-soft">Cumulative GPA</p>
          <p className={`text-sm font-medium ${atRisk ? "text-warn" : ""}`}>{academic.cumulativeGpa.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-soft">Probation threshold</p>
          <p className="text-sm font-medium">{academic.probationThreshold.toFixed(2)}</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft">GPA by term</p>
        <ul className="space-y-1.5">
          {academic.terms.map((t) => (
            <li key={t.term} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 text-ink-soft">{t.term}</span>
              <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-background">
                <span
                  className={`absolute inset-y-0 left-0 rounded-full ${t.gpa <= academic.probationThreshold ? "bg-warn" : "bg-primary"}`}
                  style={{ width: `${(t.gpa / maxGpa) * 100}%` }}
                />
              </span>
              <span className="w-10 shrink-0 text-right font-medium">{t.gpa.toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink-soft">
          A fuller GPA trend and import flow arrive in a later step. Source: {academic.source} · updated {academic.updatedOn}.
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft">Current courses</p>
        <ul className="divide-y divide-line rounded-lg border border-line">
          {academic.courses.map((c) => (
            <li key={c.code} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>
                <span className="font-medium">{c.code}</span> <span className="text-ink-soft">{c.title}</span>
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  c.status === "failed"
                    ? "bg-crisis-tint text-crisis"
                    : c.status === "in-progress"
                      ? "bg-info-tint text-info"
                      : "bg-ok-tint text-ok"
                }`}
              >
                {c.grade === "—" ? "In progress" : c.grade}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function SessionsSection({ sessions }: { sessions: SessionEntry[] }) {
  if (sessions.length === 0) {
    return <EmptyState icon={FileText} title="No sessions logged" body="Session history will appear here once sessions are recorded." />;
  }
  return (
    <ol className="space-y-3">
      {[...sessions].reverse().map((s) => (
        <li key={s.id} className="rounded-lg border border-line p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{s.type}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONCERN[s.concern]}`}>{s.concern} concern</span>
            <span className="text-xs text-ink-soft">{s.date}</span>
          </div>
          <p className="mt-1.5 text-sm text-ink-soft">{s.summary}</p>
          {s.followUp && <p className="mt-1 text-xs text-ink-soft">Follow-up: {s.followUp}</p>}
        </li>
      ))}
    </ol>
  );
}

export function NotesSection({ notes }: { notes: ClinicalNote[] }) {
  if (notes.length === 0) {
    return <EmptyState icon={FileText} title="No clinical notes" body="Structured clinical notes will appear here." />;
  }
  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-warn-tint px-3 py-2 text-xs text-warn">
        Confidential clinical record. Visible only to the assigned counsellor and authorized clinical supervisor.
      </p>
      {notes.map((n) => (
        <article key={n.id} className="rounded-lg border border-line p-4">
          <header className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">{n.date}</span>
            <span className="text-xs text-ink-soft">{n.author}</span>
          </header>
          <dl className="space-y-2 text-sm">
            {[
              ["Presenting concern", n.presentingConcern],
              ["Relevant history", n.history],
              ["Risk assessment", n.riskAssessment],
              ["Safety plan", n.safetyPlan],
              ["Note", n.note],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</dt>
                <dd className="text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}

export function DocumentsSection({ documents }: { documents: StudentDocument[] }) {
  if (documents.length === 0) {
    return <EmptyState icon={FileText} title="No documents" body="Uploaded documents will appear here." />;
  }
  return (
    <ul className="divide-y divide-line rounded-lg border border-line">
      {documents.map((d) => (
        <li key={d.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
          <FileText aria-hidden className="h-4 w-4 text-ink-soft" />
          <span className="flex-1">
            <span className="font-medium">{d.name}</span>
            <span className="block text-xs text-ink-soft">
              {d.kind} · added {d.addedOn}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ReferralsSection({ referrals, academicOnly }: { referrals: Referral[]; academicOnly?: boolean }) {
  if (referrals.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No referrals"
        body={academicOnly ? "No academic referrals are recorded for this student." : "Consent-tracked referrals will appear here."}
      />
    );
  }
  return (
    <ul className="space-y-2">
      {referrals.map((r) => (
        <li key={r.id} className="rounded-lg border border-line p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">{r.target}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                r.status === "Pending consent" ? "bg-warn-tint text-warn" : "bg-info-tint text-info"
              }`}
            >
              {r.status}
            </span>
          </div>
          <p className="mt-1 text-ink-soft">{r.reason}</p>
          <p className="mt-1 text-xs text-ink-soft">{r.date}</p>
        </li>
      ))}
    </ul>
  );
}

export function IntakeSection({ intake }: { intake: IntakeInfo }) {
  const rows = [
    ["Intake date", intake.intakeDate],
    ["Referred by", intake.referredBy],
    ["Presenting reason (category)", intake.presentingReasonCategory],
    ["Preferred contact", intake.preferredContact],
    ["Next appointment", intake.nextAppointment ?? "None scheduled"],
  ];
  return (
    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="text-sm">
          <dt className="text-xs text-ink-soft">{label}</dt>
          <dd className="font-medium text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
