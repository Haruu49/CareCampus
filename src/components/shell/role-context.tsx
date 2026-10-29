"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { Role } from "@/lib/mock/types";

interface RoleState {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleState | null>(null);
const STORAGE_KEY = "campuscare.prototype.role";
const ROLES: Role[] = ["counsellor", "admin", "advisor", "frontdesk"];
const DEFAULT_ROLE: Role = "counsellor";

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

function readRole(): Role {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Role | null;
    if (saved && ROLES.includes(saved)) return saved;
  } catch {
    /* storage unavailable; use default */
  }
  return DEFAULT_ROLE;
}

/**
 * Prototype-only role switcher. This is NOT authentication or authorization:
 * a later step must enforce roles and consent on the server/data layer.
 */
export function RoleProvider({ children }: { children: ReactNode }) {
  const role = useSyncExternalStore(subscribe, readRole, () => DEFAULT_ROLE);

  const setRole = useCallback((next: Role) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  }, []);

  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}
