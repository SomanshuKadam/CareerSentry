import { notFound } from "next/navigation";

const details = {
  "CS-101": {
    title: "Backend Engineer",
    location: "Bangalore, Karnataka, India",
    team: "Engineering",
    workplace: "Hybrid",
    description: "Build reliable APIs and distributed services for the CareerSentry-owned healing fixture.",
  },
  "CS-102": {
    title: "Software Engineer II",
    location: "Remote, India",
    team: "Platform",
    workplace: "Remote",
    description: "Improve platform reliability, developer experience, and observable data pipelines.",
  },
  "CS-103": {
    title: "Data Quality Engineer",
    location: "Bengaluru, Karnataka, India",
    team: "Data",
    workplace: "Onsite",
    description: "Design schema checks, anomaly detection, and recovery tests for public web data.",
  },
} as const;

export function generateStaticParams() {
  return Object.keys(details).map((jobId) => ({ jobId }));
}

export default function FixtureJobPage({ params }: { params: { jobId: string } }) {
  const job = details[params.jobId as keyof typeof details];
  if (!job) notFound();

  return (
    <main className="collector-lab collector-lab__detail">
      <a href="/demo-target?layout=a">Back to public roles</a>
      <p className="collector-lab__eyebrow">CareerSentry-owned fixture role / {params.jobId}</p>
      <h1>{job.title}</h1>
      <dl className="job-card__facts">
        <div><dt>Location</dt><dd>{job.location}</dd></div>
        <div><dt>Team</dt><dd>{job.team}</dd></div>
        <div><dt>Work arrangement</dt><dd>{job.workplace}</dd></div>
      </dl>
      <section>
        <h2>About the role</h2>
        <p>{job.description}</p>
      </section>
      <p className="collector-lab__notice">
        Demonstration fixture only. There is intentionally no application action or candidate-data form.
      </p>
    </main>
  );
}
