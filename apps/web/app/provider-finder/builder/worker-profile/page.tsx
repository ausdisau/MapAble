import type { Metadata } from "next";
import { notFound } from "next/navigation";

import WorkerRelationalFitClient from "./WorkerRelationalFitClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Optional workstyle settings | MapAble Care",
  robots: { index: false, follow: false },
};

export default function WorkerRelationalFitPage() {
  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.MAPABLE_SUPPORT_BUILDER_ENABLED !== "true" ||
    process.env.MAPABLE_RELATIONAL_FIT_ENABLED !== "true"
  ) notFound();
  return <WorkerRelationalFitClient />;
}
