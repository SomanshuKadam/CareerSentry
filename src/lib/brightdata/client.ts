const DEFAULT_API_BASE = "https://api.brightdata.com";
const DEFAULT_POLL_INTERVAL_MS = 5_000;
const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_INPUTS_PER_RUN = 10;

export type CollectorInput = Readonly<Record<string, unknown>> & { url: string };
export type DatasetRow = Record<string, unknown>;

export type BrightDataClientOptions = {
  apiToken: string;
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
  pollIntervalMs?: number;
  timeoutMs?: number;
};

export class BrightDataApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "BrightDataApiError";
  }
}

function requireIdentifier(value: string, prefix: "c_" | "j_", label: string): string {
  const normalized = value.trim();
  if (!normalized.startsWith(prefix) || normalized.length <= prefix.length) {
    throw new BrightDataApiError(`${label} must start with ${prefix}`);
  }
  return normalized;
}

function validateInputs(inputs: readonly CollectorInput[]): void {
  if (inputs.length === 0) {
    throw new BrightDataApiError("At least one collector input is required");
  }
  if (inputs.length > MAX_INPUTS_PER_RUN) {
    throw new BrightDataApiError(
      `A run may contain at most ${MAX_INPUTS_PER_RUN} inputs under the project credit policy`,
    );
  }
  for (const input of inputs) {
    let parsed: URL;
    try {
      parsed = new URL(input.url);
    } catch {
      throw new BrightDataApiError("Every collector input must contain a valid public HTTP(S) URL");
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new BrightDataApiError("Every collector input must contain a valid public HTTP(S) URL");
    }
  }
}

export class BrightDataClient {
  private readonly apiBaseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly pollIntervalMs: number;
  private readonly timeoutMs: number;

  constructor(private readonly options: BrightDataClientOptions) {
    if (!options.apiToken.trim()) {
      throw new BrightDataApiError("BRIGHT_DATA_API_TOKEN is required");
    }
    this.apiBaseUrl = (options.apiBaseUrl ?? DEFAULT_API_BASE).replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  private get headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.options.apiToken}`,
      "Content-Type": "application/json",
    };
  }

  async triggerCollector(
    collectorId: string,
    inputs: readonly CollectorInput[],
  ): Promise<string> {
    const collector = requireIdentifier(collectorId, "c_", "Collector ID");
    validateInputs(inputs);
    const url = new URL(`${this.apiBaseUrl}/dca/trigger`);
    url.searchParams.set("collector", collector);
    url.searchParams.set("queue_next", "1");

    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(inputs),
    });
    if (!response.ok) {
      throw new BrightDataApiError("Bright Data rejected the collector trigger", response.status);
    }

    const body = (await response.json()) as { collection_id?: unknown };
    if (typeof body.collection_id !== "string") {
      throw new BrightDataApiError("Bright Data did not return a collection ID");
    }
    return requireIdentifier(body.collection_id, "j_", "Collection ID");
  }

  async getDataset(snapshotId: string): Promise<DatasetRow[] | null> {
    const snapshot = requireIdentifier(snapshotId, "j_", "Snapshot ID");
    const url = new URL(`${this.apiBaseUrl}/dca/dataset`);
    url.searchParams.set("id", snapshot);

    const response = await this.fetchImpl(url, { headers: this.headers });
    if (!response.ok) {
      throw new BrightDataApiError("Bright Data dataset polling failed", response.status);
    }
    const body: unknown = await response.json();
    return Array.isArray(body) ? (body as DatasetRow[]) : null;
  }

  async waitForDataset(snapshotId: string): Promise<DatasetRow[]> {
    const deadline = Date.now() + this.timeoutMs;
    while (Date.now() < deadline) {
      const rows = await this.getDataset(snapshotId);
      if (rows !== null) return rows;
      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));
    }
    throw new BrightDataApiError("Timed out waiting for the Bright Data dataset");
  }

  async runCollector(
    collectorId: string,
    inputs: readonly CollectorInput[],
  ): Promise<{ snapshotId: string; rows: DatasetRow[] }> {
    const snapshotId = await this.triggerCollector(collectorId, inputs);
    const rows = await this.waitForDataset(snapshotId);
    return { snapshotId, rows };
  }
}

export function createBrightDataClientFromEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): BrightDataClient {
  return new BrightDataClient({ apiToken: environment.BRIGHT_DATA_API_TOKEN ?? "" });
}

export const BRIGHT_DATA_MAX_INPUTS_PER_RUN = MAX_INPUTS_PER_RUN;
