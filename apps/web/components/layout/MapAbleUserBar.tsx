"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { MapAbleSignOutButton } from "@/components/layout/MapAbleSignOutButton";
import { RoleBadge } from "@/components/ui/role-badge";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  isAuthFormPath,
  safeAuthCallbackFromLocation,
} from "@/lib/auth/auth-flow";
import { defaultDashboardPath } from "@/lib/auth/roles";
import {
  asUserRole,
  initialsFromDisplayName,
  resolveAccountSessionPresentation,
} from "@/lib/auth/session-presentation";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import type { UserRole } from "@/types/mapable";

const ACCOUNT_DIALOG_MARGIN_PX = 12;
const ACCOUNT_DIALOG_MAX_WIDTH_PX = 24 * 16;
const ACCOUNT_DIALOG_GAP_PX = 8;

export function accountMenuDialogStyle(
  triggerRect: Pick<DOMRect, "bottom" | "right"> | null,
  viewport: { width: number; height: number },
): CSSProperties {
  const width = Math.min(
    Math.max(viewport.width - ACCOUNT_DIALOG_MARGIN_PX * 2, 0),
    ACCOUNT_DIALOG_MAX_WIDTH_PX,
  );
  const preferredLeft = triggerRect
    ? triggerRect.right - width
    : viewport.width - ACCOUNT_DIALOG_MARGIN_PX - width;
  const maxLeft = Math.max(
    ACCOUNT_DIALOG_MARGIN_PX,
    viewport.width - ACCOUNT_DIALOG_MARGIN_PX - width,
  );
  const left = Math.min(
    Math.max(preferredLeft, ACCOUNT_DIALOG_MARGIN_PX),
    maxLeft,
  );
  const top = triggerRect
    ? triggerRect.bottom + ACCOUNT_DIALOG_GAP_PX
    : ACCOUNT_DIALOG_MARGIN_PX;

  return {
    position: "fixed",
    top,
    left,
    width,
    maxHeight: "min(80vh, 40rem)",
  };
}

function PersonSilhouette() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 text-slate-500"
    >
      <path
        fill="currentColor"
        d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12Zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2c0 .7.5 1.2 1.2 1.2h16.8c.7 0 1.2-.5 1.2-1.2v-1.2c0-3.2-6.4-4.8-9.6-4.8Z"
      />
    </svg>
  );
}

function AccountLink({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: ReactNode;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-black text-[#0C1833] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
    >
      {children}
    </Link>
  );
}

export function MapAbleUserBar({
  userName,
  role,
  compact = false,
}: {
  userName?: string;
  role?: UserRole;
  /** When true, also show Sign in / Get started text actions beside the menu (marketing desktop). */
  compact?: boolean;
}) {
  const { status, data } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [dialogStyle, setDialogStyle] = useState<CSSProperties>();
  const [sessionProbeFailed, setSessionProbeFailed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const dialogId = useId();

  const sessionUser = data?.user;
  const resolvedName = sessionUser?.name?.trim() || userName?.trim() || "";
  const resolvedRole = asUserRole(sessionUser?.role) ?? role;
  const resolvedEmail = sessionUser?.email ?? null;
  const resolvedImage = sessionUser?.image ?? null;
  const mfaVerified = sessionUser?.mfaVerified === true;

  const presentation = resolveAccountSessionPresentation({
    status,
    hasSessionUser: Boolean(sessionUser),
    serverHintName: userName,
    sessionProbeFailed,
  });

  const hideNestedAuthCtas = isAuthFormPath(pathname);
  const callbackUrl = safeAuthCallbackFromLocation(
    pathname,
    typeof window === "undefined" ? "" : window.location.search,
  );
  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const registerHref = `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const workspaceHref = resolvedRole
    ? defaultDashboardPath(resolvedRole)
    : "/dashboard";

  const isLoading = presentation === "loading";
  const isAuthenticated = presentation === "signed_in";
  const isUnavailable = presentation === "unavailable";

  const triggerLabel = isLoading
    ? "Account menu, checking sign-in"
    : isUnavailable
      ? "Account menu, sign-in status unavailable"
      : isAuthenticated
        ? `Account menu, signed in as ${resolvedName || "you"}`
        : "Account menu, not signed in";

  const dialogTitle = isAuthenticated
    ? "Your account"
    : isUnavailable
      ? "Sign-in status unavailable"
      : "Sign in";

  const ringClass = isAuthenticated
    ? "border-[#005B7F]"
    : isUnavailable
      ? "border-amber-500"
      : "border-slate-300";

  useFocusTrap(panelRef, open);

  useEffect(() => {
    let cancelled = false;

    async function probeSession() {
      if (status === "authenticated") {
        if (!cancelled) setSessionProbeFailed(false);
        return;
      }
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (cancelled) return;
        // 5xx / network-ish failures mean we cannot honestly claim signed-out.
        setSessionProbeFailed(!response.ok && response.status >= 500);
      } catch {
        if (!cancelled) setSessionProbeFailed(true);
      }
    }

    void probeSession();
    return () => {
      cancelled = true;
    };
  }, [status]);

  useLayoutEffect(() => {
    if (!open) return;

    function updatePosition() {
      setDialogStyle(
        accountMenuDialogStyle(
          triggerRef.current?.getBoundingClientRect() ?? null,
          { width: window.innerWidth, height: window.innerHeight },
        ),
      );
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    updatePosition();
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  const dialog =
    open && typeof document !== "undefined"
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[80] cursor-default bg-black/20"
              aria-label="Close account menu"
              onClick={closeMenu}
            />
            <div
              ref={panelRef}
              id={dialogId}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              data-testid="mapable-user-bar-dialog"
              style={
                dialogStyle ?? {
                  position: "fixed",
                  top: ACCOUNT_DIALOG_MARGIN_PX,
                  right: ACCOUNT_DIALOG_MARGIN_PX,
                  width: "min(92vw, 24rem)",
                  maxHeight: "min(80vh, 40rem)",
                }
              }
              className="z-[90] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-300/40"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <h2
                  id={titleId}
                  className="text-base font-black text-[#0C1833]"
                >
                  {dialogTitle}
                </h2>
                <button
                  type="button"
                  className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-2 text-sm font-bold text-slate-600 hover:bg-slate-50 ${mapableCareFocusRing}`}
                  onClick={closeMenu}
                >
                  Close
                </button>
              </div>

              {isAuthenticated ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-black text-[#0C1833]">
                    {resolvedName || "Signed in"}
                  </p>
                  {resolvedEmail ? (
                    <p className="text-sm text-slate-600">{resolvedEmail}</p>
                  ) : null}
                  {resolvedRole ? <RoleBadge role={resolvedRole} /> : null}
                  {sessionUser ? (
                    <p className="text-sm text-slate-600">
                      {mfaVerified
                        ? "Signed in with extra verification"
                        : "Signed in without extra verification"}
                    </p>
                  ) : null}
                  <p className="text-xs leading-5 text-slate-500">
                    This menu shows your sign-in state. It does not grant access
                    by itself — protected pages still check your account on the
                    server.
                  </p>
                  <Link
                    href={workspaceHref}
                    onClick={closeMenu}
                    className={`mt-1 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white hover:bg-[#004766] ${mapableCareFocusRing}`}
                  >
                    My MapAble
                  </Link>
                  <nav
                    aria-label="Account"
                    className="mt-1 flex flex-col gap-1 border-t border-slate-100 pt-2"
                  >
                    <AccountLink
                      href="/dashboard/profile"
                      onNavigate={closeMenu}
                    >
                      Profile
                    </AccountLink>
                    <AccountLink
                      href="/dashboard/accessibility"
                      onNavigate={closeMenu}
                    >
                      Accessibility preferences
                    </AccountLink>
                    <AccountLink
                      href="/dashboard/consent"
                      onNavigate={closeMenu}
                    >
                      Consent
                    </AccountLink>
                    <AccountLink href="/ask" onNavigate={closeMenu}>
                      Support and guidance
                    </AccountLink>
                    <AccountLink href="/" onNavigate={closeMenu}>
                      Explore MapAble
                    </AccountLink>
                  </nav>
                  <div className="mt-2 border-t border-slate-100 pt-3">
                    <MapAbleSignOutButton />
                  </div>
                </div>
              ) : isUnavailable ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm leading-6 text-slate-700" role="status">
                    We could not confirm whether you are signed in. Check your
                    connection and try again. This is not a confirmed sign-out.
                  </p>
                  <button
                    type="button"
                    className={`inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-[#0C1833] px-4 text-sm font-black hover:bg-slate-50 ${mapableCareFocusRing}`}
                    onClick={() => {
                      setSessionProbeFailed(false);
                      window.location.reload();
                    }}
                  >
                    Retry
                  </button>
                  {!hideNestedAuthCtas ? (
                    <Link
                      href={loginHref}
                      onClick={closeMenu}
                      className={`inline-flex min-h-11 items-center justify-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white hover:bg-[#004766] ${mapableCareFocusRing}`}
                    >
                      Go to sign in
                    </Link>
                  ) : null}
                </div>
              ) : hideNestedAuthCtas ? (
                <p className="text-sm leading-6 text-slate-600">
                  Use the form on this page to sign in or create an account.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm leading-6 text-slate-600">
                    Sign in to open My MapAble and return to what you were doing.
                  </p>
                  <Link
                    href={loginHref}
                    onClick={closeMenu}
                    className={`inline-flex min-h-11 items-center justify-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white hover:bg-[#004766] ${mapableCareFocusRing}`}
                  >
                    Sign in
                  </Link>
                  <Link
                    href={registerHref}
                    onClick={closeMenu}
                    className={`inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-[#0C1833] px-4 text-sm font-black hover:bg-slate-50 ${mapableCareFocusRing}`}
                  >
                    Get started
                  </Link>
                </div>
              )}
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div
      className={compact ? "flex flex-col gap-2" : "flex items-center gap-2"}
      data-testid="mapable-user-bar"
    >
      {!compact && presentation === "signed_out" && !hideNestedAuthCtas ? (
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href={loginHref}
            className={`inline-flex min-h-11 items-center rounded-xl border-2 border-[#0C1833] px-5 py-3 text-sm font-black transition hover:bg-slate-50 ${mapableCareFocusRing}`}
          >
            Sign in
          </Link>
          <Link
            href={registerHref}
            className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#004766] ${mapableCareFocusRing}`}
          >
            Get started
          </Link>
        </div>
      ) : null}

      {!compact && isAuthenticated ? (
        <Link
          href={workspaceHref}
          className={`hidden min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#004766] md:inline-flex ${mapableCareFocusRing}`}
        >
          My MapAble
        </Link>
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        data-testid="mapable-user-bar-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        aria-busy={isLoading || undefined}
        aria-label={triggerLabel}
        disabled={isLoading}
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex h-11 w-11 min-h-11 min-w-11 items-center justify-center overflow-hidden rounded-full border-2 bg-white ${ringClass} transition hover:bg-slate-50 disabled:opacity-70 ${mapableCareFocusRing}`}
      >
        {isLoading ? (
          <span
            className="h-6 w-6 animate-pulse rounded-full bg-slate-200"
            aria-hidden="true"
          />
        ) : isAuthenticated && resolvedImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- session avatar URL is remote and dynamic
          <img
            src={resolvedImage}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : isAuthenticated && resolvedName ? (
          <span className="text-sm font-black text-[#005B7F]" aria-hidden="true">
            {initialsFromDisplayName(resolvedName)}
          </span>
        ) : (
          <PersonSilhouette />
        )}
      </button>

      {compact && presentation === "signed_out" && !hideNestedAuthCtas ? (
        <div className="flex flex-col gap-2">
          <Link
            href={loginHref}
            className={`inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-[#0C1833] px-4 py-2 text-sm font-black transition hover:bg-slate-50 ${mapableCareFocusRing}`}
          >
            Sign in
          </Link>
          <Link
            href={registerHref}
            className={`inline-flex min-h-11 items-center justify-center rounded-xl bg-[#005B7F] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#004766] ${mapableCareFocusRing}`}
          >
            Get started
          </Link>
        </div>
      ) : null}

      {compact && isAuthenticated ? (
        <Link
          href={workspaceHref}
          className={`inline-flex min-h-11 items-center justify-center rounded-xl bg-[#005B7F] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#004766] ${mapableCareFocusRing}`}
        >
          My MapAble
        </Link>
      ) : null}

      {dialog}
    </div>
  );
}
