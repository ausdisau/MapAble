import Link from "next/link";

export const metadata = { title: "Offline | MapAble" };

export default function OfflinePage() {
  return (
    <main
      className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 p-6 text-center"
      role="status"
      aria-live="assertive"
    >
      <h1 className="font-heading text-2xl font-bold">You are offline</h1>
      <p className="text-muted-foreground">
        MapAble saved the app shell locally. Participant records and communication
        passports are not cached — reconnect to load your latest data.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-primary-foreground"
      >
        Try again
      </Link>
    </main>
  );
}
