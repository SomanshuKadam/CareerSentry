import type { JobRecord } from "../../src/lib/domain";

export const collectedAt = "2026-08-20T10:00:00.000Z";

export const backendJob: JobRecord = {
  companyId: "demo-company",
  jobId: "REQ-100",
  title: "Backend Software Engineer",
  location: "Bangalore, India",
  workplaceType: "hybrid",
  department: "Engineering",
  employmentType: "Full-time",
  publishedAt: "2026-08-18",
  experienceText: "2+ years",
  description: "Build reliable services and APIs.",
  companyJobUrl: "https://careers.example.com/jobs/REQ-100",
  applyUrl: "https://careers.example.com/jobs/REQ-100/apply",
  sourceCatalogUrl: "https://careers.example.com/jobs/",
  collectorId: "c_demo_discovery",
  collectedAt,
};

export const frontendJob: JobRecord = {
  companyId: "demo-company",
  jobId: "REQ-200",
  title: "Frontend Software Engineer",
  location: "Bengaluru, India",
  workplaceType: "onsite",
  department: "Engineering",
  employmentType: "Full-time",
  experienceText: "2+ years",
  description: "Build accessible user experiences.",
  companyJobUrl: "https://careers.example.com/jobs/REQ-200",
  sourceCatalogUrl: "https://careers.example.com/jobs/",
  collectorId: "c_demo_discovery",
  collectedAt,
};

export const initialJobs: JobRecord[] = [backendJob, frontendJob];

export const updatedBackendJob: JobRecord = {
  ...backendJob,
  location: "Bengaluru, India",
  description: "Build reliable distributed services and APIs.",
  collectedAt: "2026-08-20T11:00:00.000Z",
};

export const newDataJob: JobRecord = {
  ...backendJob,
  jobId: "REQ-300",
  title: "Platform Software Engineer",
  companyJobUrl: "https://careers.example.com/jobs/REQ-300",
  applyUrl: undefined,
  collectedAt: "2026-08-20T11:00:00.000Z",
};
