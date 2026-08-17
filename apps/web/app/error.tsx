"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div
        className="w-full max-w-lg rounded-xl border border-destructive/20 bg-card p-6 shadow-sm"
        role="alert"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-destructive">
          Something went wrong
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          This page could not be loaded.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Try again, or contact MapAble if the problem continues. No sensitive
          participant information is shown in this error state.
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Error reference: {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={reset}
          >
            Try again
          </button>
          <a
            href="/help"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-input px-5 text-sm font-semibold transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Visit Help Centre
          </a>
        </div>
      </div>
    </main>
  );
}
