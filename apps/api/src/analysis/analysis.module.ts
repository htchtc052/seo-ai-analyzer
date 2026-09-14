import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ArticlesModule } from '../articles/articles.module.js';
import { LlmModule } from '../llm/llm.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ANALYSIS_QUEUE } from './constants/analysis.constants.js';
import { AnalysisRunsRepository } from './analysis-runs.repository.js';
import { AnalysisController } from './analysis.controller.js';
import { AnalysisProcessor } from './analysis.processor.js';
import { AnalysisService } from './analysis.service.js';
import { RelevanceService } from './relevance.service.js';

@Module({
  imports: [ArticlesModule, LlmModule, PrismaModule, BullModule.registerQueue({ name: ANALYSIS_QUEUE })],
  controllers: [AnalysisController],
  providers: [AnalysisService, AnalysisRunsRepository, AnalysisProcessor, RelevanceService],
})
export class AnalysisModule {}
