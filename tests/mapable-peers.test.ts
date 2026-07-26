import { describe, expect, it } from "vitest";

import { PEERS_PRINCIPLES } from "@/lib/community/mapable-peers/copy";
import {
  isPeerPeersHostname,
  isPeerPeersPublicPath,
  peersPath,
} from "@/lib/community/mapable-peers/peer-host";
import { getPeersRoom, PEERS_ROOMS } from "@/lib/community/mapable-peers/rooms";
import { threadsForRoom } from "@/lib/community/mapable-peers/seed-threads";

describe("MapAble PEERS", () => {
  it("defines rooms with unique slugs", () => {
    const slugs = PEERS_ROOMS.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolves room by slug", () => {
    expect(getPeersRoom("introduce-yourself")?.title).toBe("Introduce yourself");
    expect(getPeersRoom("missing")).toBeUndefined();
  });

  it("sorts threads by last activity descending only", () => {
    const threads = threadsForRoom("access-and-places");
    for (let i = 1; i < threads.length; i++) {
      const prev = new Date(threads[i - 1].lastActivityAt).getTime();
      const curr = new Date(threads[i].lastActivityAt).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });

  it("documents anti-feed principles", () => {
    expect(PEERS_PRINCIPLES.some((p) => p.id === "chronology")).toBe(true);
    expect(PEERS_PRINCIPLES.some((p) => p.id === "transparency")).toBe(true);
  });

  it("recognises peer.mapable.com.au host", () => {
    expect(isPeerPeersHostname("peer.mapable.com.au")).toBe(true);
    expect(isPeerPeersHostname("peer.mapable.com.au:443")).toBe(true);
    expect(isPeerPeersHostname("www.mapable.com.au")).toBe(false);
  });

  it("maps peers paths for main vs peer host", () => {
    expect(peersPath("", false)).toBe("/peers");
    expect(peersPath("/principles", false)).toBe("/peers/principles");
    expect(peersPath("", true)).toBe("/");
    expect(peersPath("/rooms/introduce-yourself", true)).toBe("/rooms/introduce-yourself");
  });

  it("identifies public paths on peer host", () => {
    expect(isPeerPeersPublicPath("/")).toBe(true);
    expect(isPeerPeersPublicPath("/principles")).toBe(true);
    expect(isPeerPeersPublicPath("/rooms/access-and-places")).toBe(true);
    expect(isPeerPeersPublicPath("/dashboard")).toBe(false);
  });
});
