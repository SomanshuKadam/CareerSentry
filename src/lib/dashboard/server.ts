import "server-only";

import { evaluateHealth } from "../domain";
import { REVRAG_COLLECTOR_ID } from "../brightdata";
import { getPersistenceRepository } from "../persistence/server";
import type { PersistedIncident, PersistedRunSummary, PersistenceRepository } from "../persistence/contracts";
import {
  getDashboardReadModel,
  type DashboardReadModel,
  type PersistedRevRagSnapshot,
} from "./read-model";

export type ServerDashboardReadModel = DashboardReadModel & {
  storage: {
    configured: boolean;
    latestRun: PersistedRunSummary | null;
    latestIncident: PersistedIncident | null;
  };
};

function persistedSnapshot(
  value: Awaited<ReturnType<PersistenceRepository["getLastKnownGoodSnapshot"]>>,
): PersistedRevRagSnapshot | null {
  if (!value) return null;
  return {
    snapshotId: value.run.snapshotId,
    runId: value.run.runId,
    collectorId: value.run.collectorId,
    sourceCatalogUrl: value.run.sourceCatalogUrl,
    collectedAt: value.run.completedAt ?? value.run.startedAt ?? value.run.createdAt,
    rowCount: value.run.rowCount,
    validRowCount: value.run.validRowCount,
    errorRowCount: value.run.errorRowCount,
    health: evaluateHealth(value.jobs),
    records: value.jobs,
  };
}

export async function getServerDashboardReadModel(
  environment: Record<string, string | undefined> = process.env,
  injectedRepository?: PersistenceRepository | null,
): Promise<ServerDashboardReadModel> {
  const repository = injectedRepository === undefined
    ? getPersistenceRepository(environment)
    : injectedRepository;

  if (!repository) {
    const model = await getDashboardReadModel();
    return { ...model, storage: { configured: false, latestRun: null, latestIncident: null } };
  }

  try {
    const state = await repository.getLatestState(REVRAG_COLLECTOR_ID);
    const model = await getDashboardReadModel({
      snapshotStore: {
        getLastKnownGoodSnapshot: async () => persistedSnapshot(state.lastKnownGood),
      },
    });
    return {
      ...model,
      storage: {
        configured: true,
        latestRun: state.latestRun,
        latestIncident: state.latestIncident,
      },
    };
  } catch {
    const model = await getDashboardReadModel({
      snapshotStore: {
        getLastKnownGoodSnapshot: async () => {
          throw new Error("Persistence unavailable");
        },
      },
    });
    return { ...model, storage: { configured: true, latestRun: null, latestIncident: null } };
  }
}
