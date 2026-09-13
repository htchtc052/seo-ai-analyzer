# SEO AI Analyzer

Анализ семантической релевантности статьи поисковому запросу: оценка каждого абзаца через embeddings и рекомендации по сравнению с конкурентами от LLM. React, NestJS, Postgres, BullMQ и любой OpenAI-совместимый API моделей.

- Прод: https://seo-analyzer.proclouds.ru — модели через Timeweb AI Gateway: `text-embedding-3-large` и Qwen 3 Max.
- Продукт — [`docs/pdr.md`](docs/pdr.md), технические решения — [`docs/adr/`](docs/adr/README.md), сервер — [`infra/DEPLOY.md`](infra/DEPLOY.md).

## Запуск

Нужны Node.js 24, Docker и OpenAI-совместимый API моделей. `apps/api/.env.example` настроен на локальную Ollama с `embeddinggemma` и `qwen3:4b`; для Timeweb AI Gateway поменяйте `LLM_*`.

```sh
docker compose -f docker-compose.dev.yml up -d
cp apps/api/.env.example apps/api/.env
npm ci
npm run db:migrate -w @semantic/api
npm run dev
```

Интерфейс — http://localhost:5173. Без `LLM_CHAT_MODEL` рекомендации выключены, оценки считаются всегда.

## Проверки

```sh
npm run typecheck
npm test
npm run build
```

`npm test` ходит в Postgres и Redis из `docker-compose.dev.yml`; модели и интернет не нужны.

`npm run smoke:import -w @semantic/api` прогоняет импорт реальных страниц через запущенный API. Результат зависит от доступности сайтов.
