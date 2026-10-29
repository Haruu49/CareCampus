import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-tint text-primary">
        <Icon aria-hidden className="h-5 w-5" />
      </span>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="max-w-sm text-sm text-ink-soft">{body}</p>
      {action}
    </div>
  );
}

export function ErrorState({ title, body, onRetry }: { title: string; body: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 rounded-xl border border-crisis/20 bg-crisis-tint px-6 py-10 text-center">
      <AlertTriangle aria-hidden className="h-6 w-6 text-crisis" />
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="max-w-sm text-sm text-ink-soft">{body}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-line bg-surface ${className}`}>{children}</section>;
}
