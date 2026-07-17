import { interpretSearchQuery } from "@/lib/search/interpreter";
import { searchInterpretRequestSchema } from "@/lib/search/interpreter/validation";
import {
  SEARCH_INTERPRET_OPERATIONS,
  searchInterpretJsonError,
  searchInterpretJsonOk,
} from "@/lib/search/search-interpret-api-contract";

const OPERATION = SEARCH_INTERPRET_OPERATIONS.interpretQuery;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous";

  if (!checkRateLimit(ip)) {
    return searchInterpretJsonError(OPERATION, 429, {
      error: "Too many requests. Please wait a moment.",
      code: "RATE_LIMITED",
      retryable: true,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return searchInterpretJsonError(OPERATION, 400, {
      error: "Invalid JSON body",
      code: "SEARCH_INTERPRET_VALIDATION_ERROR",
      retryable: false,
    });
  }

  const parsed = searchInterpretRequestSchema.safeParse(body);
  if (!parsed.success) {
    return searchInterpretJsonError(OPERATION, 400, {
      error: "Invalid request",
      code: "SEARCH_INTERPRET_VALIDATION_ERROR",
      details: parsed.error.flatten(),
      retryable: false,
    });
  }

  try {
    const interpretation = await interpretSearchQuery(parsed.data.query);
    return searchInterpretJsonOk(OPERATION, interpretation);
  } catch (err) {
    console.error("[search-interpret]", err);
    return searchInterpretJsonError(OPERATION, 502, {
      error: "Could not interpret the search query.",
      code: "SEARCH_INTERPRET_UPSTREAM_ERROR",
      retryable: true,
    });
  }
}
