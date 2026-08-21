import Link from "next/link";
import { Activity, ArrowUpRight, CheckCircle2, ExternalLink, HeartPulse, RefreshCw, Wrench } from "lucide-react";
import { Button, PageHeader, ProgressBar, SectionHeading, StatusBadge } from "@/components/ui";
import { incident } from "@/lib/demo-data";
import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

function statusTone(status: string) {
  return status === "healthy" ? "good" : status === "degraded" || status === "recovering" ? "warn" : "bad";
}

export default async function CollectorsPage() {
  const { collectors, jobs, model, sourceLabel } = await getDashboardData();
  const healthyCollectors = collectors.filter((collector) => collector.status === "healthy").length;
  const totalRows = collectors.reduce((total, collector) => total + collector.rowCount, 0);
  const verifiedCoverage = jobs.length > 0 ? 100 : 0;

  return (
    <>
      <PageHeader eyebrow="Reliability layer" title="Collector health" description="Evidence is separated by source. RevRag's saved history records a degraded 15-entry initial run and a 10-row same-ID recovery; the owned layout A/B lab remains in review after a controlled empty-run failure.">
        <Button variant="secondary" icon={Wrench}>Review health rules</Button>
        <Button href="/history" icon={RefreshCw}>Review evidence</Button>
      </PageHeader>
      <div className="dashboard-grid">
        <section className="collector-summary"><div className="collector-summary-card"><p>Verified source coverage</p><strong>{verifiedCoverage}%</strong><small className="delta delta-positive">Recovery verified</small></div><div className="collector-summary-card"><p>Healthy collectors</p><strong>{healthyCollectors} / {collectors.length}</strong><small>Owned lab is in review</small></div><div className="collector-summary-card"><p>Rows represented</p><strong>{totalRows}</strong><small>{sourceLabel}</small></div><div className="collector-summary-card"><p>Stored incident</p><strong>{model.storage.latestIncident ? 1 : 0}</strong><small className={model.storage.latestIncident ? "delta delta-negative" : ""}>{model.storage.configured ? "Durable storage" : "Saved-evidence fallback"}</small></div></section>
        <section className="panel table-wrap"><div className="panel-header"><div><h2>Evidence collectors</h2><p>Stable IDs preserve the source contract while keeping owned healing evidence separate.</p></div><span className="status-badge status-info"><Activity size={13} />{collectors.length} monitored</span></div><table className="data-table collector-table"><thead><tr><th>Collector</th><th>Type</th><th>Collector ID</th><th>Rows</th><th>Field coverage</th><th>Duplicates</th><th>Last evidence</th><th>Status</th></tr></thead><tbody>{collectors.map((collector) => <tr key={collector.id}><td><div className="collector-name"><span className={`collector-dot ${statusTone(collector.status) === "warn" ? "warning" : statusTone(collector.status) === "bad" ? "danger" : ""}`} /><span><strong>{collector.name}</strong><small>{collector.company}</small></span></div></td><td><StatusBadge status={collector.kind} icon={false} /></td><td><span className="collector-id">{collector.id}</span></td><td><span className="health-number">{collector.rowCount}<span className={collector.rowCount < collector.previousRowCount ? "health-number bad" : "health-number good"}>({collector.rowCount >= collector.previousRowCount ? "+" : "-"}{Math.abs(collector.rowCount - collector.previousRowCount)})</span></span></td><td className="coverage-cell"><ProgressBar value={collector.fieldCoverage} tone={collector.fieldCoverage >= 98 ? "green" : collector.fieldCoverage >= 90 ? "amber" : "red"} /></td><td><span className={`health-number ${collector.duplicateRate > 2 ? "warn" : "good"}`}>{collector.duplicateRate.toFixed(1)}%</span></td><td><span className="run-time">{collector.lastRun}<small>{collector.duration} / {collector.schedule}</small></span></td><td><StatusBadge status={collector.status === "needs_review" ? "Needs review" : collector.status === "recovering" ? "Recovering" : collector.status === "degraded" ? "Degraded" : "Healthy"} /></td></tr>)}</tbody></table></section>
        <div className="two-columns"><section className="panel panel-pad"><SectionHeading title="Reliability contract" description="The checks that gate evidence from approval." /><div className="reliability-contract"><div><CheckCircle2 size={15} /><span><strong>Required fields</strong><small>Title, location, job ID, and official URL</small></span></div><div><HeartPulse size={15} /><span><strong>Baseline comparison</strong><small>Count and duplicate-rate anomalies</small></span></div><div><ExternalLink size={15} /><span><strong>Provenance allow-list</strong><small>URLs stay within the verified path</small></span></div><div><Wrench size={15} /><span><strong>Same-ID healing</strong><small>Repair without schema or UI changes</small></span></div></div></section><section className="panel panel-pad"><SectionHeading title="One collector, many consumers" description="Stable IDs keep the pipeline composable." /><div className="consumer-flow"><span>Evidence</span><i>→</i><span>Normalizer</span><i>→</i><span>Health engine</span><i>→</i><span>Jobs UI</span></div><div className="consumer-note"><span className="flow-dot" />Saved RevRag run and recovery evidence is the current external source record; the healing lab is project-owned.</div><Link href={`/incidents/${incident.id}`} className="text-link">Review the healing-lab incident <ArrowUpRight size={13} /></Link></section></div>
        <p className="footer-note">Evidence values are deterministic and safe to inspect without consuming Bright Data credits or making live requests.</p>
      </div>
    </>
  );
}
