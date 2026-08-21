import React, { type ReactElement } from "react";

export type FixtureLayout = "a" | "b";

export type OwnedFixtureRole = {
  id: string;
  title: string;
  location: string;
  team: string;
  type: string;
};

/**
 * These are fictional roles owned by CareerSentry. They are deliberately kept
 * separate from any external employer data so the healing lab is safe to run.
 */
export const ownedFixtureRoles = [
  {
    id: "CS-101",
    title: "Backend Engineer",
    location: "Bangalore, Karnataka, India",
    team: "Engineering",
    type: "Full-time",
  },
  {
    id: "CS-102",
    title: "Software Engineer II",
    location: "Remote, India",
    team: "Platform",
    type: "Full-time",
  },
  {
    id: "CS-103",
    title: "Data Quality Engineer",
    location: "Bengaluru, Karnataka, India",
    team: "Data",
    type: "Full-time",
  },
] as const satisfies readonly OwnedFixtureRole[];

export const ownedFixturePath = "/demo-target/live";

/**
 * Read the layout from a server-side environment object. Any value other than
 * the explicitly supported `b` value safely selects layout A. In particular,
 * query parameters are never consulted here.
 */
export function fixtureLayoutFromEnvironment(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): FixtureLayout {
  return environment.CAREERSENTRY_FIXTURE_LAYOUT === "b" ? "b" : "a";
}

type OwnedFixtureCatalogProps = {
  layout: FixtureLayout;
};

/**
 * Render the two intentionally different scraper targets. Layout A uses
 * `.job-card`/definition-list selectors, while layout B uses
 * `.role-tile`/labeled metadata selectors and different nesting.
 */
export function OwnedFixtureCatalog({ layout }: OwnedFixtureCatalogProps): ReactElement {
  return (
    <main className={`collector-lab collector-lab--${layout}`} data-fixture-owned="true">
      <header className="collector-lab__hero">
        <div>
          <p className="collector-lab__eyebrow">CareerSentry-owned healing fixture</p>
          <h1>Build reliable career data pipelines.</h1>
          <p>
            This stable catalog is a fictional, project-owned target for deterministic scraper
            healing tests. It contains no login, application form, or candidate data.
          </p>
        </div>
        <aside aria-label="Owned fixture safeguards">
          <strong>Layout {layout.toUpperCase()}</strong>
          <span>3 fictional public roles</span>
          <span>No login or application form</span>
        </aside>
      </header>

      {layout === "a" ? (
        <section className="job-list" aria-label="Open fictional roles" data-layout-version="a">
          {ownedFixtureRoles.map((job) => (
            <article className="job-card" data-job-id={job.id} key={job.id}>
              <div className="job-card__heading">
                <span className="job-card__id">{job.id}</span>
                <h2 className="job-card__title">{job.title}</h2>
              </div>
              <dl className="job-card__facts">
                <div>
                  <dt>Location</dt>
                  <dd className="job-card__location">{job.location}</dd>
                </div>
                <div>
                  <dt>Team</dt>
                  <dd className="job-card__team">{job.team}</dd>
                </div>
                <div>
                  <dt>Employment</dt>
                  <dd className="job-card__type">{job.type}</dd>
                </div>
              </dl>
              <a className="job-card__link" href={`/demo-target/jobs/${job.id}`}>
                View fictional role
              </a>
            </article>
          ))}
        </section>
      ) : (
        <div className="role-grid" aria-label="Open fictional roles" data-layout-version="b">
          {ownedFixtureRoles.map((job) => (
            <section className="role-tile" data-role-code={job.id} key={job.id}>
              <header>
                <p className="role-tile__team">{job.team}</p>
                <h2>
                  <a href={`/demo-target/jobs/${job.id}`}>{job.title}</a>
                </h2>
              </header>
              <div className="role-tile__metadata">
                <p>
                  <span>Based in</span>
                  <strong>{job.location}</strong>
                </p>
                <p>
                  <span>Role type</span>
                  <strong>{job.type}</strong>
                </p>
                <p>
                  <span>Requisition</span>
                  <strong>{job.id}</strong>
                </p>
              </div>
            </section>
          ))}
        </div>
      )}

      <footer className="collector-lab__footer">
        <p>
          CareerSentry-owned fictional fixture only. No employer, applications, credentials,
          candidate data, login, or application form.
        </p>
        <p>Stable URL: {ownedFixturePath}. Layout is selected server-side.</p>
      </footer>
    </main>
  );
}
