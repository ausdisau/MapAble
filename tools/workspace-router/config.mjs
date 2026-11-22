/** Allowlisted local development commands. No user-supplied shell input. */
export const WORKSPACE_HOST = "127.0.0.1";
export const DEFAULT_WORKSPACE_PORT = 4317;
export const APP_TARGETS = Object.freeze({
  web: Object.freeze({ id: "web", label: "MapAble Web", command: "pnpm", args: ["dev:web"], port: 3000 }),
  mobile: Object.freeze({ id: "mobile", label: "AdaptAble Mobile", command: "npm", args: ["run", "dev:mobile"], port: null }),
});

export function workspacePort(raw = "") {
  if (!raw) return DEFAULT_WORKSPACE_PORT;
  const number = Number(raw);
  if (!Number.isInteger(number) || number < 1024 || number > 65535)
    throw new Error("MAPABLE_WORKSPACE_PORT must be an integer from 1024 to 65535");
  return number;
}

export function runnerCommand(appId, platform = process.platform) {
  const target = APP_TARGETS[appId];
  if (!target) throw new Error("Unsupported workspace application");
  if (platform === "win32") {
    return {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", target.command + " " + target.args.join(" ")],
      detached: false,
    };
  }
  return { command: target.command, args: target.args, detached: true };
}

export function cleanLog(input) {
  return String(input)
    .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "")
    .replace(/\b(DATABASE_URL|DIRECT_URL|NEXTAUTH_SECRET|AUTH_SECRET|MOBILE_AUTH_SECRET|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|OPENAI_API_KEY)=\S+/gi, "$1=[redacted]")
    .replace(/\b(?:postgres(?:ql)?:\/\/)[^\s"']+/gi, "[database URL redacted]")
    .replace(/\b(?:sk_(?:live|test)_[A-Za-z0-9]+|sk-proj-[A-Za-z0-9_-]+)\b/g, "[credential redacted]")
    .slice(0, 480);
}

export function validatedSearchQuery(value) {
  if (typeof value !== "string") throw new Error("Enter a text search query.");
  const query = value.trim();
  if (query.length < 2 || query.length > 100 || /[\u0000-\u001f]/.test(query))
    throw new Error("Enter 2 to 100 characters of search text.");
  return query;
}
