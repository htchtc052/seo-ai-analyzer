# ADR-0006: Рекомендации LLM

- Рекомендации ходят в любой OpenAI-совместимый chat API через пакет openai: локально — Ollama (/v1), на проде — Timeweb AI Gateway. Меняются только LLM_BASE_URL, LLM_API_KEY и LLM_CHAT_MODEL, веток под провайдера в коде нет. Embeddings остаются в Ollama: DeepSeek и Qwen их не дают, а embeddinggemma помещается на маленький сервер.
- JSON Schema ответа выводится из Zod-схемы через z.toJSONSchema() и передаётся как response_format json_schema; той же схемой проверяется ответ. Валидный по схеме ответ не гарантирует фактической точности.
- Запрос идёт с reasoning_effort: none: у qwen3 в Ollama с рассуждениями ответ шёл около пяти минут, без них — около минуты.
- Рекомендации включает сам факт настройки LLM_*, отдельного флага нет. Без них GET /api/analyses/features отдаёт recommendations: false, форма скрывает конкурентов, а запуск с конкурентами отклоняется ошибкой RECOMMENDATIONS_DISABLED, а не джобом, который упал бы в очереди.
