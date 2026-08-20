import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, ExternalLink, ShieldAlert, Wrench } from "lucide-react";
import { Button, PageHeader, SectionHeading, StatusBadge } from "@/components/ui";
import { incident } from "@/lib/demo-data";

export default function IncidentsPage() {
  return (
    <>
      <PageHeader eyebrow="Self-healing queue" title="Incidents" description="Investigate extraction failures with evidence, a precise repair prompt, and a review gate before production changes.">
        <Button variant="secondary" icon={ShieldAlert}>Health policy</Button>
        <Button icon={Wrench}>Open healer</Button>
      </PageHeader>
      <div className="dashboard-grid">
        <section className="incident-queue-summary"><div><span className="queue-icon queue-danger"><AlertTriangle size={16} /></span><div><strong>1</strong><small>Needs attention</small></div></div><div><span className="queue-icon queue-warning"><Wrench size={16} /></span><div><strong>1</strong><small>Preview ready</small></div></div><div><span className="queue-icon queue-success"><CheckCircle2 size={16} /></span><div><strong>8</strong><small>Recovered this week</small></div></div><p>Healing keeps the same <code>c_* Collector ID</code>; storage and UI stay untouched.</p></section>
        <div className="section-heading incidents-heading"><div><h2>Open queue</h2><p>Sorted by severity and time detected.</p></div><span className="table-count">2 incidents</span></div>
        <div className="incident-list">
          <Link href={`/incidents/${incident.id}`} className="incident-card"><div className="incident-card-main"><div className="incident-card-title"><span className="incident-severity" /><strong>{incident.collectorName} · selector drift</strong><StatusBadge status="Preview ready" /></div><p className="incident-card-description">{incident.summary}</p><div className="incident-meta"><span><Clock3 size={12} />{incident.opened}</span><span><code>{incident.collectorId}</code></span><span><ExternalLink size={12} />{incident.company} official catalog</span></div></div><div className="incident-card-side"><div className="incident-counts"><span className="incident-count"><strong>3</strong><span>failed</span></span><span className="incident-count"><strong>48</strong><span>preview rows</span></span></div><span className="text-link">Review <ArrowUpRight size={13} /></span></div></Link>
          <Link href="/incidents/inc_uber_access_boundary" className="incident-card"><div className="incident-card-main"><div className="incident-card-title"><span className="incident-severity incident-severity-amber" /><strong>Uber careers catalog · access boundary</strong><StatusBadge status="Needs review" /></div><p className="incident-card-description">Catalog request reached an access challenge before cards rendered. Keep this source in diagnostics until a compliant public path is confirmed.</p><div className="incident-meta"><span><Clock3 size={12} />19 Aug 2026 · 18:17 IST</span><span><code>c_uber_catalog_demo</code></span><span><ExternalLink size={12} />Corporate path verified</span></div></div><div className="incident-card-side"><div className="incident-counts"><span className="incident-count"><strong>2</strong><span>failed</span></span><span className="incident-count"><strong>0</strong><span>rows</span></span></div><span className="text-link">Review <ArrowUpRight size={13} /></span></div></Link>
        </div>
        <section className="panel panel-pad"><SectionHeading title="Healing states" description="Every transition is visible and auditable." /><div className="state-flow"><span className="state-node state-node-neutral">Degraded</span><i>→</i><span className="state-node state-node-warning">Awaiting heal</span><i>→</i><span className="state-node state-node-violet">Preview ready</span><i>→</i><span className="state-node state-node-green">Recovered</span></div></section>
      </div>
    </>
  );
}
