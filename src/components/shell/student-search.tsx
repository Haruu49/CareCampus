"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserRound } from "lucide-react";
import { searchStudents } from "@/lib/mock/api";

export function StudentSearch() {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const results = useMemo(() => searchStudents(query), [query]);
  const showPanel = open && query.trim().length > 0;

  const choose = (index: number) => {
    const student = results[index];
    if (!student) return;
    setOpen(false);
    setQuery("");
    router.push(`/caseload/${student.id}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && showPanel && results.length) {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <label htmlFor="global-search" className="sr-only">
        Search students
      </label>
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
      <input
        ref={inputRef}
        id="global-search"
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showPanel && results[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder="Search students by name or program"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-soft/70"
      />
      {showPanel && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Student results"
          className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-lg"
        >
          {results.length === 0 ? (
            <li role="option" aria-selected="false" aria-disabled className="px-3 py-3 text-sm text-ink-soft">
              No students match “{query}”.
            </li>
          ) : (
            results.map((s, i) => (
              <li
                key={s.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                  i === active ? "bg-primary-tint" : ""
                }`}
              >
                <UserRound aria-hidden className="h-4 w-4 text-ink-soft" />
                <span className="font-medium">{s.name}</span>
                <span className="truncate text-ink-soft">
                  {s.program} · Year {s.year}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
