"use client";

import Link from "next/link";
import { ChevronDown, ExternalLink, Grid2X2, List, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { demoJobs, type DemoJob, type JobState } from "@/lib/demo-data";
import { CompanyMark, FilterChip, StatusBadge } from "@/components/ui";

const stateFilters: { label: string; value: "all" | JobState }[] = [
  { label: "All jobs", value: "all" },
  { label: "New", value: "new" },
  { label: "Changed", value: "changed" },
  { label: "Active", value: "active" },
];

function JobTableRow({ job }: { job: DemoJob }) {
  return (
    <tr>
      <td><Link href={`/jobs/${job.jobId}`} className="table-job"><CompanyMark mark={job.companyMark} tone={job.companyTone} size="sm" /><span className="table-job-copy"><strong>{job.title}</strong><small>{job.company} · {job.department}</small></span></Link></td>
      <td><span className="job-location">{job.location}<span>{job.workplaceType} · {job.employmentType}</span></span></td>
      <td><span className="score-pill">{job.matchScore}%</span></td>
      <td><StatusBadge status={job.state === "new" ? "New" : job.state === "changed" ? "Changed" : "Active"} /></td>
      <td><span className="table-mono">{job.publishedAt}</span></td>
      <td><a className="table-url" href={job.companyJobUrl} target="_blank" rel="noreferrer"><ExternalLink size={12} />Official page</a></td>
    </tr>
  );
}

export function JobsView() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"all" | JobState>("all");
  const [view, setView] = useState<"table" | "cards">("table");
  const [sort, setSort] = useState<"match" | "recent">("match");

  const filteredJobs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matches = demoJobs.filter((job) => {
      const matchesState = state === "all" || job.state === state;
      const haystack = `${job.title} ${job.company} ${job.location} ${job.department} ${job.matchReasons.join(" ")}`.toLowerCase();
      return matchesState && (!normalized || haystack.includes(normalized));
    });
    return [...matches].sort((left, right) => sort === "match" ? right.matchScore - left.matchScore : left.publishedAt.localeCompare(right.publishedAt));
  }, [query, sort, state]);

  return (
    <>
      <div className="filter-bar">
        <div className="filter-left">
          <label className="filter-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search role, company, or skill" aria-label="Search jobs" /></label>
          {stateFilters.map((filter) => <span key={filter.value} onClick={() => setState(filter.value)}><FilterChip active={state === filter.value}>{filter.label}{filter.value === "all" ? <span className="table-count">{demoJobs.length}</span> : null}</FilterChip></span>)}
        </div>
        <div className="filter-right">
          <button className="filter-chip" type="button" onClick={() => setSort(sort === "match" ? "recent" : "match")}><SlidersHorizontal size={13} />{sort === "match" ? "Best match" : "Most recent"}<ChevronDown size={13} /></button>
          <div className="view-toggle" aria-label="Choose view"><button className={view === "table" ? "active" : ""} type="button" onClick={() => setView("table")} aria-label="Table view"><List size={15} /></button><button className={view === "cards" ? "active" : ""} type="button" onClick={() => setView("cards")} aria-label="Card view"><Grid2X2 size={14} /></button></div>
        </div>
      </div>

      {view === "table" ? <section className="panel table-wrap"><table className="data-table jobs-table"><thead><tr><th>Role</th><th>Location</th><th>Match</th><th>State</th><th>Published</th><th>Source</th></tr></thead><tbody>{filteredJobs.map((job) => <JobTableRow job={job} key={job.jobId} />)}</tbody></table>{filteredJobs.length === 0 ? <div className="table-empty"><strong>No roles match that search</strong><p>Try a broader title, location, or skill.</p></div> : null}</section> : <section className="job-card-list">{filteredJobs.map((job) => <Link href={`/jobs/${job.jobId}`} className="job-card" key={job.jobId}><div className="job-card-head"><CompanyMark mark={job.companyMark} tone={job.companyTone} size="md" /><div className="job-title-wrap"><span className="job-title">{job.title}</span><span className="job-company">{job.company} · {job.department}</span></div><span className="score-pill">{job.matchScore}%</span></div><div className="job-card-meta"><span><MapPin size={12} />{job.location}</span><span>{job.workplaceType}</span><StatusBadge status={job.state === "new" ? "New" : job.state === "changed" ? "Changed" : "Active"} /></div><div className="job-card-reasons">{job.matchReasons.map((reason) => <span key={reason}>{reason}</span>)}</div></Link>)}</section>}
      <p className="footer-note">{filteredJobs.length} roles in the sanitized snapshot · Official links are shown for provenance review.</p>
    </>
  );
}
