import { analysisRunListSchema, analysisRunResponseSchema } from '@seo-ai-analyzer/contracts';
import { request } from '@/shared/api';

export async function getAnalysisRun(id: string) {
  return analysisRunResponseSchema.parse(await request(`/analyses/${encodeURIComponent(id)}`)).run;
}

export async function getAnalysisRuns() {
  return analysisRunListSchema.parse(await request('/analyses')).runs;
}
