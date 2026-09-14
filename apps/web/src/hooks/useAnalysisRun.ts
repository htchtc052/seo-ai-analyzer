import { useEffect, useState } from 'react';
import type { AnalysisRun, FragmentScore } from '@semantic/contracts';
import { getAnalysisRun } from '@/lib/api';
import { getRecommendationStatus } from '@/lib/recommendation-status';

const POLL_INTERVAL_MS = 2000;

export type ScoredSection = { heading: string | null; fragments: FragmentScore[] };

function groupBySection(fragments: FragmentScore[]): ScoredSection[] {
  const sections: ScoredSection[] = [];
  for (const fragment of fragments) {
    const last = sections.at(-1);
    if (last && last.heading === fragment.heading) last.fragments.push(fragment);
    else sections.push({ heading: fragment.heading, fragments: [fragment] });
  }
  return sections;
}

function statusOf(run: AnalysisRun) {
  return getRecommendationStatus(run.competitors.length, run);
}

export function useAnalysisRun(id: string) {
  const [run, setRun] = useState<AnalysisRun>();
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let timer: number | undefined;
    const load = () => getAnalysisRun(id, controller.signal).then(next => {
      setRun(next);
      if (statusOf(next) === 'pending') timer = window.setTimeout(load, POLL_INTERVAL_MS);
    }).catch(err => { if (!controller.signal.aborted) setError(err.message); });
    load();
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [id]);

  return {
    run,
    error,
    recommendationStatus: run && statusOf(run),
    sections: run && groupBySection(run.fragments),
  };
}
