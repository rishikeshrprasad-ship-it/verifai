/**
 * Safe API Client & Response Interceptor for VerifAI (ASG-04 FUSIONX 1.0)
 * Prevents "Unexpected token 'I', 'Internal S'... is not valid JSON" crashes
 * by validating response Content-Type and safely capturing raw text/HTML exceptions
 * when FastAPI throws 500/502.
 */

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    let errorBody: string = "";
    if (contentType.includes("application/json")) {
      try {
        const json = await res.json();
        errorBody = json.detail || json.error_message || json.message || JSON.stringify(json);
      } catch {
        errorBody = await res.text().catch(() => "Unknown error");
      }
    } else {
      errorBody = await res.text().catch(() => "Non-JSON error response");
    }
    throw new Error(`API Error ${res.status}: ${errorBody.slice(0, 300)}`);
  }

  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      const rawText = await res.text().catch(() => "");
      throw new Error(`Invalid JSON response (${res.status}): ${rawText.slice(0, 200)}`);
    }
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text as unknown as T;
  }
}
