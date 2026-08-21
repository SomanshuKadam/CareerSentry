import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CareerSentry Collector Lab",
  description: "A public, project-owned career catalog for deterministic scraper healing tests.",
};

const fixtureJobs = [
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
];

type DemoTargetPageProps = {
  searchParams?: { layout?: string };
};

export default function DemoTargetPage({ searchParams }: DemoTargetPageProps) {
  const layout = searchParams?.layout === "b" ? "b" : "a";

  return (
    <main className={`collector-lab collector-lab--${layout}`}>
      <header className="collector-lab__hero">
        <div>
          <p className="collector-lab__eyebrow">CareerSentry Collector Lab</p>
          <h1>Build reliable career data pipelines.</h1>
          <p>
            This project-owned public catalog exists solely for deterministic Bright Data
            Scraper Studio create, run, and heal demonstrations.
          </p>
        </div>
        <aside aria-label="Fixture information">
          <strong>Layout {layout.toUpperCase()}</strong>
          <span>3 public roles</span>
          <span>No login or application form</span>
        </aside>
      </header>

      {layout === "a" ? (
        <section className="job-list" aria-label="Open roles" data-layout-version="a">
          {fixtureJobs.map((job) => (
            <article className="job-card" data-job-id={job.id} key={job.id}>
              <div className="job-card__heading">
                <span className="job-card__id">{job.id}</span>
                <h2 className="job-card__title">{job.title}</h2>
              </div>
              <dl className="job-card__facts">
                <div><dt>Location</dt><dd className="job-card__location">{job.location}</dd></div>
                <div><dt>Team</dt><dd className="job-card__team">{job.team}</dd></div>
                <div><dt>Employment</dt><dd className="job-card__type">{job.type}</dd></div>
              </dl>
              <a className="job-card__link" href={`/demo-target/jobs/${job.id}?layout=a`}>
                View role
              </a>
            </article>
          ))}
        </section>
      ) : (
        <div className="role-grid" aria-label="Open roles" data-layout-version="b">
          {fixtureJobs.map((job) => (
            <section className="role-tile" data-role-code={job.id} key={job.id}>
              <header>
                <p className="role-tile__team">{job.team}</p>
                <h2><a href={`/demo-target/jobs/${job.id}?layout=b`}>{job.title}</a></h2>
              </header>
              <div className="role-tile__metadata">
                <p><span>Based in</span><strong>{job.location}</strong></p>
                <p><span>Role type</span><strong>{job.type}</strong></p>
                <p><span>Requisition</span><strong>{job.id}</strong></p>
              </div>
            </section>
          ))}
        </div>
      )}

      <footer className="collector-lab__footer">
        <p>CareerSentry-owned fixture data. No employer, people, applications, credentials, or personal data.</p>
        <nav aria-label="Fixture layout controls">
          <a aria-current={layout === "a" ? "page" : undefined} href="/demo-target?layout=a">Layout A</a>
          <a aria-current={layout === "b" ? "page" : undefined} href="/demo-target?layout=b">Layout B</a>
        </nav>
      </footer>
    </main>
  );
}
