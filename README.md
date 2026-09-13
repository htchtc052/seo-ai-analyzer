# Semantic Relevance

Учебный проект: анализ семантической релевантности статей с React, NestJS и Ollama.

Продуктовые требования и объём — в [`docs/pdr.md`](docs/pdr.md). Развилки реализации — в [`docs/adr/`](docs/adr/).

## Запуск

Требуется Node.js 24, npm, Docker и локальная Ollama. Из корня репозитория:

```sh
docker compose -f docker-compose.dev.yml up -d
cp apps/api/.env.example apps/api/.env
npm ci
npm run db:migrate -w @semantic/api
npm run dev
```

Интерфейс: http://localhost:5173. API: http://127.0.0.1:3001/api/health. Vite проксирует `/api` на NestJS.

Docker поднимает только Postgres (`5433`) и Redis (`6380`). API и веб запускаются через `npm run dev`, контейнеров для приложения нет.

Ollama работает на хосте (`ollama serve`) с моделями `embeddinggemma` и `qwen3:4b`. Модели меняются через `OLLAMA_EMBEDDING_MODEL` и `OLLAMA_CHAT_MODEL` в `apps/api/.env`. Без `OLLAMA_CHAT_MODEL` рекомендации выключены: форма не предлагает конкурентов, API отклоняет их с `RECOMMENDATIONS_DISABLED`, анализ считает только оценки.

## Как устроен анализ

1. Статьи загружаются по ссылке кнопкой Fetch: бэкенд скачивает страницу, Readability вырезает основной текст, результат сохраняется в Postgres. Основная статья обязательна, конкуренты (до двух) — нет.
2. Run analysis синхронно считает эмбеддинги запроса и абзацев основной статьи и сохраняет запуск с оценками.
3. Если загружены конкуренты, в очередь BullMQ уходит джоб на рекомендации (id джоба = id запуска). Воркер вызывает LLM и дописывает недостающие темы и рекомендации. Без конкурентов запуск заканчивается на оценках.
4. Страница запуска показывает оценки сразу, а пока рекомендаций нет — состояние джоба BullMQ.

## API

- `GET /api/health`
- `POST /api/articles/import` — `{ url }`, `GET /api/articles/:id`
- `POST /api/analyses` — `{ articleId, query, competitorIds, audience, purpose, niche }`
- `GET /api/analyses` — последние 50 запусков
- `GET /api/analyses/features` — `{ recommendations }`: включены ли рекомендации на этом сервере
- `GET /api/analyses/:id` — запуск с оценками по абзацам, конкурентами, рекомендациями и состоянием джоба

## Проверки и сборка

Postgres и Redis должны быть подняты: `npm test` ходит в них по-настоящему. Ollama и интернет для тестов не нужны.

```sh
npm run typecheck
npm test
npm run build
```

Смоук импорта по реальным сайтам (нужен запущенный API):

```sh
npm run smoke:import -w @semantic/api
```

Он проверяет, что импортируются все ссылки тем-примеров из `packages/examples/topics.json` (те же, что предлагает форма), а случаи из `apps/api/src/import.smoke.ts` отклоняются. Результат зависит от доступности сайтов.

`npm audit` показывает high-severity предупреждение от `deepmerge-ts` через `@prisma/config`. Это транзитивная зависимость CLI Prisma: в прод-образе CLI нужен только для `migrate deploy`, и через него проходит только наш `schema.prisma`.

## Деплой

Push в `main` проверяет код и публикует образы `api` и `web` в GHCR (`.github/workflows/publish.yml`), выкатка на VPS — `infra/deploy.sh`, запускаемый вручную по SSH. Dockerfile лежат в `apps/<app>/.docker/`, прод-compose с Traefik — в `infra/`. Порядок настройки сервера и обновления — [`infra/DEPLOY.md`](infra/DEPLOY.md).

Прод-образы можно собрать локально:

```sh
docker build -f apps/api/.docker/Dockerfile -t seo-ai-analyzer-api .
docker build -f apps/web/.docker/Dockerfile -t seo-ai-analyzer-web .
```
