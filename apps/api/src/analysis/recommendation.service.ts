import { Inject, Injectable } from '@nestjs/common';
import { recommendationSchema, type Recommendation } from '@seo-ai-analyzer/contracts';
import { LlmService } from '../llm/llm.service.js';
import { buildRecommendationPrompt, type RecommendationPromptInput } from './lib/recommendation-prompt.js';

@Injectable()
export class RecommendationService {
  constructor(
    @Inject(LlmService)
    private readonly llm: LlmService,
  ) {}

  get enabled(): boolean {
    return this.llm.chatEnabled;
  }

  recommend(input: RecommendationPromptInput): Promise<Recommendation> {
    return this.llm.completeStructured('recommendation', buildRecommendationPrompt(input), recommendationSchema);
  }
}
