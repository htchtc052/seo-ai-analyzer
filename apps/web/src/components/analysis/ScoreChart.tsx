import type { FragmentScore } from '@semantic/contracts';
import { Progress } from '@/components/ui/progress';

export function ScoreChart({ fragments }: { fragments: FragmentScore[] }) {
  return <figure className="grid gap-4">
    <figcaption className="text-sm text-muted-foreground">Cosine similarity of each fragment to the query, on a 0–1 scale</figcaption>
    <ol className="grid gap-4">
      {fragments.map((fragment, index) => <li key={index} className="grid grid-cols-[1fr_3rem] items-center gap-x-3 gap-y-1 md:grid-cols-[11rem_1fr_3rem]">
        <span className="col-span-2 text-sm font-medium md:col-span-1">{fragment.heading ?? 'Introduction'}</span>
        <Progress value={Math.max(fragment.score, 0) * 100} />
        <span className="text-right text-sm tabular-nums">{fragment.score.toFixed(2)}</span>
        <span className="col-span-2 text-xs leading-relaxed text-muted-foreground md:col-start-2">{fragment.text}</span>
      </li>)}
    </ol>
  </figure>;
}
