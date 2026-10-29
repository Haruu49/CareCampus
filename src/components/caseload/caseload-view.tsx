"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronRight, SearchX, SlidersHorizontal, Users } from "lucide-react";
import { useRole } from "@/components/shell/role-context";
import { PageHeader } from "@/components/ui/page-header";
import { Card, EmptyState, ErrorState } from "@/components/ui/states";
import { StatusBadge } from "@/components/ui/status-badge";
import { fetchCaseload, type CaseloadRow } from "@/lib/auth/access";
import { COUNSELLORS, CURRENT_USER_ID } from "@/lib/mock/students";
import { ROLE_LABELS } from "@/lib/mock/types";

type SortKey = "name" | "year" | "lastContact" | "status";
const STATUS_RANK: Record<string, number> = { crisis: 0, academic: 1, active: 2, closed: 3 };

const ALL = "all";

export function CaseloadView({ initialQuery = "" }: { initialQuery?: string }) {
  const { role } = useRole();
  const [reloadKey, setReloadKey] = useState(0);
  const currentKey = `${role}:${reloadKey}`;
  const [loaded, setLoaded] = useState<{ key: string; rows: CaseloadRow[] | null; error: boolean }>({
    key: "",
    rows: null,
    error: false,
  });
  const loading = loaded.key !== currentKey;
  const rows = loading ? null : loaded.rows;
  const error = !loading && loaded.error;

  const [query, setQuery] = useState(initialQuery);
  const [faculty, setFaculty] = useState(ALL);
  const [year, setYear] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [counsellor, setCounsellor] = useState(ALL);
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    let cancelled = false;
    const demo = new URLSearchParams(window.location.search).get("demo") ?? undefined;
    fetchCaseload(role, demo)
      .then((r) => !cancelled && setLoaded({ key: currentKey, rows: r, error: false }))
      .catch(() => !cancelled && setLoaded({ key: currentKey, rows: null, error: true }));
    return () => {
      cancelled = true;
    };
  }, [role, reloadKey, currentKey]);

  const faculties = useMemo(() => [...new Set((rows ?? []).map((r) => r.faculty))].sort(), [rows]);
  const years = useMemo(() => [...new Set((rows ?? []).map((r) => r.year))].sort((a, b) => a - b), [rows]);
  const statuses = useMemo(() => {
    const seen = new Map<string, string>();
    (rows ?? []).forEach((r) => seen.set(r.status.key, r.status.label));
    return [...seen.entries()];
  }, [rows]);

  const visible = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (q && !`${r.name} ${r.program} ${r.faculty}`.toLowerCase().includes(q)) return false;
      if (faculty !== ALL && r.faculty !== faculty) return false;
      if (year !== ALL && String(r.year) !== year) return false;
      if (status !== ALL && r.status.key !== status) return false;
      if (counsellor !== ALL && r.assignedCounsellorId !== counsellor) return false;
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return filtered.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "year") cmp = a.year - b.year;
      else if (sortKey === "lastContact") cmp = a.lastContact.localeCompare(b.lastContact);
      else cmp = (STATUS_RANK[a.status.key] ?? 9) - (STATUS_RANK[b.status.key] ?? 9);
      return cmp !== 0 ? cmp * dir : a.name.localeCompare(b.name);
    });
  }, [rows, query, faculty, year, status, counsellor, sortKey, sortDir]);

  const activeFilters = [faculty, year, status, counsellor].filter((f) => f !== ALL).length + (query ? 1 : 0);
  const resetFilters = () => {
    setQuery("");
    setFaculty(ALL);
    setYear(ALL);
    setStatus(ALL);
    setCounsellor(ALL);
  };

  const selectCls =
    "h-9 rounded-lg border border-line bg-surface px-2.5 text-sm text-ink focus-visible:border-primary";

  return (
    <>
      <PageHeader
        title="Caseload"
        description="Search, filter and sort the students you support. Status badges and detail reflect your current role."
      />

      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="caseload-search" className="sr-only">
              Search caseload
            </label>
            <input
              id="caseload-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, program or faculty"
              className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal aria-hidden className="h-4 w-4 text-ink-soft" />
            <select aria-label="Filter by faculty" className={selectCls} value={faculty} onChange={(e) => setFaculty(e.target.value)}>
              <option value={ALL}>All faculties</option>
              {faculties.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <select aria-label="Filter by study year" className={selectCls} value={year} onChange={(e) => setYear(e.target.value)}>
              <option value={ALL}>All years</option>
              {years.map((y) => (
                <option key={y} value={String(y)}>
                  Year {y}
                </option>
              ))}
            </select>
            <select aria-label="Filter by status" className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value={ALL}>All statuses</option>
              {statuses.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by assigned counsellor"
              className={selectCls}
              value={counsellor}
              onChange={(e) => setCounsellor(e.target.value)}
            >
              <option value={ALL}>All counsellors</option>
              <option value={CURRENT_USER_ID}>My caseload</option>
              {COUNSELLORS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {activeFilters > 0 && (
              <button type="button" onClick={resetFilters} className="text-sm font-medium text-primary hover:underline">
                Clear ({activeFilters})
              </button>
            )}
          </div>
        </div>
      </Card>

      {error ? (
        <ErrorState
          title="Couldn’t load the caseload"
          body="The mock data service didn’t respond. Nothing has changed."
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      ) : rows === null ? (
        <div role="status" aria-label="Loading caseload" className="space-y-2">
          <span className="sr-only">Loading caseload…</span>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : (
        <Card>
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-sm">
            <p className="text-ink-soft" aria-live="polite">
              {visible.length} {visible.length === 1 ? "student" : "students"}
              <span className="hidden sm:inline"> · viewing as {ROLE_LABELS[role]}</span>
            </p>
            <label className="flex items-center gap-2 text-ink-soft">
              <ArrowUpDown aria-hidden className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Sort</span>
              <select
                aria-label="Sort by"
                className="h-8 rounded-lg border border-line bg-surface px-2 text-sm text-ink"
                value={`${sortKey}:${sortDir}`}
                onChange={(e) => {
                  const [k, d] = e.target.value.split(":");
                  setSortKey(k as SortKey);
                  setSortDir(d as "asc" | "desc");
                }}
              >
                <option value="status:asc">Priority status</option>
                <option value="name:asc">Name A–Z</option>
                <option value="name:desc">Name Z–A</option>
                <option value="year:asc">Year (low–high)</option>
                <option value="year:desc">Year (high–low)</option>
                <option value="lastContact:desc">Last contact (recent)</option>
                <option value="lastContact:asc">Last contact (oldest)</option>
              </select>
            </label>
          </div>

          {visible.length === 0 ? (
            rows.length === 0 ? (
              <EmptyState icon={Users} title="No students in this caseload" body="Students you’re assigned will appear here." />
            ) : (
              <EmptyState
                icon={SearchX}
                title="No students match your filters"
                body="Try a different search or clear the filters to see everyone."
                action={
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
                  >
                    Clear filters
                  </button>
                }
              />
            )
          ) : (
            <ul className="divide-y divide-line">
              {visible.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/caseload/${r.id}`}
                    className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-background"
                  >
                    <span
                      aria-hidden
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-tint text-sm font-semibold text-primary-strong"
                    >
                      {r.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{r.name}</span>
                      <span className="block truncate text-xs text-ink-soft">
                        {r.program} · {r.faculty} · Year {r.year}
                      </span>
                    </span>
                    <span className="hidden text-right text-xs text-ink-soft md:block">
                      <span className="block">{r.assignedCounsellorName}</span>
                      <span className="block">Last contact {r.lastContact}</span>
                    </span>
                    <StatusBadge status={r.status} />
                    <ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-ink-soft" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </>
  );
}
