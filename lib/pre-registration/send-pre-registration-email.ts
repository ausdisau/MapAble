import { MAPABLE_SUPPORT_EMAIL } from "@/lib/brand/constants";
import {
  preRegistrationRoleLabels,
  type PreRegistrationInput,
} from "@/lib/pre-registration/schema";

export function isPreRegistrationEmailConfigured(): boolean {
  return Boolean(
    process.env.SENDGRID_API_KEY?.trim() &&
    process.env.SENDGRID_FROM_EMAIL?.trim(),
  );
}

function preRegistrationInbox(): string {
  return (
    process.env.MAPABLE_CONTACT_INBOX?.trim() ||
    process.env.SENDGRID_FROM_EMAIL?.trim() ||
    MAPABLE_SUPPORT_EMAIL
  );
}

export async function sendPreRegistrationEmail(
  submission: PreRegistrationInput,
): Promise<void> {
  const roleLabel = preRegistrationRoleLabels[submission.role];
  const subject = `[MapAble Pre-registration] ${roleLabel} — ${submission.name}`;
  const organisation = submission.organisation?.trim() || null;
  const notes = submission.notes?.trim() || null;
  const text = [
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Role: ${roleLabel}`,
    organisation ? `Organisation: ${organisation}` : null,
    submission.consentScopes?.length
      ? `Consent scopes: ${submission.consentScopes.join(", ")}`
      : null,
    notes ? `\nNotes:\n${notes}` : null,
  ]
    .filter((line) => line != null)
    .join("\n");

  const html = `
    <p><strong>Name:</strong> ${escapeHtml(submission.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(submission.email)}</p>
    <p><strong>Role:</strong> ${escapeHtml(roleLabel)}</p>
    ${
      organisation
        ? `<p><strong>Organisation:</strong> ${escapeHtml(organisation)}</p>`
        : ""
    }
    ${
      submission.consentScopes?.length
        ? `<p><strong>Consent scopes:</strong> ${escapeHtml(submission.consentScopes.join(", "))}</p>`
        : ""
    }
    ${notes ? `<hr /><p>${escapeHtml(notes).replace(/\n/g, "<br />")}</p>` : ""}
  `.trim();

  if (!isPreRegistrationEmailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[pre-register] submission (dev only):\n", text);
      return;
    }
    throw new Error("Pre-registration email is not configured");
  }

  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("SENDGRID_API_KEY is not configured");
  }

  const sgMail = await import("@sendgrid/mail");
  sgMail.default.setApiKey(apiKey);

  const from = process.env.SENDGRID_FROM_EMAIL?.trim();
  if (!from) {
    throw new Error("SENDGRID_FROM_EMAIL is not configured");
  }

  await sgMail.default.send({
    to: preRegistrationInbox(),
    from,
    replyTo: { email: submission.email, name: submission.name },
    subject,
    text,
    html,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
