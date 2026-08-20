import { describe, expect, it, vi } from "vitest";

import { BrightDataApiError, BrightDataClient } from "../src/lib/brightdata";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("BrightDataClient", () => {
  it("triggers one bounded input and polls until rows are ready", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ collection_id: "j_snapshot123" }))
      .mockResolvedValueOnce(jsonResponse({ status: "building" }))
      .mockResolvedValueOnce(jsonResponse([{ title: "Backend Engineer" }]));
    const client = new BrightDataClient({
      apiToken: "test-token",
      apiBaseUrl: "https://api.example.test",
      fetchImpl,
      pollIntervalMs: 0,
      timeoutMs: 1_000,
    });

    const result = await client.runCollector("c_collector123", [
      { url: "https://careers.example.test/jobs" },
    ]);

    expect(result).toEqual({
      snapshotId: "j_snapshot123",
      rows: [{ title: "Backend Engineer" }],
    });
    const triggerUrl = String(fetchImpl.mock.calls[0]?.[0]);
    expect(triggerUrl).toContain("collector=c_collector123");
    expect(triggerUrl).toContain("queue_next=1");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("enforces the source-of-truth ten-input ceiling before a network call", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const client = new BrightDataClient({ apiToken: "test-token", fetchImpl });
    const inputs = Array.from({ length: 11 }, (_, index) => ({
      url: `https://careers.example.test/jobs/${index}`,
    }));

    await expect(client.triggerCollector("c_collector123", inputs)).rejects.toThrow(
      BrightDataApiError,
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns safe status-aware errors without including response bodies", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({ token: "must-not-leak" }, 403),
    );
    const client = new BrightDataClient({ apiToken: "test-token", fetchImpl });

    const error = await client
      .triggerCollector("c_collector123", [{ url: "https://careers.example.test/jobs" }])
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(BrightDataApiError);
    expect(error).toMatchObject({ status: 403 });
    expect(String(error)).not.toContain("must-not-leak");
  });
});
