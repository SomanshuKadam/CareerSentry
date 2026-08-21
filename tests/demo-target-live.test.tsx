import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import LiveDemoTargetPage from "../app/demo-target/live/page";
import {
  fixtureLayoutFromEnvironment,
  ownedFixtureRoles,
  OwnedFixtureCatalog,
} from "../src/lib/demo-target/fixture";

function render(layout: "a" | "b") {
  return renderToStaticMarkup(<OwnedFixtureCatalog layout={layout} />);
}

describe("stable owned healing fixture", () => {
  it("accepts only the server layout values and defaults invalid values to A", () => {
    expect(fixtureLayoutFromEnvironment({ CAREERSENTRY_FIXTURE_LAYOUT: "a" })).toBe("a");
    expect(fixtureLayoutFromEnvironment({ CAREERSENTRY_FIXTURE_LAYOUT: "b" })).toBe("b");
    expect(fixtureLayoutFromEnvironment({ CAREERSENTRY_FIXTURE_LAYOUT: "B" })).toBe("a");
    expect(fixtureLayoutFromEnvironment({ CAREERSENTRY_FIXTURE_LAYOUT: "layout-b" })).toBe("a");
    expect(fixtureLayoutFromEnvironment({})).toBe("a");
  });

  it("renders the same three owned fictional role IDs in both layouts", () => {
    for (const layout of ["a", "b"] as const) {
      const markup = render(layout);

      expect(markup).toContain("CareerSentry-owned healing fixture");
      expect(markup).toContain("No login or application form");
      expect(markup).not.toContain("<form");
      expect(markup).not.toContain("?layout=");

      for (const role of ownedFixtureRoles) {
        expect(markup).toContain(role.id);
        expect(markup).toContain(role.title);
      }
    }
  });

  it("keeps layout A and B materially different for selector healing", () => {
    const layoutA = render("a");
    const layoutB = render("b");

    expect(layoutA).toContain('data-layout-version="a"');
    expect(layoutA).toContain('class="job-card"');
    expect((layoutA.match(/class="job-card"/g) ?? []).length).toBe(3);
    expect((layoutA.match(/class="job-card__title"/g) ?? []).length).toBe(3);
    expect((layoutA.match(/class="job-card__team"/g) ?? []).length).toBe(3);
    expect(layoutA).not.toContain('class="role-tile"');

    expect(layoutB).toContain('data-layout-version="b"');
    expect(layoutB).toContain('class="role-tile"');
    expect((layoutB.match(/class="role-tile"/g) ?? []).length).toBe(3);
    expect((layoutB.match(/class="role-tile__team"/g) ?? []).length).toBe(3);
    expect((layoutB.match(/<h2><a/g) ?? []).length).toBe(3);
    expect(layoutB).not.toContain('class="job-card"');
  });

  it("uses the stable server-selected route without reading query parameters", () => {
    const previousLayout = process.env.CAREERSENTRY_FIXTURE_LAYOUT;

    try {
      process.env.CAREERSENTRY_FIXTURE_LAYOUT = "b";
      const layoutB = renderToStaticMarkup(LiveDemoTargetPage());
      expect(layoutB).toContain('data-layout-version="b"');
      expect(layoutB).not.toContain("?layout=");

      process.env.CAREERSENTRY_FIXTURE_LAYOUT = "unexpected";
      const invalid = renderToStaticMarkup(LiveDemoTargetPage());
      expect(invalid).toContain('data-layout-version="a"');
      expect(invalid).not.toContain('data-layout-version="b"');
    } finally {
      if (previousLayout === undefined) {
        delete process.env.CAREERSENTRY_FIXTURE_LAYOUT;
      } else {
        process.env.CAREERSENTRY_FIXTURE_LAYOUT = previousLayout;
      }
    }
  });
});
