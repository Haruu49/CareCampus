import { Lock } from "lucide-react";
import type { Denied } from "@/lib/mock/types";

export function DeniedPanel({ denied }: { denied: Denied }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-line bg-background px-4 py-4 text-sm">
      <Lock aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
      <div>
        <p className="font-medium text-ink">Restricted for your role</p>
        <p className="mt-0.5 text-ink-soft">{denied.reason}</p>
      </div>
    </div>
  );
}
