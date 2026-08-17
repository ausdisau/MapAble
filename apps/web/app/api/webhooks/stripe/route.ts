import { parseAndProcessWebhookRequest } from "@/lib/stripe/webhooks";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  const result = await parseAndProcessWebhookRequest(rawBody, signature);

  if (!result.ok) {
    return new Response(result.message, { status: result.status });
  }

  return new Response(
    JSON.stringify({
      received: true,
      billing: result.billing,
      legacy: result.legacy,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
