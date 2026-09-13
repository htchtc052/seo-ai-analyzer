# ADR-0006: Модели через OpenAI-совместимый API

- Embeddings и рекомендации идут через пакет openai в любой OpenAI-совместимый API: локально — Ollama (/v1), на проде — Timeweb AI Gateway. Меняются только LLM_BASE_URL, LLM_API_KEY, LLM_EMBEDDING_MODEL и LLM_CHAT_MODEL, веток под провайдера в коде нет.
- JSON Schema ответа выводится из Zod-схемы через z.toJSONSchema() и передаётся как response_format json_schema; той же схемой проверяется ответ. Валидный по схеме ответ не гарантирует фактической точности.
- Запрос идёт с reasoning_effort: none: у qwen3 в Ollama с рассуждениями ответ шёл около пяти минут, без них — около минуты.
- Рекомендации включает сам факт настройки LLM_CHAT_MODEL, отдельного флага нет. Без неё GET /api/analyses/features отдаёт recommendations: false, форма скрывает конкурентов, а запуск с конкурентами отклоняется ошибкой RECOMMENDATIONS_DISABLED, а не джобом, который упал бы в очереди.
- Расход токенов каждого запроса пишется в лог API.
