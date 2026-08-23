import Link from "next/link";

import { getDashboardData } from "@/lib/dashboard-data";
import { healingLabCollectorId, revragCollectorId } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function ReliabilityPage() {
  const { jobs, model } = await getDashboardData();
  const sourceLabel = model.source.isPersisted
    ? "the current stored snapshot"
    : "saved verified evidence";

  return (
    <div className="product-page">
      <header className="page-lead">
        <p className="eyebrow">How we keep results trustworthy</p>
        <h1>Collected, checked, then shown.</h1>
        <p>CareerSentry keeps the real RevRag source separate from a small fictional test used to explain self-healing.</p>
      </header>

      <section className="reliability-block">
        <div className="reliability-heading">
          <div>
            <p className="eyebrow">Real company source</p>
            <h2>RevRag output cleanup</h2>
          </div>
          <span className="status-badge status-success">Verified</span>
        </div>
        <ol className="evidence-timeline">
          <li>
            <span>First pass</span>
            <strong>15 raw entries</strong>
            <p>The first Bright Data run mixed 10 active roles with five entries marked “Opening soon” and exposed application-form links.</p>
          </li>
          <li>
            <span>Bright Data repair</span>
            <strong>Same scraper, cleaner output</strong>
            <p>An approval-gated Self-Healing cleanup kept active roles and official RevRag detail pages, without changing the Collector ID.</p>
          </li>
          <li>
            <span>Current result</span>
            <strong>{jobs.length} verified roles</strong>
            <p>The {sourceLabel} contains no error rows or application-form URLs, so those are the records the Jobs page shows.</p>
          </li>
        </ol>
        <details className="evidence-details">
          <summary>Technical evidence</summary>
          <dl className="source-facts">
            <div><dt>Collector</dt><dd><code>{revragCollectorId}</code></dd></div>
            <div><dt>Source</dt><dd><a href="https://www.revrag.ai/careers" target="_blank" rel="noreferrer">revrag.ai/careers</a></dd></div>
            <div><dt>Snapshot</dt><dd><code>{model.run.snapshotId ?? "Saved evidence"}</code></dd></div>
            <div><dt>Storage</dt><dd>{model.source.isPersisted ? "Neon PostgreSQL" : "Bundled evidence fallback"}</dd></div>
          </dl>
        </details>
      </section>

      <section className="reliability-block">
        <div className="reliability-heading">
          <div>
            <p className="eyebrow">Separate fictional test</p>
            <h2>What happens when a careers page changes?</h2>
          </div>
          <span className="status-badge status-success">Recovery verified</span>
        </div>
        <p className="section-copy">The same three fictional roles are rendered with a different HTML structure. The old scraper returns no rows, which gives CareerSentry a failure to detect and Bright Data a repair to propose.</p>
        <div className="lab-result-grid">
          <article><span>Before the page change</span><strong>3 rows</strong><p>The original structure is readable by the collector.</p></article>
          <article><span>After the page change</span><strong>0 rows</strong><p>The roles remain, but the old selectors no longer find them.</p></article>
          <article><span>Recovery status</span><strong>3 rows restored</strong><p>An inspected same-ID repair returned all three roles after approval, and the schema adapter normalized every row.</p></article>
        </div>
        <div className="inline-actions"><Link className="primary-link" href="/demo-target/live">Open the fictional test page</Link><span>It contains no employer or applicant data.</span></div>
        <details className="evidence-details">
          <summary>Technical evidence</summary>
          <p>Owned test Collector ID: <code>{healingLabCollectorId}</code>. A layout change is intentionally simulated on the stable test URL; one post-approval Layout-B run verified three adapter-valid rows. This experiment is separate from RevRag.</p>
        </details>
      </section>

      <section className="plain-note">
        <strong>Browsing this page never runs a scraper.</strong>
        <p>The website reads the trusted snapshot. Collector creation, Bright Data repair, approval, and reruns remain terminal-operated workflows.</p>
      </section>
    </div>
  );
}
