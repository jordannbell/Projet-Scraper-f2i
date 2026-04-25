# Seekra - Modele Data SaaS vNext

## Objectif

Passer d'un modele centré `user_id` vers un modele **B2C + B2B multi-tenant** base sur `org_id`, sans casser les flux existants.

## Principes

- Compatibilite ascendante: ajouter avant de migrer/supprimer.
- RLS by design: acces par membership organisation.
- Idempotence et auditabilite des actions critiques.

## Nouvelles entites

### Multi-tenant
- `organizations`
  - `id`, `name`, `slug`, `owner_user_id`, `created_at`, `updated_at`
- `organization_memberships`
  - `org_id`, `user_id`, `role` (`owner`, `admin`, `member`, `viewer`), `status`
- `organization_invitations`
  - `org_id`, `email`, `role`, `token`, `expires_at`

### Billing / Entitlements
- `billing_customers`
  - `org_id`, `stripe_customer_id`, `email_billing`
- `billing_subscriptions`
  - `org_id`, `stripe_subscription_id`, `plan_code`, `status`, `current_period_end`
- `billing_webhook_events`
  - `stripe_event_id` UNIQUE, `type`, `payload`, `processed_at`, `status`
- `plan_entitlements`
  - `plan_code`, `feature_code`, `limit_value`

### Usage / Audit
- `usage_events` (append-only)
  - `idempotency_key`, `org_id`, `user_id`, `metric`, `quantity`, `occurred_at`
- `audit_log` (append-only)
  - `actor_user_id`, `org_id`, `action`, `target_type`, `target_id`, `meta_json`, `created_at`

## Evolution des tables existantes

- `user_preferences`: ajouter `org_id` (nullable puis mandatory).
- `job_matches`: ajouter `org_id`, `job_url_normalized`, index dedup metier.
- `apply_queue`: ajouter `org_id` + garder contrainte active anti-doublon.
- `user_platform_credentials`: ajouter `org_id` et `key_version` chiffrement.

## Contraintes SQL recommandees

- `UNIQUE(organizations.slug)`
- `UNIQUE(organization_memberships.org_id, organization_memberships.user_id)`
- `UNIQUE(billing_webhook_events.stripe_event_id)`
- `UNIQUE(job_matches.org_id, job_url_normalized)` (ou partiel selon statut)
- `CHECK` sur transitions de statuts metier si possible.

## Strategie de migration (phases)

### Phase 1 - Additive
- Creer tables org/billing/audit/usage.
- Ajouter `org_id` nullable aux tables existantes.
- Backfill: pour chaque user, creer org perso et mapper `org_id`.

### Phase 2 - Dual-write
- API ecrit `user_id` + `org_id`.
- RLS transitoire accepte ancien mode et nouveau mode.
- Ajouter indexes/constraints non bloquants.

### Phase 3 - Cutover
- Backend lit principalement par `org_id`.
- Plans et quotas lus depuis `billing_subscriptions` + `plan_entitlements`.
- RLS stricte organisationnelle.

### Phase 4 - Cleanup
- Supprimer chemins legacy non utilises.
- Rendre `org_id` NOT NULL sur tables coeur.
- Nettoyer colonnes transitoires.

## RLS cible (resume)

- `organization_memberships`: user voit ses memberships.
- Tables metier (`job_matches`, `apply_queue`, `user_preferences`): acces si membership actif sur `org_id`.
- Tables billing sensibles: acces `owner/admin` seulement.
- `audit_log` en lecture owner/admin, ecriture backend/service.

## Risques et mitigations

- **Risque**: drift donnees durant dual-write.  
  **Mitigation**: jobs de reconciliation journaliers + checksums.
- **Risque**: regression authz RLS.  
  **Mitigation**: tests RLS automatiques par role.
- **Risque**: webhooks Stripe en doublon.  
  **Mitigation**: idempotence `stripe_event_id` unique.
