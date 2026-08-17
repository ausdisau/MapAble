import Link from "next/link";

import { AddPlaceForm } from "@/components/access/AddPlaceForm";

export default function AddAccessPlacePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold">Suggest a place</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        <Link href="/access" className="underline">
          Back to MapAble Access
        </Link>
      </p>
      <div className="mt-6">
        <AddPlaceForm />
      </div>
    </div>
  );
}
