import { createHash } from "crypto";
import { readdirSync, readFileSync, existsSync, statSync } from "fs";
import { join, relative } from "path";

export type TwinModuleSeed = {
  moduleKey: string;
  path: string;
  programme?: string;
  canonicalDomainKeys: string[];
  description: string;
  writerCount: number;
  routeCount: number;
};

export type TwinRouteSeed = {
  method: string;
  path: string;
  filePath: string;
  moduleKey?: string;
  sideEffects: boolean;
};

export type TwinPackageSeed = {
  name: string;
  version?: string;
  path: string;
  kind: string;
};

export type FlagManifestSeed = {
  flagName: string;
  defaultValue: string;
  owner?: string;
  purpose?: string;
  sourceFile: string;
  category?: string;
};

const MODULE_CATALOGUE: TwinModuleSeed[] = [
  {
    moduleKey: "lib.transport",
    path: "lib/transport",
    programme: "Transport",
    canonicalDomainKeys: ["transport.trip", "transport.booking_legacy"],
    description: "Transport trip services and legacy booking bridge",
    writerCount: 3,
    routeCount: 35,
  },
  {
    moduleKey: "lib.care",
    path: "lib/care",
    programme: "Care",
    canonicalDomainKeys: ["care.shift"],
    description: "Care shift and request services",
    writerCount: 2,
    routeCount: 25,
  },
  {
    moduleKey: "lib.cases",
    path: "lib/cases",
    programme: "MapAble Core",
    canonicalDomainKeys: ["missions.case"],
    description: "Interim case management (bridge to CareOSMission)",
    writerCount: 1,
    routeCount: 10,
  },
  {
    moduleKey: "lib.consent",
    path: "lib/consent",
    programme: "MapAble Core",
    canonicalDomainKeys: ["participant.consent"],
    description: "Consent records and micro-consent gates",
    writerCount: 1,
    routeCount: 4,
  },
  {
    moduleKey: "lib.audit",
    path: "lib/audit",
    programme: "MapAble Core",
    canonicalDomainKeys: ["governance.audit"],
    description: "Platform audit event writer",
    writerCount: 1,
    routeCount: 1,
  },
  {
    moduleKey: "lib.indoor-accessibility",
    path: "lib/access/indoor",
    programme: "Indoor Accessibility",
    canonicalDomainKeys: ["places.floor_plan", "places.access_place"],
    description: "Indoor floor plans and preference profiles",
    writerCount: 2,
    routeCount: 8,
  },
  {
    moduleKey: "lib.convergence-os",
    path: "lib/platform/convergence-os",
    programme: "Platform Assurance",
    canonicalDomainKeys: ["convergence.control_plane"],
    description: "ConvergenceOS governance control plane",
    writerCount: 0,
    routeCount: 12,
  },
  {
    moduleKey: "lib.ndis-gateway",
    path: "lib/ndis-gateway",
    programme: "NDIS Gateway",
    canonicalDomainKeys: ["ndis.gateway", "finance.funding"],
    description: "Canonical NDIS funding-route facades (open PR)",
    writerCount: 0,
    routeCount: 0,
  },
  {
    moduleKey: "lib.auth",
    path: "lib/auth",
    programme: "MapAble Core",
    canonicalDomainKeys: ["identity.user", "identity.organisation"],
    description: "Identity, sessions, permissions",
    writerCount: 1,
    routeCount: 8,
  },
  {
    moduleKey: "lib.billing-core",
    path: "lib/billing/core",
    programme: "Billing",
    canonicalDomainKeys: ["finance.invoice"],
    description: "Billing-core invoice audit trail",
    writerCount: 1,
    routeCount: 5,
  },
];

function hashString(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function listApiRoutes(repoRoot: string): TwinRouteSeed[] {
  const apiRoot = join(repoRoot, "app/api");
  if (!existsSync(apiRoot)) return [];
  const routes: TwinRouteSeed[] = [];

  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
        continue;
      }
      if (entry !== "route.ts" && entry !== "route.js") continue;
      const rel = relative(join(repoRoot, "app/api"), dir).replace(/\\/g, "/");
      const path = `/api/${rel}`
        .replace(/\[([^\]]+)\]/g, ":$1")
        .replace(/\/+/g, "/");
      const moduleKey = inferModuleKey(rel);
      routes.push({
        method: "ANY",
        path,
        filePath: relative(repoRoot, full).replace(/\\/g, "/"),
        moduleKey,
        sideEffects:
          rel.includes("claim") ||
          rel.includes("payout") ||
          rel.includes("execution") ||
          rel.includes("stripe"),
      });
    }
  }

  walk(apiRoot);
  return routes.sort((a, b) => a.path.localeCompare(b.path));
}

function inferModuleKey(apiRel: string): string | undefined {
  if (apiRel.startsWith("transport")) return "lib.transport";
  if (apiRel.startsWith("care")) return "lib.care";
  if (apiRel.startsWith("cases")) return "lib.cases";
  if (apiRel.startsWith("consent")) return "lib.consent";
  if (apiRel.startsWith("ndis") || apiRel.startsWith("admin/ndia"))
    return "lib.ndis-gateway";
  if (apiRel.startsWith("convergence")) return "lib.convergence-os";
  if (apiRel.startsWith("indoor") || apiRel.startsWith("access"))
    return "lib.indoor-accessibility";
  if (apiRel.startsWith("billing") || apiRel.startsWith("payouts"))
    return "lib.billing-core";
  if (apiRel.startsWith("auth")) return "lib.auth";
  return undefined;
}

function parseEnvExampleFlags(repoRoot: string): FlagManifestSeed[] {
  const envPath = join(repoRoot, ".env.example");
  if (!existsSync(envPath)) return [];
  const lines = readFileSync(envPath, "utf8").split("\n");
  const flags: FlagManifestSeed[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const name = m[1];
    if (
      !name.includes("ENABLED") &&
      !name.startsWith("MAPABLE_CONVERGENCE") &&
      !name.includes("PILOT") &&
      !name.includes("MODE")
    ) {
      continue;
    }
    flags.push({
      flagName: name,
      defaultValue: m[2] || "",
      sourceFile: ".env.example",
      owner: name.startsWith("MAPABLE_CONVERGENCE")
        ? "platform_assurance"
        : undefined,
      purpose: name.startsWith("MAPABLE_CONVERGENCE")
        ? "ConvergenceOS governance control"
        : "Platform feature toggle",
      category: name.startsWith("MAPABLE_CONVERGENCE")
        ? "convergence"
        : "programme",
    });
  }
  return flags;
}

function readPackages(repoRoot: string): TwinPackageSeed[] {
  const packages: TwinPackageSeed[] = [];
  try {
    const rootPkg = JSON.parse(
      readFileSync(join(repoRoot, "package.json"), "utf8")
    ) as { name?: string; version?: string };
    packages.push({
      name: rootPkg.name ?? "MapableAU",
      version: rootPkg.version,
      path: ".",
      kind: "workspace_root",
    });
  } catch {
    /* ignore */
  }
  const realtime = join(repoRoot, "apps/realtime-server/package.json");
  if (existsSync(realtime)) {
    try {
      const pkg = JSON.parse(readFileSync(realtime, "utf8")) as {
        name?: string;
        version?: string;
      };
      packages.push({
        name: pkg.name ?? "@mapable/realtime-server",
        version: pkg.version,
        path: "apps/realtime-server",
        kind: "workspace_package",
      });
    } catch {
      /* ignore */
    }
  }
  return packages;
}

export function buildTwinInventory(repoRoot = process.cwd()) {
  const packages = readPackages(repoRoot);
  const modules = MODULE_CATALOGUE.filter((m) =>
    existsSync(join(repoRoot, m.path))
  );
  // Keep catalogue entries even if path missing (open-PR modules)
  const allModules =
    modules.length === MODULE_CATALOGUE.length
      ? modules
      : [
          ...modules,
          ...MODULE_CATALOGUE.filter(
            (m) => !modules.some((x) => x.moduleKey === m.moduleKey)
          ),
        ];
  const routes = listApiRoutes(repoRoot);
  const flags = parseEnvExampleFlags(repoRoot);

  const schemaPath = join(repoRoot, "prisma/schema.prisma");
  const schemaHash = existsSync(schemaPath)
    ? hashString(readFileSync(schemaPath, "utf8"))
    : null;

  const packageGraphHash = hashString(JSON.stringify(packages));
  const routeGraphHash = hashString(
    JSON.stringify(routes.map((r) => `${r.method}:${r.path}`))
  );
  const flagManifestHash = hashString(
    JSON.stringify(flags.map((f) => `${f.flagName}=${f.defaultValue}`))
  );
  const capabilityManifestHash = hashString(
    JSON.stringify(allModules.map((m) => m.moduleKey))
  );

  return {
    packages,
    modules: allModules,
    routes: routes.slice(0, 500),
    flags,
    hashes: {
      schemaHash,
      packageGraphHash,
      routeGraphHash,
      flagManifestHash,
      capabilityManifestHash,
    },
    graphEdges: allModules.flatMap((m) =>
      m.canonicalDomainKeys.map((domainKey) => ({
        edgeType: "implements",
        fromNodeType: "Module",
        fromNodeKey: m.moduleKey,
        toNodeType: "CanonicalDomain",
        toNodeKey: domainKey,
        evidence: `${m.path} owns domain ${domainKey}`,
      }))
    ),
  };
}
