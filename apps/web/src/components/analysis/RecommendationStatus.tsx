import type { ComponentProps } from 'react';
import type { RecommendationStatus as Status } from '@/hooks/useAnalysisRun';
import { Badge } from '@/components/ui/badge';

const badges: Record<Status, { label: string; variant: ComponentProps<typeof Badge>['variant'] }> = {
  'not-requested': { label: 'Scores only', variant: 'outline' },
  queued: { label: 'Recommendations queued', variant: 'outline' },
  writing: { label: 'Writing recommendations', variant: 'secondary' },
  ready: { label: 'Recommendations ready', variant: 'default' },
  failed: { label: 'Recommendations failed', variant: 'destructive' },
  'job-missing': { label: 'Recommendation job not found', variant: 'destructive' },
};

export function RecommendationStatus({ status }: { status: Status }) {
  const { label, variant } = badges[status];
  return <Badge variant={variant}>{label}</Badge>;
}
