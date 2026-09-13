import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import type {
  AnalysisRequest,
  AnalysisRun,
  AnalysisRunSummary,
  ArticleSection,
  Features,
  FragmentScore,
  RecommendationJob,
} from '@semantic/contracts';
import { ArticlesService } from '../articles/articles.service.js';
import { ANALYSIS_QUEUE, type AnalysisJob } from './lib/analysis-queue.js';
import { AnalysisRunsRepository } from './analysis-runs.repository.js';
import { flattenFragments } from './lib/fragments.js';
import { RecommendationService } from './recommendation.service.js';
import { RelevanceService } from './relevance.service.js';

type AnalysisRunRow = NonNullable<Awaited<ReturnType<AnalysisRunsRepository['findById']>>>;
type AnalysisRunListRow = Awaited<ReturnType<AnalysisRunsRepository['findRecent']>>[number];

@Injectable()
export class AnalysisService {
  constructor(
    @Inject(ArticlesService)
    private readonly articles: ArticlesService,
    @Inject(AnalysisRunsRepository)
    private readonly runs: AnalysisRunsRepository,
    @Inject(RelevanceService)
    private readonly relevance: RelevanceService,
    @Inject(RecommendationService)
    private readonly recommendations: RecommendationService,
    @InjectQueue(ANALYSIS_QUEUE)
    private readonly queue: Queue<AnalysisJob>,
  ) {}

  async start(input: AnalysisRequest): Promise<AnalysisRun> {
    if (input.competitorIds.length > 0 && !this.recommendations.enabled) {
      throw new UnprocessableEntityException({
        code: 'RECOMMENDATIONS_DISABLED',
        message: 'Recommendations are disabled on this server, so competitors cannot be added',
      });
    }
    const article = await this.articles.findById(input.articleId);
    await Promise.all(input.competitorIds.map((id) => this.articles.findById(id)));

    const fragments = flattenFragments(article.sections);
    const scores = await this.relevance.score(input.query, fragments.map((fragment) => fragment.text));
    const run = await this.runs.create(input, scores);
    if (input.competitorIds.length > 0) {
      await this.queue.add('recommend', { runId: run.id }, { jobId: run.id });
    }
    return this.findById(run.id);
  }

  async findById(id: string): Promise<AnalysisRun> {
    const run = await this.requireRun(id);
    return {
      id: run.id,
      article: toArticleRef(run.article),
      query: run.query,
      overallScore: average(run.scores),
      recommendations: run.recommendations,
      createdAt: run.createdAt.toISOString(),
      competitors: run.competitors.map(toArticleRef),
      audience: run.audience,
      purpose: run.purpose,
      niche: run.niche,
      fragments: scoreFragments(run),
      missingEntities: run.missingEntities,
      recommendationJob: run.competitors.length > 0 ? await this.findRecommendationJob(id) : null,
    };
  }

  features(): Features {
    return { recommendations: this.recommendations.enabled };
  }

  async findRecent(): Promise<AnalysisRunSummary[]> {
    const runs = await this.runs.findRecent();
    return runs.map(toSummary);
  }

  async delete(id: string): Promise<void> {
    await this.requireRun(id);
    await this.queue.remove(id);
    await this.runs.delete(id);
  }

  async writeRecommendations(runId: string): Promise<void> {
    const run = await this.requireRun(runId);
    const recommendation = await this.recommendations.recommend({
      query: run.query,
      audience: run.audience,
      purpose: run.purpose,
      niche: run.niche,
      articleTitle: run.article.title,
      fragments: scoreFragments(run),
      competitors: run.competitors.map((competitor) => ({
        title: competitor.title,
        sections: competitor.sections as ArticleSection[],
      })),
    });
    await this.runs.saveRecommendation(runId, recommendation);
  }

  private async requireRun(id: string): Promise<AnalysisRunRow> {
    const run = await this.runs.findById(id);
    if (!run) {
      throw new NotFoundException({ code: 'ANALYSIS_RUN_NOT_FOUND', message: 'Analysis run not found' });
    }
    return run;
  }

  private async findRecommendationJob(runId: string): Promise<RecommendationJob | null> {
    const job = await this.queue.getJob(runId);
    if (!job) return null;
    return { state: await job.getState(), failedReason: job.failedReason ?? null };
  }
}

function scoreFragments(run: AnalysisRunRow): FragmentScore[] {
  return flattenFragments(run.article.sections as ArticleSection[]).map((fragment, index) => ({
    ...fragment,
    score: run.scores[index]!,
  }));
}

function toArticleRef(article: { id: string; sourceUrl: string; title: string }) {
  return { id: article.id, sourceUrl: article.sourceUrl, title: article.title };
}

function average(scores: number[]): number {
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function toSummary(run: AnalysisRunListRow): AnalysisRunSummary {
  return {
    id: run.id,
    article: run.article,
    query: run.query,
    overallScore: average(run.scores),
    competitorCount: run._count.competitors,
    recommendations: run.recommendations,
    createdAt: run.createdAt.toISOString(),
  };
}
