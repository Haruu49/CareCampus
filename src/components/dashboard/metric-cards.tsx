import type { Metric } from "@/lib/mock/types";

const TONE: Record<Metric["tone"], string> = {
  neutral: "text-ink-soft",
  crisis: "text-crisis",
  warn: "text-warn",
  ok: "text-ok",
};

export function MetricCards({ metrics }: { metrics: Metric[] }) {
  return (
    <ul aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metrics.map((m) => (
        <li key={m.id} className="rounded-xl border border-line bg-surface p-4">
          <p className="text-sm text-ink-soft">{m.label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-ink">{m.value}</p>
          <p className={`mt-1 text-xs ${TONE[m.tone]}`}>{m.context}</p>
        </li>
      ))}
    </ul>
  );
}
