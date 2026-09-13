# Деплой

## Схема

Прод — один заменяемый VPS на Ubuntu с адресом `seo-analyzer.proclouds.ru`.

- Push в `main` запускает workflow **Publish images**: typecheck, миграции и тесты на Postgres и Redis в Actions, затем сборка образов `ghcr.io/htchtc052/seo-ai-analyzer-api:latest` (NestJS и Prisma CLI для миграций) и `ghcr.io/htchtc052/seo-ai-analyzer-web:latest` (статика в nginx). Публикация ничего не выкатывает.
- Деплой — ручной workflow **Deploy**: по SSH скачивает образы, применяет миграции временным контейнером из образа api, пересоздаёт контейнеры и проверяет `https://<APP_DOMAIN>/api/health`. Если миграция упала, работающие контейнеры не заменяются.
- VPS ничего не собирает. На нём только папка `infra` этого репозитория (sparse checkout), `.env` и Docker volumes.
- Traefik выпускает сертификат Let's Encrypt, отправляет `/api` в контейнер API, остальное — в nginx со статикой web.
- Ollama работает на хосте VPS, API ходит к ней через `host.docker.internal`.

```
/srv/seo-ai-analyzer/
└── infra   ← docker-compose.yml и прод-.env
```

## Новый сервер

A-запись `seo-analyzer.proclouds.ru` должна указывать на сервер до первого запуска: Let's Encrypt проверяет домен по HTTP.

Docker:

```bash
curl -fsSL https://get.docker.com | sh
```

Docker Hub отдаёт `429` анонимным клиентам с адресов Timeweb. Если `docker compose pull` упирается в лимит, пропишите зеркало `https://dockerhub.timeweb.cloud` в `/etc/docker/daemon.json` и перезапустите Docker.

Ollama на хосте. Она должна слушать не только loopback, иначе контейнер до неё не достучится; снаружи порт закрывает файрвол:

```bash
curl -fsSL https://ollama.com/install.sh | sh
mkdir -p /etc/systemd/system/ollama.service.d
printf '[Service]\nEnvironment="OLLAMA_HOST=0.0.0.0:11434"\n' > /etc/systemd/system/ollama.service.d/override.conf
systemctl daemon-reload && systemctl restart ollama
ollama pull embeddinggemma
ollama pull qwen3:4b
```

Файрвол: наружу только SSH, 80 и 443; Ollama доступна только из Docker-сетей.

```bash
ufw allow OpenSSH
ufw allow 80,443/tcp
ufw allow from 172.16.0.0/12 to any port 11434 proto tcp
ufw enable
```

Инфраструктура и секреты:

```bash
git clone --filter=blob:none --sparse https://github.com/htchtc052/seo-ai-analyzer.git /srv/seo-ai-analyzer
cd /srv/seo-ai-analyzer
git sparse-checkout set infra
cd infra
cp .env.example .env && chmod 600 .env
```

В `.env` заполнить:

- `ACME_EMAIL` — реальный ящик, сюда Let's Encrypt пишет об истечении сертификата;
- `POSTGRES_PASSWORD`, `REDIS_PASSWORD` — `openssl rand -hex 24`. Пароли подставляются в URL подключения, поэтому только hex.

Публичный ключ, парный секрету `VPS_SSH_KEY`, должен лежать в `/root/.ssh/authorized_keys`.

Первый запуск — workflow **Deploy** или те же команды вручную:

```bash
cd /srv/seo-ai-analyzer/infra
docker compose pull api web
docker compose up -d --wait postgres redis
docker compose run --rm api npx --no-install prisma migrate deploy
docker compose up -d
curl --fail https://seo-analyzer.proclouds.ru/api/health
```

## GitHub

Секреты репозитория `htchtc052/seo-ai-analyzer` для **Deploy**:

- `VPS_HOST` — текущий публичный IP сервера; меняется при переезде;
- `VPS_SSH_KEY` — приватный ключ, которым можно войти как `root`.

GHCR создаёт пакеты приватными. После первой публикации откройте каждый пакет (Packages → `seo-ai-analyzer-api`, `seo-ai-analyzer-web` → Package settings) и сделайте его публичным: тогда VPS скачивает образы без логина и токенов на сервере.

## Обновление

1. Push в `main`, дождаться зелёного **Publish images**.
2. Actions → **Deploy** → Run workflow, или из терминала:

```bash
gh workflow run deploy.yml --repo htchtc052/seo-ai-analyzer --ref main
gh run watch --repo htchtc052/seo-ai-analyzer
```

Новая переменная в `.env.example` сама на сервер не попадает — её нужно дописать в `/srv/seo-ai-analyzer/infra/.env`.

## Данные

- Образы можно скачать заново в любой момент; база, Redis, сертификаты и `.env` живут только на сервере. Полная копия — образ диска Timeweb при остановленном стеке (`docker compose stop`).
- Никогда не запускать `docker compose down -v`: удалятся база и сертификаты.
- Сброс базы — только по явному решению:

```bash
cd /srv/seo-ai-analyzer/infra
docker compose pull api
docker compose down
docker volume rm seo-ai-analyzer_pg_data seo-ai-analyzer_redis_data
docker compose up -d --wait postgres redis
docker compose run --rm api npx --no-install prisma migrate deploy
docker compose up -d
```
