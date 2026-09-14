import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { analysisRequestSchema, type Article, type Features } from '@semantic/contracts';
import topics from '@semantic/examples/topics.json';
import { getFeatures, importArticle, startAnalysis } from '@/lib/api';

export type Topic = (typeof topics)[number];

export type ArticleSlot = { url: string; article: Article | undefined; error: string };

export type AnalysisHint = 'recommendations-disabled' | 'with-competitors' | 'without-competitors';

const contextFields = ['query', 'audience', 'purpose', 'niche'] as const;

function emptySlot(url: string): ArticleSlot {
  return { url, article: undefined, error: '' };
}

function needsFetch(slot: ArticleSlot): boolean {
  return slot.url.trim() !== '' && !slot.article;
}

async function fetchSlot(slot: ArticleSlot): Promise<ArticleSlot> {
  if (!needsFetch(slot)) return slot;
  try {
    return { ...slot, article: await importArticle(slot.url.trim()), error: '' };
  } catch (err) {
    return { ...slot, error: err instanceof Error ? err.message : 'Could not fetch the article' };
  }
}

function getHint(features: Features, competitors: ArticleSlot[]): AnalysisHint {
  if (!features.recommendations) return 'recommendations-disabled';
  return competitors.some(slot => slot.article) ? 'with-competitors' : 'without-competitors';
}

export function useNewAnalysis() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic>(topics[0]!);
  const [main, setMain] = useState<ArticleSlot>(emptySlot(''));
  const [competitors, setCompetitors] = useState<ArticleSlot[]>(topics[0]!.competitors.map(() => emptySlot('')));
  const [features, setFeatures] = useState<Features>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const form = useForm({
    resolver: zodResolver(analysisRequestSchema),
    mode: 'onTouched',
    defaultValues: { articleId: '', query: '', competitorIds: [], audience: '', purpose: '', niche: '' },
  });
  const { isSubmitting, isSubmitted } = form.formState;
  const activeCompetitors = features?.recommendations ? competitors : [];

  useEffect(() => {
    const controller = new AbortController();
    getFeatures(controller.signal).then(setFeatures).catch(err => {
      if (!controller.signal.aborted) setError(err.message);
    });
    return () => controller.abort();
  }, []);

  function applySlots(nextMain: ArticleSlot, nextCompetitors: ArticleSlot[]) {
    setMain(nextMain);
    setCompetitors(nextCompetitors);
    const options = { shouldValidate: isSubmitted };
    form.setValue('articleId', nextMain.article?.id ?? '', options);
    const loaded = features?.recommendations ? nextCompetitors : [];
    form.setValue('competitorIds', loaded.flatMap(slot => slot.article ? [slot.article.id] : []), options);
  }

  function resetContext() {
    for (const field of contextFields) form.setValue(field, '');
  }

  function selectTopic(next: Topic) {
    setTopic(next);
    applySlots(emptySlot(next.article.url), next.competitors.map(example => emptySlot(example.url)));
    resetContext();
  }

  function changeMainUrl(url: string) {
    const replacesExample = main.url === topic.article.url;
    applySlots(emptySlot(url), replacesExample ? competitors.map(() => emptySlot('')) : competitors);
    resetContext();
  }

  function changeCompetitorUrl(index: number, url: string) {
    applySlots(main, competitors.map((slot, position) => position === index ? emptySlot(url) : slot));
  }

  async function fetchArticles() {
    setIsLoading(true);
    const [nextMain, ...nextActive] = await Promise.all([main, ...activeCompetitors].map(fetchSlot));
    setIsLoading(false);
    applySlots(nextMain!, features?.recommendations ? nextActive : competitors);
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
    selectTopic,
    main,
    changeMainUrl,
    competitors: activeCompetitors,
    changeCompetitorUrl,
    fetchArticles,
    canFetch: !isLoading && !isSubmitting && [main, ...activeCompetitors].some(needsFetch),
    isLoading,
    canRun: !isLoading && !isSubmitting,
    hint: features && getHint(features, activeCompetitors),
    form,
    submit,
    error,
  };
}
