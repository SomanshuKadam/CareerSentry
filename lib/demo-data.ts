export type HealthStatus = "healthy" | "degraded" | "recovering" | "needs_review";

export type DemoJob = {
  jobId: string;
  title: string;
  location: string;
  department: string;
  employmentType: string;
  companyJobUrl: string;
  sourceCatalogUrl: string;
};

export type DemoCompany = {
  id: string;
  name: string;
  mark: string;
  tone: string;
  corporateUrl: string;
  careersUrl: string;
  catalogUrl: string;
  provenance: string[];
  collectorId: string;
  status: HealthStatus;
  lastChecked: string;
  jobs: number;
  coverage: number;
  note: string;
};

export type CollectorStat = {
  id: string;
  name: string;
  company: string;
  kind: "Discovery" | "PDP";
  status: HealthStatus;
  lastRun: string;
  rowCount: number;
  previousRowCount: number;
  fieldCoverage: number;
  duplicateRate: number;
  invalidLinks: number;
  duration: string;
  schedule: string;
};

export const revragCollectorId = "c_mt3ctgtj2rqnwsqm8p";
export const healingLabCollectorId = "c_mt1wzptjco00s7w0p";
export const revragCatalogUrl = "https://www.revrag.ai/careers";
export const savedRecoveryLabel = "Saved verification / 10 clean rows";

type VerifiedRole = {
  companyJobUrl: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  experienceText: string;
};

const verifiedRoles: VerifiedRole[] = [
  {
    companyJobUrl: "https://www.revrag.ai/careers/ai-product-analyst-intern",
    title: "AI Product Analyst Intern",
    department: "Product & Design",
    location: "On-site, Bengaluru",
    employmentType: "Internship (6 months)",
    experienceText: "6 months, with a PPO based on performance",
  },
  {
    companyJobUrl: "https://www.revrag.ai/careers/data-scientist-intern",
    title: "Data Scientist Intern",
    department: "AI & Data",
    location: "On-site, Bengaluru",
    employmentType: "Internship (6 months)",
    experienceText: "6 months, with a PPO based on performance",
  },
  {
    companyJobUrl: "https://www.revrag.ai/careers/growth-associate",
    title: "Growth Associate (Content & Community)",
    department: "GTM and Revenue",
    location: "On-site, Bengaluru",
    employmentType: "Full-time",
    experienceText: "2 to 3+ years",
  },
  {
    companyJobUrl: "https://www.revrag.ai/careers/product-design-intern",
    title: "Product Design Intern",
    department: "Product & Design",
    location: "On-site, Bengaluru",
    employmentType: "Internship (6 months)",
    experienceText: "6 months, with a PPO based on performance",
  },
  {
    companyJobUrl: "https://www.revrag.ai/careers/ai-engineer-intern",
    title: "AI Engineer Intern",
    department: "AI & Data",
    location: "On-site, Bengaluru",
    employmentType: "Internship (6 months)",
    experienceText: "6 months, with a PPO based on performance",
  },
  {
    companyJobUrl: "https://www.revrag.ai/careers/devsecops-intern",
    title: "DevSecOps Intern",
    department: "Engineering",
    location: "On-site, Bengaluru",
    employmentType: "Internship (6 months)",
    experienceText: "6 months, with a PPO based on performance",
  },
  {
    companyJobUrl: "https://www.revrag.ai/careers/software-developer-intern-frontend",
    title: "Software Developer Intern (Frontend)",
    department: "Engineering",
    location: "On-site, Bengaluru",
    employmentType: "Internship (6 months)",
    experienceText: "6 months, with a PPO based on performance",
  },
  {
    companyJobUrl: "https://www.revrag.ai/careers/software-developer-intern-backend",
    title: "Software Developer Intern (Backend)",
    department: "Engineering",
    location: "On-site, Bengaluru",
    employmentType: "Internship (6 months)",
    experienceText: "6 months, with a PPO based on performance",
  },
  {
    companyJobUrl: "https://www.revrag.ai/careers/forward-deployed-engineer-intern",
    title: "Forward Deployed Engineer (FDE) Intern",
    department: "GTM and Revenue",
    location: "On-site, Bengaluru",
    employmentType: "Internship (6 months)",
    experienceText: "6 months, with a PPO based on performance",
  },
  {
    companyJobUrl: "https://www.revrag.ai/careers/customer-success-intern",
    title: "Customer Success Intern",
    department: "GTM and Revenue",
    location: "On-site, Bengaluru",
    employmentType: "Internship (6 months)",
    experienceText: "6 months, with a PPO based on performance",
  },
];

function stableJobIdFromUrl(companyJobUrl: string) {
  const url = new URL(companyJobUrl);
  if (url.origin !== "https://www.revrag.ai" || !url.pathname.startsWith("/careers/")) {
    throw new Error(`Unexpected RevRag job URL: ${companyJobUrl}`);
  }

  const slug = url.pathname.split("/").filter(Boolean).at(-1);
  if (!slug) {
    throw new Error(`Missing unique job slug: ${companyJobUrl}`);
  }
  return slug;
}

const verifiedJobIds = verifiedRoles.map((role) => stableJobIdFromUrl(role.companyJobUrl));
if (new Set(verifiedJobIds).size !== verifiedJobIds.length) {
  throw new Error("Saved RevRag evidence contains duplicate same-origin job slugs");
}

export const demoJobs: DemoJob[] = verifiedRoles.map((role, index) => ({
  jobId: verifiedJobIds[index]!,
  title: role.title,
  location: role.location,
  department: role.department,
  employmentType: role.employmentType,
  companyJobUrl: role.companyJobUrl,
  sourceCatalogUrl: revragCatalogUrl,
}));

export const demoCompanies: DemoCompany[] = [
  {
    id: "revrag-ai",
    name: "RevRag AI",
    mark: "R",
    tone: "violet",
    corporateUrl: "https://www.revrag.ai/",
    careersUrl: revragCatalogUrl,
    catalogUrl: revragCatalogUrl,
    provenance: ["revrag.ai", "revrag.ai/careers", "/careers/{role-slug}"],
    collectorId: revragCollectorId,
    status: "healthy",
    lastChecked: savedRecoveryLabel,
    jobs: demoJobs.length,
    coverage: 100,
    note: "Saved verified run / 10 active roles / no application data",
  },
  {
    id: "careersentry-healing-lab",
    name: "CareerSentry Healing Lab",
    mark: "C",
    tone: "cyan",
    corporateUrl: "https://career-sentry.vercel.app/",
    careersUrl: "https://career-sentry.vercel.app/demo-target",
    catalogUrl: "https://career-sentry.vercel.app/demo-target?layout=a",
    provenance: ["career-sentry.vercel.app", "/demo-target", "layout A / layout B"],
    collectorId: healingLabCollectorId,
    status: "needs_review",
    lastChecked: "Evidence · 21 Aug 2026",
    jobs: 3,
    coverage: 100,
    note: "CareerSentry-owned fixture evidence only · layout B remains unresolved",
  },
];

export const demoCollectors: CollectorStat[] = [
  {
    id: revragCollectorId,
    name: "RevRag AI Discovery / same-ID recovered",
    company: "RevRag AI",
    kind: "Discovery",
    status: "healthy",
    lastRun: savedRecoveryLabel,
    rowCount: demoJobs.length,
    previousRowCount: demoJobs.length,
    fieldCoverage: 100,
    duplicateRate: 0,
    invalidLinks: 0,
    duration: "Not recorded",
    schedule: "No persistent schedule",
  },
  {
    id: healingLabCollectorId,
    name: "Owned layout A/B healing lab",
    company: "CareerSentry Healing Lab",
    kind: "Discovery",
    status: "needs_review",
    lastRun: "Evidence · 21 Aug 2026",
    rowCount: 0,
    previousRowCount: 3,
    fieldCoverage: 0,
    duplicateRate: 0,
    invalidLinks: 0,
    duration: "Evidence only",
    schedule: "Manual fixture",
  },
];

export const demoRuns = [
  {
    id: "run_revrag_initial_degraded",
    time: "Initial saved run",
    collector: "RevRag AI Discovery / initial",
    collectorId: revragCollectorId,
    status: "Degraded",
    rows: 15,
    delta: "—",
    duration: "Not recorded",
    trigger: "Initial run / 10 valid + 5 rejected",
  },
  {
    id: "run_revrag_same_id_recovered",
    time: "Same-ID recovered run",
    collector: "RevRag AI Discovery / same-ID recovery",
    collectorId: revragCollectorId,
    status: "Recovered",
    rows: 10,
    delta: "-5",
    duration: "Not recorded",
    trigger: "Approval-gated cleanup / verified",
  },
  {
    id: "run_fixture_layout_b_degraded",
    time: "21 Aug 2026 · evidence",
    collector: "Owned layout B healing lab",
    collectorId: healingLabCollectorId,
    status: "Degraded",
    rows: 0,
    delta: "-3",
    duration: "Recorded evidence",
    trigger: "Fixture regression",
  },
  {
    id: "run_fixture_layout_a_recovered",
    time: "21 Aug 2026 · evidence",
    collector: "Owned layout A healing lab",
    collectorId: healingLabCollectorId,
    status: "Recovered",
    rows: 3,
    delta: "+3",
    duration: "Recorded evidence",
    trigger: "Fixture baseline",
  },
  {
    id: "run_fixture_heal_rejected",
    time: "21 Aug 2026 · evidence",
    collector: "Owned layout B healing lab",
    collectorId: healingLabCollectorId,
    status: "Rejected",
    rows: 0,
    delta: "—",
    duration: "Not recorded",
    trigger: "Repair rejected",
  },
];

export const incident = {
  id: "inc_healing_lab_layout_b",
  collectorId: healingLabCollectorId,
  collectorName: "Owned layout B healing lab",
  company: "CareerSentry Healing Lab",
  status: "Needs review" as const,
  opened: "21 Aug 2026 · evidence",
  summary: "The project-owned layout B fixture returned zero rows after a non-empty layout A baseline. A repair attempt failed verification and left the collector unchanged.",
  severity: "High" as const,
  failedChecks: [
    { label: "Row-count anomaly", value: "0 rows", detail: "3 baseline rows → 0 current rows", state: "fail" },
    { label: "Required field coverage", value: "0%", detail: "No records available to validate", state: "fail" },
    { label: "Provenance allow-list", value: "Pass", detail: "All fixture URLs remain on career-sentry.vercel.app", state: "pass" },
    { label: "Saved repair verification", value: "Rejected", detail: "The attempted layout B repair failed before save", state: "warn" },
  ],
  brokenSample: {
    title: "Owned layout B fixture",
    url: "https://career-sentry.vercel.app/demo-target?layout=b",
    note: "The controlled project-owned redesign is retained as healing evidence; it is not an external employer catalog.",
  },
  prompt: "On the CareerSentry-owned layout B fixture, preserve the existing Collector ID and schema. Compare the empty result with the known-good layout A evidence, restore enumeration for the three fixture roles, and validate required fields, canonical fixture URLs, and duplicate rate before any save. Keep the repair bounded to the owned fixture and do not access application or personal-data surfaces.",
  preview: {
    before: { rows: 3, coverage: 100, duplicates: "0.0%" },
    after: { rows: 0, coverage: 0, duplicates: "n/a" },
    duration: "Not recorded",
  },
  timeline: [
    { time: "09:05", title: "Layout A baseline retained", detail: "Three fixture roles with complete required fields", state: "success" },
    { time: "09:12", title: "Layout B run completed", detail: "Zero rows returned from the same owned target", state: "error" },
    { time: "09:14", title: "Health engine opened incident", detail: "Row-count and required-field checks failed", state: "error" },
    { time: "09:18", title: "Repair rejected", detail: "Saved-template verification failed; Collector ID remained unchanged", state: "info" },
  ],
};

export const overviewSparkline = [15, 10, 0, 3, 0];
export const coverageSparkline = [67, 100, 0, 100, 0];
