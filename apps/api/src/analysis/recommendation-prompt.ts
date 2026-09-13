import type { ArticleSection, FragmentScore } from '@semantic/contracts';

export type RecommendationPromptInput = {
  query: string;
  audience: string;
  purpose: string;
  niche: string;
  articleTitle: string;
  fragments: FragmentScore[];
  competitors: { title: string; sections: ArticleSection[] }[];
};

export function buildRecommendationPrompt(input: RecommendationPromptInput): string {
  const fragmentLines = input.fragments
    .map((fragment) => `- [${fragment.score.toFixed(2)}] ${fragment.heading ? `${fragment.heading}: ` : ''}${fragment.text}`)
    .join('\n');

  const competitorBlocks = input.competitors
    .map((competitor) => {
      const sectionLines = competitor.sections
        .map((section) => `${section.heading ? `${section.heading}: ` : ''}${section.paragraphs.join(' ')}`)
        .join('\n');
      return `### ${competitor.title}\n${sectionLines}`;
    })
    .join('\n\n');

  return `You are analysing whether an article is relevant to a target search query.

Target query: ${input.query}
Target audience: ${input.audience || 'not specified'}
Content purpose: ${input.purpose || 'not specified'}
Website niche: ${input.niche || 'not specified'}

Article: "${input.articleTitle}"
Fragments with cosine similarity scores against the query (higher is more relevant):
${fragmentLines}

Competitor articles on the same topic:
${competitorBlocks || 'none available'}

List entities or topics the competitor articles cover that this article is missing, and give concrete, actionable recommendations to improve this article's relevance to the target query.`;
}
