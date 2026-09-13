import { useId, type ReactNode } from 'react';
import type { Article } from '@semantic/contracts';
import { FetchedArticle } from '@/components/articles/FetchedArticle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useArticleImport } from '@/hooks/useArticleImport';

type Props = {
  label: string;
  example: { site: string; url: string };
  exampleAction?: ReactNode;
  article: Article | undefined;
  disabled: boolean;
  onChange: (article: Article | undefined) => void;
};

export function ArticleFetch({ label, example, exampleAction, article, disabled, onChange }: Props) {
  const id = useId();
  const { url, pending, error, canFetch, changeUrl, fetchArticle } = useArticleImport(article, onChange);

  return <div className="grid gap-2">
    <Label htmlFor={id}>{label}</Label>
    <div className="flex gap-2">
      <Input id={id} type="url" placeholder="https://" value={url} disabled={disabled || pending} onChange={event => changeUrl(event.target.value)} />
      <Button type="button" disabled={disabled || !canFetch} onClick={fetchArticle}>{pending ? 'Fetching…' : 'Fetch'}</Button>
    </div>
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      Example:
      <Button type="button" variant="link" size="xs" title={example.url} disabled={disabled || pending} onClick={() => changeUrl(example.url)}>
        {example.site}
      </Button>
      {exampleAction}
    </p>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    {article && <FetchedArticle article={article} />}
  </div>;
}
