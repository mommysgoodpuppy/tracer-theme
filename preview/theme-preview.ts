/**
 * Tracer theme syntax gallery. 
 * Keep this file open beside the theme JSON while tuning colors.
 */

import { EventEmitter } from "node:events";

type Status = "idle" | "running" | "complete" | "failed";

interface TraceEvent<TPayload extends object> {
  readonly id: string;
  status: Status;
  createdAt: Date;
  payload: TPayload;
}

const DEFAULT_TIMEOUT_MS = 2_500;
const endpoint = new URL("https://example.com/api/traces?limit=20");

export class TraceClient extends EventEmitter {
  #attempts = 0;

  constructor(private readonly token: string) {
    super();
  }

  async send<T extends object>(payload: T): Promise<TraceEvent<T>> {
    if (!this.token) throw new Error("A token is required");

    const trace: TraceEvent<T> = {
      id: crypto.randomUUID(),
      status: "running",
      createdAt: new Date(),
      payload,
    };

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        this.#attempts = attempt;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            authorization: `Bearer ${this.token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(trace),
          signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        trace.status = "complete";
        this.emit("complete", trace);
        return trace;
      } catch (error: unknown) {
        console.warn(`Attempt ${attempt} failed`, error);
      }
    }

    trace.status = "failed";
    return trace;
  }
}

const client = new TraceClient("demo-token");
void client.send({ name: "theme-preview", samples: [1, 2, 3] });
