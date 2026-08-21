import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileSearch,
  Play,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button, CompanyMark, MetricCard, PageHeader, Sparkline } from "@/components/ui";
import { coverageSparkline, demoProfile, overviewSparkline } from "@/lib/demo-data";
import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const { jobs, collectors, sourceLabel, sourceNote } = await getDashboardData();
  const previewJobs = jobs.slice(0, 4);
  const healthyCollectors = collectors.filter((collector) => collector.status === "healthy").length;
  const verifiedCoverage = jobs.length > 0 ? 100 : 0;
  const healingLab = collectors.find((collector) => collector.company === "CareerSentry Healing Lab");

  return (
    <>
      <PageHeader
        eyebrow="Saved RevRag recovery"
        title="Good morning, here is your signal."
        description={`RevRag currently shows ${jobs.length} verified roles from ${sourceLabel}. ${sourceNote} The separate healing lab remains unresolved on layout B.`}
      >
        <Button href="/jobs" variant="secondary" icon={FileSearch}>Browse verified roles</Button>
        <Button href="/collectors" icon={Play}>Review evidence health</Button>
      </PageHeader>

      <div className="dashboard-grid">
        <section className="metrics-grid" aria-label="Overview metrics">
          <MetricCard label="Verified roles" value={String(jobs.length)} detail={sourceLabel} trend="Accepting applications" icon={Sparkles}>
            <div className="metric-sparkline"><Sparkline points={overviewSparkline} color="#685cf6" fill /></div>
          </MetricCard>
          <MetricCard label="Changed roles" value="0" detail="No comparison run saved" trend="Not evaluated" trendTone="neutral" icon={TrendingUp} />
          <MetricCard label="Closed roles" value="0" detail="No closure evidence in saved runs" trend="Not evaluated" trendTone="neutral" icon={CircleAlert} />
          <MetricCard label="Source coverage" value={`${verifiedCoverage}%`} detail={`${healthyCollectors} verified source collector; healing lab is separate`} trend="Recovery verified" icon={ShieldCheck}>
            <div className="metric-sparkline"><Sparkline points={coverageSparkline} color="#2fbe99" fill /></div>
          </MetricCard>
        </section>

        <div className="overview-columns">
          <section className="panel jobs-preview">
            <div className="panel-header">
              <div><h2>Verified roles</h2><p>Public RevRag records retained from the saved recovery without application URLs or personal data.</p></div>
              <Link href="/jobs" className="text-link">View all <ArrowUpRight size={14} /></Link>
            </div>
            <div className="panel-body">
              {previewJobs.map((job) => (
                <Link href={`/jobs/${job.jobId}`} className="job-row" key={job.jobId}>
                  <div className="job-main">
                    <CompanyMark mark={job.companyMark} tone={job.companyTone} size="sm" />
                    <span className="job-title-wrap"><span className="job-title">{job.title}</span><span className="job-company">{job.company} / {job.department}</span></span>
                  </div>
                  <div className="job-location">{job.location}<span>{job.workplaceType} / {job.employmentType}</span></div>
                  <div className="job-date">{job.publishedAt}<span className="job-company">Source date</span></div>
                  <div className="job-score"><span className="score-pill">{job.matchScore}%</span><span className="score-label">example match</span></div>
                </Link>
              ))}
            </div>
          </section>

          <section className="panel match-panel">
            <div className="panel-header">
              <div><h2>Example matching profile</h2><p>Scores are derived in-app from this sanitized preference profile.</p></div>
              <Sparkles size={16} color="#a7a0ff" />
            </div>
            <div className="match-profile">
              <span className="profile-avatar">AS</span>
              <div><strong>{demoProfile.role}</strong><span>{demoProfile.level}</span></div>
            </div>
            <div className="profile-tags">{demoProfile.locations.map((location) => <span className="profile-tag" key={location}>{location}</span>)}{demoProfile.skills.slice(0, 4).map((skill) => <span className="profile-tag" key={skill}>{skill}</span>)}</div>
            <div className="match-footer"><span>Example rules only</span><Link href="/settings" className="text-link">Edit profile <ArrowUpRight size={13} /></Link></div>
          </section>
        </div>

        <div className="overview-columns">
          <section className="panel">
            <div className="panel-header">
              <div><h2>Evidence health</h2><p>Saved source runs and the separate owned healing lab.</p></div>
              <Link href="/collectors" className="text-link">Open health <ArrowUpRight size={14} /></Link>
            </div>
            <div className="health-summary">
              <div className="health-score-row"><div><span className="health-score-label">Verified source coverage</span><div className="health-score">{verifiedCoverage}<small>/100</small></div></div><div className="health-ring"><span>{verifiedCoverage}%</span></div></div>
              <div className="health-list">
                {collectors.map((collector) => {
                  const warning = collector.status !== "healthy";
                  return <div className="health-row" key={collector.id}><div className="health-row-label"><strong>{collector.company} / {collector.kind}</strong><small>{collector.rowCount} rows / {collector.lastRun}</small></div><div className="health-mini-track"><span className={warning ? "warning" : ""} style={{ width: `${collector.fieldCoverage}%` }} /></div><span className="health-row-value">{collector.fieldCoverage}%</span></div>;
                })}
              </div>
              <div className="health-footer"><CheckCircle2 size={14} /> {healingLab ? `Healing-lab evidence remains in review; dashboard source: ${sourceLabel}.` : `Dashboard source: ${sourceLabel}.`}</div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header"><div><h2>Evidence activity</h2><p>What is represented in this workspace.</p></div><Activity size={16} color="#8b98ad" /></div>
            <div className="panel-body">
              <div className="activity-list">
                <div className="activity-item"><span className="activity-icon activity-green"><CheckCircle2 size={14} /></span><div className="activity-copy"><strong>RevRag same-ID recovery verified</strong><p>10 clean rows / zero error envelopes / same Collector ID.</p></div><span className="activity-time">source</span></div>
                <div className="activity-item"><span className="activity-icon activity-amber"><CircleAlert size={14} /></span><div className="activity-copy"><strong>Healing lab needs review</strong><p>Layout B returned zero rows; repair evidence was rejected.</p></div><span className="activity-time">lab</span></div>
                <div className="activity-item"><span className="activity-icon"><Sparkles size={14} /></span><div className="activity-copy"><strong>Example matches calculated</strong><p>Scores are UI-derived and are not source fields.</p></div><span className="activity-time">UI</span></div>
              </div>
            </div>
          </section>
        </div>

        <div className="footer-note"><Clock3 size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />Showing {sourceLabel} plus owned healing-lab evidence · <strong>Page loads never trigger Bright Data collection.</strong></div>
      </div>
    </>
  );
}
