export interface ServiceContext {
  endpoint: string;
}

export interface ServiceResult<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
  status: number;
}

export async function postJson<T>(url: string, body: unknown): Promise<ServiceResult<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    });
    const status = res.status;
    if (!res.ok) {
      const text = (await res.text().catch(() => "")) || res.statusText;
      return { ok: false, data: null, error: text, status };
    }
    const data = (await res.json().catch(() => null)) as T | null;
    return { ok: true, data, error: null, status };
  } catch (err) {
    return {
      ok: false,
      data: null,
      error: err instanceof Error ? err.message : "Network error",
      status: 0,
    };
  }
}
