"use client";

import { useRouter } from "next/navigation";

export function CommitImportButton({ importId }: { importId: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground"
      onClick={async () => {
        await fetch(`/api/admin/access/import/${importId}/commit`, {
          method: "POST",
        });
        router.refresh();
      }}
    >
      Commit import (creates pending places)
    </button>
  );
}
