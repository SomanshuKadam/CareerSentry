import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("public UI contract", () => {
  it("exposes only the four intentional top-level destinations", () => {
    const shell = source("components/app-shell.tsx");

    expect(shell).toContain('{ label: "Home", href: "/"');
    expect(shell).toContain('{ label: "Jobs", href: "/jobs"');
    expect(shell).toContain('{ label: "Reliability", href: "/reliability"');
    expect(shell).toContain('{ label: "Healing demo", href: "/demo-target/live"');
    expect(shell).not.toMatch(/settings|help|workspace-switcher|global-search|avatar-button|credits-card/i);
  });

  it("does not show fictional matching or template actions on product pages", () => {
    const pages = [
      source("app/page.tsx"),
      source("app/jobs/page.tsx"),
      source("app/jobs/[jobId]/page.tsx"),
      source("components/jobs-view.tsx"),
      source("app/reliability/page.tsx"),
    ].join("\n");

    expect(pages).not.toMatch(/matchScore|demoProfile|save example match|tune matching/i);
    expect(pages).toContain("No invented description");
    expect(pages).toContain("We do not claim success");
  });

  it("redirects every retired or previously dead destination", () => {
    const config = source("next.config.mjs");
    for (const route of [
      "/collectors",
      "/companies",
      "/history",
      "/incidents",
      "/settings",
      "/help",
    ]) {
      expect(config).toContain(`source: "${route}"`);
    }
  });
});
