import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ArticlesModule } from '../articles/articles.module.js';
import { OllamaModule } from '../ollama/ollama.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ANALYSIS_QUEUE } from './analysis-queue.js';
import { AnalysisRunsRepository } from './analysis-runs.repository.js';
import { AnalysisController } from './analysis.controller.js';
import { AnalysisProcessor } from './analysis.processor.js';
import { AnalysisService } from './analysis.service.js';
import { RecommendationService } from './recommendation.service.js';
import { RelevanceService } from './relevance.service.js';

@Module({
  imports: [
    ArticlesModule,
    OllamaModule,
    PrismaModule,
    BullModule.registerQueue({ name: ANALYSIS_QUEUE }),
  ],
  controllers: [AnalysisController],
  providers: [
    AnalysisService,
    AnalysisRunsRepository,
    AnalysisProcessor,
    RelevanceService,
    RecommendationService,
  ],
})
export class AnalysisModule {}
