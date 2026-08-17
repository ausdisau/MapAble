import { Suspense } from "react";

export default function WorkerServiceLogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<p className="text-sm">Loading…</p>}>{children}</Suspense>;
}
