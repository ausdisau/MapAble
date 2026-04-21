import express from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";

const app = express();
app.use(express.json());

const connectors = new ReplitConnectors();

async function agentmailRequest(path: string, method: string, body?: unknown) {
  const opts: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body && (method === "POST" || method === "PATCH" || method === "PUT")) {
    opts.body = JSON.stringify(body);
  }
  const response = await connectors.proxy("agentmail", path, opts as any);
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { status: response.status, data };
}

app.post("/api/email/inboxes", async (req, res) => {
  try {
    const { username, display_name } = req.body;
    const result = await agentmailRequest("/inboxes", "POST", {
      username: username || "mapable-notifications",
      display_name: display_name || "MapAble Notifications",
    });
    res.status(result.status).json(result.data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/email/inboxes", async (_req, res) => {
  try {
    const result = await agentmailRequest("/inboxes", "GET");
    res.status(result.status).json(result.data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/email/send", async (req, res) => {
  try {
    const { inbox_id, to, subject, text, html } = req.body;
    if (!inbox_id || !to || !subject) {
      return res.status(400).json({ error: "inbox_id, to, and subject are required" });
    }
    const result = await agentmailRequest(`/inboxes/${inbox_id}/messages/send`, "POST", {
      to,
      subject,
      text: text || "",
      html: html || undefined,
    });
    res.status(result.status).json(result.data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/email/reply", async (req, res) => {
  try {
    const { inbox_id, message_id, text, html } = req.body;
    if (!inbox_id || !message_id || !text) {
      return res.status(400).json({ error: "inbox_id, message_id, and text are required" });
    }
    const result = await agentmailRequest(
      `/inboxes/${inbox_id}/messages/${message_id}/reply`,
      "POST",
      { text, html: html || undefined }
    );
    res.status(result.status).json(result.data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/email/messages/:inbox_id", async (req, res) => {
  try {
    const { inbox_id } = req.params;
    const limit = req.query.limit || "50";
    const result = await agentmailRequest(
      `/inboxes/${inbox_id}/messages?limit=${limit}`,
      "GET"
    );
    res.status(result.status).json(result.data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/email/messages/:inbox_id/:message_id", async (req, res) => {
  try {
    const { inbox_id, message_id } = req.params;
    const result = await agentmailRequest(
      `/inboxes/${inbox_id}/messages/${message_id}`,
      "GET"
    );
    res.status(result.status).json(result.data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.patch("/api/email/messages/:inbox_id/:message_id/labels", async (req, res) => {
  try {
    const { inbox_id, message_id } = req.params;
    const { add_labels, remove_labels } = req.body;
    const result = await agentmailRequest(
      `/inboxes/${inbox_id}/messages/${message_id}`,
      "PATCH",
      { add_labels, remove_labels }
    );
    res.status(result.status).json(result.data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/email/health", async (_req, res) => {
  try {
    const check = await connectors.proxy("agentmail", "/inboxes", { method: "GET" });
    if (check.status === 401) {
      res.json({ status: "auth_error", service: "agentmail", message: "API key not configured or expired" });
    } else {
      res.json({ status: "ok", service: "agentmail" });
    }
  } catch (e: any) {
    res.status(503).json({ status: "unavailable", service: "agentmail", error: e.message });
  }
});

const PORT = 3001;
app.listen(PORT, "127.0.0.1", () => {
  console.log(`AgentMail microservice listening on http://127.0.0.1:${PORT}`);
});
