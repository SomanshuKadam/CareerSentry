import { RefreshCw, SlidersHorizontal } from "lucide-react";
import { Button, PageHeader } from "@/components/ui";
import { JobsView } from "@/components/jobs-view";
import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const { jobs, sourceLabel } = await getDashboardData();
  return (
    <>
      <PageHeader eyebrow="Verified role catalog" title="Jobs" description={`${jobs.length} active RevRag AI roles from ${sourceLabel}. Every row keeps its same-origin source and collector trail; application routes are excluded.`}>
        <Button variant="secondary" icon={SlidersHorizontal}>Tune matching</Button>
        <Button icon={RefreshCw}>Review snapshot</Button>
      </PageHeader>
      <JobsView jobs={jobs} sourceLabel={sourceLabel} />
    </>
  );
}
