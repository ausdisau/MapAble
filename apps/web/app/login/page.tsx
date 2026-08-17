import { Suspense } from "react";

import { CorePageHeader } from "@/components/core/CorePageHeader";
import { getConfiguredOAuthProviders } from "@/lib/auth/oauth-providers";

import LoginClient from "./LoginClient";

export default function LoginPage() {
  const oauthProviders = getConfiguredOAuthProviders();

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <CorePageHeader
        eyebrow="MapAble"
        title="Sign in"
        description="Access your dashboard, care bookings, transport trips, and support tools."
        centered
        className="mb-8 border-0 pb-0"
      />
      <Suspense
        fallback={
          <p className="text-center text-sm text-muted-foreground">
            Loading sign-in form…
          </p>
        }
      >
        <LoginClient oauthProviders={oauthProviders} />
      </Suspense>
    </div>
  );
}
