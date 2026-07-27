import type { CommunicationPassportWithRelations } from "@/lib/communication/communication-passport-service";

export function CommunicationPassportPanel({
  passport,
}: {
  passport: CommunicationPassportWithRelations | null;
}) {
  if (!passport) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-sm" role="status">
        No communication passport yet. Create one to share how you communicate.
      </p>
    );
  }

  return (
    <section aria-labelledby="passport-heading" className="space-y-4 rounded-xl border p-4">
      <header className="space-y-1">
        <h2 id="passport-heading" className="font-heading text-lg font-semibold">
          {passport.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          Status: {passport.status}. Speech difficulty is never treated as reduced capacity.
        </p>
      </header>

      {passport.aboutMe ? (
        <div>
          <h3 className="font-medium">About me</h3>
          <p className="text-sm">{passport.aboutMe}</p>
        </div>
      ) : null}

      {passport.howICommunicate ? (
        <div>
          <h3 className="font-medium">How I communicate</h3>
          <p className="text-sm">{passport.howICommunicate}</p>
        </div>
      ) : null}

      {passport.pleaseDo ? (
        <div>
          <h3 className="font-medium">Please do</h3>
          <p className="text-sm">{passport.pleaseDo}</p>
        </div>
      ) : null}

      {passport.pleaseDont ? (
        <div>
          <h3 className="font-medium">Please don&apos;t</h3>
          <p className="text-sm">{passport.pleaseDont}</p>
        </div>
      ) : null}
    </section>
  );
}
