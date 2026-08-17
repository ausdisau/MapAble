import { searchInterpreterConfig } from "@/lib/config/search-interpreter";

/**
 * Optional Hugging Face hub classifier slug hint (phase 3).
 * Never blocks interpretation — returns null on any failure.
 */
export async function classifyCategorySlugFromHub(
  query: string,
): Promise<string | null> {
  const hubId = searchInterpreterConfig.classifierHubId.trim();
  const token = searchInterpreterConfig.huggingFaceToken.trim();
  if (!hubId || !token || !query.trim()) return null;

  try {
    const res = await fetch(
      `https://api-inference.huggingface.co/models/${hubId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: query.trim(),
          parameters: { max_new_tokens: 48, return_full_text: false },
        }),
        signal: AbortSignal.timeout(6_000),
      },
    );

    if (!res.ok) return null;

    const data = (await res.json()) as
      | Array<{ generated_text?: string }>
      | { generated_text?: string };

    const text = Array.isArray(data)
      ? (data[0]?.generated_text ?? "")
      : (data.generated_text ?? "");

    return parseSlugFromClassifierOutput(text);
  } catch (err) {
    console.error("[search-interpreter] HF classifier hint failed", err);
    return null;
  }
}

function parseSlugFromClassifierOutput(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as { slug?: string };
    if (parsed.slug && typeof parsed.slug === "string") {
      return parsed.slug.trim() || null;
    }
  } catch {
    const match = trimmed.match(/"slug"\s*:\s*"([^"]+)"/);
    if (match?.[1]) return match[1].trim();
  }

  return null;
}
