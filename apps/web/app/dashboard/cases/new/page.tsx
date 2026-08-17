import type { CaseCategory, CasePriority } from "@prisma/client";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth/guards";
import { createCase } from "@/lib/cases/case-service";
import { caseManagementConfig } from "@/lib/config/case-management";

export const metadata = { title: "Open a case | AI Case Management" };
export const dynamic = "force-dynamic";

const CATEGORIES: CaseCategory[] = [
  "intake",
  "goal_planning",
  "service_coordination",
  "funding_review",
  "safeguarding",
  "housing",
  "health",
  "employment",
  "education",
  "legal",
  "other",
];

const PRIORITIES: CasePriority[] = ["low", "medium", "high", "urgent"];

async function handleCreate(formData: FormData) {
  "use server";
  if (!caseManagementConfig.enabled) {
    redirect("/dashboard/cases");
  }
  const user = await requirePermission("case:manage:self");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "other") as CaseCategory;
  const priority = String(formData.get("priority") ?? "medium") as CasePriority;
  if (title.length < 3) {
    redirect("/dashboard/cases/new?error=title");
  }
  const created = await createCase(
    {
      title,
      description,
      category,
      priority,
      participantId: user.primaryRole === "participant" ? user.id : undefined,
    },
    user.id,
  );
  redirect(`/dashboard/cases/${created.id}`);
}

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!caseManagementConfig.enabled) {
    redirect("/dashboard/cases");
  }
  await requirePermission("case:manage:self");
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Open a new case</h1>
        <p className="text-muted-foreground">
          Cases are private to authorised staff and the participant.
        </p>
      </header>

      {error === "title" ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          A case title is required (at least 3 characters).
        </p>
      ) : null}

      <form action={handleCreate} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Case title
          </label>
          <input
            id="title"
            name="title"
            required
            minLength={3}
            maxLength={200}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            maxLength={10_000}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="What is this case about? What is the participant context?"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="block text-sm font-medium">
              Category
            </label>
            <select
              id="category"
              name="category"
              defaultValue="other"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue="medium"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Open case
        </button>
      </form>
    </div>
  );
}
