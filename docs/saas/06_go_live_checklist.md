# Seekra - Checklist Go-Live SaaS

## 1) Produit

- [ ] Parcours inscription -> 1ere candidature valide en moins de 5 minutes.
- [ ] Matrice plateformes publiee (auto complet, semi-auto, manuel guide).
- [ ] Messages UI honnetes sur limites et statuts (`applied`, `needs_manual`, `failed`).
- [ ] Support FR complet sur ecrans critiques.

## 2) Billing et plans

- [ ] Plans Stripe crees et verifies (free/starter/pro/elite).
- [ ] Webhooks verifies en staging et prod.
- [ ] Entitlements et quotas controles backend.
- [ ] Downgrade et annulation testees bout-en-bout.

## 3) Securite

- [ ] Secrets en coffre, pas de secret en dur dans repo.
- [ ] Verification signature Stripe active.
- [ ] Acces admin/service-role limite et audite.
- [ ] Chiffrement credentials plateforme avec rotation versionnee.

## 4) RGPD / legal

- [ ] CGU/Politique de confidentialite a jour et accessibles.
- [ ] Export donnees utilisateur operationnel.
- [ ] Suppression compte + purge donnees <= 72h operationnelle.
- [ ] Journal des actions critiques disponible.

## 5) Fiabilite technique

- [ ] CI/CD vert (backend/frontend/worker).
- [ ] SLO monitorables et dashboards prets.
- [ ] Alertes critiques configurees (API, worker, stripe, queue).
- [ ] Runbooks incidents valides par exercice.

## 6) Data quality

- [ ] Dedup offres active et verifiee.
- [ ] Anti-doublons queue verifie en concurrence.
- [ ] Integrite statuts `job_matches` et `apply_queue` testee.
- [ ] Backups/restauration testes.

## 7) Support et operations

- [ ] Process support (triage, SLA support, escalade).
- [ ] Templates emails transactionnels valides.
- [ ] Canal incident interne defini.
- [ ] Changelog de release publie.

## 8) KPI lancement

- [ ] Activation J1: `% users avec 1ere candidature envoyee`.
- [ ] Conversion Free -> paid.
- [ ] Taux `applied` par plateforme.
- [ ] Taux erreur critique (5xx, worker crash, webhook failed).
- [ ] Churn mensuel et ARPU.
