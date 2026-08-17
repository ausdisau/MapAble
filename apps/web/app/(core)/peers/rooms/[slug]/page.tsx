import Link from "next/link";
import { notFound } from "next/navigation";

import { CorePageHeader } from "@/components/core/CorePageHeader";
import { PeersThreadList } from "@/components/mapable-peers/PeersThreadList";
import { getPeersLinkHelpers } from "@/lib/community/mapable-peers/peers-request";
import { getPeersRoom, PEERS_ROOMS } from "@/lib/community/mapable-peers/rooms";
import { threadsForRoom } from "@/lib/community/mapable-peers/seed-threads";

export function generateStaticParams() {
  return PEERS_ROOMS.map((room) => ({ slug: room.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const room = getPeersRoom(slug);
  if (!room) return { title: "Room not found" };
  return {
    title: `${room.title} — MapAble PEERS`,
    description: room.description,
  };
}

export default async function PeersRoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const room = getPeersRoom(slug);
  if (!room) notFound();

  const threads = threadsForRoom(slug);
  const links = await getPeersLinkHelpers();
  const roomPath = links.room(slug);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <CorePageHeader
        eyebrow="MapAble PEERS"
        title={room.title}
        description={room.description}
      >
        <p className="text-sm text-muted-foreground">{room.purpose}</p>
      </CorePageHeader>

      <div
        className="rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-3 text-sm"
        role="note"
      >
        <strong className="text-secondary">Chronological order.</strong> Threads below are sorted by
        last activity only. No personalised ranking. Posting will open when PEERS accounts connect
        to MapAble sign-in.
      </div>

      <PeersThreadList threads={threads} roomPath={roomPath} />

      <p className="text-sm text-muted-foreground">
        <Link href={links.home} className="font-medium text-primary hover:underline">
          ← All rooms
        </Link>
        {" · "}
        <Link href="/access" className="font-medium text-primary hover:underline">
          MapAble Access
        </Link>
      </p>
    </div>
  );
}
