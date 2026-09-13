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
  children?: ReactNode;
  url: string;
  onUrlChange: (url: string) => void;
  article: Article | undefined;
  disabled: boolean;
  onChange: (article: Article | undefined) => void;
};

export function ArticleFetch({ label, children, url, onUrlChange, article, disabled, onChange }: Props) {
  const id = useId();
  const { pending, error, canFetch, changeUrl, fetchArticle } = useArticleImport({ url, onUrlChange, article, onChange });

  return <div className="grid gap-2">
    <Label htmlFor={id}>{label}</Label>
    <div className="flex gap-2">
      <Input id={id} type="url" placeholder="https://" value={url} disabled={disabled || pending} onChange={event => changeUrl(event.target.value)} />
      <Button type="button" disabled={disabled || !canFetch} onClick={fetchArticle}>{pending ? 'Fetching…' : 'Fetch'}</Button>
    </div>
    {children}
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    {article && <FetchedArticle article={article} />}
  </div>;
}
