import { JobsView } from "@/components/jobs-view";
import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const { jobs, model } = await getDashboardData();
  const sourceText = model.source.isPersisted
    ? "the stored last-known-good snapshot"
    : "the saved verified RevRag run";

  return (
    <div className="product-page">
      <header className="page-lead">
        <p className="eyebrow">Real public data</p>
        <h1>RevRag AI jobs</h1>
        <p>{jobs.length} active roles from {sourceText}. Application-form links are intentionally excluded.</p>
      </header>
      <JobsView jobs={jobs} sourceLabel={model.source.label} />
    </div>
  );
}
