import { afterEach, describe, expect, it, vi } from "vitest";

import {
  REVRAG_COLLECTOR_ID,
  REVRAG_SOURCE_CATALOG_URL,
  RevRagSnapshotNotHealthyError,
  runRevRagCollection,
  type CollectorRunner,
} from "../src/lib/brightdata";
import { createRevRagRouteHandler } from "../app/api/admin/collect/revrag/handler";
import type { PersistenceRepository } from "../src/lib/persistence/contracts";
import {
  revragErrorRows,
  revragHealedRows,
  revragValidRows,
} from "./fixtures/revrag";

const environment = {
  CAREERSENTRY_RUN_KEY: "test-run-key",
  BRIGHT_DATA_API_TOKEN: "server-only-token",
} satisfies Record<string, string | undefined>;

function fakeClient(rows: Record<string, unknown>[]): {
  client: CollectorRunner;
  runCollector: ReturnType<typeof vi.fn<CollectorRunner["runCollector"]>>;
} {
  const runCollector = vi
    .fn<CollectorRunner["runCollector"]>()
    .mockResolvedValue({ snapshotId: "j_revrag_snapshot", rows });
  return { client: { runCollector }, runCollector };
}

function fakePersistence() {
  const commitHealthySnapshot = vi.fn().mockResolvedValue({ canonicalJobCount: 10 });
  const recordUnhealthyRun = vi.fn().mockResolvedValue({ canonicalJobCount: 0 });
  const repository = {
    commitHealthySnapshot,
    recordUnhealthyRun,
  } as unknown as PersistenceRepository;
  return { repository, commitHealthySnapshot, recordUnhealthyRun };
}

async function jsonBody(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

function postRequest(body: unknown = {}): Request {
  return new Request("http://localhost/api/admin/collect/revrag", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-careersentry-run-key": "test-run-key",
    },
    body: JSON.stringify(body),
  });
}

describe("RevRag collection orchestration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the fixed collector/input and returns only canonical healthy records", async () => {
    const { client, runCollector } = fakeClient(revragHealedRows);

    const result = await runRevRagCollection(client, {
      now: () => "2026-08-22T10:00:00.000Z",
    });

    expect(runCollector).toHaveBeenCalledWith(REVRAG_COLLECTOR_ID, [
      { url: REVRAG_SOURCE_CATALOG_URL },
    ]);
    expect(result).toMatchObject({
      snapshotId: "j_revrag_snapshot",
      collectorId: REVRAG_COLLECTOR_ID,
      status: "healthy",
      healthy: true,
      counts: { rowCount: 10, validRowCount: 10, errorRowCount: 0 },
    });
    expect(result.records).toHaveLength(10);
    expect(result.records[0]).toMatchObject({
      jobId: "healed-role-1",
      companyJobUrl: "https://www.revrag.ai/careers/healed-role-1",
      collectorId: REVRAG_COLLECTOR_ID,
    });
    expect(result.records[0]).not.toHaveProperty("applyUrl");
    expect(JSON.stringify(result)).not.toContain("forms.google.com");
  });

  it("fails a degraded snapshot and discards partial canonical records", async () => {
    const { client } = fakeClient([...revragValidRows, ...revragErrorRows]);

    const promise = runRevRagCollection(client, {
      now: () => "2026-08-22T10:00:00.000Z",
    });

    await expect(promise).rejects.toBeInstanceOf(RevRagSnapshotNotHealthyError);
    try {
      await promise;
    } catch (error) {
      expect(error).toBeInstanceOf(RevRagSnapshotNotHealthyError);
      expect(error).toMatchObject({
        result: {
          snapshotId: "j_revrag_snapshot",
          collectorId: REVRAG_COLLECTOR_ID,
          status: "degraded",
          healthy: false,
          counts: { rowCount: 15, validRowCount: 10, errorRowCount: 5 },
          records: [],
        },
      });
    }
  });
});

describe("protected RevRag route", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requires the server run key before constructing a collector client", async () => {
    const createClient = vi.fn<(apiToken: string) => CollectorRunner>();
    const { repository } = fakePersistence();
    const handler = createRevRagRouteHandler({ environment, createClient, persistence: repository });
    const request = new Request("http://localhost/api/admin/collect/revrag", {
      method: "POST",
      headers: { "x-careersentry-run-key": "wrong-key" },
    });

    const response = await handler(request);
    const body = await jsonBody(response);

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("returns 503 when Bright Data is not configured after authentication", async () => {
    const createClient = vi.fn<(apiToken: string) => CollectorRunner>();
    const handler = createRevRagRouteHandler({
      environment: { CAREERSENTRY_RUN_KEY: environment.CAREERSENTRY_RUN_KEY },
      createClient,
      persistence: fakePersistence().repository,
    });

    const response = await handler(postRequest({ collectorId: "c_attacker", url: "https://attacker.test" }));
    const body = await jsonBody(response);

    expect(response.status).toBe(503);
    expect(body).toEqual({ error: "Collection service is not configured" });
    expect(createClient).not.toHaveBeenCalled();
  });

  it("ignores caller target fields and returns a no-store sanitized success", async () => {
    const { client, runCollector } = fakeClient(revragHealedRows);
    const { repository, commitHealthySnapshot } = fakePersistence();
    const handler = createRevRagRouteHandler({
      environment,
      createClient: () => client,
      persistence: repository,
      now: () => "2026-08-22T10:00:00.000Z",
    });

    const response = await handler(
      postRequest({
        collectorId: "c_attacker",
        url: "https://attacker.test/private",
      }),
    );
    const body = await jsonBody(response);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(runCollector).toHaveBeenCalledWith(REVRAG_COLLECTOR_ID, [
      { url: REVRAG_SOURCE_CATALOG_URL },
    ]);
    expect(body).toMatchObject({
      snapshotId: "j_revrag_snapshot",
      collectorId: REVRAG_COLLECTOR_ID,
      status: "healthy",
      persisted: true,
      counts: { rowCount: 10, validRowCount: 10, errorRowCount: 0 },
    });
    expect(commitHealthySnapshot).toHaveBeenCalledWith(expect.objectContaining({
      snapshotId: "j_revrag_snapshot",
      collectorId: REVRAG_COLLECTOR_ID,
      records: expect.any(Array),
    }));
    expect(body.records).toHaveLength(10);
    expect(JSON.stringify(body)).not.toContain("forms.google.com");
    expect(JSON.stringify(body)).not.toContain("server-only-token");
    expect(JSON.stringify(body)).not.toContain("attacker.test");
  });

  it("returns a safe failed response without returning degraded rows", async () => {
    const { client } = fakeClient([...revragValidRows, ...revragErrorRows]);
    const { repository, recordUnhealthyRun } = fakePersistence();
    const handler = createRevRagRouteHandler({
      environment,
      createClient: () => client,
      persistence: repository,
    });

    const response = await handler(postRequest());
    const body = await jsonBody(response);

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toMatchObject({
      snapshotId: "j_revrag_snapshot",
      collectorId: REVRAG_COLLECTOR_ID,
      status: "degraded",
      healthy: false,
      persisted: true,
      counts: { rowCount: 15, validRowCount: 10, errorRowCount: 5 },
      records: [],
    });
    expect(recordUnhealthyRun).toHaveBeenCalledWith(expect.objectContaining({
      snapshotId: "j_revrag_snapshot",
      status: "degraded",
      incident: expect.objectContaining({ status: "degraded" }),
    }));
    expect(JSON.stringify(body)).not.toContain("forms.google.com");
  });

  it("can exercise the real client with a fake fetch and still use the fixed target", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ collection_id: "j_revrag_snapshot" }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(revragHealedRows), { status: 200 }));
    vi.stubGlobal("fetch", fetchImpl);
    const handler = createRevRagRouteHandler({
      environment,
      persistence: fakePersistence().repository,
    });

    const response = await handler(postRequest({ collectorId: "c_attacker" }));
    const body = await jsonBody(response);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ collectorId: REVRAG_COLLECTOR_ID, status: "healthy" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const [triggerUrl, triggerInit] = fetchImpl.mock.calls[0] ?? [];
    expect(String(triggerUrl)).toContain(`/dca/trigger?collector=${REVRAG_COLLECTOR_ID}`);
    expect(JSON.parse(String(triggerInit?.body))).toEqual([
      { url: REVRAG_SOURCE_CATALOG_URL },
    ]);
  });

  it("fails closed before a live trigger when durable storage is unavailable", async () => {
    const { client, runCollector } = fakeClient(revragHealedRows);
    const handler = createRevRagRouteHandler({
      environment,
      createClient: () => client,
      persistence: null,
    });

    const response = await handler(postRequest());

    expect(response.status).toBe(503);
    expect(await jsonBody(response)).toEqual({ error: "Durable storage is not configured" });
    expect(runCollector).not.toHaveBeenCalled();
  });
});
