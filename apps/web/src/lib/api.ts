import {
  analysisRunListSchema,
  analysisRunResponseSchema,
  apiErrorSchema,
  articleResponseSchema,
  type AnalysisRequest,
} from '@semantic/contracts';

async function request(path: string, options?: RequestInit) {
  const response = await fetch(`/api${path}`, options);
  const body: unknown = await response.json();
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    throw new Error(parsed.success ? parsed.data.error.message : `Request failed (${response.status})`);
  }
  return body;
}

function postJson(path: string, payload: unknown) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function importArticle(url: string) {
  return articleResponseSchema.parse(await postJson('/articles/import', { url })).article;
}

export async function startAnalysis(input: AnalysisRequest) {
  return analysisRunResponseSchema.parse(await postJson('/analyses', input)).run;
}

export async function getAnalysisRun(id: string, signal?: AbortSignal) {
  return analysisRunResponseSchema.parse(await request(`/analyses/${encodeURIComponent(id)}`, { signal })).run;
}

export async function getAnalysisRuns(signal?: AbortSignal) {
  return analysisRunListSchema.parse(await request('/analyses', { signal })).runs;
}
