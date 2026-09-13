import { useEffect, useState } from 'react';
import type { AnalysisRunSummary } from '@semantic/contracts';
import { getAnalysisRuns } from '@/lib/api';

export type AnalysisRunResult = 'scores-only' | 'recommendations-ready' | 'recommendations-pending';

function getResult(run: AnalysisRunSummary): AnalysisRunResult {
  if (run.competitorCount === 0) return 'scores-only';
  if (run.recommendations.length > 0) return 'recommendations-ready';
  return 'recommendations-pending';
}

export function useAnalysisRuns() {
  const [runs, setRuns] = useState<AnalysisRunSummary[]>();
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    getAnalysisRuns(controller.signal).then(setRuns).catch(err => {
      if (!controller.signal.aborted) setError(err.message);
    });
    return () => controller.abort();
  }, []);

  return { rows: runs?.map(run => ({ run, result: getResult(run) })), error };
}
