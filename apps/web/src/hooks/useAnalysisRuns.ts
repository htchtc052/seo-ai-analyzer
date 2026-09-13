import { useEffect, useState } from 'react';
import type { AnalysisRunSummary } from '@semantic/contracts';
import { deleteAnalysisRun, getAnalysisRuns } from '@/lib/api';

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

  async function deleteRun(id: string) {
    setError('');
    try {
      await deleteAnalysisRun(id);
      setRuns(current => current?.filter(run => run.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the analysis');
    }
  }

  return { rows: runs?.map(run => ({ run, result: getResult(run) })), error, deleteRun };
}
