import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, ExternalLink, ShieldAlert, Wrench } from "lucide-react";
import { Button, PageHeader, SectionHeading, StatusBadge } from "@/components/ui";
import { incident } from "@/lib/demo-data";

export default function IncidentsPage() {
  const failedCheckCount = incident.failedChecks.filter((check) => check.state === "fail").length;

  return (
    <>
      <PageHeader eyebrow="Self-healing evidence" title="Incidents" description="Review controlled extraction failures with evidence and bounded repair prompts. The completed RevRag same-ID recovery is recorded separately in saved history; this queue is the owned layout-B lab.">
        <Button variant="secondary" icon={ShieldAlert}>Review health policy</Button>
        <Button href="/history" icon={Wrench}>Open evidence history</Button>
      </PageHeader>
      <div className="dashboard-grid">
        <section className="incident-queue-summary"><div><span className="queue-icon queue-danger"><AlertTriangle size={16} /></span><div><strong>1</strong><small>Needs review</small></div></div><div><span className="queue-icon queue-warning"><Wrench size={16} /></span><div><strong>0</strong><small>Live repairs</small></div></div><div><span className="queue-icon queue-success"><CheckCircle2 size={16} /></span><div><strong>1</strong><small>Known-good baseline</small></div></div><p>Owned-lab healing evidence keeps the same <code>c_*</code> Collector ID; no replacement collector or live source call is made.</p></section>
        <div className="section-heading incidents-heading"><div><h2>Open evidence queue</h2><p>Sorted by severity and evidence state.</p></div><span className="table-count">1 incident</span></div>
        <div className="incident-list">
          <Link href={`/incidents/${incident.id}`} className="incident-card"><div className="incident-card-main"><div className="incident-card-title"><span className="incident-severity incident-severity-amber" /><strong>{incident.collectorName} / empty-run regression</strong><StatusBadge status={incident.status} /></div><p className="incident-card-description">{incident.summary}</p><div className="incident-meta"><span><Clock3 size={12} />{incident.opened}</span><span><code>{incident.collectorId}</code></span><span><ExternalLink size={12} />Owned fixture only</span></div></div><div className="incident-card-side"><div className="incident-counts"><span className="incident-count"><strong>{failedCheckCount}</strong><span>failed</span></span><span className="incident-count"><strong>{incident.preview.after.rows}</strong><span>current rows</span></span></div><span className="text-link">Review <ArrowUpRight size={13} /></span></div></Link>
        </div>
        <section className="panel panel-pad"><SectionHeading title="Healing states" description="Every controlled transition is visible and auditable." /><div className="state-flow"><span className="state-node state-node-neutral">Degraded</span><i>→</i><span className="state-node state-node-warning">Awaiting review</span><i>→</i><span className="state-node state-node-violet">Repair rejected</span><i>→</i><span className="state-node state-node-green">Baseline retained</span></div></section>
      </div>
    </>
  );
}
