import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import {
  articleImportRequestSchema,
  articleResponseSchema,
  type ArticleImportRequest,
} from '@semantic/contracts';
import { ResponseSchema } from '../common/response-schema.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { ArticlesService } from './articles.service.js';

@Controller('articles')
export class ArticlesController {
  constructor(
    @Inject(ArticlesService)
    private readonly articles: ArticlesService,
  ) {}

  @Post('import')
  @ResponseSchema(articleResponseSchema)
  async import(
    @Body(new ZodValidationPipe(articleImportRequestSchema)) input: ArticleImportRequest,
  ) {
    return { article: await this.articles.import(input.url) };
  }

  @Get(':id')
  @ResponseSchema(articleResponseSchema)
  async findById(@Param('id') id: string) {
    return { article: await this.articles.findById(id) };
  }
}
