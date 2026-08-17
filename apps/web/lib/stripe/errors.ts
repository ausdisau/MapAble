export class StripeNotConfiguredError extends Error {
  constructor() {
    super("STRIPE_NOT_CONFIGURED");
    this.name = "StripeNotConfiguredError";
  }
}

export function isStripeNotConfiguredError(err: unknown): boolean {
  return (
    err instanceof StripeNotConfiguredError ||
    (err instanceof Error && err.message === "STRIPE_NOT_CONFIGURED")
  );
}
