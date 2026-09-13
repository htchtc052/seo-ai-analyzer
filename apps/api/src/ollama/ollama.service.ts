import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z, type ZodType } from 'zod';
import type { AppConfig } from '../config/config.schema.js';

type EmbedResponse = { embeddings: number[][] };
type ChatResponse = { message: { content: string } };

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

  async chatStructured<T>(model: string, prompt: string, schema: ZodType<T>): Promise<T> {
    const response = await fetch(
      new URL('/api/chat', this.config.get('OLLAMA_BASE_URL', { infer: true })),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
          think: false,
          format: z.toJSONSchema(schema),
        }),
      },
    );
    if (!response.ok) {
      throw new Error(`Ollama chat request failed: ${response.status} ${await response.text()}`);
    }

    const body = (await response.json()) as ChatResponse;
    return schema.parse(JSON.parse(body.message.content));
  }
}
