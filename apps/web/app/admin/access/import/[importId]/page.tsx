import Link from "next/link";

import { CommitImportButton } from "@/components/access-import/CommitImportButton";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminImportDetailPage({
  params,
}: {
  params: Promise<{ importId: string }>;
}) {
  await requireAdmin();
  const { importId } = await params;
  const job = await prisma.accessImportJob.findUnique({
    where: { id: importId },
    include: {
      items: { take: 50 },
      conflicts: { take: 20 },
    },
  });

  if (!job) return <p className="p-6">Job not found</p>;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Import {importId}</h1>
      <p>
        Status: <strong>{job.status}</strong> · Source: {job.sourceType}
      </p>
      <CommitImportButton importId={importId} />
      <p className="text-sm text-muted-foreground">
        Preview only until commit — imported places start as pending moderation.
      </p>
      <Link href="/admin/access/import" className="text-sm underline">
        Back
      </Link>
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Lat</th>
            <th>Lng</th>
          </tr>
        </thead>
        <tbody>
          {job.items.map((i) => (
            <tr key={i.id} className="border-t">
              <td>{i.name}</td>
              <td>{i.status}</td>
              <td>{i.latitude ?? "—"}</td>
              <td>{i.longitude ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
