import { ArticleFetch } from '@/components/articles/ArticleFetch';
import { TopicPicker } from '@/components/articles/TopicPicker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNewAnalysis } from '@/hooks/useNewAnalysis';

export function NewAnalysisPage() {
  const { topics, topic, setTopic, article, selectArticle, competitors, selectCompetitor, hasCompetitors, form, submit, error } = useNewAnalysis();
  const { register, formState: { errors, isSubmitting } } = form;

  return <form className="grid items-start gap-6 md:grid-cols-2" onSubmit={submit} noValidate>
    <Card>
      <CardHeader><CardTitle>Articles</CardTitle></CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <ArticleFetch
              label="Your article"
              example={topic.article}
              exampleAction={<TopicPicker topics={topics} topic={topic} disabled={isSubmitting} onSelect={setTopic} />}
              article={article}
              disabled={isSubmitting}
              onChange={selectArticle}
            />
            <FieldError errors={[errors.articleId]} />
          </Field>
          {topic.competitors.map((example, index) => <Field key={index}>
            <ArticleFetch
              label={`Competitor ${index + 1} (optional)`}
              example={example}
              article={competitors[index]}
              disabled={isSubmitting}
              onChange={next => selectCompetitor(index, next)}
            />
          </Field>)}
          <FieldError errors={[errors.competitorIds]} />
        </FieldGroup>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>Analysis</CardTitle></CardHeader>
      <CardContent>
        <FieldGroup>
          <Field data-invalid={Boolean(errors.query)}>
            <FieldLabel htmlFor="query">Target query</FieldLabel>
            <Input id="query" {...register('query')} placeholder={`e.g. ${topic.query}`} aria-invalid={Boolean(errors.query)} disabled={isSubmitting} />
            <FieldError errors={[errors.query]} />
          </Field>
          <Field data-invalid={Boolean(errors.audience)}>
            <FieldLabel htmlFor="audience">Target audience</FieldLabel>
            <Textarea id="audience" {...register('audience')} placeholder="Who is reading? What do they already know?" aria-invalid={Boolean(errors.audience)} disabled={isSubmitting} />
            <FieldError errors={[errors.audience]} />
          </Field>
          <Field data-invalid={Boolean(errors.purpose)}>
            <FieldLabel htmlFor="purpose">Content purpose</FieldLabel>
            <Textarea id="purpose" {...register('purpose')} placeholder="What should the reader learn or do?" aria-invalid={Boolean(errors.purpose)} disabled={isSubmitting} />
            <FieldError errors={[errors.purpose]} />
          </Field>
          <Field data-invalid={Boolean(errors.niche)}>
            <FieldLabel htmlFor="niche">Website niche</FieldLabel>
            <Input id="niche" {...register('niche')} placeholder="e.g. Consumer technology news" aria-invalid={Boolean(errors.niche)} disabled={isSubmitting} />
            <FieldError errors={[errors.niche]} />
          </Field>
          <Field>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Scoring…' : 'Run analysis'}</Button>
            <FieldDescription>
              {hasCompetitors
                ? 'Scores are calculated right away. Recommendations against your competitors are written in the background and take about a minute.'
                : 'Without competitors the analysis calculates relevance scores only. Fetch a competitor to also get recommendations.'}
            </FieldDescription>
          </Field>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        </FieldGroup>
      </CardContent>
    </Card>
  </form>;
}
