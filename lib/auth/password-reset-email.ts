import { getAppBaseUrl } from "@/lib/auth/app-base-url";
import { sendEmail } from "@/lib/notifications/sendgrid";

export function isPasswordResetEmailConfigured(): boolean {
  return Boolean(
    process.env.SENDGRID_API_KEY?.trim() &&
      process.env.SENDGRID_FROM_EMAIL?.trim()
  );
}

export function buildPasswordResetUrl(token: string): string {
  return `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
}): Promise<void> {
  const subject = "Reset your MapAble password";
  const text = [
    "We received a request to reset your MapAble password.",
    "",
    `Open this link to choose a new password (valid for 1 hour):`,
    params.resetUrl,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  const html = `
    <p>We received a request to reset your MapAble password.</p>
    <p><a href="${params.resetUrl}">Choose a new password</a> (link valid for 1 hour).</p>
    <p>If you did not request this, you can ignore this email.</p>
  `.trim();

  await sendEmail({
    to: params.to,
    subject,
    text,
    html,
  });
}
