/**
 * Verified from the unified repository's root package.json and application manifests.
 * These are instructions, NOT evidence that a process is running.
 * No arbitrary command input or remote shell endpoint is provided.
 */
export const WORKSPACE_TARGETS = [
  {
    id: "web",
    directory: "apps/web",
    title: "MapAble Web Platform",
    description: "Next.js 15, React 18 - MapAble Access, Core and Marketplace",
    command: "pnpm dev:web",
    localUrl: "http://localhost:3000",
    colour: "indigo",
  },
  {
    id: "mobile",
    directory: "apps/mobile",
    title: "AdaptAble / Independence Suite",
    description: "Expo SDK 57, React 19 - native Android and iOS",
    command: "npm run dev:mobile",
    localUrl: null,
    colour: "violet",
  },
] as const;

export type WorkspaceTargetId = (typeof WORKSPACE_TARGETS)[number]["id"];

export const WORKSPACE_REPO = {
  canonical: "ausdisau/MapAble",
  url: "https://github.com/ausdisau/MapAble",
  importedSource: "ausdisau/mapableau-new",
  importCommit: "e0a8b6907b25b23eda82fcbc3b722c088861b704",
  packageManager: "pnpm@10.12.1",
} as const;

export function isWorkspaceRouterEnabled(value: string | undefined): boolean {
  return value === "true";
}

export function getLaunchCommand(targetId: unknown): string | null {
  return WORKSPACE_TARGETS.find((target) => target.id === targetId)?.command ?? null;
}
