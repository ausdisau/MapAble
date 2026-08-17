const TWILIO_VERIFY_BASE_URL = "https://verify.twilio.com/v2";

export function isTwilio2FAEnabled(): boolean {
  return process.env.TWILIO_2FA_ENABLED === "true";
}

export function hasTwilioVerifyConfig(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
    process.env.TWILIO_AUTH_TOKEN?.trim() &&
    process.env.TWILIO_VERIFY_SERVICE_SID?.trim(),
  );
}

function twilioAuthHeader(): string {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!accountSid || !authToken) {
    throw new Error("Twilio account credentials are not configured");
  }

  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

function verifyServiceSid(): string {
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();
  if (!serviceSid) {
    throw new Error("TWILIO_VERIFY_SERVICE_SID is not configured");
  }
  return serviceSid;
}

export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "your phone";
  return `•••• ${digits.slice(-4)}`;
}

export async function startTwilioSmsVerification(phone: string): Promise<void> {
  const body = new URLSearchParams({
    Channel: "sms",
    To: phone,
  });

  const response = await fetch(
    `${TWILIO_VERIFY_BASE_URL}/Services/${verifyServiceSid()}/Verifications`,
    {
      method: "POST",
      headers: {
        Authorization: twilioAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Twilio Verify start failed with status ${response.status}`,
    );
  }
}

export async function checkTwilioSmsVerification({
  code,
  phone,
}: {
  code: string;
  phone: string;
}): Promise<boolean> {
  const body = new URLSearchParams({
    Code: code,
    To: phone,
  });

  const response = await fetch(
    `${TWILIO_VERIFY_BASE_URL}/Services/${verifyServiceSid()}/VerificationCheck`,
    {
      method: "POST",
      headers: {
        Authorization: twilioAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  if (!response.ok) {
    return false;
  }

  const payload = (await response.json()) as { status?: string };
  return payload.status === "approved";
}
