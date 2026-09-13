import { Link } from 'react-router';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAnalysisRuns, type AnalysisRunResult } from '@/hooks/useAnalysisRuns';

const resultLabels: Record<AnalysisRunResult, string> = {
  'scores-only': 'Scores only',
  'recommendations-ready': 'Scores and recommendations',
  'recommendations-pending': 'Recommendations not ready',
};

export function AnalysisRunsPage() {
  const { rows, error } = useAnalysisRuns();

  return <Card>
    <CardHeader><CardTitle>Analyses</CardTitle></CardHeader>
    <CardContent>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {!rows && !error && <p className="text-sm text-muted-foreground">Loading analyses…</p>}
      {rows?.length === 0 && <p className="text-sm text-muted-foreground">No analyses yet. <Button asChild variant="link" className="p-0"><Link to="/">Start one</Link></Button></p>}
      {rows && rows.length > 0 && <Table>
        <TableHeader><TableRow>
          <TableHead>Started</TableHead>
          <TableHead>Article</TableHead>
          <TableHead>Query</TableHead>
          <TableHead className="text-right">Relevance</TableHead>
          <TableHead>Result</TableHead>
        </TableRow></TableHeader>
        <TableBody>{rows.map(({ run, result }) => <TableRow key={run.id}>
          <TableCell><Button asChild variant="link" className="p-0"><Link to={`/analyses/${run.id}`}>{new Date(run.createdAt).toLocaleString()}</Link></Button></TableCell>
          <TableCell className="whitespace-normal">{run.article.title}</TableCell>
          <TableCell className="whitespace-normal">{run.query}</TableCell>
          <TableCell className="text-right tabular-nums">{run.overallScore.toFixed(2)}</TableCell>
          <TableCell>{resultLabels[result]}</TableCell>
        </TableRow>)}</TableBody>
      </Table>}
    </CardContent>
  </Card>;
}
