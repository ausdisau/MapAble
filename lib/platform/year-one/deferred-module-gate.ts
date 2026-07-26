import { notFound } from "next/navigation";

import { isYearOneDeferredPathEnabled } from "@/lib/config/year-one-scope";

/** Call from deferred module pages when Year-One flag is off. */
export function enforceYearOneModulePath(pathname: string): void {
  if (!isYearOneDeferredPathEnabled(pathname)) {
    notFound();
  }
}
