import { useEffect, useState } from 'react';
import type { AnalysisRun } from '@semantic/contracts';
import { getAnalysisRun } from '@/lib/api';

const POLL_INTERVAL_MS = 2000;

export type RecommendationStatus = 'not-requested' | 'queued' | 'writing' | 'ready' | 'failed' | 'job-missing';

function getRecommendationStatus(run: AnalysisRun): RecommendationStatus {
  if (run.competitors.length === 0) return 'not-requested';
  if (run.recommendations.length > 0) return 'ready';
  if (!run.recommendationJob) return 'job-missing';
  if (run.recommendationJob.state === 'failed') return 'failed';
  if (run.recommendationJob.state === 'active') return 'writing';
  return 'queued';
}

export function useAnalysisRun(id: string) {
  const [run, setRun] = useState<AnalysisRun>();
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let timer: number | undefined;
    const load = () => getAnalysisRun(id, controller.signal).then(next => {
      setRun(next);
      const status = getRecommendationStatus(next);
      if (status === 'queued' || status === 'writing') timer = window.setTimeout(load, POLL_INTERVAL_MS);
    }).catch(err => { if (!controller.signal.aborted) setError(err.message); });
    load();
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [id]);

  return { run, error, recommendationStatus: run && getRecommendationStatus(run) };
}
