import Link from "next/link";
import { notFound } from "next/navigation";

import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: { params: { jobId: string } }) {
  const { jobs } = await getDashboardData();
  const job = jobs.find((candidate) => candidate.jobId === params.jobId);
  if (!job) notFound();

  return (
    <div className="product-page narrow-page">
      <Link className="back-link-simple" href="/jobs">← All RevRag jobs</Link>
      <article className="job-detail-simple">
        <header>
          <p className="eyebrow">{job.department}</p>
          <h1>{job.title}</h1>
          <p>{job.location} · {job.employmentType}</p>
          <a className="primary-link" href={job.companyJobUrl} target="_blank" rel="noreferrer">Open official role page ↗</a>
        </header>
        <section>
          <h2>Source record</h2>
          <dl className="source-facts">
            <div><dt>Company</dt><dd>RevRag AI</dd></div>
            <div><dt>Job ID</dt><dd>{job.jobId}</dd></div>
            <div><dt>Source catalog</dt><dd><a href={job.sourceCatalogUrl} target="_blank" rel="noreferrer">revrag.ai/careers ↗</a></dd></div>
          </dl>
        </section>
        <aside className="plain-note">
          <strong>Why this record is trusted</strong>
          <p>It came from RevRag AI&apos;s official public careers catalog. CareerSentry does not store application forms, candidate data, or invented details.</p>
        </aside>
      </article>
    </div>
  );
}
