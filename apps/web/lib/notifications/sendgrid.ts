import sgMail from "@sendgrid/mail";

function ensureSendGridConfigured(): void {
  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("SENDGRID_API_KEY is not configured");
  }
  sgMail.setApiKey(apiKey);
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  ensureSendGridConfigured();
  const from = process.env.SENDGRID_FROM_EMAIL?.trim();
  if (!from) {
    throw new Error("SENDGRID_FROM_EMAIL is not configured");
  }

  await sgMail.send({
    to,
    from,
    subject,
    text,
    html,
  });
}
