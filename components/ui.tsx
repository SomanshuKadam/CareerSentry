import Link from "next/link";
import { ArrowUpRight, Check, ChevronRight, CircleAlert, CircleCheck, CircleX, Info, Minus, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {children ? <div className="page-header-actions">{children}</div> : null}
    </div>
  );
}

export function SectionHeading({ title, description, href, action }: { title: string; description?: string; href?: string; action?: string }) {
  return (
    <div className="section-heading">
      <div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
      {href && action ? <Link href={href} className="text-link">{action}<ArrowUpRight size={14} /></Link> : null}
    </div>
  );
}

export function StatusBadge({ status, icon = true }: { status: string; icon?: boolean }) {
  const normalized = status.toLowerCase().replace(/\s+/g, "_");
  const tone = normalized.includes("healthy") || normalized.includes("recovered") || normalized === "pass" || normalized === "active" ? "success" : normalized.includes("degraded") || normalized.includes("warning") || normalized.includes("preview") || normalized.includes("recover") || normalized === "new" || normalized === "changed" ? "warning" : normalized.includes("closed") || normalized.includes("fail") || normalized.includes("high") ? "danger" : normalized.includes("review") ? "neutral" : "info";
  const Icon = tone === "success" ? CircleCheck : tone === "danger" ? CircleX : tone === "warning" ? CircleAlert : Info;
  return <span className={`status-badge status-${tone}`}>{icon ? <Icon size={13} strokeWidth={2.3} /> : null}{status}</span>;
}

export function MetricCard({
  label,
  value,
  detail,
  trend,
  trendTone = "positive",
  icon: Icon,
  children,
}: {
  label: string;
  value: string;
  detail?: string;
  trend?: string;
  trendTone?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  children?: ReactNode;
}) {
  return (
    <article className="metric-card">
      <div className="metric-card-top"><span className="metric-icon"><Icon size={17} /></span>{trend ? <span className={`metric-trend trend-${trendTone}`}>{trend}</span> : null}</div>
      <p className="metric-label">{label}</p>
      <div className="metric-value">{value}</div>
      {detail ? <p className="metric-detail">{detail}</p> : null}
      {children}
    </article>
  );
}

export function Sparkline({ points, color = "#6d5dfc", fill = false }: { points: number[]; color?: string; fill?: boolean }) {
  const width = 160;
  const height = 42;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(max - min, 1);
  const coords = points.map((point, index) => `${(index / (points.length - 1)) * width},${height - ((point - min) / range) * (height - 8) - 4}`).join(" ");
  const area = `0,${height} ${coords} ${width},${height}`;
  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Trend sparkline" preserveAspectRatio="none">
      {fill ? <polygon points={area} fill={color} opacity="0.10" /> : null}
      <polyline points={coords} fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={coords.split(" ").at(-1)?.split(",")[1]} r="3" fill={color} />
    </svg>
  );
}

export function ProgressBar({ value, tone = "violet", label, showValue = true }: { value: number; tone?: "violet" | "green" | "amber" | "red"; label?: string; showValue?: boolean }) {
  return <div className="progress-wrap">{label || showValue ? <div className="progress-meta">{label ? <span>{label}</span> : <span />}{showValue ? <strong>{value}%</strong> : null}</div> : null}<div className="progress-track"><span className={`progress-fill progress-${tone}`} style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} /></div></div>;
}

export function CompanyMark({ mark, tone = "violet", size = "md" }: { mark: string; tone?: string; size?: "sm" | "md" | "lg" }) {
  return <span className={`company-mark company-mark-${tone} company-mark-${size}`}>{mark}</span>;
}

export function Delta({ value }: { value: string }) {
  const positive = value.startsWith("+");
  const negative = value.startsWith("−") || value.startsWith("-");
  return <span className={`delta${positive ? " delta-positive" : negative ? " delta-negative" : ""}`}>{positive ? "↑" : negative ? "↓" : <Minus size={11} />}{value.replace(/^([+−-])/, "")}</span>;
}

export function ProvenanceTrail({ steps }: { steps: string[] }) {
  return <div className="provenance-trail">{steps.map((step, index) => <span key={`${step}-${index}`} className="provenance-step"><span>{step}</span>{index < steps.length - 1 ? <ChevronRight size={13} /> : null}</span>)}</div>;
}

export function Button({ children, href, variant = "primary", icon: Icon, className = "", type = "button" }: { children: ReactNode; href?: string; variant?: "primary" | "secondary" | "ghost" | "danger"; icon?: LucideIcon; className?: string; type?: "button" | "submit" }) {
  const content = <>{Icon ? <Icon size={15} /> : null}{children}</>;
  if (href) return <Link className={`button button-${variant} ${className}`} href={href}>{content}</Link>;
  return <button className={`button button-${variant} ${className}`} type={type}>{content}</button>;
}

export function CheckItem({ label, detail, state }: { label: string; detail?: string; state: "pass" | "warn" | "fail" }) {
  const Icon = state === "pass" ? Check : state === "fail" ? CircleX : CircleAlert;
  return <div className="check-item"><span className={`check-icon check-${state}`}><Icon size={14} /></span><span className="check-copy"><strong>{label}</strong>{detail ? <small>{detail}</small> : null}</span></div>;
}

export function FilterChip({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return <button className={`filter-chip${active ? " filter-chip-active" : ""}`} type="button">{children}</button>;
}

export function TableEmpty({ title, description }: { title: string; description: string }) {
  return <div className="table-empty"><span className="empty-mark"><CircleCheck size={19} /></span><strong>{title}</strong><p>{description}</p></div>;
}
