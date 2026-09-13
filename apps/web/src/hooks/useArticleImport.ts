import { useState } from 'react';
import type { Article } from '@semantic/contracts';
import { importArticle } from '@/lib/api';

type Options = {
  url: string;
  onUrlChange: (url: string) => void;
  article: Article | undefined;
  onChange: (article: Article | undefined) => void;
};

export function useArticleImport({ url, onUrlChange, article, onChange }: Options) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  function changeUrl(value: string) {
    onUrlChange(value);
    setError('');
    if (article) onChange(undefined);
  }

  async function fetchArticle() {
    onChange(undefined);
    setError('');
    setPending(true);
    try {
      onChange(await importArticle(url.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not fetch the article');
    } finally {
      setPending(false);
    }
  }

  return { url, pending, error, canFetch: !pending && url.trim() !== '', changeUrl, fetchArticle };
}
