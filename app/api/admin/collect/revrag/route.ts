import { createRevRagRouteHandler, jsonResponse } from "./handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createRevRagRouteHandler();

export async function GET(): Promise<Response> {
  return jsonResponse(
    { error: "Method not allowed" },
    405,
    { Allow: "POST" },
  );
}
