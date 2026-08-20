import Link from "next/link";
import { Activity, ArrowUpRight, CheckCircle2, ExternalLink, HeartPulse, RefreshCw, Wrench } from "lucide-react";
import { Button, PageHeader, ProgressBar, SectionHeading, StatusBadge } from "@/components/ui";
import { demoCollectors } from "@/lib/demo-data";

function statusTone(status: string) {
  return status === "healthy" ? "good" : status === "degraded" || status === "recovering" ? "warn" : "bad";
}

export default function CollectorsPage() {
  return (
    <>
      <PageHeader eyebrow="Reliability layer" title="Collector health" description="A run is only healthy when enumeration, field coverage, duplicates, links, and the last known-good baseline agree.">
        <Button variant="secondary" icon={Wrench}>Health rules</Button>
        <Button icon={RefreshCw}>Run all checks</Button>
      </PageHeader>
      <div className="dashboard-grid">
        <section className="collector-summary"><div className="collector-summary-card"><p>Overall health</p><strong>96%</strong><small className="delta delta-positive">↑ 4.2%</small></div><div className="collector-summary-card"><p>Healthy collectors</p><strong>2 / 4</strong><small>1 recovering</small></div><div className="collector-summary-card"><p>Rows this run</p><strong>211</strong><small className="delta delta-positive">↑ 2.1%</small></div><div className="collector-summary-card"><p>Open incidents</p><strong>2</strong><small className="delta delta-negative">↑ 1 today</small></div></section>
        <section className="panel table-wrap"><div className="panel-header"><div><h2>All collectors</h2><p>Stable IDs let healing happen in place without a downstream migration.</p></div><span className="status-badge status-info"><Activity size={13} />4 monitored</span></div><table className="data-table collector-table"><thead><tr><th>Collector</th><th>Type</th><th>Collector ID</th><th>Rows</th><th>Field coverage</th><th>Duplicates</th><th>Last run</th><th>Status</th></tr></thead><tbody>{demoCollectors.map((collector) => <tr key={collector.id}><td><div className="collector-name"><span className={`collector-dot ${statusTone(collector.status) === "warn" ? "warning" : statusTone(collector.status) === "bad" ? "danger" : ""}`} /><span><strong>{collector.name}</strong><small>{collector.company}</small></span></div></td><td><StatusBadge status={collector.kind} icon={false} /></td><td><span className="collector-id">{collector.id}</span></td><td><span className="health-number">{collector.rowCount}<span className={collector.rowCount < collector.previousRowCount ? "health-number bad" : "health-number good"}>({collector.rowCount >= collector.previousRowCount ? "+" : "−"}{Math.abs(collector.rowCount - collector.previousRowCount)})</span></span></td><td className="coverage-cell"><ProgressBar value={collector.fieldCoverage} tone={collector.fieldCoverage >= 98 ? "green" : collector.fieldCoverage >= 90 ? "amber" : "red"} /></td><td><span className={`health-number ${collector.duplicateRate > 2 ? "warn" : "good"}`}>{collector.duplicateRate.toFixed(1)}%</span></td><td><span className="run-time">{collector.lastRun}<small>{collector.duration} · {collector.schedule}</small></span></td><td><StatusBadge status={collector.status === "needs_review" ? "Needs review" : collector.status === "recovering" ? "Recovering" : collector.status === "degraded" ? "Degraded" : "Healthy"} /></td></tr>)}</tbody></table></section>
        <div className="two-columns"><section className="panel panel-pad"><SectionHeading title="Reliability contract" description="The checks that gate a preview from approval." /><div className="reliability-contract"><div><CheckCircle2 size={15} /><span><strong>Required fields</strong><small>Title, location, job ID, and official URL</small></span></div><div><HeartPulse size={15} /><span><strong>Baseline comparison</strong><small>Count and duplicate-rate anomalies</small></span></div><div><ExternalLink size={15} /><span><strong>Provenance allow-list</strong><small>URLs stay within the verified path</small></span></div><div><Wrench size={15} /><span><strong>Same-ID healing</strong><small>Repair without schema or UI changes</small></span></div></div></section><section className="panel panel-pad"><SectionHeading title="One collector, many consumers" description="Stable IDs keep the pipeline composable." /><div className="consumer-flow"><span>Scraper Studio</span><i>→</i><span>Normalizer</span><i>→</i><span>Health engine</span><i>→</i><span>Jobs UI</span></div><div className="consumer-note"><span className="flow-dot" />The Nutanix discovery collector is the current primary candidate.</div><Link href="/incidents/inc_canva_selector_drift" className="text-link">Review the active incident <ArrowUpRight size={13} /></Link></section></div>
        <p className="footer-note">Fixture health values are deterministic and safe to inspect without consuming Bright Data credits.</p>
      </div>
    </>
  );
}
