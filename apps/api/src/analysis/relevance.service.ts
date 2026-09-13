import { Inject, Injectable } from '@nestjs/common';
import { OllamaService } from '../ollama/ollama.service.js';
import { cosineSimilarity } from './lib/cosine-similarity.js';

@Injectable()
export class RelevanceService {
  constructor(
    @Inject(OllamaService)
    private readonly ollama: OllamaService,
  ) {}

  async score(query: string, texts: string[]): Promise<number[]> {
    const [queryEmbedding, ...textEmbeddings] = await this.ollama.embed([query, ...texts]);
    return textEmbeddings.map((embedding) => cosineSimilarity(queryEmbedding!, embedding));
  }
}
