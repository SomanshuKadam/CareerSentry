import { RefreshCw, SlidersHorizontal } from "lucide-react";
import { Button, PageHeader } from "@/components/ui";
import { JobsView } from "@/components/jobs-view";

export default function JobsPage() {
  return (
    <>
      <PageHeader eyebrow="Verified role catalog" title="Jobs" description="Ten active RevRag AI roles from the saved same-ID recovery run. Every row keeps its same-origin source and collector trail; application routes are excluded.">
        <Button variant="secondary" icon={SlidersHorizontal}>Tune matching</Button>
        <Button icon={RefreshCw}>Review snapshot</Button>
      </PageHeader>
      <JobsView />
    </>
  );
}
