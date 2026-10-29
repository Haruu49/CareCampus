import type { ReactNode } from "react";
import { NOTIFICATIONS } from "@/lib/mock/data";
import { RoleProvider } from "./role-context";
import { Brand, SidebarNav } from "./sidebar-nav";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <RoleProvider>
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-surface px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
        <aside className="hidden border-r border-line bg-surface lg:flex lg:flex-col lg:gap-8 lg:p-4">
          <Brand />
          <SidebarNav />
          <p className="mt-auto rounded-lg bg-warn-tint p-3 text-xs leading-relaxed text-warn">
            Prototype with invented data. Not for real student or clinical records.
          </p>
        </aside>
        <div className="flex min-w-0 flex-col">
          <Topbar notifications={NOTIFICATIONS} />
          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>
        </div>
      </div>
    </RoleProvider>
  );
}
