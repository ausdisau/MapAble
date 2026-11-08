"use client";

import Link from "next/link";
import { useState } from "react";

import type { MapAbleIdReadSnapshot } from "@/lib/identity/mapableid-read-model";

type SectionId =
  | "overview"
  | "security"
  | "delegates"
  | "services"
  | "privacy"
  | "recovery";

const SECTIONS: ReadonlyArray<{
  id: SectionId;
  label: string;
  description: string;
}> = [
  { id: "overview", label: "My Identity", description: "Your account summary" },
  { id: "security", label: "Sign-in & Security", description: "Your existing sign-in options" },
  { id: "delegates", label: "People I Trust", description: "Assistance stays under your control" },
  { id: "services", label: "Connected Services", description: "Separate access for each service" },
  { id: "privacy", label: "Privacy & Consent", description: "See and review sharing" },
  { id: "recovery", label: "Account Recovery", description: "Get help without giving up control" },
];

function PageLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center rounded-lg font-semibold text-[#005B7F] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ED9F3D]"
    >
      {children}
    </Link>
  );
}

function Panel({
  heading,
  id,
  children,
}: {
  heading: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="space-y-4 rounded-2xl border border-slate-300 bg-white p-4 sm:p-6"
    >
      <h2 id={id} className="text-2xl font-bold text-[#0C1833]">
        {heading}
      </h2>
      {children}
    </section>
  );
}

/**
 * Based on the six-area interaction model from merged legacy PR #676, but
 * consumes ONLY canonical server-scoped MapAbleID v0.3 metadata.
 * It does not perform auth, delegation, consent, or federation mutations.
 *
 * The dashboard shell already supplies a <main> landmark and a skip link;
 * this component intentionally does not create a second one.
 */
export function MapAbleIdReadOnly({
  snapshot,
}: {
  snapshot: MapAbleIdReadSnapshot;
}) {
  const [active, setActive] = useState<SectionId>("overview");
  const [largerText, setLargerText] = useState(false);
  const [simplerLanguage, setSimplerLanguage] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  function move(section: SectionId) {
    setActive(section);
    const label = SECTIONS.find((entry) => entry.id === section)?.label;
    setAnnouncement((label ?? "Account section") + " opened. No account settings changed.");
  }

  return (
    <div
      style={{ fontSize: largerText ? "1.2rem" : "1rem" }}
      className="mx-auto max-w-6xl space-y-5 text-[#0C1833]"
    >
      <header className="space-y-3">
        <p className="font-bold uppercase tracking-widest text-[#005B7F]">
          MapAbleID · Australian Disability Ltd
        </p>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">
          Your life. Your identity.
        </h1>
        <p className="max-w-3xl leading-relaxed text-slate-700">
          {simplerLanguage
            ? "You can see your account details here. No changes are made on this page."
            : "Review your MapAble identity, security, trusted assistance and sharing choices without changing your account settings."}
        </p>
        <p className="rounded-xl border-2 border-[#BF8A22] bg-[#FFF4D8] p-4 font-medium text-[#352A16]">
          Read-only development preview. Your original sign-in method, recent
          MFA, YubiKey hardware and AD.iD federation have not been independently
          verified by this screen.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(13rem,16rem)_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl bg-[#0C1833] p-4 text-white">
          <div className="mb-4 rounded-xl border border-white/30 p-3">
            <p className="text-xl font-bold">MapAbleID</p>
            <p>Identity without barriers</p>
          </div>
          <nav aria-label="MapAbleID sections">
            <ul className="grid gap-2">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <button
                    type="button"
                    aria-pressed={active === section.id}
                    onClick={() => move(section.id)}
                    className={
                      "min-h-12 w-full rounded-xl border px-3 py-3 text-left " +
                      "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ED9F3D] " +
                      (active === section.id
                        ? "border-[#ED9F3D] bg-[#214A67] text-white"
                        : "border-transparent text-white hover:border-white/60 hover:bg-[#23425A]")
                    }
                  >
                    <span className="block font-bold">{section.label}</span>
                    <span className="block opacity-90">{section.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <p className="mt-5 border-t border-white/30 pt-4">
            You decide who can help you. Assistance does not give anyone
            automatic control of your account.
          </p>
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-300 bg-white p-4">
            <p className="mr-auto font-semibold">Current section: {SECTIONS.find((s) => s.id === active)?.label}</p>
            <button
              type="button"
              aria-pressed={largerText}
              onClick={() => setLargerText((value) => !value)}
              className="min-h-11 rounded-lg border border-[#005B7F] px-4 py-2 font-semibold text-[#005B7F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ED9F3D]"
            >
              {largerText ? "Standard text" : "Larger text"}
            </button>
            <label className="flex min-h-11 items-center gap-2 font-medium">
              <input
                type="checkbox"
                checked={simplerLanguage}
                onChange={(event) => setSimplerLanguage(event.target.checked)}
                className="h-5 w-5 accent-[#005B7F] focus-visible:outline-4 focus-visible:outline-[#ED9F3D]"
              />
              Simpler explanations
            </label>
          </div>
          <p role="status" aria-live="polite" className="sr-only">
            {announcement}
          </p>

          {active === "overview" ? (
            <Panel id="mapableid-overview-title" heading="My identity">
              <div className="flex flex-wrap items-center gap-4 rounded-xl bg-[#EAF2F7] p-4">
                <span
                  aria-hidden="true"
                  className="grid h-14 w-14 place-items-center rounded-2xl bg-[#005B7F] text-2xl font-bold text-white"
                >
                  {snapshot.account.displayName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="font-bold">{snapshot.account.displayName}</p>
                  <p className="break-all">{snapshot.account.email}</p>
                  <p>Role: {snapshot.account.role}</p>
                </div>
              </div>
              <p className="text-slate-700">
                {simplerLanguage
                  ? "You are signed in to MapAble. Other connected accounts have not been checked."
                  : "This summary comes from your existing MapAble server-verified session. It does not establish separate AD.iD federation or access to other applications."}
              </p>
              <div className="flex flex-wrap gap-4">
                <PageLink href="/dashboard/profile">Review my existing profile</PageLink>
                <PageLink href="/dashboard/accessibility">Accessibility preferences</PageLink>
              </div>
            </Panel>
          ) : null}

          {active === "security" ? (
            <Panel id="mapableid-security-title" heading="Sign-in and security">
              <p>Current login authority: <strong>{snapshot.session.authenticationService}</strong>.</p>
              <p>Stored MapAble passkey credentials: <strong>{snapshot.passkeys.storedCredentialCount}</strong>.</p>
              <p className="text-slate-700">
                This number does not verify whether a YubiKey is registered,
                whether a passkey was used to sign in recently, or whether MFA
                was completed for this session.
              </p>
              <ul className="grid gap-3">
                {snapshot.adapters.map((adapter) => (
                  <li key={adapter.id} className="rounded-xl border border-slate-300 p-4">
                    <p className="font-bold">{adapter.label}</p>
                    <p>Status: {adapter.state.replaceAll("_", " ")}</p>
                    <p className="text-slate-700">{adapter.reason}</p>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-4">
                <PageLink href="/dashboard/profile">Manage existing MapAble passkeys</PageLink>
                <PageLink href="/account/security">Review account security</PageLink>
              </div>
            </Panel>
          ) : null}

          {active === "delegates" ? (
            <Panel id="mapableid-delegates-title" heading="People I trust">
              <p>
                {simplerLanguage
                  ? "People who help you do not automatically get access to your account."
                  : "Supported decision-making and account delegation are different from identity verification. A supporter needs specific, revocable permissions and must not impersonate you."}
              </p>
              <p>
                Active recipient-directed sharing consents in MapAble:{" "}
                <strong>{snapshot.sharing.activeRecipientConsentCount}</strong>.
              </p>
              <p className="text-slate-700">
                This is not the number of verified delegates. Legal authority,
                individual permissions and current delegate status have
                <strong> not been determined</strong> by this summary.
              </p>
              <div className="flex flex-wrap gap-4">
                <PageLink href="/participant/delegates">Review delegated access</PageLink>
                <PageLink href="/dashboard/consent">Review sharing consents</PageLink>
              </div>
            </Panel>
          ) : null}

          {active === "services" ? (
            <Panel id="mapableid-services-title" heading="Connected services">
              <p className="text-slate-700">
                A signed-in MapAble account does not automatically grant
                access to ProviderCloud, AccessiBooks, CripSquare or AD.iD.
                Each future service must verify its own permissions.
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {snapshot.services.map((service) => (
                  <li key={service.id} className="rounded-xl border border-slate-300 bg-[#F7FAFC] p-4">
                    <p className="font-bold">{service.label}</p>
                    <p>
                      {service.state === "current_workspace"
                        ? "Current authenticated MapAble workspace"
                        : "Connection not independently verified"}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="text-slate-700">
                No service connection or permission can be created from this page.
              </p>
            </Panel>
          ) : null}

          {active === "privacy" ? (
            <Panel id="mapableid-privacy-title" heading="Privacy and consent">
              <p>
                Active consent records with a specified user or organisation
                recipient: <strong>{snapshot.sharing.activeRecipientConsentCount}</strong>.
              </p>
              <p className="text-slate-700">
                Consent to share information for one purpose is not consent to
                all purposes. You can review or withdraw existing grants using
                the established MapAble consent centre.
              </p>
              <div className="flex flex-wrap gap-4">
                <PageLink href="/dashboard/consent">Open consent centre</PageLink>
                <PageLink href="/participant/privacy">Review privacy controls</PageLink>
              </div>
              <p className="text-slate-700">
                MapAbleID has not changed any grants or sent information to
                another service.
              </p>
            </Panel>
          ) : null}

          {active === "recovery" ? (
            <Panel id="mapableid-recovery-title" heading="Account recovery">
              <p>
                {simplerLanguage
                  ? "If you cannot sign in, you can ask for help without sharing your password."
                  : "Recovery should preserve your own decision-making and communication methods, including AAC and independent human support."}
              </p>
              <p className="text-slate-700">
                This view has <strong>not verified</strong> your configured
                recovery methods or confirmed successful recovery for a lost
                device or security key.
              </p>
              <div className="flex flex-wrap gap-4">
                <PageLink href="/forgot-password">Existing password reset</PageLink>
                <PageLink href={snapshot.recovery.humanSupportRoute}>
                  Request independent account assistance
                </PageLink>
              </div>
              <p className="text-slate-700">
                No supporter or family member is automatically authorised
                to take control of your account.
              </p>
            </Panel>
          ) : null}

          <footer className="rounded-xl border border-slate-300 bg-white p-4 text-slate-700">
            <p>{snapshot.explanation}</p>
            <p className="mt-2 font-semibold">
              Read-only: no security methods, permissions, data sharing or
              identity providers were changed.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
