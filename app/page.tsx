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
          We collect public roles from official company career pages, check the result, and
          keep only the jobs we can explain.
        </p>
        <div className="hero-actions">
          <Link className="primary-link" href="/jobs">Browse {jobs.length} verified roles</Link>
          <Link className="secondary-link" href="/reliability">How reliability works</Link>
        </div>
      </section>

      <section className="truth-strip" aria-label="Current project state">
        <div><span>Official source</span><strong>RevRag AI careers</strong></div>
        <div><span>Current result</span><strong>{jobs.length} verified roles</strong></div>
        <div><span>Data status</span><strong>{model.source.isPersisted ? "Stored snapshot" : "Saved verified evidence"}</strong></div>
      </section>

      <section className="content-section">
        <div className="section-intro">
          <p className="eyebrow">How it works</p>
          <h2>One real source, checked before it reaches you.</h2>
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
            <h3>Keep</h3>
            <p>Only a healthy result is stored, so the jobs page never silently replaces good data with a broken run.</p>
          </article>
        </div>
      </section>

      <section className="source-split">
        <article className="source-card source-card-real">
          <p className="eyebrow">Real company data</p>
          <h2>RevRag AI</h2>
          <p>{jobs.length} roles from the current verified snapshot. No application forms, candidate data, or invented companies.</p>
          <Link href="/jobs">Browse the roles →</Link>
        </article>
        <article className="source-card">
          <p className="eyebrow">Separate fictional test</p>
          <h2>Self-healing demo</h2>
          <p>A safe test page changes its HTML while keeping the same three roles, so a scraper failure can be inspected without touching an employer.</p>
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
