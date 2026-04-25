# Seekra - Socle Ops/SRE

## Objectif

Mettre en place un minimum SaaS production-ready: CI/CD, observabilite, runbooks et SLO.

## Topologie cible

- `frontend` (Vercel ou equivalent)
- `backend-api` (FastAPI)
- `backend-worker` (Playwright queue consumer)
- `supabase` (DB/Auth/Storage)
- `stripe` (billing)

## CI/CD v1

## Pipeline PR (obligatoire)
- Backend:
  - `python -m compileall`
  - tests unitaires rapides
  - smoke API
- Frontend:
  - `npm ci`
  - `npm run lint`
  - `npm run build`

## Pipeline main
- Build images API/worker taggees (`git-sha`).
- Deploy staging automatique.
- Smoke tests post-deploy.
- Promotion manuelle vers prod.

## Strategy release

- Deploy progressif (canary ou blue/green simple).
- Rollback via image precedente + migration safe.
- Migrations DB executees en step explicite, jamais implicite au boot.

## Observabilite v1

## Logs
- Format JSON unique (timestamp, service, level, correlation_id, user_id, queue_id, match_id).
- Redaction des donnees sensibles.

## Metrics
- API: p50/p95 latence, taux 5xx, req/min.
- Worker: queue depth, queue lag, taux `applied/needs_manual/failed`.
- Billing: webhooks recu/failed, conversion plan.

## Alerting
- Erreurs 5xx > seuil 5 min.
- Queue lag > seuil.
- Webhook Stripe failures consecutifs.
- Crash worker/no heartbeat.

## SLO initiaux

- API availability: 99.5%
- API p95 latence lecture: < 800ms
- Queue processing p95: < 5 min
- Billing webhook success: > 99%

## Runbooks minimaux

1. API down
2. Worker down / queue bloquee
3. Stripe webhook outage
4. Provider LLM outage
5. Scraper source break

Chaque runbook doit couvrir: detection, impact, mitigation, rollback, verification.

## Gestion des secrets

- Stockage dans secret manager par environnement.
- Rotation trimestrielle des cles critiques.
- Separation stricte dev/staging/prod.

## Definition of done

- Un incident critique declenche une alerte exploitable.
- Un rollback peut etre execute en < 15 minutes.
- Les dashboards affichent etat API + worker + billing en continu.
