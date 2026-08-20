import { ArrowDown, ArrowUp, CalendarDays, CheckCircle2, CircleAlert, Clock3, Download, Filter, RefreshCw } from "lucide-react";
import { Button, Delta, PageHeader, SectionHeading, StatusBadge } from "@/components/ui";
import { demoRuns } from "@/lib/demo-data";

const runPoints = [55, 57, 54, 63, 61, 72, 69, 84, 76, 89, 86, 91, 87, 95, 92, 98];
const coveragePoints = [93, 94, 94, 95, 96, 95, 98, 97, 99, 98, 100, 99, 100, 100, 99, 100];

function Chart() {
  const width = 760;
  const height = 112;
  const makePoints = (values: number[]) => values.map((value, index) => `${(index / (values.length - 1)) * width},${height - ((value - 45) / 60) * 90}`).join(" ");
  const rows = makePoints(runPoints);
  const coverage = makePoints(coveragePoints);
  return <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-label="Rows and field coverage trend"><defs><linearGradient id="history-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#685cf6" stopOpacity=".16" /><stop offset="1" stopColor="#685cf6" stopOpacity="0" /></linearGradient></defs><polygon points={`0,${height} ${rows} ${width},${height}`} fill="url(#history-fill)" /><polyline points={rows} fill="none" stroke="#685cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><polyline points={coverage} fill="none" stroke="#2fbe99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4" /><circle cx={width} cy={rows.split(" ").at(-1)?.split(",")[0]} r="3.5" fill="#685cf6" /><circle cx={width} cy={coverage.split(" ").at(-1)?.split(",")[0]} r="3" fill="#2fbe99" /></svg>;
}

export default function HistoryPage() {
  return (
    <>
      <PageHeader eyebrow="Snapshots & lifecycle" title="Run history" description="Trace every collector run, baseline comparison, and job lifecycle change from one place.">
        <Button variant="secondary" icon={CalendarDays}>20 Aug – 13 Aug</Button>
        <Button variant="secondary" icon={Download}>Export evidence</Button>
        <Button icon={RefreshCw}>Refresh history</Button>
      </PageHeader>
      <div className="dashboard-grid">
        <section className="history-overview"><div className="history-overview-copy"><span className="page-eyebrow">Last 7 days</span><h2>Reliable signals are trending up.</h2><p>Rows recovered after the Canva incident while required-field coverage stayed above the approval threshold.</p><div className="history-key-stats"><div><strong>98.6%</strong><span>avg field coverage</span><Delta value="+3.2%" /></div><div><strong>27</strong><span>runs completed</span><Delta value="+5" /></div><div><strong>2</strong><span>incidents opened</span><Delta value="−1" /></div></div></div><div className="history-summary-chart"><span>Rows & field coverage</span><div className="history-chart-graphic"><Chart /></div><div className="chart-axis"><span>13 Aug</span><span>16 Aug</span><span>20 Aug</span></div><div className="chart-legend"><span className="legend-dot" />Rows discovered <span className="legend-dot legend-mint" />Field coverage</div></div></section>
        <section className="panel table-wrap"><div className="panel-header"><div><h2>Recent runs</h2><p>One row per snapshot, including the trigger and resulting status.</p></div><button className="filter-chip" type="button"><Filter size={13} />Filter</button></div><table className="data-table run-table"><thead><tr><th>Run</th><th>Collector</th><th>Status</th><th>Rows</th><th>Change</th><th>Duration</th><th>Trigger</th></tr></thead><tbody>{demoRuns.map((run) => <tr key={run.id}><td><span className="run-time">{run.time}<small>{run.id}</small></span></td><td><span className="table-job-copy"><strong>{run.collector}</strong><small className="collector-id">{run.collectorId}</small></span></td><td className="run-status"><StatusBadge status={run.status} /></td><td><span className="table-mono">{run.rows}</span></td><td><Delta value={run.delta} /></td><td><span className="table-mono">{run.duration}</span></td><td><span className="status-badge status-neutral">{run.trigger}</span></td></tr>)}</tbody></table></section>
        <div className="two-columns"><section className="panel panel-pad"><SectionHeading title="Lifecycle changes" description="What happened to roles across snapshots." /><div className="lifecycle-summary"><div><span className="lifecycle-icon lifecycle-new"><ArrowUp size={15} /></span><strong>18</strong><small>New roles</small></div><div><span className="lifecycle-icon lifecycle-change"><RefreshCw size={14} /></span><strong>7</strong><small>Changed roles</small></div><div><span className="lifecycle-icon lifecycle-close"><ArrowDown size={15} /></span><strong>3</strong><small>Closed roles</small></div></div><div className="lifecycle-foot"><CheckCircle2 size={14} />Dedupe runs before lifecycle comparison.</div></section><section className="panel panel-pad"><SectionHeading title="Evidence retention" description="Sanitized bundles support reproducible review." /><div className="retention-list"><div><span><CircleAlert size={14} /></span><strong>2 open incidents</strong><small>Before / broken / preview evidence retained</small></div><div><span><CheckCircle2 size={14} /></span><strong>14 healthy baselines</strong><small>Last known-good snapshot per collector</small></div><div><span><Clock3 size={14} /></span><strong>30 day window</strong><small>Demo fixture keeps the latest run history</small></div></div></section></div>
        <p className="footer-note">Run history is backed by deterministic fixtures while the API/storage vertical slice is wired.</p>
      </div>
    </>
  );
}
