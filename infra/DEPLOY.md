# Деплой

Прод — VPS с Ubuntu, домен `seo-analyzer.proclouds.ru`. Push в `main` публикует образы в GHCR, выкатка — вручную скриптом `infra/deploy.sh`.

## Новый сервер

A-запись домена должна указывать на сервер до первого запуска, иначе Let's Encrypt не выпустит сертификат.

```bash
curl -fsSL https://get.docker.com | sh

git clone --filter=blob:none --sparse https://github.com/htchtc052/seo-ai-analyzer.git /srv/seo-ai-analyzer
cd /srv/seo-ai-analyzer && git sparse-checkout set infra
cp infra/.env.example infra/.env && chmod 600 infra/.env
```

В `infra/.env` задать `POSTGRES_PASSWORD` и `REDIS_PASSWORD` через `openssl rand -hex 24` — пароли входят в URL подключения, поэтому только hex — и `LLM_API_KEY` из Timeweb AI Gateway. Затем `infra/deploy.sh`. Пустой `LLM_CHAT_MODEL` выключает рекомендации.

## Обновление

После зелёного **Publish images**:

```bash
ssh root@<VPS_HOST> 'cd /srv/seo-ai-analyzer && git pull --ff-only && infra/deploy.sh'
```

Новые переменные из `.env.example` на сервер сами не попадают. `docker compose down -v` удаляет базу и сертификаты.
