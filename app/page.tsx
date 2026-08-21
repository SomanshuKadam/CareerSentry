import Link from "next/link";

import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { jobs, model } = await getDashboardData();

  return (
    <div className="product-page">
      <section className="product-hero">
        <p className="eyebrow">CareerSentry</p>
        <h1>Job data that does not fail silently.</h1>
        <p className="hero-copy">
          CareerSentry collects public roles from official company career pages, checks the
          result, and keeps the collector repairable when the page changes.
        </p>
        <div className="hero-actions">
          <Link className="primary-link" href="/jobs">See the {jobs.length} real jobs</Link>
          <Link className="secondary-link" href="/reliability">See what broke and how it was fixed</Link>
        </div>
      </section>

      <section className="truth-strip" aria-label="Current project state">
        <div><span>Real source</span><strong>RevRag AI careers</strong></div>
        <div><span>Verified result</span><strong>{jobs.length} public roles</strong></div>
        <div><span>Collector</span><strong>Same ID before and after repair</strong></div>
        <div><span>Dashboard source</span><strong>{model.source.isPersisted ? "Stored snapshot" : "Saved verified evidence"}</strong></div>
      </section>

      <section className="content-section">
        <div className="section-intro">
          <p className="eyebrow">The actual project</p>
          <h2>One real source. One reliability problem. One controlled demo.</h2>
        </div>
        <div className="story-steps">
          <article>
            <span>01</span>
            <h3>Collect</h3>
            <p>A custom Bright Data Scraper Studio collector reads RevRag&apos;s official public careers page.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Validate</h3>
            <p>CareerSentry rejects incomplete rows, off-domain links, duplicates, and application-form data.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Repair</h3>
            <p>The collector was repaired in place and verified again without changing its ID or the jobs UI.</p>
          </article>
        </div>
      </section>

      <section className="source-split">
        <article className="source-card source-card-real">
          <p className="eyebrow">Real company data</p>
          <h2>RevRag AI</h2>
          <p>{jobs.length} roles retained from a verified public run. No application forms, candidate data, or invented companies.</p>
          <Link href="/jobs">Browse the roles →</Link>
        </article>
        <article className="source-card">
          <p className="eyebrow">Project-owned test site</p>
          <h2>Healing lab</h2>
          <p>Three fictional roles exist only to break the page layout safely and demonstrate selector recovery.</p>
          <Link href="/demo-target/live">Open the clearly labeled demo →</Link>
        </article>
      </section>

      <section className="plain-note">
        <strong>No collection happens when you browse this site.</strong>
        <p>The public UI reads a stored snapshot when configured, otherwise it uses the bundled verified evidence.</p>
      </section>
    </div>
  );
}
