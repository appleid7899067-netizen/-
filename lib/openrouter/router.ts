export type OpenRouterModel = {
  id: string;
  name?: string;
  pricing?: { prompt?: string; completion?: string };
  architecture?: Record<string, unknown>;
  supported_parameters?: string[];
};

export async function getFreeModels(): Promise<OpenRouterModel[]> {
  const r = await fetch("https://openrouter.ai/api/v1/models", {
    cache: "no-store",
  });
  if (!r.ok) {
    throw new Error(`OpenRouter models request failed: ${r.status}`);
  }
  const body = await r.json();
  return (body.data ?? []).filter(
    (m: OpenRouterModel) =>
      Number(m.pricing?.prompt ?? 0) === 0 &&
      Number(m.pricing?.completion ?? 0) === 0
  );
}

export function buildEightCandidates(models: OpenRouterModel[]): string[] {
  return models
    .map((m) => m.id)
    .filter(Boolean)
    .slice(0, 8);
}

export async function chatWithEightFallback(
  messages: unknown[],
  options: {
    apiKey: string;
    candidates?: string[];
    maxAttempts?: number;
  }
) {
  const candidates =
    options.candidates?.length
      ? options.candidates
      : ["openrouter/free"];
  const attempts = Math.min(options.maxAttempts ?? 8, 8);
  const errors: string[] = [];

  for (let i = 0; i < Math.min(attempts, candidates.length); i++) {
    const model = candidates[i];
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages }),
      });
      const data = await r.json();
      if (r.ok && data?.choices?.[0]?.message?.content) {
        return { ...data, selectedModel: model, attempt: i + 1, errors };
      }
      errors.push(`${model}: ${data?.error?.message ?? `HTTP ${r.status}`}`);
    } catch (e) {
      errors.push(`${model}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "openrouter/free", messages }),
  });
  const data = await r.json();
  if (!r.ok) {
    throw new Error(
      JSON.stringify({ errors, final: data?.error?.message ?? r.status })
    );
  }
  return { ...data, selectedModel: "openrouter/free", attempt: attempts + 1, errors };
}
