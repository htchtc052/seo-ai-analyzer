import { Link, useParams } from 'react-router';
import { AnalysisRunInputs } from '@/components/analysis/AnalysisRunInputs';
import { RecommendationStatus } from '@/components/analysis/RecommendationStatus';
import { ScoreChart } from '@/components/analysis/ScoreChart';
import { TextList } from '@/components/analysis/TextList';
import { ExternalLink } from '@/components/ui/external-link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalysisRun } from '@/hooks/useAnalysisRun';

export function AnalysisRunPage() {
  const { id = '' } = useParams();
  const { run, error, recommendationStatus, sections } = useAnalysisRun(id);

  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  if (!run || !recommendationStatus || !sections) return <p className="text-sm text-muted-foreground">Loading analysis…</p>;

  return <Card>
    <CardHeader>
      <CardTitle className="text-lg"><ExternalLink href={run.article.sourceUrl}>{run.article.title}</ExternalLink></CardTitle>
      <CardAction><RecommendationStatus status={recommendationStatus} /></CardAction>
    </CardHeader>
    <CardContent className="grid gap-8">
      <AnalysisRunInputs run={run} />
      <section className="grid gap-4">
        <h3 className="font-semibold">Overall relevance: <span className="text-primary tabular-nums">{run.overallScore.toFixed(2)}</span></h3>
        <ScoreChart sections={sections} />
      </section>
      {recommendationStatus === 'scores-only' && <p className="text-sm text-muted-foreground">No competitors were added, so recommendations were not requested.</p>}
      {recommendationStatus === 'failed' && <Alert variant="destructive"><AlertDescription>{run.recommendationJob?.failedReason ?? 'The recommendation job is no longer available.'}</AlertDescription></Alert>}
      {recommendationStatus === 'ready' && <>
        {run.missingEntities.length > 0 && <TextList title="Suggested missing topics" items={run.missingEntities} />}
        <TextList title="Recommendations" items={run.recommendations} />
      </>}
    </CardContent>
    <CardFooter className="gap-2">
      <Button asChild variant="outline" size="sm"><Link to="/analyses">All analyses</Link></Button>
      <Button asChild variant="outline" size="sm"><Link to="/">New analysis</Link></Button>
    </CardFooter>
  </Card>;
}
