import { Inject, Injectable } from '@nestjs/common';
import { LlmService } from '../llm/llm.service.js';
import { cosineSimilarity } from './lib/cosine-similarity.js';

@Injectable()
export class RelevanceService {
  constructor(
    @Inject(LlmService)
    private readonly llm: LlmService,
  ) {}

  async score(query: string, texts: string[]): Promise<number[]> {
    const [queryEmbedding, ...textEmbeddings] = await this.llm.embed([query, ...texts]);
    return textEmbeddings.map((embedding) => cosineSimilarity(queryEmbedding!, embedding));
  }
}
