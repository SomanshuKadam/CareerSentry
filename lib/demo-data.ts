export type WorkplaceType = "remote" | "hybrid" | "onsite" | "unknown";
export type JobState = "new" | "changed" | "active" | "closed";
export type HealthStatus = "healthy" | "degraded" | "recovering" | "needs_review";

export type DemoJob = {
  companyId: string;
  company: string;
  companyMark: string;
  companyTone: string;
  jobId: string;
  title: string;
  location: string;
  workplaceType: WorkplaceType;
  department: string;
  employmentType: string;
  publishedAt: string;
  collectedAt: string;
  companyJobUrl: string;
  sourceCatalogUrl: string;
  collectorId: string;
  state: JobState;
  matchScore: number;
  matchReasons: string[];
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

export const demoProfile = {
  role: "Software / Backend Engineer",
  level: "SWE II · approximately 2 years",
  locations: ["Bengaluru", "Remote India"],
  skills: ["Java", "Python", "TypeScript", "APIs", "Distributed systems"],
};

export const demoJobs: DemoJob[] = [
  {
    companyId: "nutanix",
    company: "Nutanix",
    companyMark: "N",
    companyTone: "violet",
    jobId: "NX-DEMO-0421",
    title: "Software Engineer II — Platform Services",
    location: "Bengaluru, Karnataka",
    workplaceType: "hybrid",
    department: "Engineering · Platform",
    employmentType: "Full-time",
    publishedAt: "18 Aug 2026",
    collectedAt: "20 Aug 2026 · 09:42 IST",
    companyJobUrl: "https://careers.nutanix.com/en/jobs/NX-DEMO-0421",
    sourceCatalogUrl: "https://careers.nutanix.com/en/jobs/",
    collectorId: "c_nutanix_discovery_demo",
    state: "new",
    matchScore: 94,
    matchReasons: ["Java + APIs", "Bengaluru", "Platform team"],
  },
  {
    companyId: "canva",
    company: "Canva",
    companyMark: "C",
    companyTone: "blue",
    jobId: "CV-DEMO-1189",
    title: "Backend Engineer — Collaboration",
    location: "Remote India",
    workplaceType: "remote",
    department: "Engineering · Collaboration",
    employmentType: "Full-time",
    publishedAt: "17 Aug 2026",
    collectedAt: "20 Aug 2026 · 09:42 IST",
    companyJobUrl: "https://www.canva.com/careers/jobs/CV-DEMO-1189",
    sourceCatalogUrl: "https://www.canva.com/careers/jobs/",
    collectorId: "c_canva_catalog_demo",
    state: "changed",
    matchScore: 91,
    matchReasons: ["Distributed systems", "Remote India", "TypeScript"],
  },
  {
    companyId: "salesforce",
    company: "Salesforce",
    companyMark: "S",
    companyTone: "cyan",
    jobId: "SF-DEMO-7604",
    title: "Software Engineer — Developer Infrastructure",
    location: "Hyderabad, Telangana",
    workplaceType: "onsite",
    department: "Engineering · Infrastructure",
    employmentType: "Full-time",
    publishedAt: "15 Aug 2026",
    collectedAt: "20 Aug 2026 · 09:42 IST",
    companyJobUrl: "https://careers.salesforce.com/en/jobs/SF-DEMO-7604",
    sourceCatalogUrl: "https://careers.salesforce.com/en/jobs/",
    collectorId: "c_salesforce_catalog_demo",
    state: "active",
    matchScore: 83,
    matchReasons: ["Python", "APIs", "Infrastructure"],
  },
  {
    companyId: "uber",
    company: "Uber",
    companyMark: "U",
    companyTone: "ink",
    jobId: "UB-DEMO-2388",
    title: "Backend Engineer II — Marketplace",
    location: "Bengaluru, Karnataka",
    workplaceType: "hybrid",
    department: "Engineering · Marketplace",
    employmentType: "Full-time",
    publishedAt: "14 Aug 2026",
    collectedAt: "20 Aug 2026 · 09:42 IST",
    companyJobUrl: "https://www.uber.com/careers/list/UB-DEMO-2388",
    sourceCatalogUrl: "https://www.uber.com/careers/",
    collectorId: "c_uber_catalog_demo",
    state: "active",
    matchScore: 79,
    matchReasons: ["Distributed systems", "Bengaluru", "Backend"],
  },
  {
    companyId: "nutanix",
    company: "Nutanix",
    companyMark: "N",
    companyTone: "violet",
    jobId: "NX-DEMO-0407",
    title: "Member of Technical Staff — Data Services",
    location: "Pune, Maharashtra",
    workplaceType: "onsite",
    department: "Engineering · Data",
    employmentType: "Full-time",
    publishedAt: "12 Aug 2026",
    collectedAt: "20 Aug 2026 · 09:42 IST",
    companyJobUrl: "https://careers.nutanix.com/en/jobs/NX-DEMO-0407",
    sourceCatalogUrl: "https://careers.nutanix.com/en/jobs/",
    collectorId: "c_nutanix_discovery_demo",
    state: "active",
    matchScore: 76,
    matchReasons: ["Java", "Data services", "Engineering"],
  },
  {
    companyId: "canva",
    company: "Canva",
    companyMark: "C",
    companyTone: "blue",
    jobId: "CV-DEMO-1120",
    title: "Software Engineer — Growth Platform",
    location: "Sydney / Remote",
    workplaceType: "remote",
    department: "Engineering · Growth",
    employmentType: "Full-time",
    publishedAt: "05 Aug 2026",
    collectedAt: "20 Aug 2026 · 09:42 IST",
    companyJobUrl: "https://www.canva.com/careers/jobs/CV-DEMO-1120",
    sourceCatalogUrl: "https://www.canva.com/careers/jobs/",
    collectorId: "c_canva_catalog_demo",
    state: "closed",
    matchScore: 72,
    matchReasons: ["TypeScript", "APIs", "Remote"],
  },
];

export const demoCompanies: DemoCompany[] = [
  {
    id: "nutanix",
    name: "Nutanix",
    mark: "N",
    tone: "violet",
    corporateUrl: "https://www.nutanix.com/",
    careersUrl: "https://careers.nutanix.com/en/",
    catalogUrl: "https://careers.nutanix.com/en/jobs/",
    provenance: ["nutanix.com", "careers.nutanix.com", "/en/jobs/"],
    collectorId: "c_nutanix_discovery_demo",
    status: "healthy",
    lastChecked: "Today · 09:42 IST",
    jobs: 54,
    coverage: 100,
    note: "Primary validation candidate · official careers path",
  },
  {
    id: "canva",
    name: "Canva",
    mark: "C",
    tone: "blue",
    corporateUrl: "https://www.canva.com/",
    careersUrl: "https://www.canva.com/careers/",
    catalogUrl: "https://www.canva.com/careers/jobs/",
    provenance: ["canva.com", "canva.com/careers", "/careers/jobs/"],
    collectorId: "c_canva_catalog_demo",
    status: "degraded",
    lastChecked: "Today · 09:38 IST",
    jobs: 31,
    coverage: 87,
    note: "Selector drift detected · preview ready",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    mark: "S",
    tone: "cyan",
    corporateUrl: "https://www.salesforce.com/",
    careersUrl: "https://www.salesforce.com/company/careers/",
    catalogUrl: "https://careers.salesforce.com/en/jobs/",
    provenance: ["salesforce.com", "salesforce.com/company/careers", "careers.salesforce.com"],
    collectorId: "c_salesforce_catalog_demo",
    status: "healthy",
    lastChecked: "Today · 09:31 IST",
    jobs: 118,
    coverage: 99,
    note: "Catalog stable · last 7 runs healthy",
  },
  {
    id: "uber",
    name: "Uber",
    mark: "U",
    tone: "ink",
    corporateUrl: "https://www.uber.com/",
    careersUrl: "https://www.uber.com/careers/",
    catalogUrl: "https://www.uber.com/careers/",
    provenance: ["uber.com", "uber.com/careers", "/careers/"],
    collectorId: "c_uber_catalog_demo",
    status: "needs_review",
    lastChecked: "Yesterday · 18:17 IST",
    jobs: 42,
    coverage: 93,
    note: "Cloudflare boundary · diagnostic required",
  },
];

export const demoCollectors: CollectorStat[] = [
  {
    id: "c_nutanix_discovery_demo",
    name: "Nutanix careers catalog",
    company: "Nutanix",
    kind: "Discovery",
    status: "healthy",
    lastRun: "Today · 09:42 IST",
    rowCount: 54,
    previousRowCount: 53,
    fieldCoverage: 100,
    duplicateRate: 0,
    invalidLinks: 0,
    duration: "42 sec",
    schedule: "Every 6 hours",
  },
  {
    id: "c_canva_catalog_demo",
    name: "Canva careers catalog",
    company: "Canva",
    kind: "Discovery",
    status: "degraded",
    lastRun: "Today · 09:38 IST",
    rowCount: 31,
    previousRowCount: 47,
    fieldCoverage: 87,
    duplicateRate: 6.4,
    invalidLinks: 4,
    duration: "1 min 08 sec",
    schedule: "Every 6 hours",
  },
  {
    id: "c_salesforce_catalog_demo",
    name: "Salesforce careers catalog",
    company: "Salesforce",
    kind: "Discovery",
    status: "healthy",
    lastRun: "Today · 09:31 IST",
    rowCount: 118,
    previousRowCount: 119,
    fieldCoverage: 99,
    duplicateRate: 0.8,
    invalidLinks: 1,
    duration: "1 min 44 sec",
    schedule: "Every 12 hours",
  },
  {
    id: "c_nutanix_pdp_demo",
    name: "Nutanix job details",
    company: "Nutanix",
    kind: "PDP",
    status: "recovering",
    lastRun: "Today · 09:45 IST",
    rowCount: 8,
    previousRowCount: 8,
    fieldCoverage: 98,
    duplicateRate: 0,
    invalidLinks: 0,
    duration: "24 sec",
    schedule: "On change",
  },
];

export const demoRuns = [
  { id: "run_2026_08_20_0942", time: "20 Aug 2026 · 09:42 IST", collector: "Nutanix careers catalog", collectorId: "c_nutanix_discovery_demo", status: "Healthy", rows: 54, delta: "+1", duration: "42 sec", trigger: "Scheduled" },
  { id: "run_2026_08_20_0938", time: "20 Aug 2026 · 09:38 IST", collector: "Canva careers catalog", collectorId: "c_canva_catalog_demo", status: "Degraded", rows: 31, delta: "−16", duration: "1 min 08 sec", trigger: "Scheduled" },
  { id: "run_2026_08_20_0931", time: "20 Aug 2026 · 09:31 IST", collector: "Salesforce careers catalog", collectorId: "c_salesforce_catalog_demo", status: "Healthy", rows: 118, delta: "−1", duration: "1 min 44 sec", trigger: "Scheduled" },
  { id: "run_2026_08_19_1817", time: "19 Aug 2026 · 18:17 IST", collector: "Uber careers catalog", collectorId: "c_uber_catalog_demo", status: "Needs review", rows: 42, delta: "−9", duration: "52 sec", trigger: "Manual" },
  { id: "run_2026_08_19_1512", time: "19 Aug 2026 · 15:12 IST", collector: "Nutanix job details", collectorId: "c_nutanix_pdp_demo", status: "Recovered", rows: 8, delta: "+2", duration: "24 sec", trigger: "Healing" },
  { id: "run_2026_08_19_0943", time: "19 Aug 2026 · 09:43 IST", collector: "Nutanix careers catalog", collectorId: "c_nutanix_discovery_demo", status: "Healthy", rows: 53, delta: "+3", duration: "39 sec", trigger: "Scheduled" },
];

export const incident = {
  id: "inc_canva_selector_drift",
  collectorId: "c_canva_catalog_demo",
  collectorName: "Canva careers catalog",
  company: "Canva",
  status: "Preview ready" as const,
  opened: "20 Aug 2026 · 09:38 IST",
  summary: "Listing cards returned, but title and official URL coverage dropped after a DOM nesting change.",
  severity: "High" as const,
  failedChecks: [
    { label: "Row-count anomaly", value: "31 rows", detail: "47 → 31 · 34% below baseline", state: "fail" },
    { label: "Required field coverage", value: "87%", detail: "title 87% · URL 91% · location 100%", state: "fail" },
    { label: "Duplicate rate", value: "6.4%", detail: "Expected below 2%", state: "warn" },
    { label: "Provenance allow-list", value: "Pass", detail: "All links remain on canva.com", state: "pass" },
  ],
  brokenSample: {
    title: "Backend Engineer — Collaboration",
    url: "https://www.canva.com/careers/jobs/CV-DEMO-1189",
    note: "The card link is now nested under [data-job-card] instead of the previous anchor selector.",
  },
  prompt: "On the Canva careers catalog, retain the existing schema and Collector ID. The job card link moved into the [data-job-card] wrapper; extract title, location, department, and the canonical company URL from each card. Preserve pagination and reject non-job links. Validate against the supplied representative URL and keep all URLs within canva.com.",
  preview: {
    before: { rows: 31, coverage: 87, duplicates: "6.4%" },
    after: { rows: 48, coverage: 100, duplicates: "0.0%" },
    duration: "1 min 11 sec",
  },
  timeline: [
    { time: "09:38", title: "Run completed", detail: "31 rows stored · 16 fewer than baseline", state: "error" },
    { time: "09:39", title: "Health engine opened incident", detail: "3 checks failed against last known-good snapshot", state: "error" },
    { time: "09:40", title: "Repair requested", detail: "Prompt generated from selector evidence", state: "info" },
    { time: "09:41", title: "Preview returned", detail: "48 rows · contract and provenance checks pass", state: "success" },
  ],
};

export const overviewSparkline = [34, 38, 36, 44, 42, 48, 54];
export const coverageSparkline = [91, 94, 93, 97, 96, 98, 100];
