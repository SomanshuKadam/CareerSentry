import Link from "next/link";
import { ArrowLeft, ExternalLink, GitBranch, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { Button, CompanyMark, PageHeader, ProvenanceTrail, SectionHeading, StatusBadge } from "@/components/ui";
import { demoCompanies, demoJobs } from "@/lib/demo-data";

export function generateStaticParams() {
  return demoJobs.map((job) => ({ jobId: job.jobId }));
}

export default function JobDetailPage({ params }: { params: { jobId: string } }) {
  const job = demoJobs.find((candidate) => candidate.jobId === params.jobId);
  if (!job) notFound();
  const company = demoCompanies.find((candidate) => candidate.id === job.companyId);
  if (!company) notFound();

  return (
    <>
      <Link href="/jobs" className="back-link"><ArrowLeft size={14} />Back to jobs</Link>
      <div className="job-detail-grid">
        <div className="job-detail-main">
          <PageHeader eyebrow={`${job.company} · ${job.department}`} title={job.title} description={`${job.location} · ${job.workplaceType} · ${job.employmentType}`}>
            <Button href={job.companyJobUrl} variant="secondary" icon={ExternalLink}>Official role page</Button>
            <Button icon={Sparkles}>Save match</Button>
          </PageHeader>
          <section className="panel panel-pad">
            <div className="job-detail-intro"><CompanyMark mark={job.companyMark} tone={job.companyTone} size="lg" /><div><h2>{job.company}</h2><p>{job.jobId} · collected {job.collectedAt}</p></div><StatusBadge status={job.state === "new" ? "New" : job.state === "changed" ? "Changed" : "Active"} /></div>
            <div className="job-detail-stats"><div><span>Location</span><strong><MapPin size={13} />{job.location}</strong></div><div><span>Published</span><strong>{job.publishedAt}</strong></div><div><span>Match score</span><strong className="match-score-large">{job.matchScore}%</strong></div></div>
          </section>
          <section className="panel panel-pad"><SectionHeading title="Why this matches" description="Transparent signals from the demo preference rules." /><div className="reason-grid">{job.matchReasons.map((reason) => <div className="reason-card" key={reason}><span><Sparkles size={13} /></span><strong>{reason}</strong><small>Contributes to the match score</small></div>)}</div></section>
        </div>
        <aside className="job-detail-side">
          <section className="panel panel-pad"><SectionHeading title="Source provenance" description="The path used to verify this role." /><ProvenanceTrail steps={company.provenance} /><div className="section-rule" /><div className="meta-row"><span>Source catalog</span><a href={job.sourceCatalogUrl} target="_blank" rel="noreferrer" className="table-url">Open <ExternalLink size={11} /></a></div><div className="meta-row"><span>Collector ID</span><strong className="incident-code">{job.collectorId}</strong></div><div className="meta-row"><span>Verification</span><strong>{job.collectedAt}</strong></div><div className="provenance-safe"><ShieldCheck size={14} /><span>Official domain allow-list passed</span></div></section>
          <section className="panel panel-pad"><SectionHeading title="Collector trail" description="No downstream schema changes required." /><div className="collector-trail"><div className="trail-step"><span className="trail-icon"><GitBranch size={13} /></span><div><strong>Discovery</strong><small>{job.collectorId}</small></div></div><div className="trail-line" /><div className="trail-step"><span className="trail-icon trail-icon-green"><ShieldCheck size={13} /></span><div><strong>Normalized</strong><small>Contract v1 · valid</small></div></div></div><Link href="/collectors" className="text-link">View collector health <ExternalLink size={13} /></Link></section>
        </aside>
      </div>
    </>
  );
}
