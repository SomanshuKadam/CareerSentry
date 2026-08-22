import { JobsView } from "@/components/jobs-view";
import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const { jobs, model } = await getDashboardData();
  const sourceText = model.source.isPersisted
    ? "the current stored snapshot"
    : "saved verified evidence";

  return (
    <div className="product-page">
      <header className="page-lead">
        <p className="eyebrow">Real public data</p>
        <h1>RevRag AI jobs</h1>
        <p>{jobs.length} roles from {sourceText}. Each link goes to RevRag&apos;s official role page.</p>
      </header>
      <JobsView
        jobs={jobs}
        sourceLabel={model.source.isPersisted ? "RevRag AI's stored verified snapshot" : "Saved verified RevRag evidence"}
      />
    </div>
  );
}
