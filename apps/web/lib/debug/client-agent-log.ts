type ClientAgentLogPayload = {
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  runId?: string;
};

export function clientAgentLog(
  hypothesisId: string,
  location: string,
  message: string,
  data?: Record<string, unknown>,
  runId?: string
) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const payload: ClientAgentLogPayload = {
    hypothesisId,
    location,
    message,
    data,
    runId,
  };

  fetch("/api/debug/agent-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
