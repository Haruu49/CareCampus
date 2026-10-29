"use client";

import { ErrorState } from "@/components/ui/states";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="We couldn’t load this page"
      body="Something went wrong while loading your data. Nothing has been changed. Please try again."
      onRetry={reset}
    />
  );
}
