import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Article, ArticleSection } from '@semantic/contracts';
import { WebPageService } from '../web-page/web-page.service.js';
import { importFailed } from './article-import-failed.js';
import { ArticlesRepository } from './articles.repository.js';
import { extractArticle } from './html-sections.js';

const MIN_TEXT_LENGTH = 500;

type ArticleRow = NonNullable<Awaited<ReturnType<ArticlesRepository['findById']>>>;

@Injectable()
export class ArticlesService {
  constructor(
    @Inject(ArticlesRepository)
    private readonly articles: ArticlesRepository,
    @Inject(WebPageService)
    private readonly webPages: WebPageService,
  ) {}

  async import(url: string): Promise<Article> {
    const html = await this.webPages.fetchHtml(url);
    const extracted = extractArticle(html);
    if (!extracted) importFailed('Could not find article text on the page');

    const textLength = extracted.sections.flatMap((section) => section.paragraphs).join(' ').length;
    if (textLength < MIN_TEXT_LENGTH) {
      importFailed(`Found only ${textLength} characters of article text, at least ${MIN_TEXT_LENGTH} are needed`);
    }
    if (!extracted.title) importFailed('The page has no title');

    return toArticle(await this.articles.create({ sourceUrl: url, ...extracted }));
  }

  async findById(id: string): Promise<Article> {
    const article = await this.articles.findById(id);
    if (!article) {
      throw new NotFoundException({ code: 'ARTICLE_NOT_FOUND', message: 'Article not found' });
    }
    return toArticle(article);
  }
}

function toArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    sourceUrl: row.sourceUrl,
    title: row.title,
    sections: row.sections as ArticleSection[],
    importedAt: row.importedAt.toISOString(),
  };
}
