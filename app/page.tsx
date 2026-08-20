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
import { Button, CompanyMark, MetricCard, PageHeader, SectionHeading, Sparkline, StatusBadge } from "@/components/ui";
import { coverageSparkline, demoCollectors, demoJobs, demoProfile, overviewSparkline } from "@/lib/demo-data";

export default function OverviewPage() {
  const previewJobs = demoJobs.filter((job) => job.state !== "closed").slice(0, 4);
  const healthyCollectors = demoCollectors.filter((collector) => collector.status === "healthy").length;

  return (
    <>
      <PageHeader
        eyebrow="Wednesday · 20 August 2026"
        title="Good morning, here’s your signal."
        description="A clear view of the roles that moved, the collectors you can trust, and anything that needs your attention."
      >
        <Button href="/jobs" variant="secondary" icon={FileSearch}>Browse matches</Button>
        <Button href="/collectors" icon={Play}>Run health check</Button>
      </PageHeader>

      <div className="dashboard-grid">
        <section className="metrics-grid" aria-label="Overview metrics">
          <MetricCard label="New matches" value="18" detail="Since your last review" trend="+6 today" icon={Sparkles}>
            <div className="metric-sparkline"><Sparkline points={overviewSparkline} color="#685cf6" fill /></div>
          </MetricCard>
          <MetricCard label="Changed roles" value="7" detail="Salary, scope, or location changed" trend="+2 today" trendTone="neutral" icon={TrendingUp} />
          <MetricCard label="Closed roles" value="3" detail="Removed from the latest snapshots" trend="−1 today" trendTone="negative" icon={CircleAlert} />
          <MetricCard label="Collector health" value="96%" detail={`${healthyCollectors} of ${demoCollectors.length} collectors healthy`} trend="+4.2%" icon={ShieldCheck}>
            <div className="metric-sparkline"><Sparkline points={coverageSparkline} color="#2fbe99" fill /></div>
          </MetricCard>
        </section>

        <div className="overview-columns">
          <section className="panel jobs-preview">
            <div className="panel-header">
              <div><h2>Fresh matches</h2><p>Rules-based matches from the latest verified snapshots.</p></div>
              <Link href="/jobs" className="text-link">View all <ArrowUpRight size={14} /></Link>
            </div>
            <div className="panel-body">
              {previewJobs.map((job) => (
                <Link href={`/jobs/${job.jobId}`} className="job-row" key={job.jobId}>
                  <div className="job-main">
                    <CompanyMark mark={job.companyMark} tone={job.companyTone} size="sm" />
                    <span className="job-title-wrap"><span className="job-title">{job.title}</span><span className="job-company">{job.company} · {job.department.split(" · ")[1]}</span></span>
                  </div>
                  <div className="job-location">{job.location}<span>{job.workplaceType} · {job.employmentType}</span></div>
                  <div className="job-date">{job.publishedAt}<span className="job-company">Published</span></div>
                  <div className="job-score"><span className="score-pill">{job.matchScore}%</span><span className="score-label">match</span></div>
                </Link>
              ))}
            </div>
          </section>

          <section className="panel match-panel">
            <div className="panel-header">
              <div><h2>Matching profile</h2><p>Explainable rules, fictional demo profile.</p></div>
              <Sparkles size={16} color="#a7a0ff" />
            </div>
            <div className="match-profile">
              <span className="profile-avatar">AS</span>
              <div><strong>{demoProfile.role}</strong><span>{demoProfile.level}</span></div>
            </div>
            <div className="profile-tags">{demoProfile.locations.map((location) => <span className="profile-tag" key={location}>{location}</span>)}{demoProfile.skills.slice(0, 4).map((skill) => <span className="profile-tag" key={skill}>{skill}</span>)}</div>
            <div className="match-footer"><span>Last tuned 2 days ago</span><Link href="/settings" className="text-link">Edit profile <ArrowUpRight size={13} /></Link></div>
          </section>
        </div>

        <div className="overview-columns">
          <section className="panel">
            <div className="panel-header">
              <div><h2>Collector health</h2><p>Latest signal from every connected career source.</p></div>
              <Link href="/collectors" className="text-link">Open health <ArrowUpRight size={14} /></Link>
            </div>
            <div className="health-summary">
              <div className="health-score-row"><div><span className="health-score-label">Overall reliability</span><div className="health-score">96<small>/100</small></div></div><div className="health-ring"><span>96%</span></div></div>
              <div className="health-list">
                {demoCollectors.slice(0, 3).map((collector) => {
                  const warning = collector.status !== "healthy";
                  return <div className="health-row" key={collector.id}><div className="health-row-label"><strong>{collector.company} · {collector.kind}</strong><small>{collector.rowCount} rows · {collector.lastRun}</small></div><div className="health-mini-track"><span className={warning ? "warning" : ""} style={{ width: `${collector.fieldCoverage}%` }} /></div><span className="health-row-value">{collector.fieldCoverage}%</span></div>;
                })}
              </div>
              <div className="health-footer"><CheckCircle2 size={14} /> Last baseline comparison completed 4 min ago</div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header"><div><h2>Activity</h2><p>What changed while you were away.</p></div><Activity size={16} color="#8b98ad" /></div>
            <div className="panel-body">
              <div className="activity-list">
                <div className="activity-item"><span className="activity-icon activity-amber"><CircleAlert size={14} /></span><div className="activity-copy"><strong>Canva collector needs attention</strong><p>Preview is ready after a selector drift.</p></div><span className="activity-time">22m</span></div>
                <div className="activity-item"><span className="activity-icon activity-green"><CheckCircle2 size={14} /></span><div className="activity-copy"><strong>Nutanix snapshot verified</strong><p>54 rows · all required fields present.</p></div><span className="activity-time">27m</span></div>
                <div className="activity-item"><span className="activity-icon"><Sparkles size={14} /></span><div className="activity-copy"><strong>4 new roles matched</strong><p>Highest score: Platform Services · 94%.</p></div><span className="activity-time">29m</span></div>
              </div>
            </div>
          </section>
        </div>

        <div className="footer-note"><Clock3 size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />Showing sanitized fixture data · <strong>No live Bright Data requests are made in this workspace.</strong></div>
      </div>
    </>
  );
}
