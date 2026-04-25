# Seekra - Plan Stripe end-to-end

## Objectif

Finaliser un circuit Stripe fiable: checkout -> webhook -> abonnement -> entitlements -> quotas.

## Plans cibles

- `free`: 0 EUR
- `starter`: 7.99 EUR
- `pro`: 14.99 EUR
- `elite`: 24.99 EUR

## Flux cible

1. Frontend demande creation checkout session.
2. Backend cree session Stripe et enregistre un `billing_intent`.
3. Webhook Stripe recu (`checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated/deleted`).
4. Event traite de facon idempotente.
5. `billing_subscriptions` et `plan_entitlements` mis a jour.
6. Middleware quota applique les droits en temps reel.

## Endpoints backend a mettre en place

- `POST /api/billing/checkout-session`
- `POST /api/billing/portal-session`
- `POST /api/stripe/webhook`
- `GET /api/billing/subscription`
- `GET /api/billing/invoices`

## Idempotence webhooks

- Table `billing_webhook_events` avec `stripe_event_id` UNIQUE.
- Workflow:
  - inserer event en `received`,
  - ignorer si deja traite,
  - traiter dans transaction,
  - marquer `processed`/`failed`.

## Entitlements et quotas

- Source de verite: `billing_subscriptions.plan_code`.
- Mapping quotas:
  - free: auto_apply_daily_limit=0, lm_monthly_limit=3
  - starter: auto_apply_daily_limit=5, lm_monthly_limit=inf
  - pro: auto_apply_daily_limit=20
  - elite: auto_apply_daily_limit=50
- Middleware unique backend pour verifier limites avant actions premium.

## Gestion erreurs et cas limites

- Paiement echoue -> conserver plan precedent, pas d'upgrade.
- Webhook recu hors ordre -> appliquer derniere date effective Stripe.
- Subscription deleted -> fallback automatique vers `free`.
- Timeout Stripe API -> retry exponentiel + dead-letter event.

## Security

- Verification signature webhook Stripe obligatoire.
- Secrets Stripe separes par environnement.
- Journaliser actions de billing dans `audit_log`.

## Tests requis

- Unit:
  - mapping plan -> entitlements,
  - parser webhook,
  - idempotence event.
- Integration:
  - checkout success,
  - downgrade/cancel,
  - webhook duplique.
- E2E:
  - utilisateur upgrade plan puis quota effectif sur auto-apply.

## Definition of done

- Le plan affiche la bonne valeur partout (frontend + backend + DB).
- Aucun event webhook duplique ne modifie 2 fois l'etat.
- Quotas auto-apply et LM respectent le plan actif.
