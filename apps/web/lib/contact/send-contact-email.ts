import { MAPABLE_SUPPORT_EMAIL } from "@/lib/brand/constants";
import { contactTopicLabels, type ContactFormInput } from "@/lib/contact/contact-form-schema";

export function isContactEmailConfigured(): boolean {
  return Boolean(
    process.env.SENDGRID_API_KEY?.trim() &&
      process.env.SENDGRID_FROM_EMAIL?.trim(),
  );
}

function contactInbox(): string {
  return (
    process.env.MAPABLE_CONTACT_INBOX?.trim() ||
    process.env.SENDGRID_FROM_EMAIL?.trim() ||
    MAPABLE_SUPPORT_EMAIL
  );
}

export async function sendContactFormEmail(
  submission: ContactFormInput,
): Promise<void> {
  const topicLabel = contactTopicLabels[submission.topic];
  const subject = `[MapAble Contact] ${topicLabel} — ${submission.name}`;
  const text = [
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Topic: ${topicLabel}`,
    submission.consentScopes?.length
      ? `Consent scopes: ${submission.consentScopes.join(", ")}`
      : null,
    "",
    submission.message,
  ]
    .filter((line) => line != null)
    .join("\n");

  const html = `
    <p><strong>Name:</strong> ${escapeHtml(submission.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(submission.email)}</p>
    <p><strong>Topic:</strong> ${escapeHtml(topicLabel)}</p>
    ${
      submission.consentScopes?.length
        ? `<p><strong>Consent scopes:</strong> ${escapeHtml(submission.consentScopes.join(", "))}</p>`
        : ""
    }
    <hr />
    <p>${escapeHtml(submission.message).replace(/\n/g, "<br />")}</p>
  `.trim();

  if (!isContactEmailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[contact] submission (dev only):\n", text);
      return;
    }
    throw new Error("Contact email is not configured");
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
    to: contactInbox(),
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
