import { NextResponse } from "next/server";

import { agentLog } from "@/lib/debug/agent-log";

type AgentLogBody = {
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  runId?: string;
};

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: AgentLogBody;
  try {
    body = (await request.json()) as AgentLogBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { hypothesisId, location, message, data, runId } = body;
  if (!hypothesisId || !location || !message) {
    return NextResponse.json(
      { error: "hypothesisId, location, and message are required" },
      { status: 400 }
    );
  }

  agentLog(hypothesisId, location, message, data, runId);
  return NextResponse.json({ ok: true });
}
