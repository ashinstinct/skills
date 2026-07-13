---
name: postiz-app-install
description: Self-hosting Postiz, the open-source social media scheduling tool
metadata:
  tags: postiz, self-hosting, docker, docker-compose, social-media-scheduler
---

## When to use

Use this skill when asked to install, self-host, or deploy Postiz
(https://github.com/gitroomhq/postiz-app) — an open-source social media
scheduling and management platform.

## Prerequisites

- Docker Engine and the Docker Compose plugin (`docker compose`, not the
  legacy standalone `docker-compose`).
- A machine reachable at whatever hostname/IP you'll configure as `MAIN_URL`
  (for local testing, `localhost` is fine).

## Quick start (Docker Compose)

The officially maintained compose setup lives in a dedicated repo,
`gitroomhq/postiz-docker-compose`. It bundles Postiz plus Postgres, Redis,
and a full Temporal stack (Postiz uses Temporal for scheduled/async jobs).

```bash
git clone https://github.com/gitroomhq/postiz-docker-compose
cd postiz-docker-compose
docker compose up -d
```

Once the containers are healthy, open `http://localhost:4007` (mapped from
container port 5000) and create the first account.

To stop: `docker compose down`. Data persists in named volumes
(`postgres-volume`, `postiz-redis-data`, `postiz-config`, `postiz-uploads`,
etc.) unless you also pass `-v`.

## Configuring environment variables

All configuration is via environment variables on the `postiz` service.
Three ways to set them (can be combined):

- **A** — inline under `environment:` in `docker-compose.yaml`.
- **B** — a `postiz.env` file mounted at `/config` for the `postiz`
  container only.
- **C** — a `.env` file next to `docker-compose.yaml` (not recommended by
  upstream).

After changing variables, recreate the containers (`docker compose down &&
docker compose up -d`) — a restart alone won't pick up compose-level env
changes.

### Required settings

```yaml
MAIN_URL: 'http://localhost:4007'
FRONTEND_URL: 'http://localhost:4007'
NEXT_PUBLIC_BACKEND_URL: 'http://localhost:4007/api'
JWT_SECRET: 'random string that is unique to every install'
DATABASE_URL: 'postgresql://postiz-user:postiz-password@postiz-postgres:5432/postiz-db-local'
REDIS_URL: 'redis://postiz-redis:6379'
BACKEND_INTERNAL_URL: 'http://localhost:3000'
TEMPORAL_ADDRESS: 'temporal:7233'
IS_GENERAL: 'true'
DISABLE_REGISTRATION: 'false'
RUN_CRON: 'true'
```

Replace `MAIN_URL`/`FRONTEND_URL`/`NEXT_PUBLIC_BACKEND_URL` with the
externally-reachable URL when deploying beyond localhost (e.g. behind a
reverse proxy), and generate a real random `JWT_SECRET`.

### Storage

Defaults to local disk:

```yaml
STORAGE_PROVIDER: 'local'
UPLOAD_DIRECTORY: '/uploads'
NEXT_PUBLIC_UPLOAD_DIRECTORY: '/uploads'
```

Or use Cloudflare R2 by setting `STORAGE_PROVIDER: 'cloudflare'` plus
`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ACCESS_KEY`,
`CLOUDFLARE_SECRET_ACCESS_KEY`, `CLOUDFLARE_BUCKETNAME`,
`CLOUDFLARE_BUCKET_URL`, `CLOUDFLARE_REGION`.

### Social platform integrations (optional)

Leave blank to disable a platform. Fill in only the ones you need — each
requires registering an OAuth app with that platform and pointing its
redirect URL at your Postiz instance:

`X_API_KEY` / `X_API_SECRET`, `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`,
`REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET`, `GITHUB_CLIENT_ID` /
`GITHUB_CLIENT_SECRET`, `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET`,
`THREADS_APP_ID` / `THREADS_APP_SECRET`, `YOUTUBE_CLIENT_ID` /
`YOUTUBE_CLIENT_SECRET`, `TIKTOK_CLIENT_ID` / `TIKTOK_CLIENT_SECRET`,
`PINTEREST_CLIENT_ID` / `PINTEREST_CLIENT_SECRET`, `DISCORD_CLIENT_ID` /
`DISCORD_CLIENT_SECRET` / `DISCORD_BOT_TOKEN_ID`, `SLACK_ID` /
`SLACK_SECRET` / `SLACK_SIGNING_SECRET`, `MASTODON_URL` /
`MASTODON_CLIENT_ID` / `MASTODON_CLIENT_SECRET`, `BEEHIIVE_API_KEY` /
`BEEHIIVE_PUBLICATION_ID`, `DRIBBBLE_CLIENT_ID` / `DRIBBBLE_CLIENT_SECRET`.

### Other optional settings

- `OPENAI_API_KEY` — enables AI-assisted content features.
- `API_LIMIT` — API rate limit.
- Short-link providers: `DUB_TOKEN`/`DUB_API_ENDPOINT`, `SHORT_IO_SECRET_KEY`,
  `KUTT_API_KEY`/`KUTT_API_ENDPOINT`, `LINK_DRIP_API_KEY`/`LINK_DRIP_API_ENDPOINT`.
- Generic OAuth/Authentik login: `POSTIZ_GENERIC_OAUTH`, `POSTIZ_OAUTH_URL`,
  `POSTIZ_OAUTH_AUTH_URL`, `POSTIZ_OAUTH_TOKEN_URL`,
  `POSTIZ_OAUTH_USERINFO_URL`, `POSTIZ_OAUTH_CLIENT_ID`,
  `POSTIZ_OAUTH_CLIENT_SECRET`.
- Stripe billing (only relevant for multi-tenant/SaaS deployments):
  `FEE_AMOUNT`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`,
  `STRIPE_SIGNING_KEY`, `STRIPE_SIGNING_KEY_CONNECT`.
- Sentry debugging: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_SPOTLIGHT` (pair with
  the `spotlight` service, started via `docker compose --profile debug up`).

## Ports

| Port | Service |
| --- | --- |
| 4007 | Postiz web app (host) → 5000 (container) |
| 8080 | Temporal Web UI |
| 7233 | Temporal gRPC endpoint |

## Alternative install paths

- **One-click PaaS deploy**: Railway offers a one-click Postiz template
  (search "Deploy Postiz" on railway.com) if a VPS isn't available.
- **Upgrading**: when pulling a newer image on an existing install, check
  `docs.postiz.com/installation/migration` first — schema/env changes
  sometimes require manual steps.
- **From source (development only)**: clone
  `github.com/gitroomhq/postiz-app` itself (a pnpm monorepo — NextJS
  frontend, NestJS backend, Prisma/Postgres, Temporal) and use its
  `docker-compose.dev.yaml`, or `pnpm install && pnpm run dev` per the
  repo's README. Not recommended for production use — prefer the
  dedicated `postiz-docker-compose` repo above.

## Troubleshooting

- Containers stuck unhealthy on first boot: Temporal + Elasticsearch can
  take 1-2 minutes to become healthy; the `postiz` service's `start_period`
  is set to 120s to accommodate this — give it time before assuming failure.
- Changed an env var but nothing happened: you edited but only restarted —
  run `docker compose down && docker compose up -d` to force recreation.
- Check logs per-service: `docker compose logs -f postiz`.
