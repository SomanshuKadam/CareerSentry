import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Clipboard, ExternalLink, GitBranch, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { notFound } from "next/navigation";
import { Button, CheckItem, PageHeader, ProvenanceTrail, SectionHeading, StatusBadge } from "@/components/ui";
import { demoCompanies, incident } from "@/lib/demo-data";

export function generateStaticParams() {
  return [{ incidentId: incident.id }];
}

export default function IncidentDetailPage({ params }: { params: { incidentId: string } }) {
  if (params.incidentId !== incident.id) notFound();
  const company = demoCompanies.find((candidate) => candidate.id === "careersentry-healing-lab");
  if (!company) notFound();

  return (
    <>
      <Link href="/incidents" className="back-link"><ArrowLeft size={14} />Back to incidents</Link>
      <PageHeader eyebrow={`Owned healing lab / ${incident.opened}`} title="Layout B incident needs review" description={incident.summary}>
        <StatusBadge status={incident.status} />
        <Button variant="secondary" icon={Clipboard}>Copy evidence</Button>
        <Button href="/history" icon={Wrench}>Open run history</Button>
      </PageHeader>
      <div className="incident-detail-grid">
        <div className="incident-detail-main">
          <section className="incident-header-banner"><AlertTriangle size={18} /><div><strong>Production repair was not approved</strong><p>The saved-template verification failed, so the original Collector ID and known-good layout A baseline remain unchanged.</p></div></section>
          <section className="panel panel-pad"><SectionHeading title="Failed checks" description="Compared with the known-good layout A fixture evidence." /><div className="check-grid">{incident.failedChecks.map((check) => <CheckItem key={check.label} label={check.label} detail={`${check.value} / ${check.detail}`} state={check.state as "pass" | "warn" | "fail"} />)}</div></section>
          <section className="panel panel-pad"><SectionHeading title="Broken sample" description="Sanitized evidence from the owned fixture regression." /><div className="evidence-card"><div className="evidence-card-top"><strong>{incident.brokenSample.title}</strong><span>owned fixture input</span></div><span className="code-chip">{incident.brokenSample.url}</span><p>{incident.brokenSample.note}</p></div></section>
          <section className="panel panel-pad"><SectionHeading title="Bounded repair prompt" description="Retained as healing evidence; it does not authorize a live call." /><div className="prompt-box"><p>{incident.prompt}</p></div><div className="prompt-footer"><span><Sparkles size={13} />Generated from owned fixture checks and selector evidence</span><span>{incident.prompt.length} characters</span></div></section>
          <section className="panel panel-pad"><SectionHeading title="Evidence comparison" description="The failed repair remains visible instead of being presented as recovery." /><div className="preview-compare"><div className="preview-stat"><div className="preview-stat-label"><span>Known-good layout A</span><strong>Baseline</strong></div><div className="preview-stat-value">{incident.preview.before.rows} rows</div><small>{incident.preview.before.coverage} coverage / {incident.preview.before.duplicates} duplicates</small></div><span className="preview-arrow"><ArrowRight size={14} /></span><div className="preview-stat preview-after"><div className="preview-stat-label"><span>Layout B evidence</span><strong>Needs review</strong></div><div className="preview-stat-value">{incident.preview.after.rows} rows</div><small>{incident.preview.after.coverage} coverage / {incident.preview.after.duplicates} duplicates</small></div></div><div className="approval-row"><p>Collector <code className="incident-code">{incident.collectorId}</code> was left unchanged after the failed repair.</p><Button href="/history" variant="secondary" icon={ExternalLink}>View evidence records</Button></div></section>
        </div>
        <aside className="incident-detail-side">
          <section className="panel panel-pad"><div className="collector-detail-header"><span><GitBranch size={18} /></span><div><h2>{incident.collectorName}</h2><p>{incident.collectorId}</p></div></div><div className="collector-detail-meta"><div className="meta-row"><span>Source</span><strong>{incident.company}</strong></div><div className="meta-row"><span>Opened</span><strong>{incident.opened}</strong></div><div className="meta-row"><span>Severity</span><StatusBadge status={incident.severity} /></div><div className="meta-row"><span>Repair state</span><strong>Rejected before save</strong></div></div><div className="section-rule" /><ProvenanceTrail steps={company.provenance} /><div className="provenance-safe"><ShieldCheck size={14} /><span>All fixture links stay on career-sentry.vercel.app</span></div></section>
          <section className="panel panel-pad"><SectionHeading title="Incident timeline" description="Every controlled state transition is recorded." /><div className="timeline">{incident.timeline.map((item) => <div className="timeline-item" key={item.time}><span className={`timeline-dot timeline-${item.state}`} /><div className="timeline-copy"><strong>{item.title}</strong><p>{item.detail}</p></div><span className="timeline-time">{item.time}</span></div>)}</div></section>
          <section className="panel panel-pad recovery-card"><span className="recovery-icon"><ShieldCheck size={16} /></span><strong>Safety outcome</strong><p>The failed owned-lab repair did not replace its Collector ID or alter the separate saved RevRag recovery evidence.</p><Link href="/collectors" className="text-link">View collector health <ExternalLink size={13} /></Link></section>
        </aside>
      </div>
    </>
  );
}
