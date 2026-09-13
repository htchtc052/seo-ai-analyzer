import { Inject, Injectable } from '@nestjs/common';
import { recommendationSchema, type Recommendation } from '@semantic/contracts';
import { OllamaService } from '../ollama/ollama.service.js';
import { buildRecommendationPrompt, type RecommendationPromptInput } from './recommendation-prompt.js';

@Injectable()
export class RecommendationService {
  constructor(
    @Inject(OllamaService)
    private readonly ollama: OllamaService,
  ) {}

  recommend(input: RecommendationPromptInput): Promise<Recommendation> {
    return this.ollama.chatStructured(buildRecommendationPrompt(input), recommendationSchema);
  }
}
