import type { LucideIcon } from "lucide-react";
import { PageHeader } from "./page-header";
import { Card, EmptyState } from "./states";

export function ComingSoon({ title, description, icon }: { title: string; description: string; icon: LucideIcon }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card>
        <EmptyState icon={icon} title={`${title} is coming in a later step`} body="This area is part of the shell so navigation is ready, but it isn’t built yet." />
      </Card>
    </>
  );
}
