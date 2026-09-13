# SEO AI Analyzer

Анализ семантической релевантности статьи поисковому запросу: оценка каждого абзаца через embeddings и рекомендации по сравнению с конкурентами от LLM. React, NestJS, Postgres, BullMQ, Ollama.

- Прод: https://seo-analyzer.proclouds.ru — на сервере 2 ГБ памяти, поэтому рекомендации там выключены и считаются только оценки. Полный сценарий — локально.
- Продукт — [`docs/pdr.md`](docs/pdr.md), технические решения — [`docs/adr/`](docs/adr/README.md), сервер — [`infra/DEPLOY.md`](infra/DEPLOY.md).

## Запуск

Нужны Node.js 24, Docker и Ollama на хосте с моделями `embeddinggemma` и `qwen3:4b`.

```sh
docker compose -f docker-compose.dev.yml up -d
cp apps/api/.env.example apps/api/.env
npm ci
npm run db:migrate -w @semantic/api
npm run dev
```

Интерфейс — http://localhost:5173. Без `OLLAMA_CHAT_MODEL` в `apps/api/.env` рекомендации выключены.

## Проверки

```sh
npm run typecheck
npm test
npm run build
```

`npm test` ходит в Postgres и Redis из `docker-compose.dev.yml`; Ollama и интернет не нужны.

`npm run smoke:import -w @semantic/api` прогоняет импорт реальных страниц через запущенный API. Результат зависит от доступности сайтов.
