/**
 * A local-only workspace process router. NEVER mount this inside a public
 * Next.js API route or expose it via Replit/Vercel proxies.
 *
 * Security boundaries: loopback-only listener, exact Host/Origin, per-run
 * unguessable header token for APIs, no CORS, no arbitrary shell commands,
 * no secrets in public environment variables, CSP and text-only logs.
 */
import http from "node:http";
import { spawn } from "node:child_process";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  APP_TARGETS, WORKSPACE_HOST, cleanLog, runnerCommand,
  validatedSearchQuery, workspacePort,
} from "./config.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(here, "../..");
const document = readFileSync(resolve(here, "index.html"), "utf8");
const stylesheet = readFileSync(resolve(here, "styles.css"), "utf8");
const script = readFileSync(resolve(here, "app.js"), "utf8");
const MAX_LOGS = 180;

const send = (res, status, value, mime = "application/json; charset=utf-8") => {
  const body = typeof value === "string" ? value : JSON.stringify(value);
  res.writeHead(status, {
    "Content-Type": mime,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy":
      "default-src 'none'; script-src 'self'; style-src 'self'; " +
      "connect-src 'self'; img-src 'self'; font-src 'self'; " +
      "frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  });
  res.end(body);
};

function sameSecret(provided, expected) {
  if (typeof provided !== "string") return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function parseBody(req, maxBytes = 2048) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error("Request exceeds local control limit.");
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new Error("Request body must contain valid JSON."); }
}

export function createWorkspaceRouter({
  port = workspacePort(process.env.MAPABLE_WORKSPACE_PORT),
  rootDir = repositoryRoot,
  launch = spawn,
} = {}) {
  const token = randomBytes(32).toString("hex");
  const processes = new Map(Object.keys(APP_TARGETS).map((id) => [id, {
    id, status: "stopped", pid: null, startedAt: null, stoppedAt: null,
    exitCode: null, child: null, stopTimer: null,
  }]));
  let logIndex = 0;
  let logs = [];

  const writeLog = (category, message) => {
    logs.push({
      id: ++logIndex,
      at: new Date().toISOString(),
      category,
      message: cleanLog(message),
    });
    if (logs.length > MAX_LOGS) logs = logs.slice(-MAX_LOGS);
  };
  writeLog("system", "Local router is ready. No app process is assumed to be running.");

  function publicProcess(id) {
    const p = processes.get(id);
    return {
      id: p.id, status: p.status, pid: p.pid,
      startedAt: p.startedAt, stoppedAt: p.stoppedAt,
      exitCode: p.exitCode,
    };
  }

  function wireOutput(child, id, stream, category) {
    if (!stream) return;
    let pending = "";
    stream.setEncoding("utf8");
    stream.on("data", (text) => {
      pending += text;
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() || "";
      for (const line of lines.slice(-30)) {
        if (line.trim()) writeLog(category, id + ": " + line);
      }
      if (pending.length > 4096) {
        writeLog(category, id + ": " + pending.slice(0, 4096));
        pending = "";
      }
    });
    stream.on("end", () => {
      if (pending.trim()) writeLog(category, id + ": " + pending);
    });
  }

  function start(id) {
    const p = processes.get(id);
    if (!p) throw new Error("Unknown app target.");
    if (p.child || p.status === "running" || p.status === "starting" || p.status === "stopping")
      throw new Error("This app process is already being managed.");
    const command = runnerCommand(id);
    p.status = "starting";
    p.exitCode = null;
    p.startedAt = new Date().toISOString();
    p.stoppedAt = null;
    writeLog("command", "Launching approved local command: " + APP_TARGETS[id].command +
      " " + APP_TARGETS[id].args.join(" "));
    let child;
    try {
      child = launch(command.command, command.args, {
        cwd: rootDir, env: process.env, shell: false,
        detached: command.detached, windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (err) {
      p.status = "failed";
      writeLog("error", "Could not start " + id + ": " + (err instanceof Error ? err.message : "unknown error"));
      return publicProcess(id);
    }
    p.child = child;
    p.pid = typeof child.pid === "number" ? child.pid : null;
    child.once("spawn", () => {
      if (p.status === "starting") p.status = "running";
      writeLog("system", id + " process started. Application readiness is checked separately.");
    });
    child.once("error", (err) => {
      p.status = "failed";
      p.child = null;
      p.pid = null;
      p.stoppedAt = new Date().toISOString();
      writeLog("error", id + " process error: " + err.message);
    });
    child.once("exit", (code, signal) => {
      if (p.stopTimer) clearTimeout(p.stopTimer);
      p.stopTimer = null;
      const intentionallyStopped = p.status === "stopping";
      p.status = intentionallyStopped || code === 0 ? "stopped" : "failed";
      p.exitCode = typeof code === "number" ? code : null;
      p.child = null;
      p.pid = null;
      p.stoppedAt = new Date().toISOString();
      writeLog(intentionallyStopped || code === 0 ? "system" : "error",
        id + " process exited (" + (signal || "code " + String(code)) + ").");
    });
    wireOutput(child, id, child.stdout, "stdout");
    wireOutput(child, id, child.stderr, "stderr");
    return publicProcess(id);
  }

  function stop(id) {
    const p = processes.get(id);
    if (!p) throw new Error("Unknown app target.");
    if (!p.child) throw new Error("No managed process exists for this app.");
    if (p.status === "stopping") throw new Error("Process stop is already requested.");
    p.status = "stopping";
    writeLog("system", "Stopping local " + id + " process group.");
    try {
      if (process.platform === "win32") {
        if (p.pid !== null) {
          launch("taskkill.exe", ["/PID", String(p.pid), "/T", "/F"], {
            cwd: rootDir, shell: false, windowsHide: true, stdio: "ignore",
          });
        } else p.child.kill();
      } else if (p.pid !== null) {
        process.kill(-p.pid, "SIGTERM");
      } else {
        p.child.kill("SIGTERM");
      }
    } catch (err) {
      writeLog("error", "Process termination failed: " + (err instanceof Error ? err.message : "unknown"));
      try { p.child.kill("SIGTERM"); } catch { /* Process may have exited. */ }
    }
    p.stopTimer = setTimeout(() => {
      if (!p.child) return;
      try {
        if (process.platform === "win32") {
          if (p.pid !== null)
            launch("taskkill.exe", ["/PID", String(p.pid), "/T", "/F"], {
              cwd: rootDir, shell: false, windowsHide: true, stdio: "ignore",
            });
          else p.child.kill();
        } else if (p.pid !== null) process.kill(-p.pid, "SIGKILL");
        else p.child.kill("SIGKILL");
      } catch { /* Already terminated or inaccessible. */ }
    }, 3500);
    p.stopTimer.unref?.();
    return publicProcess(id);
  }

  async function isWebResponding() {
    if (processes.get("web").status !== "running") return false;
    try {
      const res = await fetch("http://127.0.0.1:3000/", {
        method: "HEAD", signal: AbortSignal.timeout(1600),
        redirect: "manual", cache: "no-store",
      });
      return res.status < 500;
    } catch { return false; }
  }

  let listenerOrigin = null;
  const server = http.createServer(async (req, res) => {
    try {
      const origin = listenerOrigin;
      if (!origin || req.headers.host !== origin.replace("http://", "")) {
        send(res, 403, { error: "Local host required." }); return;
      }
      const url = new URL(req.url || "/", origin);
      if (req.method === "GET" && url.pathname === "/") {
        send(res, 200, document.replace("__MAPABLE_ROUTER_TOKEN__", token),
          "text/html; charset=utf-8");
        return;
      }
      if (req.method === "GET" && url.pathname === "/styles.css") {
        send(res, 200, stylesheet, "text/css; charset=utf-8"); return;
      }
      if (req.method === "GET" && url.pathname === "/app.js") {
        send(res, 200, script, "text/javascript; charset=utf-8"); return;
      }
      if (!sameSecret(req.headers["x-workspace-token"], token)) {
        send(res, 403, { error: "Local workspace token required." }); return;
      }
      if (req.method === "GET" && url.pathname === "/api/state") {
        send(res, 200, {
          locallyManaged: true, processStateIsLocalOnly: true,
          apps: Object.fromEntries(Object.keys(APP_TARGETS).map((id) => [id, publicProcess(id)])),
          webHttpReachable: await isWebResponding(),
          logs,
        });
        return;
      }
      if (req.method === "GET" && url.pathname === "/api/place-search") {
        let query;
        try { query = validatedSearchQuery(url.searchParams.get("q")); }
        catch (err) { send(res, 400, { error: err.message }); return; }
        if (processes.get("web").status !== "running") {
          send(res, 503, { error: "Start the local Web process before searching." }); return;
        }
        try {
          const target = new URL("http://127.0.0.1:3000/api/access/search");
          target.searchParams.set("q", query);
          target.searchParams.set("limit", "5");
          target.searchParams.set("sort", "relevance");
          const remote = await fetch(target, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(7500), redirect: "manual",
          });
          if (!remote.ok) {
            send(res, 502, { error: "Local MapAble access search returned status " + remote.status }); return;
          }
          if (Number(remote.headers.get("content-length") || "0") > 131072) {
            send(res, 502, { error: "Search response was larger than expected." }); return;
          }
          const body = await remote.text();
          if (body.length > 131072) {
            send(res, 502, { error: "Search response was larger than expected." }); return;
          }
          const json = JSON.parse(body);
          if (!json || !Array.isArray(json.results)) {
            send(res, 502, { error: "Unexpected search data format." }); return;
          }
          const results = json.results.slice(0, 5).map((entry) => {
            const place = entry && typeof entry === "object" ? entry.place : null;
            return {
              name: typeof place?.name === "string" ? place.name.slice(0, 130) : "Unnamed place",
              suburb: typeof place?.suburb === "string" ? place.suburb.slice(0, 100) : "",
              category: typeof place?.category === "string" ? place.category.slice(0, 80) : "",
              confidence: typeof place?.confidence === "string" ? place.confidence.slice(0, 45) : "unknown",
            };
          });
          writeLog("system", "Read-only local access search completed (text only).");
          send(res, 200, { results, source: "local MapAble web API", noLocationShared: true });
        } catch {
          send(res, 502, { error: "The local MapAble API could not return verified JSON data." });
        }
        return;
      }
      if (req.method === "POST" && (url.pathname === "/api/control" || url.pathname === "/api/clear")) {
        if (req.headers.origin !== origin) {
          send(res, 403, { error: "Same-origin request required." }); return;
        }
        if (!(req.headers["content-type"] || "").startsWith("application/json")) {
          send(res, 415, { error: "JSON content type required." }); return;
        }
        let payload;
        try { payload = await parseBody(req); }
        catch (err) { send(res, 400, { error: err.message }); return; }
        if (url.pathname === "/api/clear") {
          if (!payload || payload.confirm !== true) {
            send(res, 400, { error: "Explicit log-clear confirmation required." }); return;
          }
          logs = [];
          writeLog("system", "Local terminal display log cleared.");
          send(res, 200, { ok: true }); return;
        }
        if (!payload || (payload.app !== "web" && payload.app !== "mobile") ||
            (payload.action !== "start" && payload.action !== "stop")) {
          send(res, 400, { error: "Unsupported app or control action." }); return;
        }
        try {
          const state = payload.action === "start" ? start(payload.app) : stop(payload.app);
          send(res, 200, { state });
        } catch (err) {
          send(res, 409, { error: err.message }); return;
        }
        return;
      }
      send(res, 404, { error: "Unknown local workspace route." });
    } catch {
      if (!res.headersSent) send(res, 500, { error: "The local workspace encountered an internal error." });
      else res.end();
    }
  });

  return {
    token,
    get origin() { return listenerOrigin; },
    getSnapshot() { return { apps: Object.fromEntries(Object.keys(APP_TARGETS).map((id) => [id, publicProcess(id)])), logs }; },
    async listen() {
      return await new Promise((done, reject) => {
        server.once("error", reject);
        server.listen(port, WORKSPACE_HOST, () => {
          server.removeListener("error", reject);
          const address = server.address();
          listenerOrigin = "http://" + WORKSPACE_HOST + ":" + address.port;
          done(listenerOrigin);
        });
      });
    },
    async close() {
      for (const id of Object.keys(APP_TARGETS)) {
        const p = processes.get(id);
        if (p.child && p.status !== "stopping") {
          try { stop(id); } catch { /* Process exited concurrently. */ }
        }
      }
      if (server.listening) {
        await new Promise((done) => server.close(done));
      }
    },
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const router = createWorkspaceRouter();
  router.listen().then((origin) => {
    process.stdout.write("\nMapAble Unified local workspace running at " + origin + "\n");
    process.stdout.write("Only this computer can access the router. Close with Ctrl+C.\n");
    const shutdown = () => {
      router.close().finally(() => process.exit(0));
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  }).catch((error) => {
    process.stderr.write("Failed to start local workspace: " + error.message + "\n");
    process.exitCode = 1;
  });
}
