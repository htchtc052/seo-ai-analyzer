import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { analysisRequestSchema, type Article } from '@semantic/contracts';
import topics from '@semantic/examples/topics.json';
import { startAnalysis } from '@/lib/api';

export type Topic = (typeof topics)[number];

export function useNewAnalysis() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic>(topics[0]!);
  const [article, setArticle] = useState<Article>();
  const [competitors, setCompetitors] = useState<(Article | undefined)[]>([]);
  const [error, setError] = useState('');
  const form = useForm({
    resolver: zodResolver(analysisRequestSchema),
    mode: 'onTouched',
    defaultValues: { articleId: '', query: '', competitorIds: [], audience: '', purpose: '', niche: '' },
  });
  const { isSubmitted } = form.formState;

  function selectArticle(next: Article | undefined) {
    setArticle(next);
    form.setValue('articleId', next?.id ?? '', { shouldValidate: isSubmitted });
  }

  function selectCompetitor(index: number, next: Article | undefined) {
    const nextCompetitors = topic.competitors.map((_, position) => position === index ? next : competitors[position]);
    setCompetitors(nextCompetitors);
    const ids = nextCompetitors.filter(item => item !== undefined).map(item => item.id);
    form.setValue('competitorIds', ids, { shouldValidate: isSubmitted });
  }

  const submit = form.handleSubmit(async values => {
    setError('');
    try {
      const run = await startAnalysis(values);
      navigate(`/analyses/${run.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the analysis');
    }
  });

  return {
    topics,
    topic,
    setTopic,
    article,
    selectArticle,
    competitors,
    selectCompetitor,
    hasCompetitors: competitors.some(Boolean),
    form,
    submit,
    error,
  };
}
