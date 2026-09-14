import type { AnalysisRunSummary, RecommendationJob } from '@semantic/contracts';

export type RecommendationStatus = 'scores-only' | 'pending' | 'ready' | 'failed';

const pendingStates: RecommendationJob['state'][] = ['waiting', 'waiting-children', 'prioritized', 'delayed', 'active'];

export function getRecommendationStatus(
  competitorCount: number,
  run: Pick<AnalysisRunSummary, 'recommendations' | 'recommendationJob'>,
): RecommendationStatus {
  if (competitorCount === 0) return 'scores-only';
  if (run.recommendations.length > 0) return 'ready';
  if (run.recommendationJob && pendingStates.includes(run.recommendationJob.state)) return 'pending';
  return 'failed';
}
