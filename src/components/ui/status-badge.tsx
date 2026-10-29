import type { VisibleStatus } from "@/lib/mock/types";

const TONE: Record<VisibleStatus["tone"], string> = {
  neutral: "bg-background text-ink-soft border border-line",
  crisis: "bg-crisis-tint text-crisis",
  warn: "bg-warn-tint text-warn",
  ok: "bg-ok-tint text-ok",
  info: "bg-info-tint text-info",
};

export function StatusBadge({ status }: { status: VisibleStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[status.tone]}`}>
      {status.label}
    </span>
  );
}
