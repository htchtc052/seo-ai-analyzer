import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { z, type ZodType } from 'zod';
import type { AppConfig } from '../config/config.schema.js';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly chat: { client: OpenAI; model: string } | undefined;

  constructor(
    @Inject(ConfigService)
    config: ConfigService<AppConfig, true>,
  ) {
    const llm = config.get('LLM', { infer: true });
    this.chat = llm && { client: new OpenAI({ baseURL: llm.baseUrl, apiKey: llm.apiKey }), model: llm.model };
  }

  get enabled(): boolean {
    return this.chat !== undefined;
  }

  async completeStructured<T>(name: string, prompt: string, schema: ZodType<T>): Promise<T> {
    if (!this.chat) throw new Error('LLM chat model is not configured');
    const completion = await this.chat.client.chat.completions.create({
      model: this.chat.model,
      messages: [{ role: 'user', content: prompt }],
      reasoning_effort: 'none',
      response_format: {
        type: 'json_schema',
        json_schema: { name, strict: true, schema: z.toJSONSchema(schema) },
      },
    });
    this.logger.log(`${this.chat.model} tokens: prompt ${completion.usage?.prompt_tokens}, completion ${completion.usage?.completion_tokens}`);
    const content = completion.choices[0]?.message.content;
    if (!content) throw new Error(`LLM returned no content (finish reason: ${completion.choices[0]?.finish_reason})`);
    return schema.parse(JSON.parse(content));
  }
}
