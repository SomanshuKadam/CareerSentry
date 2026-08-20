import { ArrowUpRight, Building2, ExternalLink, Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button, CompanyMark, PageHeader, ProvenanceTrail, SectionHeading, StatusBadge } from "@/components/ui";
import { demoCompanies } from "@/lib/demo-data";

export default function CompaniesPage() {
  return (
    <>
      <PageHeader eyebrow="Source registry" title="Companies" description="Keep the corporate-to-careers path explicit. CareerSentry treats provenance as part of every job record.">
        <Button variant="secondary" icon={Building2}>Check coverage</Button>
        <Button icon={Plus}>Add company</Button>
      </PageHeader>
      <div className="dashboard-grid">
        <section className="source-callout"><span className="source-callout-icon"><ShieldCheck size={17} /></span><div><strong>Every source is verified before collection.</strong><p>We follow the official corporate handoff, keep the catalog URL, and flag a source when the path or access boundary changes.</p></div><Link href="/collectors" className="text-link">See health <ArrowUpRight size={14} /></Link></section>
        <div className="company-card-grid">{demoCompanies.map((company) => <article className="company-card" key={company.id}><div className="company-card-top"><div className="company-card-title"><CompanyMark mark={company.mark} tone={company.tone} size="md" /><div><strong>{company.name}</strong><small>{company.corporateUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}</small></div></div><StatusBadge status={company.status === "needs_review" ? "Needs review" : company.status === "degraded" ? "Degraded" : "Healthy"} /></div><p>{company.note}</p><ProvenanceTrail steps={company.provenance} /><div className="company-card-footer"><div className="company-card-stat"><span>Catalog rows</span><strong>{company.jobs}</strong></div><div className="company-card-stat"><span>Field coverage</span><strong>{company.coverage}%</strong></div><Link href={`/collectors?company=${company.id}`} className="text-link">Inspect <ArrowUpRight size={13} /></Link></div></article>)}</div>
        <section className="panel panel-pad"><SectionHeading title="How provenance works" description="A job is only considered authoritative when the path is traceable." /><div className="provenance-explainer"><div className="explainer-step"><span className="explainer-number">01</span><div><strong>Corporate path</strong><p>Start at the company domain, not an aggregator or an independently discovered ATS URL.</p></div></div><div className="explainer-line" /><div className="explainer-step"><span className="explainer-number">02</span><div><strong>Careers handoff</strong><p>Record the official careers entry and the delegated recruiting portal, when present.</p></div></div><div className="explainer-line" /><div className="explainer-step"><span className="explainer-number">03</span><div><strong>Catalog proof</strong><p>Every normalized record keeps its catalog URL, collector ID, and verification time.</p></div></div></div></section>
        <p className="footer-note"><ExternalLink size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />Company URLs in this fixture are public-domain examples; no account or restricted page is accessed.</p>
      </div>
    </>
  );
}
