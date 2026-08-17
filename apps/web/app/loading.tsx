export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm"
        role="status"
        aria-live="polite"
      >
        <div
          className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
          aria-hidden="true"
        />
        <h1 className="text-xl font-semibold text-foreground">
          Loading MapAble
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please wait while this page is prepared.
        </p>
      </div>
    </main>
  );
}
