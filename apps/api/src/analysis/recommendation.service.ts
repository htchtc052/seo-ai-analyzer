import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { recommendationSchema, type Recommendation } from '@semantic/contracts';
import type { AppConfig } from '../config/config.schema.js';
import { OllamaService } from '../ollama/ollama.service.js';
import { buildRecommendationPrompt, type RecommendationPromptInput } from './lib/recommendation-prompt.js';

@Injectable()
export class RecommendationService {
  constructor(
    @Inject(OllamaService)
    private readonly ollama: OllamaService,
    @Inject(ConfigService)
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  get enabled(): boolean {
    return this.config.get('OLLAMA_CHAT_MODEL', { infer: true }) !== undefined;
  }

  recommend(input: RecommendationPromptInput): Promise<Recommendation> {
    const model = this.config.get('OLLAMA_CHAT_MODEL', { infer: true });
    if (model === undefined) throw new Error('OLLAMA_CHAT_MODEL is not configured');
    return this.ollama.chatStructured(model, buildRecommendationPrompt(input), recommendationSchema);
  }
}
