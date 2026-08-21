import React from "react";

import { OwnedFixtureCatalog, fixtureLayoutFromEnvironment } from "../../../src/lib/demo-target/fixture";

// This must remain a Server Component: the layout switch is server-only and
// the stable URL intentionally has no query-param layout override.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export default function LiveDemoTargetPage() {
  return <OwnedFixtureCatalog layout={fixtureLayoutFromEnvironment(process.env)} />;
}
