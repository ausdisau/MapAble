#!/usr/bin/env npx tsx
/**
 * Obtain NDIS provider finder list-providers.json for local Prisma seeding.
 *
 * Order: HTTP download → rsync remote (NDIS_LIST_PROVIDERS_RSYNC_SOURCE) →
 * rsync bundled public/data/provider-outlets.json into data/ndis/.
 */
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { promisify } from "node:util";

import {
  NDIS_LIST_PROVIDERS_LOCAL_PATH,
  NDIS_LIST_PROVIDERS_URL,
  NDIS_LIST_PROVIDERS_URL_WWW,
  PROVIDER_OUTLETS_PUBLIC_PATH,
} from "@/lib/ndis/list-providers-source";

const execFileAsync = promisify(execFile);

const USER_AGENT =
  "Mozilla/5.0 (compatible; MapAble/1.0; +https://github.com/ausdisau/mapableau-new)";

async function tryFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json, text/plain, */*",
      Referer: "https://www.ndis.gov.au/participants/working-providers/finding-providers/provider-finder",
    },
    redirect: "follow",
  });
}

async function rsyncFrom(
  source: string,
  dest: string,
): Promise<void> {
  await mkdir(dirname(dest), { recursive: true });
  await execFileAsync("rsync", ["-a", "--info=stats2", source, dest], {
    maxBuffer: 10 * 1024 * 1024,
  });
}

async function main(): Promise<void> {
  const urls = [NDIS_LIST_PROVIDERS_URL_WWW, NDIS_LIST_PROVIDERS_URL];
  let body: string | null = null;
  let usedUrl: string | null = null;

  for (const url of urls) {
    const res = await tryFetch(url);
    if (res.ok) {
      body = await res.text();
      usedUrl = url;
      break;
    }
    console.warn(`GET ${url} → ${res.status} ${res.statusText}`);
  }

  if (body && usedUrl) {
    JSON.parse(body);
    await mkdir(dirname(NDIS_LIST_PROVIDERS_LOCAL_PATH), { recursive: true });
    await writeFile(NDIS_LIST_PROVIDERS_LOCAL_PATH, body, "utf8");
    console.log(`Saved ${NDIS_LIST_PROVIDERS_LOCAL_PATH} from ${usedUrl}`);
    return;
  }

  const remote = process.env.NDIS_LIST_PROVIDERS_RSYNC_SOURCE?.trim();
  if (remote) {
    try {
      await rsyncFrom(remote, NDIS_LIST_PROVIDERS_LOCAL_PATH);
      JSON.parse(await readFile(NDIS_LIST_PROVIDERS_LOCAL_PATH, "utf8"));
      console.log(`Rsynced ${NDIS_LIST_PROVIDERS_LOCAL_PATH} from ${remote}`);
      return;
    } catch (e) {
      console.warn("Remote rsync failed:", e instanceof Error ? e.message : e);
    }
  }

  try {
    await rsyncFrom(
      PROVIDER_OUTLETS_PUBLIC_PATH,
      NDIS_LIST_PROVIDERS_LOCAL_PATH,
    );
    JSON.parse(await readFile(NDIS_LIST_PROVIDERS_LOCAL_PATH, "utf8"));
    console.log(
      `Rsynced bundled export → ${NDIS_LIST_PROVIDERS_LOCAL_PATH} (same format as list-providers.json)`,
    );
    return;
  } catch (e) {
    console.error("Bundled rsync failed:", e instanceof Error ? e.message : e);
  }

  console.error(
    "Could not obtain list-providers.json.\n" +
      "  Set NDIS_LIST_PROVIDERS_RSYNC_SOURCE=user@host:/path/list-providers.json\n" +
      "  Or ensure public/data/provider-outlets.json exists, then re-run.",
  );
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
