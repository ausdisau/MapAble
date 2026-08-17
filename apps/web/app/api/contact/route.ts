import { NextResponse } from "next/server";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { contactFormSchema } from "@/lib/contact/contact-form-schema";
import {
  isContactEmailConfigured,
  sendContactFormEmail,
} from "@/lib/contact/send-contact-email";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

const SUCCESS_MESSAGE =
  "Thanks — your message was received. MapAble will respond using the email address you provided.";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(ip, { windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX })
  ) {
    return NextResponse.json(
      { error: "Too many messages sent. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  try {
    const body = (await req.json()) as unknown;
    const parsed = contactFormSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid form data";
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    if (parsed.data.company) {
      return NextResponse.json({ message: SUCCESS_MESSAGE });
    }

    if (isContactEmailConfigured()) {
      await sendContactFormEmail(parsed.data);
    } else if (process.env.NODE_ENV !== "production") {
      await sendContactFormEmail(parsed.data);
    } else {
      console.error(
        "[contact] SENDGRID_API_KEY / SENDGRID_FROM_EMAIL not configured",
      );
      return NextResponse.json(
        {
          error:
            "Contact form is temporarily unavailable. Please email support@mapable.com.au.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ message: SUCCESS_MESSAGE });
  } catch (error) {
    console.error("[contact] submission failed", error);
    return NextResponse.json(
      { error: "Could not send your message. Please try again later." },
      { status: 500 },
    );
  }
}
