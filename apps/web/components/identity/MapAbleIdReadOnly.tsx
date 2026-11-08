import Link from "next/link";

import type { MapAbleIdReadSnapshot } from "@/lib/identity/mapableid-read-model";

function IdentityPanel({
  title,
  id,
  children,
}: {
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={id + "-heading"}
      className="space-y-3 rounded-xl border border-slate-300 bg-white p-5"
    >
      <h2 id={id + "-heading"} className="text-xl font-bold text-[#0C1833]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center rounded-lg font-semibold text-[#005B7F] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/50"
    >
      {children}
    </Link>
  );
}

export function MapAbleIdReadOnly({ snapshot }: { snapshot: MapAbleIdReadSnapshot }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#005B7F]">
          MapAbleID · Your account
        </p>
        <h1 className="font-heading text-3xl font-bold text-[#0C1833]">
          Your identity, your choice
        </h1>
        <p className="max-w-3xl text-slate-700">
          Review how this MapAble account is represented. This is a read-only
          account summary. It cannot change your sign-in methods, permissions
          or connected services.
        </p>
        <p className="rounded-lg border border-amber-500 bg-amber-50 p-4 text-sm font-medium text-[#0C1833]">
          Read-only development preview. AD.iD federation, MFA assurance and
          cross-app access have not been independently verified.
        </p>
      </header>

      <nav aria-label="MapAbleID page sections">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
          <li><a className="underline underline-offset-4" href="#identity-account">My identity</a></li>
          <li><a className="underline underline-offset-4" href="#identity-security">Security</a></li>
          <li><a className="underline underline-offset-4" href="#identity-sharing">Sharing</a></li>
          <li><a className="underline underline-offset-4" href="#identity-services">Services</a></li>
          <li><a className="underline underline-offset-4" href="#identity-recovery">Recovery</a></li>
        </ul>
      </nav>

      <div className="grid gap-5 lg:grid-cols-2">
        <IdentityPanel id="identity-account" title="My identity">
          <dl className="space-y-2 text-sm">
            <div><dt className="font-semibold">Name</dt><dd>{snapshot.account.displayName}</dd></div>
            <div><dt className="font-semibold">Email</dt><dd className="break-all">{snapshot.account.email}</dd></div>
            <div><dt className="font-semibold">Role in MapAble</dt><dd>{snapshot.account.role}</dd></div>
          </dl>
          <ActionLink href="/dashboard/profile">Review my profile</ActionLink>
        </IdentityPanel>

        <IdentityPanel id="identity-security" title="Sign-in and security">
          <p className="text-sm text-slate-700">
            Current session: signed in through {snapshot.session.authenticationService}.
          </p>
          <p className="text-sm text-slate-700">
            Stored passkey credentials: {snapshot.passkeys.storedCredentialCount}.
          </p>
          <p className="text-sm text-slate-700">
            Original sign-in method, MFA and recent passkey verification: not
            confirmed by this view. A stored credential is not proof of a
            successful recent passkey login.
          </p>
          <ActionLink href="/dashboard/profile">Manage existing passkeys in profile</ActionLink>
        </IdentityPanel>

        <IdentityPanel id="identity-sharing" title="Privacy and sharing">
          <p className="text-sm text-slate-700">
            Active sharing consents with a recorded recipient:{" "}
            <strong>{snapshot.sharing.activeRecipientConsentCount}</strong>.
          </p>
          <p className="text-sm text-slate-700">
            This is not a count of verified delegates or proof of their legal
            authority. You can review and revoke grants in the consent centre.
          </p>
          <ActionLink href="/dashboard/consent">Review sharing consents</ActionLink>
        </IdentityPanel>

        <IdentityPanel id="identity-services" title="Connected services">
          <ul className="space-y-2 text-sm">
            <li><strong>MapAble:</strong> Current authenticated workspace</li>
            <li><strong>AD.iD federation:</strong> Not independently verified</li>
          </ul>
          <p className="text-sm text-slate-700">
            Access to AccessiBooks, ProviderCloud or other services is not
            inferred from this MapAble session or from matching email addresses.
          </p>
        </IdentityPanel>

        <IdentityPanel id="identity-recovery" title="Account recovery and assistance">
          <p className="text-sm text-slate-700">
            An independent recovery method has not been confirmed in this view.
            You can request assistance without giving a supporter your password
            or surrendering control of your account.
          </p>
          <ActionLink href={snapshot.recovery.humanSupportRoute}>Get account assistance</ActionLink>
        </IdentityPanel>

        <IdentityPanel id="identity-about" title="What this information means">
          <p className="text-sm text-slate-700">{snapshot.explanation}</p>
          <p className="text-sm text-slate-700">
            No action on this page sends your information to another service
            or changes a consent or security setting.
          </p>
        </IdentityPanel>
      </div>
    </div>
  );
}
