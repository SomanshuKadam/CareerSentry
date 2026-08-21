"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Activity, BriefcaseBusiness, Home, Menu, Sparkles, X, type LucideIcon } from "lucide-react";

type AppShellProps = {
  children: ReactNode;
};

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navigation: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
  { label: "Reliability", href: "/reliability", icon: Activity },
  { label: "Healing demo", href: "/demo-target/live", icon: Sparkles },
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

function NavigationLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const pathname = usePathname();
  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      className={`top-nav-link${active ? " top-nav-link-active" : ""}`}
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
    >
      <Icon size={16} strokeWidth={active ? 2 : 1.8} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}

export function AppShell({ children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="app-frame">
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="brand-link" aria-label="CareerSentry home">
            <BrandMark />
            <span className="brand-copy">
              <span className="brand-name">Career<span>Sentry</span></span>
              <span className="brand-kicker">Career data you can explain</span>
            </span>
          </Link>

          <button
            className="mobile-nav-toggle icon-button"
            type="button"
            onClick={() => setMobileNavOpen((open) => !open)}
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileNavOpen}
            aria-controls="primary-navigation"
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <nav
            id="primary-navigation"
            className={`top-nav${mobileNavOpen ? " top-nav-open" : ""}`}
            aria-label="Primary navigation"
          >
            {navigation.map((item) => (
              <NavigationLink key={item.href} item={item} onNavigate={() => setMobileNavOpen(false)} />
            ))}
          </nav>
        </div>
      </header>

      <div className="main-column">
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
