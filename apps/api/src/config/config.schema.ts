import { z } from 'zod';

const unsetWhenEmpty = <T extends z.ZodType>(schema: T) => z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_HOST: z.string().min(1).default('127.0.0.1'),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  WEB_ORIGIN: z.url().default('http://localhost:5173'),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  OLLAMA_BASE_URL: z.url().default('http://127.0.0.1:11434'),
  OLLAMA_EMBEDDING_MODEL: z.string().trim().min(1).default('embeddinggemma'),
  LLM_BASE_URL: unsetWhenEmpty(z.url()),
  LLM_API_KEY: unsetWhenEmpty(z.string().trim().min(1)),
  LLM_CHAT_MODEL: unsetWhenEmpty(z.string().trim().min(1)),
}).transform(({ LLM_BASE_URL, LLM_API_KEY, LLM_CHAT_MODEL, ...config }, context) => {
  const values = [LLM_BASE_URL, LLM_API_KEY, LLM_CHAT_MODEL];
  if (values.every((value) => value === undefined)) return { ...config, LLM: undefined };
  if (!LLM_BASE_URL || !LLM_API_KEY || !LLM_CHAT_MODEL) {
    context.addIssue({ code: 'custom', message: 'LLM_BASE_URL, LLM_API_KEY and LLM_CHAT_MODEL must be set together' });
    return z.NEVER;
  }
  return { ...config, LLM: { baseUrl: LLM_BASE_URL, apiKey: LLM_API_KEY, model: LLM_CHAT_MODEL } };
});

export type AppConfig = z.infer<typeof configSchema>;

export function validateConfig(input: Record<string, unknown>): AppConfig {
  const result = configSchema.safeParse(input);
  if (!result.success) {
    throw new Error(`Invalid application configuration:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
