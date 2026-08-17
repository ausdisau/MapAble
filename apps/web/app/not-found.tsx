import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Page not found
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          We could not find that MapAble page.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The public site has stable module pages, resources and support links.
          If you expected a pilot app route, sign in or contact MapAble.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Go home
          </Link>
          <Link
            href="/help"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-input px-5 text-sm font-semibold transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Visit Help Centre
          </Link>
        </div>
      </div>
    </main>
  );
}
