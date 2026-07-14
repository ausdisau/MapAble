import Link from "next/link";
import { redirect } from "next/navigation";

import { SessionDeviceLists } from "@/components/privacy/SessionDeviceLists";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  listActiveSessions,
  listLoginAuditHistory,
  listMfaEnrolments,
  listTrustedDevices,
} from "@/lib/identity/identity-security-service";

export const metadata = { title: "Security | MapAble Account" };

export default async function AccountSecurityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [mfaEnrolments, trustedDevices, sessions, loginHistory] =
    await Promise.all([
      listMfaEnrolments(user.id),
      listTrustedDevices(user.id),
      listActiveSessions(user.id),
      listLoginAuditHistory(user.id),
    ]);

  const serializedSessions = sessions.map(
    (session: (typeof sessions)[number]) => ({
      ...session,
      createdAt: session.createdAt.toISOString(),
      lastSeenAt: session.lastSeenAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
    }),
  );

  const serializedDevices = trustedDevices.map(
    (device: (typeof trustedDevices)[number]) => ({
      ...device,
      lastSeenAt: device.lastSeenAt.toISOString(),
      createdAt: device.createdAt.toISOString(),
    }),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4">
      <header>
        <h1 className="font-heading text-2xl font-bold">Account security</h1>
        <p className="mt-2 text-muted-foreground">
          Review how you sign in, which devices are trusted, and recent account
          activity. You stay in control — revoke access at any time.
        </p>
        <Link
          href="/dashboard/profile"
          className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
        >
          Manage passkeys on your profile →
        </Link>
      </header>

      <section aria-labelledby="mfa-heading">
        <h2 id="mfa-heading" className="text-lg font-semibold">
          Multi-factor authentication
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Extra verification methods linked to your account.
        </p>
        {mfaEnrolments.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No MFA methods enrolled. Add a passkey from your{" "}
            <Link
              href="/dashboard/profile"
              className="text-primary hover:underline"
            >
              profile page
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border">
            {mfaEnrolments.map((enrolment: (typeof mfaEnrolments)[number]) => (
              <li key={enrolment.id} className="p-4">
                <p className="font-medium">
                  {enrolment.method === "passkey"
                    ? "Passkey"
                    : enrolment.method === "sms_twilio"
                      ? "SMS verification"
                      : enrolment.method}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: {enrolment.status}
                  {enrolment.enrolledAt
                    ? ` · Enrolled ${enrolment.enrolledAt.toLocaleDateString("en-AU")}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SessionDeviceLists
        sessions={serializedSessions}
        devices={serializedDevices}
      />

      <section aria-labelledby="login-history-heading">
        <h2 id="login-history-heading" className="text-lg font-semibold">
          Login history
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Recent sign-in and security events on your account.
        </p>
        {loginHistory.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No login events recorded yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border">
            {loginHistory.map((event: (typeof loginHistory)[number]) => (
              <li key={event.id} className="p-4 text-sm">
                <p className="font-medium">
                  {event.eventType.replace(/_/g, " ")}
                </p>
                {event.method ? (
                  <p className="text-muted-foreground">
                    Method: {event.method}
                  </p>
                ) : null}
                <time
                  dateTime={event.createdAt.toISOString()}
                  className="text-xs text-muted-foreground"
                >
                  {event.createdAt.toLocaleString("en-AU")}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
