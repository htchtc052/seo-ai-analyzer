import { Module } from '@nestjs/common';
import { ArticleExtractorService } from './article-extractor.service.js';
import { WebPageService } from './web-page.service.js';

@Module({
  providers: [WebPageService, ArticleExtractorService],
  exports: [WebPageService],
})
export class WebPageModule {}
