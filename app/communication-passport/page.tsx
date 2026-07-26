import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { getCommunicationPassport } from "@/lib/support/communication-passport/service";
import { isCommunicationPassportEnabled } from "@/lib/config/communication-workforce";

export const metadata = {
  title: "Communication Passport | MapAble",
};

export default async function CommunicationPassportPage() {
  const user = await requireAuth();
  const enabled = isCommunicationPassportEnabled();

  if (!enabled) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Communication Passport</h1>
        <p className="mt-4 text-neutral-700">
          This feature is not enabled in this environment. It is not available
          for production claims until flags and readiness gates are met.
        </p>
        <p className="mt-2">
          <Link href="/dashboard" className="underline">
            Back to dashboard
          </Link>
        </p>
      </main>
    );
  }

  const passport = await getCommunicationPassport(user.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Communication Passport</h1>
      <p className="mt-2 text-neutral-700">
        Your selected communication instructions. Workers see only what you
        authorise for a specific purpose. Silence is not consent.
      </p>
      <p className="mt-2 text-sm text-neutral-600">
        Version {passport.version} · Updated {passport.updatedAt}
      </p>
      <ol className="mt-6 list-decimal space-y-4 pl-5">
        {passport.instructions.length === 0 ? (
          <li>No instructions selected yet. Use the API or profile editor to add modes.</li>
        ) : (
          passport.instructions.map((instruction) => (
            <li key={instruction.id}>
              <p className="font-medium">{instruction.participantWording}</p>
              {instruction.required ? (
                <p className="text-sm text-neutral-600">Required for support delivery</p>
              ) : null}
            </li>
          ))
        )}
      </ol>
      <p className="mt-8 text-sm text-neutral-600">
        One question at a time mode and AAC instructions are supported. No
        compulsory smartphone, camera, or chat.
      </p>
    </main>
  );
}
