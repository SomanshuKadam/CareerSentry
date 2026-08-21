"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { DemoJob } from "@/lib/demo-data";

export function JobsView({ jobs, sourceLabel }: { jobs: DemoJob[]; sourceLabel: string }) {
  const [query, setQuery] = useState("");
  const visibleJobs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return jobs;
    return jobs.filter((job) =>
      `${job.title} ${job.department} ${job.location} ${job.employmentType}`.toLowerCase().includes(needle),
    );
  }, [jobs, query]);

  return (
    <section className="jobs-catalog">
      <label className="job-search">
        <span>Search these roles</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try engineering, Bengaluru, or internship"
        />
      </label>

      <p className="result-count">{visibleJobs.length} of {jobs.length} roles</p>
      <div className="simple-job-list">
        {visibleJobs.map((job) => (
          <article className="simple-job" key={job.jobId}>
            <div>
              <p className="job-team">{job.department}</p>
              <h2><Link href={`/jobs/${job.jobId}`}>{job.title}</Link></h2>
              <p>{job.location} · {job.employmentType}</p>
            </div>
            <div className="job-links">
              <Link href={`/jobs/${job.jobId}`}>Details</Link>
              <a href={job.companyJobUrl} target="_blank" rel="noreferrer">Official page ↗</a>
            </div>
          </article>
        ))}
      </div>
      {visibleJobs.length === 0 ? <p className="empty-message">No roles match that search.</p> : null}
      <p className="data-caption">Source: {sourceLabel}. Role dates were not published, so no dates are invented.</p>
    </section>
  );
}
