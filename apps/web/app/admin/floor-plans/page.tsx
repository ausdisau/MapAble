import Link from "next/link";

import { isIndoorFeatureEnabled } from "@/lib/access/indoor/feature-flags";

export default function FloorPlansAdminPage() {
  const authoringEnabled = isIndoorFeatureEnabled("floorPlanAuthoring");
  const reviewEnabled = isIndoorFeatureEnabled("floorPlanReviewWorkflow");

  if (!authoringEnabled && !reviewEnabled) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-black">Floor plan authoring</h1>
        <p className="mt-4 text-slate-600">
          Floor plan authoring is disabled in this environment. Enable{" "}
          <code>INDOOR_FLAG_FLOOR_PLAN_AUTHORING</code> to use the studio.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8">
      <h1 className="text-2xl font-black text-[#0C1833]">Floor plan publishing studio</h1>
      <p className="text-slate-600">
        Create, annotate, review and publish indoor floor plans. Published versions are immutable;
        edits create new draft versions.
      </p>

      <section className="rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold">Authoring workflow</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>Select a venue and create a floor draft via the API or venue management tools.</li>
          <li>Upload an approved plan asset and add alt text, features, zones and route graphs.</li>
          <li>Submit for review — a different reviewer must approve and publish.</li>
          <li>Preview the public viewer before publishing.</li>
        </ol>
        <p className="mt-4 text-sm text-slate-600">
          API: <code>POST /api/indoor/authoring/[placeId]/floor-plans</code>
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold">Moderation</h2>
        <p className="mt-2 text-sm text-slate-600">
          Community corrections and status reports are reviewed separately from publication.
        </p>
        <Link
          href="/admin/floor-plans/moderation"
          className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white"
        >
          Open moderation queue
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold">Preview</h2>
        <p className="mt-2 text-sm text-slate-600">
          Demo floor plan with full indoor platform panels:
        </p>
        <Link
          href="/accessibility-map/demo-parramatta-library/floor-plan"
          className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black"
        >
          Open Parramatta Library demo
        </Link>
      </section>
    </main>
  );
}
