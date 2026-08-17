import fs from "node:fs";
import path from "node:path";

type AgentLogPayload = {
  sessionId: string;
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
  runId?: string;
};

const LOG_PATH = path.join(process.cwd(), "debug-b842da.log");
const ENDPOINT =
  "http://127.0.0.1:7249/ingest/a8d2db3f-3315-4cd8-a300-a0a45c32dc6d";

export function agentLog(
  hypothesisId: string,
  location: string,
  message: string,
  data?: Record<string, unknown>,
  runId?: string
) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const payload: AgentLogPayload = {
    sessionId: "b842da",
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
    runId,
  };

  try {
    fs.appendFileSync(LOG_PATH, `${JSON.stringify(payload)}\n`, "utf8");
  } catch {
    // ignore file write errors
  }

  if (typeof fetch !== "undefined") {
    fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "b842da",
      },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }
}
