"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { ROLE_LABELS, type Role } from "@/lib/mock/types";
import { useRole } from "./role-context";

const ROLES = Object.keys(ROLE_LABELS) as Role[];

export function UserMenu() {
  const { role, setRole } = useRole();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-background"
          aria-label={`Account menu, signed in as Dr. Amira Okafor, ${ROLE_LABELS[role]}`}
        >
          <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
            AO
          </span>
          <span className="hidden text-left leading-tight md:block">
            <span className="block text-sm font-medium">Dr. Amira Okafor</span>
            <span className="block text-xs text-ink-soft">{ROLE_LABELS[role]}</span>
          </span>
          <ChevronDown aria-hidden className="hidden h-4 w-4 text-ink-soft md:block" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-72 rounded-xl border border-line bg-surface p-1 shadow-lg"
        >
          <DropdownMenu.Label className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-ink-soft">
            Preview as role
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={role} onValueChange={(v) => setRole(v as Role)}>
            {ROLES.map((r) => (
              <DropdownMenu.RadioItem
                key={r}
                value={r}
                className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-primary-tint"
              >
                {ROLE_LABELS[r]}
                <DropdownMenu.ItemIndicator>
                  <Check aria-hidden className="h-4 w-4 text-primary" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <p className="px-3 py-2 text-xs leading-relaxed text-ink-soft">
            Prototype only. Switching roles changes the label, not what data you can access. Real sign-in and
            role checks come in a later step.
          </p>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
