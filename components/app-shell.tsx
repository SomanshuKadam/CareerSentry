"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Briefcase,
  Building2,
  ChevronDown,
  Clock3,
  Command,
  ExternalLink,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";

type AppShellProps = {
  children: ReactNode;
};

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

const primaryNav: NavItem[] = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Jobs", href: "/jobs", icon: Briefcase, badge: "10" },
  { label: "Companies", href: "/companies", icon: Building2 },
];

const reliabilityNav: NavItem[] = [
  { label: "Collector health", href: "/collectors", icon: Activity, badge: "2" },
  { label: "Incidents", href: "/incidents", icon: AlertTriangle, badge: "1" },
  { label: "Run history", href: "/history", icon: Clock3 },
];

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span className="brand-mark-ring brand-mark-ring-one" />
      <span className="brand-mark-ring brand-mark-ring-two" />
      <span className="brand-mark-dot" />
    </span>
  );
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const pathname = usePathname();
  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link className={`sidebar-link${active ? " sidebar-link-active" : ""}`} href={item.href} onClick={onNavigate}>
      <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
      <span>{item.label}</span>
      {item.badge ? <span className={`nav-badge${active ? " nav-badge-active" : ""}`}>{item.badge}</span> : null}
    </Link>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <aside className={`sidebar${open ? " sidebar-open" : ""}`}>
      <div className="sidebar-top">
        <div className="brand-row">
          <Link href="/" className="brand-link" onClick={onClose}>
            <BrandMark />
            <span className="brand-copy">
              <span className="brand-name">Career<span>Sentry</span></span>
              <span className="brand-kicker">CAREER INTELLIGENCE</span>
            </span>
          </Link>
          <button className="icon-button sidebar-close" onClick={onClose} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        <button className="workspace-switcher" type="button">
          <span className="workspace-avatar">D</span>
          <span className="workspace-copy">
            <span className="workspace-label">Workspace</span>
            <span className="workspace-name">Evidence workspace</span>
          </span>
          <ChevronDown size={15} />
        </button>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          <p className="nav-section-label">Workspace</p>
          {primaryNav.map((item) => <NavLink key={item.href} item={item} onNavigate={onClose} />)}

          <p className="nav-section-label nav-section-spaced">Reliability</p>
          {reliabilityNav.map((item) => <NavLink key={item.href} item={item} onNavigate={onClose} />)}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="credits-card">
          <div className="credits-heading">
            <span className="credits-icon"><Sparkles size={14} /></span>
            <span>Spend ceiling</span>
            <span className="credits-safe"><ShieldCheck size={13} /> Safe</span>
          </div>
          <div className="credits-number"><strong>3,000</strong><span>/ 5,000 max</span></div>
          <div className="credits-track"><span style={{ width: "60%" }} /></div>
          <p>Configured guard · 2,000-credit reserve · not a live balance.</p>
        </div>
        <Link className="sidebar-utility" href="/settings" onClick={onClose}><Settings size={16} /> Settings</Link>
        <Link className="sidebar-utility" href="/help" onClick={onClose}><HelpCircle size={16} /> Documentation <ExternalLink size={13} /></Link>
        <div className="sidebar-footer-note">Fixture mode <span className="fixture-dot" /> no live requests</div>
      </div>
    </aside>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const pageName = pathname === "/" ? "Overview" : pathname.split("/")[1]?.replace(/-/g, " ") || "Overview";
  const title = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-button menu-button" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button>
        <div className="breadcrumbs"><span>CareerSentry</span><span className="breadcrumb-slash">/</span><strong>{title}</strong></div>
      </div>
      <div className="topbar-actions">
        <button className="global-search" type="button"><Search size={16} /><span>Search anything</span><kbd><Command size={11} /> K</kbd></button>
        <span className="live-status"><span className="live-status-dot" /> Fixture mode</span>
        <button className="avatar-button" type="button" aria-label="Open account menu">AS</button>
      </div>
    </header>
  );
}

export function AppShell({ children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("nav-open", mobileNavOpen);
    return () => document.body.classList.remove("nav-open");
  }, [mobileNavOpen]);

  return (
    <div className="app-frame">
      <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      {mobileNavOpen ? <button className="sidebar-overlay" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation overlay" /> : null}
      <div className="main-column">
        <Topbar onMenu={() => setMobileNavOpen(true)} />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
