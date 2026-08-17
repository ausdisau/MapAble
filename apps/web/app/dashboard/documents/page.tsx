import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Documents | MapAble" };

export default async function DocumentsPage() {
  const user = await requireAuth();
  const docs = await prisma.document.findMany({ where: { deletedAt: null, OR: [{ participantId: user.id }, { uploadedById: user.id }] }, orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <header className="flex justify-between"><h1 className="font-heading text-2xl font-bold">Documents</h1>
        <Link href="/dashboard/documents/upload" className="min-h-11 inline-flex items-center rounded-lg bg-primary px-4 text-primary-foreground">Upload</Link>
      </header>
      <ul className="space-y-2">{docs.map(d => <li key={d.id}><Link href={`/dashboard/documents/${d.id}`} className="block rounded-lg border p-3">{d.title} — {d.category}</Link></li>)}</ul>
    </div>
  );
}
