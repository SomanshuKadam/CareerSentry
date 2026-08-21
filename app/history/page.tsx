import { ArrowDown, ArrowUp, CalendarDays, CheckCircle2, CircleAlert, Clock3, Download, Filter, RefreshCw } from "lucide-react";
import { Button, Delta, PageHeader, SectionHeading, StatusBadge } from "@/components/ui";
import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

const runPoints = [15, 10, 0, 3, 0];
const coveragePoints = [67, 100, 0, 100, 0];

function Chart() {
  const width = 760;
  const height = 112;
  const makePoints = (values: number[]) => values.map((value, index) => `${(index / (values.length - 1)) * width},${height - (value / 100) * (height - 16) - 8}`).join(" ");
  const rows = makePoints(runPoints);
  const coverage = makePoints(coveragePoints);
  return <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-label="Evidence rows and field coverage"><defs><linearGradient id="history-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#685cf6" stopOpacity=".16" /><stop offset="1" stopColor="#685cf6" stopOpacity="0" /></linearGradient></defs><polygon points={`0,${height} ${rows} ${width},${height}`} fill="url(#history-fill)" /><polyline points={rows} fill="none" stroke="#685cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><polyline points={coverage} fill="none" stroke="#2fbe99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4" /><circle cx={width} cy={rows.split(" ").at(-1)?.split(",")[1]} r="3.5" fill="#685cf6" /><circle cx={width} cy={coverage.split(" ").at(-1)?.split(",")[1]} r="3" fill="#2fbe99" /></svg>;
}

export default async function HistoryPage() {
  const { jobs: demoJobs, runs: demoRuns, model } = await getDashboardData();
  return (
    <>
      <PageHeader eyebrow="Evidence & lifecycle" title="Run history" description={`Trace RevRag collection evidence alongside the separate CareerSentry-owned healing lab. Storage mode: ${model.source.label}.`}>
        <Button variant="secondary" icon={CalendarDays}>Evidence window</Button>
        <Button variant="secondary" icon={Download}>Evidence JSON</Button>
        <Button href="/collectors" icon={RefreshCw}>Review health</Button>
      </PageHeader>
      <div className="dashboard-grid">
        <section className="history-overview"><div className="history-overview-copy"><span className="page-eyebrow">Saved run evidence</span><h2>Source truth stays separated.</h2><p>RevRag's initial saved run returned 15 entries: 10 valid active roles and 5 rejected error envelopes. An approval-gated cleanup was saved on the same Collector ID and verified 10 clean rows. The owned layout A/B lab retains a three-row baseline, a zero-row regression, and a rejected repair attempt.</p><div className="history-key-stats"><div><strong>{demoJobs.length}</strong><span>verified roles</span><Delta value="—" /></div><div><strong>{demoRuns.length}</strong><span>saved records</span><Delta value="—" /></div><div><strong>1</strong><span>healing incident</span><Delta value="—" /></div></div></div><div className="history-summary-chart"><span>Rows & field coverage in saved evidence</span><div className="history-chart-graphic"><Chart /></div><div className="chart-axis"><span>Initial</span><span>Lab</span><span>Recovered</span></div><div className="chart-legend"><span className="legend-dot" />Rows represented <span className="legend-dot legend-mint" />Field coverage</div></div></section>
        <section className="panel table-wrap"><div className="panel-header"><div><h2>Evidence records</h2><p>One row per saved RevRag run or controlled healing-lab state.</p></div><button className="filter-chip" type="button"><Filter size={13} />Filter</button></div><table className="data-table run-table"><thead><tr><th>Record</th><th>Collector</th><th>Status</th><th>Entries</th><th>Change</th><th>Duration</th><th>Trigger</th></tr></thead><tbody>{demoRuns.map((run) => <tr key={run.id}><td><span className="run-time">{run.time}<small>{run.id}</small></span></td><td><span className="table-job-copy"><strong>{run.collector}</strong><small className="collector-id">{run.collectorId}</small></span></td><td className="run-status"><StatusBadge status={run.status} /></td><td><span className="table-mono">{run.rows}</span></td><td><Delta value={run.delta} /></td><td><span className="table-mono">{run.duration}</span></td><td><span className="status-badge status-neutral">{run.trigger}</span></td></tr>)}</tbody></table></section>
        <div className="two-columns"><section className="panel panel-pad"><SectionHeading title="Lifecycle changes" description="No lifecycle state is inferred without a second external snapshot." /><div className="lifecycle-summary"><div><span className="lifecycle-icon lifecycle-new"><ArrowUp size={15} /></span><strong>{demoJobs.length}</strong><small>Active in saved run</small></div><div><span className="lifecycle-icon lifecycle-change"><RefreshCw size={14} /></span><strong>0</strong><small>Changed roles</small></div><div><span className="lifecycle-icon lifecycle-close"><ArrowDown size={15} /></span><strong>0</strong><small>Closed roles</small></div></div><div className="lifecycle-foot"><CheckCircle2 size={14} />Lifecycle comparison is intentionally not claimed.</div></section><section className="panel panel-pad"><SectionHeading title="Evidence retention" description="Sanitized bundles support reproducible review." /><div className="retention-list"><div><span><CircleAlert size={14} /></span><strong>1 open incident</strong><small>Owned layout A/B regression and rejected repair</small></div><div><span><CheckCircle2 size={14} /></span><strong>2 saved RevRag runs</strong><small>Initial degraded run and same-ID recovered verification / no application data</small></div><div><span><Clock3 size={14} /></span><strong>Fixture evidence retained</strong><small>No persistent feed or live company history is synthesized</small></div></div></section></div>
        <p className="footer-note">Run history is a truthful evidence view: two saved RevRag records (initial degraded and same-ID recovered) plus deterministic owned healing-lab records.</p>
      </div>
    </>
  );
}
