import Link from "next/link";

import { getDashboardData } from "@/lib/dashboard-data";
import { healingLabCollectorId, revragCollectorId } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function ReliabilityPage() {
  const { jobs, model } = await getDashboardData();

  return (
    <div className="product-page">
      <header className="page-lead">
        <p className="eyebrow">Reliability, without the dashboard theatre</p>
        <h1>What broke, what was fixed, and what is still unfinished.</h1>
        <p>There are two separate stories below: a real RevRag collector and a project-owned layout test.</p>
      </header>
      <section className="reliability-block">
        <div className="reliability-heading"><div><p className="eyebrow">Real company source</p><h2>RevRag collector cleanup</h2></div><code>{revragCollectorId}</code></div>
        <ol className="evidence-timeline">
          <li><span>Initial run</span><strong>15 entries</strong><p>10 valid active jobs and 5 errors from roles marked “Opening soon.” The raw output also exposed Google application-form URLs.</p></li>
          <li><span>Repair</span><strong>Same collector ID</strong><p>The collector was changed to skip “Opening soon” cards and keep only same-origin RevRag job-detail URLs.</p></li>
          <li><span>Verification</span><strong>{jobs.length} clean jobs</strong><p>Zero error envelopes, zero application-form URLs, and ten distinct official detail links.</p></li>
        </ol>
        <p className="data-caption">Current UI source: {model.source.label}. Browsing this page does not rerun the collector.</p>
      </section>
      <section className="reliability-block">
        <div className="reliability-heading"><div><p className="eyebrow">CareerSentry-owned test site</p><h2>Controlled layout break</h2></div><code>{healingLabCollectorId}</code></div>
        <div className="lab-result-grid">
          <article><span>Layout A</span><strong>3 rows</strong><p>The original selector found all three fictional roles.</p></article>
          <article><span>Layout B</span><strong>0 rows</strong><p>A deliberately different DOM caused a clear count failure.</p></article>
          <article><span>Repair attempt</span><strong>Not recovered</strong><p>The prior approval failed and left the collector unchanged. We do not claim success.</p></article>
        </div>
        <div className="inline-actions"><Link className="primary-link" href="/demo-target/live">Open the stable owned demo</Link><span>Three fictional CS-* roles; no employer or applicant data.</span></div>
      </section>
      <section className="plain-note"><strong>Still unfinished</strong><p>A real database has not been provisioned, and the stable layout-B recovery has not been run through Scraper Studio. The code supports both, but this UI does not pretend they happened.</p></section>
    </div>
  );
}
