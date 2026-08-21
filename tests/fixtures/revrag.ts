import type { RevRagIngestionMetadata } from "../../src/lib/brightdata";

export const revRagMetadata: RevRagIngestionMetadata = {
  companyId: "revrag-ai",
  sourceCatalogUrl: "https://www.revrag.ai/careers",
  collectorId: "c_revrag_discovery",
  collectedAt: "2026-08-22T08:00:00.000Z",
  allowedOrigins: ["https://www.revrag.ai"],
  allowedPathPrefix: "/careers",
  workplaceType: "onsite",
};

export function revragValidRow(index: number) {
  const slug = `role-${index}`;

  return {
    job_id_value: slug,
    title: `AI Engineer ${index}`,
    department: "Engineering",
    location: "Bangalore, India",
    employment_type: "Full-time",
    experience_text: "2+ years",
    summary: `Build RevRag systems for role ${index}.`,
    product_page_url: `https://www.revrag.ai/careers/${slug}`,
    // This is an external application form and must never become applyUrl.
    job_url: `https://forms.google.com/d/${slug}`,
    input: "https://www.revrag.ai/careers",
  };
}

export function revragErrorRow(index: number) {
  return {
    error: "parse_error",
    error_code: "parse_error",
    input: "https://www.revrag.ai/careers",
    product_page_url: `https://www.revrag.ai/careers/opening-soon-${index}`,
  };
}

/** Final healed shape: identity is recoverable only from company_job_url. */
export function revragHealedRow(index: number) {
  const slug = `healed-role-${index}`;

  return {
    title: `Healed AI Engineer ${index}`,
    department: "Engineering",
    location: "Bengaluru, India",
    employment_type: "Full-time",
    experience_text: "3+ years",
    summary: `Build the healed RevRag system for role ${index}.`,
    company_job_url: `https://www.revrag.ai/careers/${slug}`,
    job_url: `https://forms.google.com/d/${slug}`,
    input: "https://www.revrag.ai/careers",
  };
}

export const revragValidRows = Array.from({ length: 10 }, (_, index) =>
  revragValidRow(index + 1),
);

export const revragErrorRows = Array.from({ length: 5 }, (_, index) =>
  revragErrorRow(index + 1),
);

export const revragHealedRows = Array.from({ length: 10 }, (_, index) =>
  revragHealedRow(index + 1),
);
