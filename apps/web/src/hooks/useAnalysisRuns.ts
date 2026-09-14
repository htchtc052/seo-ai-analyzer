import { useEffect, useState } from 'react';
import type { AnalysisRunSummary } from '@seo-ai-analyzer/contracts';
import { deleteAnalysisRun, getAnalysisRuns } from '@/lib/api';
import { getRecommendationStatus } from '@/lib/recommendation-status';

const POLL_INTERVAL_MS = 2000;

function statusOf(run: AnalysisRunSummary) {
  return getRecommendationStatus(run.competitorCount, run);
}

export function useAnalysisRuns() {
  const [runs, setRuns] = useState<AnalysisRunSummary[]>();
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let timer: number | undefined;
    const load = () =>
      getAnalysisRuns(controller.signal)
        .then((next) => {
          setRuns(next);
          if (next.some((run) => statusOf(run) === 'pending')) timer = window.setTimeout(load, POLL_INTERVAL_MS);
        })
        .catch((err) => {
          if (!controller.signal.aborted) setError(err.message);
        });
    load();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, []);

  async function deleteRun(id: string) {
    setError('');
    try {
      await deleteAnalysisRun(id);
      setRuns((current) => current?.filter((run) => run.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the analysis');
    }
  }

  return { rows: runs?.map((run) => ({ run, status: statusOf(run) })), error, deleteRun };
}
