import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../config/config.schema.js';

type EmbedResponse = { embeddings: number[][] };

@Injectable()
export class OllamaService {
  constructor(
    @Inject(ConfigService)
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async embed(texts: string[]): Promise<number[][]> {
    const response = await fetch(
      new URL('/api/embed', this.config.get('OLLAMA_BASE_URL', { infer: true })),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.get('OLLAMA_EMBEDDING_MODEL', { infer: true }),
          input: texts,
        }),
      },
    );
    if (!response.ok) {
      throw new Error(`Ollama embeddings request failed: ${response.status} ${await response.text()}`);
    }

    const body = (await response.json()) as EmbedResponse;
    return body.embeddings;
  }
}
