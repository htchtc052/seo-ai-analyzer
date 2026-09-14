import { apiErrorSchema } from '@seo-ai-analyzer/contracts';

export async function request(path: string, options?: RequestInit): Promise<unknown> {
  const response = await fetch(`/api${path}`, options);
  const body: unknown = response.status === 204 ? undefined : await response.json();
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    throw new Error(parsed.success ? parsed.data.error.message : `Request failed (${response.status})`);
  }
  return body;
}

export function postJson(path: string, payload: unknown): Promise<unknown> {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
