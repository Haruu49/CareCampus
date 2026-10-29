import { CaseloadView } from "@/components/caseload/caseload-view";

export default async function CaseloadPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <CaseloadView initialQuery={q ?? ""} />;
}
