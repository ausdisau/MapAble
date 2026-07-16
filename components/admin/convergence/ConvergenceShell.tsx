import Link from "next/link";
import type { ReactNode } from "react";

const LINKS = [
  { href: "/admin/convergence", label: "Overview" },
  { href: "/admin/convergence/domains", label: "Domains" },
  { href: "/admin/convergence/pull-requests", label: "Pull requests" },
  { href: "/admin/convergence/branches", label: "Branches" },
  { href: "/admin/convergence/dependencies", label: "Dependencies" },
  { href: "/admin/convergence/collisions", label: "Collisions" },
  { href: "/admin/convergence/capabilities", label: "Capabilities" },
  { href: "/admin/convergence/merge-trains", label: "Merge trains" },
  { href: "/admin/convergence/decisions", label: "Decisions" },
] as const;

export function ConvergenceShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          ConvergenceOS · audit / advisory · no automated merges
        </p>
        <h1 className="font-heading text-2xl font-bold">{title}</h1>
        {description ? (
          <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>

      <nav
        aria-label="ConvergenceOS sections"
        className="flex flex-wrap gap-2 border-b border-border pb-3"
      >
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="min-h-11 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
