import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Clipboard, ExternalLink, GitBranch, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { notFound } from "next/navigation";
import { Button, CheckItem, PageHeader, ProvenanceTrail, SectionHeading, StatusBadge } from "@/components/ui";
import { demoCompanies, incident } from "@/lib/demo-data";

export function generateStaticParams() {
  return [{ incidentId: incident.id }, { incidentId: "inc_uber_access_boundary" }];
}

export default function IncidentDetailPage({ params }: { params: { incidentId: string } }) {
  if (params.incidentId === "inc_uber_access_boundary") {
    return <PlaceholderIncident />;
  }
  if (params.incidentId !== incident.id) notFound();
  const company = demoCompanies.find((candidate) => candidate.id === "canva");
  if (!company) notFound();

  return (
    <>
      <Link href="/incidents" className="back-link"><ArrowLeft size={14} />Back to incidents</Link>
      <PageHeader eyebrow={`Healing incident · ${incident.opened}`} title="Canva collector needs a repair" description={incident.summary}>
        <StatusBadge status="Preview ready" />
        <Button variant="secondary" icon={Clipboard}>Copy evidence</Button>
        <Button icon={Wrench}>Open healer</Button>
      </PageHeader>
      <div className="incident-detail-grid">
        <div className="incident-detail-main">
          <section className="incident-header-banner"><AlertTriangle size={18} /><div><strong>Approval gate is ready</strong><p>The preview restores required-field coverage and enumeration. Review the evidence before approving the same Collector ID.</p></div></section>
          <section className="panel panel-pad"><SectionHeading title="Failed checks" description="Compared with the last known-good Canva snapshot." /><div className="check-grid">{incident.failedChecks.map((check) => <CheckItem key={check.label} label={check.label} detail={`${check.value} · ${check.detail}`} state={check.state as "pass" | "warn" | "fail"} />)}</div></section>
          <section className="panel panel-pad"><SectionHeading title="Broken sample" description="Sanitized evidence from the failing run." /><div className="evidence-card"><div className="evidence-card-top"><strong>{incident.brokenSample.title}</strong><span>representative input</span></div><span className="code-chip">{incident.brokenSample.url}</span><p>{incident.brokenSample.note}</p></div></section>
          <section className="panel panel-pad"><SectionHeading title="Repair prompt" description="Specific, bounded, and under the 1,000-character limit." /><div className="prompt-box"><p>{incident.prompt}</p></div><div className="prompt-footer"><span><Sparkles size={13} />Generated from failed checks and selector evidence</span><span>892 characters</span></div></section>
          <section className="panel panel-pad"><SectionHeading title="Preview comparison" description="The contract and provenance checks run before approval." /><div className="preview-compare"><div className="preview-stat"><div className="preview-stat-label"><span>Before repair</span><strong>Degraded</strong></div><div className="preview-stat-value">{incident.preview.before.rows} rows</div><small>{incident.preview.before.coverage} coverage · {incident.preview.before.duplicates} duplicates</small></div><span className="preview-arrow"><ArrowRight size={14} /></span><div className="preview-stat preview-after"><div className="preview-stat-label"><span>Preview</span><strong>Passes</strong></div><div className="preview-stat-value">{incident.preview.after.rows} rows</div><small>{incident.preview.after.coverage} coverage · {incident.preview.after.duplicates} duplicates</small></div></div><div className="approval-row"><p>Approving keeps <code className="incident-code">{incident.collectorId}</code> unchanged.</p><Button icon={CheckCircle2}>Approve preview</Button></div></section>
        </div>
        <aside className="incident-detail-side">
          <section className="panel panel-pad"><div className="collector-detail-header"><span><GitBranch size={18} /></span><div><h2>{incident.collectorName}</h2><p>{incident.collectorId}</p></div></div><div className="collector-detail-meta"><div className="meta-row"><span>Company</span><strong>{incident.company}</strong></div><div className="meta-row"><span>Opened</span><strong>{incident.opened}</strong></div><div className="meta-row"><span>Severity</span><StatusBadge status={incident.severity} /></div><div className="meta-row"><span>Preview duration</span><strong>{incident.preview.duration}</strong></div></div><div className="section-rule" /><ProvenanceTrail steps={company.provenance} /><div className="provenance-safe"><ShieldCheck size={14} /><span>All preview links stay on canva.com</span></div></section>
          <section className="panel panel-pad"><SectionHeading title="Incident timeline" description="Every state transition is recorded." /><div className="timeline">{incident.timeline.map((item) => <div className="timeline-item" key={item.time}><span className={`timeline-dot timeline-${item.state}`} /><div className="timeline-copy"><strong>{item.title}</strong><p>{item.detail}</p></div><span className="timeline-time">{item.time}</span></div>)}</div></section>
          <section className="panel panel-pad recovery-card"><span className="recovery-icon"><ShieldCheck size={16} /></span><strong>Recovery proof</strong><p>Once approved, the next run must pass the same fixture regression and retain the same Collector ID.</p><Link href="/history" className="text-link">View run history <ExternalLink size={13} /></Link></section>
        </aside>
      </div>
    </>
  );
}

function PlaceholderIncident() {
  return <><Link href="/incidents" className="back-link"><ArrowLeft size={14} />Back to incidents</Link><PageHeader eyebrow="Diagnostics" title="Uber access boundary" description="This source is paused while a compliant public catalog path is verified."><StatusBadge status="Needs review" /></PageHeader><section className="panel panel-pad placeholder-incident"><span><AlertTriangle size={20} /></span><h2>No repair has been proposed</h2><p>Managed access does not override site or hackathon constraints. Keep this source in review until the official public experience renders usable vacancies.</p><Button href="/companies" variant="secondary">View source provenance</Button></section></>;
}
