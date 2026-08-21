import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, ExternalLink, ShieldAlert, Wrench } from "lucide-react";
import { Button, PageHeader, SectionHeading, StatusBadge } from "@/components/ui";
import { incident } from "@/lib/demo-data";
import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const { model } = await getDashboardData();
  const storedIncident = model.storage.latestIncident;
  const incidentCount = 1 + (storedIncident ? 1 : 0);
  const failedCheckCount = incident.failedChecks.filter((check) => check.state === "fail").length;

  return (
    <>
      <PageHeader eyebrow="Self-healing evidence" title="Incidents" description="Review controlled extraction failures with evidence and bounded repair prompts. The completed RevRag same-ID recovery is recorded separately in saved history; this queue is the owned layout-B lab.">
        <Button variant="secondary" icon={ShieldAlert}>Review health policy</Button>
        <Button href="/history" icon={Wrench}>Open evidence history</Button>
      </PageHeader>
      <div className="dashboard-grid">
        <section className="incident-queue-summary"><div><span className="queue-icon queue-danger"><AlertTriangle size={16} /></span><div><strong>{incidentCount}</strong><small>Needs review</small></div></div><div><span className="queue-icon queue-warning"><Wrench size={16} /></span><div><strong>0</strong><small>Live repairs</small></div></div><div><span className="queue-icon queue-success"><CheckCircle2 size={16} /></span><div><strong>1</strong><small>Known-good baseline</small></div></div><p>{model.storage.configured ? "Stored RevRag incidents are sanitized and shown beside the owned healing lab." : "No database is configured; this queue shows the owned healing-lab evidence fallback."}</p></section>
        <div className="section-heading incidents-heading"><div><h2>Open evidence queue</h2><p>Sorted by severity and evidence state.</p></div><span className="table-count">{incidentCount} incident{incidentCount === 1 ? "" : "s"}</span></div>
        <div className="incident-list">
          {storedIncident ? <article className="incident-card"><div className="incident-card-main"><div className="incident-card-title"><span className="incident-severity incident-severity-amber" /><strong>RevRag AI / stored collector incident</strong><StatusBadge status={storedIncident.status} /></div><p className="incident-card-description">{storedIncident.reasons.join("; ") || "The latest collector run did not pass the healthy snapshot gate."}</p><div className="incident-meta"><span><Clock3 size={12} />{storedIncident.createdAt}</span><span><code>{storedIncident.collectorId}</code></span><span><ExternalLink size={12} />Sanitized durable evidence</span></div></div><div className="incident-card-side"><div className="incident-counts"><span className="incident-count"><strong>{storedIncident.reasons.length}</strong><span>reasons</span></span></div></div></article> : null}
          <Link href={`/incidents/${incident.id}`} className="incident-card"><div className="incident-card-main"><div className="incident-card-title"><span className="incident-severity incident-severity-amber" /><strong>{incident.collectorName} / empty-run regression</strong><StatusBadge status={incident.status} /></div><p className="incident-card-description">{incident.summary}</p><div className="incident-meta"><span><Clock3 size={12} />{incident.opened}</span><span><code>{incident.collectorId}</code></span><span><ExternalLink size={12} />Owned fixture only</span></div></div><div className="incident-card-side"><div className="incident-counts"><span className="incident-count"><strong>{failedCheckCount}</strong><span>failed</span></span><span className="incident-count"><strong>{incident.preview.after.rows}</strong><span>current rows</span></span></div><span className="text-link">Review <ArrowUpRight size={13} /></span></div></Link>
        </div>
        <section className="panel panel-pad"><SectionHeading title="Healing states" description="Every controlled transition is visible and auditable." /><div className="state-flow"><span className="state-node state-node-neutral">Degraded</span><i>→</i><span className="state-node state-node-warning">Awaiting review</span><i>→</i><span className="state-node state-node-violet">Repair rejected</span><i>→</i><span className="state-node state-node-green">Baseline retained</span></div></section>
      </div>
    </>
  );
}
