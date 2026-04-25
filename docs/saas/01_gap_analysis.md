# Seekra - Matrice d'ecarts CDC vs code

Ce document compare le cahier des charges `Seekra_CahierDesCharges_v1.pdf` avec l'etat actuel du code.

## Synthese executive

- Le socle technique est solide pour un MVP (FastAPI, Next.js, Supabase, queue auto-apply, LLM).
- Le coeur B2C fonctionne deja en version initiale (auth, scraping, matching, auto-apply assiste, pages principales).
- Les ecarts majeurs sont sur: monétisation Stripe de bout-en-bout, parcours tracker avance, couche B2B, observabilite/SRE, et conformite RGPD operationnelle.

## Matrice fonctionnelle

| Module CDC | Etat actuel | Niveau | Ecart principal | Priorite |
|---|---|---|---|---|
| Onboarding & profil candidat | Present (`/register`, `/login`, `/auto-apply`, upload CV) | Partiel | Parsing CV DOCX, preferences avancees, robustesse validation | P1 |
| Dashboard offres agregees | Present (`/dashboard`, `POST /api/jobs/search`) | Partiel | Dedup inter-sources robuste, filtres complets (salaire/seniorite/secteur) | P1 |
| Matching score 0-100 | Present (`services/ai_matching.py`) | Partiel | Versionnement du scoring, explicabilite, fallback no-LLM | P1 |
| Auto-apply premium | Present (queue + Playwright + handlers) | Partiel | Taux `applied` encore limite, plusieurs sources en `needs_manual` | P0 |
| Tracker candidatures | Present minimal (`/matches`) | Partiel | Kanban complet, timeline, relances J+7, export avance | P1 |
| Espace documents IA | Faible couverture | Manquant | CV generator/corrector, LM standalone, simulateur entretien | P2 |
| Administration abonnements | Faible couverture | Manquant/partiel | Upgrade/downgrade, factures, entitlement par plan | P0 |
| B2B org/team | Absent | Manquant | Organisations, roles, permissions, billing entreprise | P2 |

## Matrice non-fonctionnelle

| Exigence CDC | Etat actuel | Ecart | Priorite |
|---|---|---|---|
| Dashboard < 2s | Variable | Pas de budget perf ni APM formalise | P1 |
| LM < 8s | Variable selon provider | Pas de SLO/SLA mesurable | P1 |
| Uptime 99.5% | Non mesure | Pas de SLO/alerting/runbook | P0 |
| RLS sur tables | Partiellement vrai | Usage service_role important, governance incomplete | P0 |
| Droit a l'oubli 72h | Non industrialise | Pas de workflow purge/export automatise | P0 |
| UX FR + EN | Present partiel | i18n incomplete et textes hardcodes | P1 |
| Observabilite | Logs basiques JSON/print | Pas de metrics/traces centralisees | P0 |
| CI/CD prod | Limite | Pas de pipeline qualite + release gates | P0 |

## Ecarts techniques critiques (P0)

1. **Monetisation incomplete**: plans Stripe non relies a un moteur d'entitlements.
2. **Auto-apply non homogène**: promesse produit > couverture reelle par plateforme.
3. **Ops insuffisants pour SaaS**: pas de SLO, alerting, runbooks, rollback formel.
4. **Conformite RGPD partielle**: suppression/export compte non automatisee bout-en-bout.
5. **Modele data non multi-tenant**: architecture encore orientee utilisateur individuel.

## Conclusion

Seekra est a un niveau **MVP technique avance**. Pour devenir un **vrai SaaS B2C+B2B**, le chantier prioritaire est:

- fermer la boucle revenue (Stripe -> quotas -> entitlement -> UI),
- fiabiliser le coeur auto-apply,
- et poser la fondation ops/conformite.
