import { describe, expect, it, vi } from "vitest";

import {
  defaultSavedRevRagEvidence,
  getDashboardReadModel,
  type PersistedRevRagSnapshot,
} from "../src/lib/dashboard";
import { evaluateHealth, jobRecordSchema } from "../src/lib/domain";
import {
  REVRAG_COLLECTOR_ID,
  REVRAG_SOURCE_CATALOG_URL,
} from "../src/lib/brightdata";

describe("dashboard read model", () => {
  it("returns explicitly labeled saved evidence when persistence is not configured", async () => {
    const model = await getDashboardReadModel();

    expect(model.source).toMatchObject({
      kind: "saved_evidence",
      isPersisted: false,
      isSavedEvidence: true,
      fallbackReason: "persistence_not_configured",
    });
    expect(model.source.label).toContain("Saved verified RevRag evidence");
    expect(model.run).toMatchObject({
      status: "saved_evidence",
      isPersisted: false,
      isLastKnownGood: false,
      timestampPrecision: "day",
      rowCount: 10,
      validRowCount: 10,
      errorRowCount: 0,
    });
    expect(model.run.snapshotId).toBeUndefined();
    expect(model.provenance).toMatchObject({
      relationship: "corporate-to-careers",
      catalogUrl: REVRAG_SOURCE_CATALOG_URL,
      allowedOrigins: ["https://www.revrag.ai"],
      allowedPathPrefixes: ["/careers"],
    });
    expect(model.records).toHaveLength(10);
    expect(model.records.every((record) => jobRecordSchema.safeParse(record).success)).toBe(true);
    expect(model.records.every((record) => !Object.prototype.hasOwnProperty.call(record, "applyUrl"))).toBe(
      true,
    );
    expect(JSON.stringify(model)).not.toContain("forms.google.com");
    expect(JSON.stringify(model)).not.toContain("job_url");
    expect(model.health.basis).toBe("saved_evidence");
  });

  it("prefers a healthy injected persisted last-known-good snapshot", async () => {
    const records = defaultSavedRevRagEvidence.records;
    const snapshot: PersistedRevRagSnapshot = {
      snapshotId: "j_persisted_revrag_1",
      runId: "run_persisted_revrag_1",
      collectorId: REVRAG_COLLECTOR_ID,
      sourceCatalogUrl: REVRAG_SOURCE_CATALOG_URL,
      collectedAt: "2026-08-22T10:00:00.000Z",
      rowCount: records.length,
      validRowCount: records.length,
      errorRowCount: 0,
      health: evaluateHealth(records),
      records,
    };
    const getLastKnownGoodSnapshot = vi.fn().mockResolvedValue(snapshot);

    const model = await getDashboardReadModel({
      snapshotStore: { getLastKnownGoodSnapshot },
    });

    expect(getLastKnownGoodSnapshot).toHaveBeenCalledTimes(1);
    expect(model.source).toMatchObject({
      kind: "persisted_last_known_good",
      isPersisted: true,
      isSavedEvidence: false,
    });
    expect(model.source.fallbackReason).toBeUndefined();
    expect(model.run).toMatchObject({
      snapshotId: "j_persisted_revrag_1",
      runId: "run_persisted_revrag_1",
      status: "succeeded",
      isPersisted: true,
      isLastKnownGood: true,
      timestampPrecision: "instant",
    });
    expect(model.health.basis).toBe("persisted_last_known_good");
    expect(model.records).toEqual(records);
    expect(JSON.stringify(model)).not.toContain("forms.google.com");
  });

  it("labels a missing persisted snapshot without claiming it was stored", async () => {
    const getLastKnownGoodSnapshot = vi.fn().mockResolvedValue(null);

    const model = await getDashboardReadModel({
      persistedSnapshotStore: { getLastKnownGoodSnapshot },
    });

    expect(getLastKnownGoodSnapshot).toHaveBeenCalledTimes(1);
    expect(model.source).toMatchObject({
      kind: "saved_evidence",
      fallbackReason: "no_last_known_good_snapshot",
      isPersisted: false,
    });
    expect(model.run.snapshotId).toBeUndefined();
  });

  it("falls back safely when persistence fails or returns a non-usable snapshot", async () => {
    const unavailable = await getDashboardReadModel({
      snapshotStore: {
        getLastKnownGoodSnapshot: vi.fn().mockRejectedValue(new Error("database unavailable")),
      },
    });
    expect(unavailable.source.fallbackReason).toBe("persistence_unavailable");
    expect(unavailable.source.isSavedEvidence).toBe(true);

    const degraded: PersistedRevRagSnapshot = {
      snapshotId: "j_degraded_revrag_1",
      collectorId: REVRAG_COLLECTOR_ID,
      sourceCatalogUrl: REVRAG_SOURCE_CATALOG_URL,
      collectedAt: "2026-08-22T10:00:00.000Z",
      health: evaluateHealth([], defaultSavedRevRagEvidence.records),
      records: [],
    };
    const notUsable = await getDashboardReadModel({
      snapshotStore: {
        getLastKnownGoodSnapshot: vi.fn().mockResolvedValue(degraded),
      },
    });
    expect(notUsable.source.fallbackReason).toBe("persisted_snapshot_not_usable");
    expect(notUsable.records).toHaveLength(10);
    expect(JSON.stringify(notUsable)).not.toContain("database unavailable");
  });

  it("does not expose application URLs from an otherwise canonical persisted record", async () => {
    const record = {
      ...defaultSavedRevRagEvidence.records[0],
      applyUrl: "https://forms.google.com/private-application",
    };
    const snapshot: PersistedRevRagSnapshot = {
      snapshotId: "j_persisted_with_apply_url",
      collectorId: REVRAG_COLLECTOR_ID,
      sourceCatalogUrl: REVRAG_SOURCE_CATALOG_URL,
      collectedAt: "2026-08-22T10:00:00.000Z",
      rowCount: 1,
      validRowCount: 1,
      errorRowCount: 0,
      health: evaluateHealth([record]),
      records: [record],
    };

    const model = await getDashboardReadModel({
      snapshotStore: { getLastKnownGoodSnapshot: vi.fn().mockResolvedValue(snapshot) },
    });

    expect(model.source.kind).toBe("persisted_last_known_good");
    expect(model.records[0]).not.toHaveProperty("applyUrl");
    expect(JSON.stringify(model)).not.toContain("forms.google.com");
  });
});
