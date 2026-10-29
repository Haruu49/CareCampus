import { PageHeader } from "@/components/ui/page-header";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { PriorityList } from "@/components/dashboard/priority-list";
import { TodaysAppointments } from "@/components/dashboard/todays-appointments";
import { getDashboard } from "@/lib/mock/api";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const { demo } = await searchParams;
  const data = await getDashboard(demo);

  return (
    <>
      <PageHeader title="Dashboard" description="Who in your caseload needs attention this week, and why." />
      <div className="flex flex-col gap-6">
        <MetricCards metrics={data.metrics} />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <PriorityList alerts={data.alerts} students={data.students} />
          <TodaysAppointments appointments={data.appointments} students={data.students} />
        </div>
      </div>
    </>
  );
}
