import { createRevRagRouteHandler, jsonResponse } from "./handler";
import { getPersistenceRepository } from "../../../../../src/lib/persistence/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createRevRagRouteHandler({ persistence: getPersistenceRepository() });

export async function GET(): Promise<Response> {
  return jsonResponse(
    { error: "Method not allowed" },
    405,
    { Allow: "POST" },
  );
}
