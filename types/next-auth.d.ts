import "next-auth";
import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    /** MapAble primary role — stored on JWT as `role`. */
    role?: string;
    /** True when this sign-in completed MFA or passkey. */
    mfaVerified?: boolean;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role?: string;
      mfaVerified?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: string;
    mfaVerified?: boolean;
    mfaVerifiedAt?: number;
  }
}
