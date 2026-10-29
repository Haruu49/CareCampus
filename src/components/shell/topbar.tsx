"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { Brand, SidebarNav } from "./sidebar-nav";
import { StudentSearch } from "./student-search";
import { NotificationsMenu } from "./notifications-menu";
import { UserMenu } from "./user-menu";
import type { AppNotification } from "@/lib/mock/types";

export function Topbar({ notifications }: { notifications: AppNotification[] }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            aria-label="Open navigation menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-background lg:hidden"
          >
            <Menu aria-hidden className="h-5 w-5" />
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/40 lg:hidden" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-6 bg-surface p-4 shadow-xl lg:hidden"
          >
            <div className="flex items-center justify-between">
              <Dialog.Title asChild>
                <div>
                  <Brand />
                </div>
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-background"
                >
                  <X aria-hidden className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="flex min-w-0 flex-1 justify-center sm:justify-start">
        <StudentSearch />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <NotificationsMenu initial={notifications} />
        <UserMenu />
      </div>
    </header>
  );
}
