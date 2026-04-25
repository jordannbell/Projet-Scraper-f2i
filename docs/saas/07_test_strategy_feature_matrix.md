# Seekra - Strategie de tests par feature

## Objectif

Assurer une couverture test par fonctionnalite produit (B2C+B2B), avec une pyramide de tests exploitable en CI.

## Pyramide cible

- **Unit tests** (rapides): logique metier services (matching, quotas, transitions statuts).
- **Integration tests**: API FastAPI + DB test.
- **E2E tests**: parcours utilisateur frontend -> backend (auth, matching, auto-apply).
- **Synthetic prod checks**: healthchecks et parcours critiques monitorés.

## Matrice de couverture par feature

| Feature | Unit | Integration API | E2E UI/API | Owner |
|---|---|---|---|---|
| Auth signup/login/logout | Oui | Oui | Oui | FE+BE |
| Upload CV + parsing IA | Oui | Oui | Oui | BE |
| Search jobs | Oui | Oui | Oui | BE |
| Matching score + lettre | Oui | Oui | Oui | BE |
| Matches approve/reject | Oui | Oui | Oui | BE |
| Auto-apply queue + processor | Oui | Oui | Oui | BE |
| Anti-doublons queue/campagne | Oui | Oui | Oui | BE |
| Billing checkout/webhook | Oui | Oui | Oui | BE |
| Entitlements/quotas plans | Oui | Oui | Oui | BE |
| Tracker candidatures | Oui | Oui | Oui | FE+BE |
| RGPD export/delete | Oui | Oui | Oui | BE |

## Suites minimales a maintenir

## Backend
- `test_api_contract_*`: statuts et payloads des endpoints.
- `test_queue_*`: dedup, claim atomique, transitions statuts.
- `test_billing_*`: idempotence webhooks Stripe.
- `test_authz_*`: routes protegees, RLS/scopes.

## Frontend
- `test_auth_journey`: login/register/logout.
- `test_dashboard_journey`: recherche + filtrage + recommandation.
- `test_auto_apply_journey`: profil + consent + run-now.
- `test_matches_journey`: approve/reject + affichage statuts.

## Donnees de test

- Jeux de donnees seedes (utilisateur free, starter, pro, org admin).
- Fixtures d'offres standardisees (FT/Indeed/HelloWork) avec cas dedup.
- Fixtures webhooks Stripe (`payment_succeeded`, `subscription_deleted`, duplicates).

## Gates CI proposes

- PR: unit + integration critiques (<= 10 min).
- Main: unit + integration complete + build frontend/backend.
- Nightly: E2E end-to-end + charge legere + rapport couverture.

## KPI qualite

- Couverture backend critique > 70% (services coeur > 85%).
- Flaky tests < 2%.
- Temps pipeline PR < 12 min.
- 0 regression P0 en production.
