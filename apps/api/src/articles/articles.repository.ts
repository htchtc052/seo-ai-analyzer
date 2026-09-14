import { Inject, Injectable } from '@nestjs/common';
import type { ArticleSection } from '@seo-ai-analyzer/contracts';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ArticlesRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  create(data: { sourceUrl: string; title: string; sections: ArticleSection[] }) {
    return this.prisma.article.create({ data });
  }

  findById(id: string) {
    return this.prisma.article.findUnique({ where: { id } });
  }
}
