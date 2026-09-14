import {
  analysisRunResponseSchema,
  articleResponseSchema,
  featuresResponseSchema,
  type AnalysisRequest,
} from '@seo-ai-analyzer/contracts';
import { postJson, request } from '@/shared/api';

export async function importArticle(url: string) {
  return articleResponseSchema.parse(await postJson('/articles/import', { url })).article;
}

export async function startAnalysis(input: AnalysisRequest) {
  return analysisRunResponseSchema.parse(await postJson('/analyses', input)).run;
}

export async function getFeatures() {
  return featuresResponseSchema.parse(await request('/analyses/features')).features;
}
