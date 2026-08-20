import { RefreshCw, SlidersHorizontal } from "lucide-react";
import { Button, PageHeader } from "@/components/ui";
import { JobsView } from "@/components/jobs-view";

export default function JobsPage() {
  return (
    <>
      <PageHeader eyebrow="Verified role catalog" title="Jobs" description="Fresh, changed, and active roles matched against your demo profile. Every row keeps its official source and collector trail.">
        <Button variant="secondary" icon={SlidersHorizontal}>Tune matching</Button>
        <Button icon={RefreshCw}>Refresh snapshot</Button>
      </PageHeader>
      <JobsView />
    </>
  );
}
