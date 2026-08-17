import Link from "next/link";
import type { ReactNode } from "react";

export function AdminOpsShell({
  title,
  description,
  breadcrumb,
  children,
  filters,
}: {
  title: string;
  description?: string;
  breadcrumb?: { label: string; href: string }[];
  children: ReactNode;
  filters?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <a
        href="#ops-main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      {breadcrumb && breadcrumb.length > 0 ? (
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/admin" className="hover:text-foreground hover:underline">
                Admin
              </Link>
            </li>
            {breadcrumb.map((crumb) => (
              <li key={crumb.href} className="flex items-center gap-2">
                <span aria-hidden>/</span>
                <Link href={crumb.href} className="hover:text-foreground hover:underline">
                  {crumb.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <header>
        <h1 id="ops-main" className="font-heading text-2xl font-bold md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {filters ? (
        <div
          role="search"
          aria-label="Filter list"
          className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4"
        >
          {filters}
        </div>
      ) : null}
      {children}
    </div>
  );
}
