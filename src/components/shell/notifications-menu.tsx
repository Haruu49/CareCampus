"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Bell, BellOff } from "lucide-react";
import type { AppNotification } from "@/lib/mock/types";

export function NotificationsMenu({ initial }: { initial: AppNotification[] }) {
  const [items, setItems] = useState(initial);
  const unread = items.filter((n) => !n.read).length;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-background"
        >
          <Bell aria-hidden className="h-5 w-5" />
          {unread > 0 && (
            <span aria-hidden className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-crisis px-1 text-[10px] font-semibold text-white">
              {unread}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold">Notifications</h2>
            <button
              type="button"
              disabled={unread === 0}
              onClick={() => setItems((prev) => prev.map((n) => ({ ...n, read: true })))}
              className="text-xs font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-ink-soft/60 disabled:no-underline"
            >
              Mark all read
            </button>
          </div>
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
              <BellOff aria-hidden className="h-6 w-6 text-ink-soft" />
              <p className="text-sm text-ink-soft">You’re all caught up.</p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {items.map((n) => (
                <li key={n.id} className="flex gap-3 px-4 py-3 text-sm">
                  <span
                    aria-hidden
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-primary"}`}
                  />
                  <div>
                    <p className={n.read ? "text-ink-soft" : "text-ink"}>
                      {!n.read && <span className="sr-only">Unread: </span>}
                      {n.text}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">{n.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
