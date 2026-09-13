import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { analysisRequestSchema, type Article, type Features } from '@semantic/contracts';
import topics from '@semantic/examples/topics.json';
import { getFeatures, startAnalysis } from '@/lib/api';

export type Topic = (typeof topics)[number];

export type AnalysisHint = 'recommendations-disabled' | 'with-competitors' | 'without-competitors';

function getHint(features: Features, competitors: (Article | undefined)[]): AnalysisHint {
  if (!features.recommendations) return 'recommendations-disabled';
  return competitors.some(Boolean) ? 'with-competitors' : 'without-competitors';
}

export function useNewAnalysis() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic>(topics[0]!);
  const [article, setArticle] = useState<Article>();
  const [competitors, setCompetitors] = useState<(Article | undefined)[]>([]);
  const [features, setFeatures] = useState<Features>();
  const [error, setError] = useState('');
  const form = useForm({
    resolver: zodResolver(analysisRequestSchema),
    mode: 'onTouched',
    defaultValues: { articleId: '', query: '', competitorIds: [], audience: '', purpose: '', niche: '' },
  });
  const { isSubmitted } = form.formState;

  useEffect(() => {
    const controller = new AbortController();
    getFeatures(controller.signal).then(setFeatures).catch(err => {
      if (!controller.signal.aborted) setError(err.message);
    });
    return () => controller.abort();
  }, []);

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
    features,
    topics,
    topic,
    setTopic,
    article,
    selectArticle,
    competitors,
    selectCompetitor,
    hint: features && getHint(features, competitors),
    form,
    submit,
    error,
  };
}
