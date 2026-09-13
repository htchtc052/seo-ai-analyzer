import { z } from 'zod';

export const articleSectionSchema = z.object({
  heading: z.string().min(1).nullable(),
  paragraphs: z.array(z.string().min(1)).min(1),
});

export const articleSchema = z.object({
  id: z.string().min(1),
  sourceUrl: z.url(),
  title: z.string().min(1),
  sections: z.array(articleSectionSchema).min(1),
  importedAt: z.iso.datetime(),
});

export const articleRefSchema = articleSchema.pick({ id: true, sourceUrl: true, title: true });

export const articleImportRequestSchema = z.object({
  url: z.url({ protocol: /^https?$/, error: 'Enter an http or https URL' }),
});

export const articleResponseSchema = z.object({ article: articleSchema });

export const analysisRequestSchema = z.object({
  articleId: z.string().trim().min(1, 'Fetch the article first'),
  query: z.string().trim().min(1, 'Enter a target query').max(500),
  competitorIds: z.array(z.string().min(1)).max(2).refine(
    (ids) => new Set(ids).size === ids.length,
    'Competitors must be different articles',
  ),
  audience: z.string().trim().max(1000),
  purpose: z.string().trim().max(1000),
  niche: z.string().trim().max(1000),
});

export const fragmentScoreSchema = z.object({
  heading: z.string().min(1).nullable(),
  text: z.string().min(1),
  score: z.number().min(-1).max(1),
});

export const recommendationSchema = z.object({
  missingEntities: z.array(z.string().min(1)),
  recommendations: z.array(z.string().min(1)).min(1),
});

export const recommendationJobSchema = z.object({
  state: z.enum(['waiting', 'waiting-children', 'prioritized', 'delayed', 'active', 'completed', 'failed', 'unknown']),
  failedReason: z.string().nullable(),
});

export const analysisRunSummarySchema = z.object({
  id: z.string().min(1),
  article: articleRefSchema,
  query: z.string(),
  overallScore: z.number().min(-1).max(1),
  competitorCount: z.number().int().min(0),
  recommendations: z.array(z.string()),
  createdAt: z.iso.datetime(),
});

export const analysisRunSchema = analysisRunSummarySchema.omit({ competitorCount: true }).extend({
  competitors: z.array(articleRefSchema),
  audience: z.string(),
  purpose: z.string(),
  niche: z.string(),
  fragments: z.array(fragmentScoreSchema).min(1),
  missingEntities: z.array(z.string()),
  recommendationJob: recommendationJobSchema.nullable(),
});

export const analysisRunResponseSchema = z.object({ run: analysisRunSchema });
export const analysisRunListSchema = z.object({ runs: z.array(analysisRunSummarySchema) });

export const featuresSchema = z.object({ recommendations: z.boolean() });
export const featuresResponseSchema = z.object({ features: featuresSchema });

export const apiErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string(), fields: z.record(z.string(), z.array(z.string())).optional() }),
});

export type Article = z.infer<typeof articleSchema>;
export type ArticleRef = z.infer<typeof articleRefSchema>;
export type ArticleSection = z.infer<typeof articleSectionSchema>;
export type ArticleImportRequest = z.infer<typeof articleImportRequestSchema>;
export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
export type FragmentScore = z.infer<typeof fragmentScoreSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type RecommendationJob = z.infer<typeof recommendationJobSchema>;
export type AnalysisRunSummary = z.infer<typeof analysisRunSummarySchema>;
export type AnalysisRun = z.infer<typeof analysisRunSchema>;
export type Features = z.infer<typeof featuresSchema>;
