import type { ArticleSection } from '@semantic/contracts';

export type Fragment = { heading: string | null; text: string };

export function flattenFragments(sections: ArticleSection[]): Fragment[] {
  return sections.flatMap((section) =>
    section.paragraphs.map((text) => ({ heading: section.heading, text })),
  );
}
