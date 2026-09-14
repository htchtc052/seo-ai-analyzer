import { readFileSync } from 'node:fs';
import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import {
  recommendationSchema,
  type AnalysisRequest,
  type AnalysisRun,
  type AnalysisRunSummary,
  type Features,
  type FragmentScore,
  type RecommendationJob,
} from '@seo-ai-analyzer/contracts';
import { ArticlesService } from '../articles/articles.service.js';
import { LlmService } from '../llm/llm.service.js';
import { AnalysisRunsRepository } from './analysis-runs.repository.js';
import { ANALYSIS_QUEUE, type AnalysisJob } from './constants/analysis.constants.js';
import { RelevanceService } from './relevance.service.js';

const recommendationPrompt = readFileSync(new URL('./prompts/recommendation.md', import.meta.url), 'utf8');

type AnalysisRunRow = NonNullable<Awaited<ReturnType<AnalysisRunsRepository['findById']>>>;

@Injectable()
export class AnalysisService {
  constructor(
    @Inject(ArticlesService)
    private readonly articles: ArticlesService,
    @Inject(AnalysisRunsRepository)
    private readonly runs: AnalysisRunsRepository,
    @Inject(LlmService)
    private readonly llm: LlmService,
    @Inject(RelevanceService)
    private readonly relevance: RelevanceService,
    @InjectQueue(ANALYSIS_QUEUE)
    private readonly queue: Queue<AnalysisJob>,
  ) {}

  async start(input: AnalysisRequest): Promise<AnalysisRun> {
    if (input.competitorIds.length > 0 && this.llm.chatModel === undefined) {
      throw new UnprocessableEntityException({
        code: 'RECOMMENDATIONS_DISABLED',
        message: 'Recommendations are disabled on this server, so competitors cannot be added',
      });
    }
    const article = await this.articles.findById(input.articleId);
    await Promise.all(input.competitorIds.map((id) => this.articles.findById(id)));

    const scores = await this.relevance.score(input.query, article.sections);
    const run = await this.runs.create(input, scores);
    if (input.competitorIds.length > 0) {
      await this.queue.add('recommend', { runId: run.id }, { jobId: run.id, attempts: 1 });
    }
    return this.findById(run.id);
  }

  async findById(id: string): Promise<AnalysisRun> {
    const run = await this.requireRun(id);
    return {
      id: run.id,
      article: toArticleRef(run.article),
      query: run.query,
      overallScore: this.relevance.overall(run.scores),
      recommendations: run.recommendations,
      recommendationJob: run.competitors.length > 0 ? await this.findRecommendationJob(id) : null,
      createdAt: run.createdAt.toISOString(),
      competitors: run.competitors.map(toArticleRef),
      audience: run.audience,
      purpose: run.purpose,
      niche: run.niche,
      fragments: this.relevance.scoreFragments(run.article.sections, run.scores),
      missingEntities: run.missingEntities,
    };
  }

  features(): Features {
    return { recommendations: this.llm.chatModel !== undefined };
  }

  async findRecent(): Promise<AnalysisRunSummary[]> {
    const runs = await this.runs.findRecent();
    return Promise.all(
      runs.map(async (run) => ({
        id: run.id,
        article: run.article,
        query: run.query,
        overallScore: this.relevance.overall(run.scores),
        competitorCount: run._count.competitors,
        recommendations: run.recommendations,
        recommendationJob: run._count.competitors > 0 ? await this.findRecommendationJob(run.id) : null,
        createdAt: run.createdAt.toISOString(),
      })),
    );
  }

  async delete(id: string): Promise<void> {
    await this.requireRun(id);
    await this.queue.remove(id);
    await this.runs.delete(id);
  }

  async writeRecommendations(runId: string): Promise<void> {
    const run = await this.requireRun(runId);
    const prompt = renderRecommendationPrompt(run, this.relevance.scoreFragments(run.article.sections, run.scores));
    await this.runs.saveRecommendation(
      runId,
      await this.llm.completeStructured('recommendation', prompt, recommendationSchema),
    );
  }

  private async requireRun(id: string): Promise<AnalysisRunRow> {
    const run = await this.runs.findById(id);
    if (!run) throw new NotFoundException({ code: 'ANALYSIS_RUN_NOT_FOUND', message: 'Analysis run not found' });
    return run;
  }

  private async findRecommendationJob(runId: string): Promise<RecommendationJob | null> {
    const job = await this.queue.getJob(runId);
    if (!job) return null;
    return { state: await job.getState(), failedReason: job.failedReason ?? null };
  }
}

function toArticleRef({ id, sourceUrl, title }: { id: string; sourceUrl: string; title: string }) {
  return { id, sourceUrl, title };
}

function renderRecommendationPrompt(run: AnalysisRunRow, fragments: FragmentScore[]): string {
  const values: Record<string, string> = {
    query: run.query,
    audience: run.audience || 'not specified',
    purpose: run.purpose || 'not specified',
    niche: run.niche || 'not specified',
    articleTitle: run.article.title,
    fragments: fragments
      .map(
        (fragment) =>
          `- [${fragment.score.toFixed(2)}] ${fragment.heading ? `${fragment.heading}: ` : ''}${fragment.text}`,
      )
      .join('\n'),
    competitors: run.competitors
      .map((competitor) => {
        const lines = competitor.sections
          .map((section) => `${section.heading ? `${section.heading}: ` : ''}${section.paragraphs.join(' ')}`)
          .join('\n');
        return `### ${competitor.title}\n${lines}`;
      })
      .join('\n\n'),
  };
  return recommendationPrompt.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key]!);
}
