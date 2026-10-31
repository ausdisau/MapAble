"use strict";

const token = document.querySelector('meta[name="workspace-token"]')?.content || "";
const elements = {
  message: document.getElementById("workspace-message"),
  terminal: document.getElementById("terminal-log"),
  readyWeb: document.getElementById("ready-web"),
  openWeb: document.getElementById("open-web"),
  searchForm: document.getElementById("search-form"),
  searchFeedback: document.getElementById("search-feedback"),
  searchResults: document.getElementById("search-results"),
};
let isBusy = false;
let pollTimer = null;
let live = true;

function notice(message, error = false) {
  elements.message.textContent = message;
  elements.message.dataset.error = error ? "true" : "false";
}
function searchNotice(message, error = false) {
  elements.searchFeedback.textContent = message;
  elements.searchFeedback.dataset.error = error ? "true" : "false";
}

async function request(path, options = {}) {
  const headers = { "X-Workspace-Token": token };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(path, {
    method: options.method || "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: AbortSignal.timeout(9500),
  });
  let data;
  try { data = await response.json(); }
  catch { throw new Error("Local router returned an unreadable response."); }
  if (!response.ok) throw new Error(data.error || "Local request failed (" + response.status + ").");
  return data;
}

const label = {
  stopped: "Stopped", starting: "Starting", running: "Process running",
  stopping: "Stopping", failed: "Failed",
};
function showApps(data) {
  for (const appId of ["web", "mobile"]) {
    const app = data.apps[appId];
    if (!app) continue;
    const status = document.getElementById("status-" + appId);
    status.dataset.state = app.status;
    status.textContent = label[app.status] || "Unknown";
    const idle = app.status === "stopped" || app.status === "failed";
    document.getElementById("start-" + appId).disabled = isBusy || !idle;
    document.getElementById("stop-" + appId).disabled = isBusy || idle || app.status === "stopping";
  }
  elements.openWeb.hidden = !data.webHttpReachable;
  elements.readyWeb.textContent = data.webHttpReachable
    ? "The local Web server responded to an HTTP readiness request."
    : data.apps.web.status === "running"
      ? "Process is running, but the web HTTP endpoint is not yet reachable."
      : "Web HTTP readiness is not established.";
}

function showLogs(logs) {
  if (!Array.isArray(logs)) return;
  const atBottom = elements.terminal.scrollHeight - elements.terminal.scrollTop -
    elements.terminal.clientHeight < 45;
  const fragment = document.createDocumentFragment();
  for (const row of logs.slice(-180)) {
    const li = document.createElement("li");
    li.dataset.category = String(row.category || "system");
    const time = document.createElement("time");
    const date = new Date(row.at);
    time.textContent = Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("en-AU");
    const text = document.createElement("span");
    text.textContent = String(row.message || "");
    li.append(time, text);
    fragment.appendChild(li);
  }
  elements.terminal.replaceChildren(fragment);
  if (atBottom) elements.terminal.scrollTop = elements.terminal.scrollHeight;
}

async function refresh() {
  const data = await request("/api/state");
  showApps(data);
  showLogs(data.logs);
}

async function poll() {
  if (!live) return;
  try { await refresh(); }
  catch (error) { notice(error.message || "Cannot reach local router.", true); }
  finally { if (live) pollTimer = setTimeout(poll, 2500); }
}

async function control(app, action) {
  if (isBusy) return;
  isBusy = true;
  for (const id of ["web", "mobile"]) {
    document.getElementById("start-" + id).disabled = true;
    document.getElementById("stop-" + id).disabled = true;
  }
  try {
    await request("/api/control", { method: "POST", body: { app, action } });
    notice((action === "start" ? "Start" : "Stop") + " requested for " + app +
      ". Actual process state will update below.");
    await refresh();
  } catch (error) {
    notice(error.message || "The process command failed.", true);
  } finally {
    isBusy = false;
    try { await refresh(); } catch { /* Next scheduled poll will retry. */ }
  }
}

for (const appId of ["web", "mobile"]) {
  document.getElementById("start-" + appId).addEventListener("click", () => control(appId, "start"));
  document.getElementById("stop-" + appId).addEventListener("click", () => control(appId, "stop"));
}

document.getElementById("clear-logs").addEventListener("click", async () => {
  try {
    await request("/api/clear", { method: "POST", body: { confirm: true } });
    notice("Local process log cleared. Processes were not stopped.");
    await refresh();
  } catch (error) {
    notice(error.message || "Could not clear log.", true);
  }
});

elements.searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(elements.searchForm);
  const query = String(formData.get("query") || "").trim();
  if (query.length < 2) {
    searchNotice("Enter at least two characters.", true); return;
  }
  elements.searchResults.replaceChildren();
  searchNotice("Searching the local MapAble API...");
  document.getElementById("run-search").disabled = true;
  try {
    const data = await request("/api/place-search?q=" + encodeURIComponent(query));
    if (!Array.isArray(data.results) || !data.results.length) {
      searchNotice("No matching places were returned by the local API."); return;
    }
    const fragment = document.createDocumentFragment();
    for (const item of data.results) {
      const li = document.createElement("li");
      const title = document.createElement("strong");
      title.textContent = item.name || "Unnamed place";
      const detail = document.createElement("small");
      detail.textContent = [
        item.suburb, item.category, "Evidence status: " + (item.confidence || "unknown"),
      ].filter(Boolean).join(" · ");
      li.append(title, detail);
      fragment.appendChild(li);
    }
    elements.searchResults.appendChild(fragment);
    searchNotice(data.results.length + " result(s) returned by the local API. No location coordinates shared.");
  } catch (error) {
    searchNotice(error.message || "Local search was unsuccessful.", true);
  } finally {
    document.getElementById("run-search").disabled = false;
  }
});

window.addEventListener("pagehide", () => {
  live = false;
  if (pollTimer) clearTimeout(pollTimer);
});
poll();
