import json

# FRENCH JSON
fr_path = "frontend/locales/fr.json"
with open(fr_path, 'r', encoding='utf-8') as f:
    fr_data = json.load(f)

fr_data["about"] = {
    "title1": "À propos de",
    "subtitle": "L'intelligence artificielle au service de votre carrière. Ne cherchez plus, trouvez.",
    "context_title": "Le Contexte du Projet",
    "context_p1": "Le marché de l'emploi est devenu une jungle complexe. Les candidats passent des heures à scroller sur des dizaines de sites, souvent pour tomber sur des offres qui ne correspondent pas vraiment à leurs attentes ou qui sont déjà pourvues.",
    "context_p2": "est né d'un constat simple : la recherche d'emploi devrait être proactive et intelligente, pas épuisante.",
    "context_p3": "En combinant la puissance du scraping éthique et des algorithmes de recommandation avancés, nous avons créé une plateforme qui ne se contente pas de lister des offres, mais qui",
    "context_p3_em": "comprend",
    "context_p3_end": "votre profil et vous connecte aux opportunités les plus pertinentes.",
    "mission_title": "Notre Mission",
    "precision_title": "Précision",
    "precision_desc": "Fini le bruit. Uniquement des offres qui matchent vos compétences.",
    "speed_title": "Rapidité",
    "speed_desc": "Automatisez la recherche et gagnez des heures précieuses chaque semaine.",
    "privacy_title": "Confidentialité",
    "privacy_desc": "Vos données vous appartiennent. Pas de revente, pas de spam.",
    "founder": "Fondateur & Lead Dev",
    "status": "En mission",
    "contact": "Me Contacter"
}

fr_data["dashboard"] = {
    "filters": "Filtres",
    "clear_all": "Tout effacer",
    "skills_label_fr": "Vos atouts clés (Compétences)",
    "skills_hint": "Séparez vos compétences par des virgules.",
    "skills_placeholder": "python, sql, power bi...",
    "contract_type": "Type de Contrat",
    "date_posted": "Date de Publication",
    "any_time": "N'importe quand",
    "last_24h": "Dernières 24 heures",
    "last_7d": "Les 7 derniers jours",
    "last_30d": "Les 30 derniers jours",
    "job_alerts": "Alertes d'emploi",
    "job_alerts_desc": "Soyez notifié des nouvelles offres correspondant à ces filtres.",
    "create_alert": "Créer une alerte",
    "jobs_title": "{keyword} Emplois",
    "all_jobs": "Tous les emplois",
    "showing_results": "Affichage de {count} résultats",
    "search_placeholder": "Titre du poste, mots-clés",
    "sort_by": "Trier par :",
    "sort_relevance": "Pertinence",
    "sort_date": "Date",
    "sort_salary": "Salaire (Décroissant)",
    "ready_explore": "Prêt à explorer ?",
    "ready_desc": "Utilisez la barre de recherche ci-dessus pour trouver l'opportunité idéale dans notre système.",
    "search_now": "Chercher maintenant",
    "apply_now": "Postuler",
    "status_demo": "Connexion à la démo...",
    "status_connecting": "Connexion aux agrégateurs...",
    "status_error_scrape": "Erreur de recherche",
    "status_no_offer": "Aucune offre trouvée.",
    "status_analyzing": "Analyse de {count} offres",
    "status_error_rec": "Erreur de recommandation",
    "status_error_general": "Une erreur s'est produite.",
    "modal_title": "Créez un compte gratuitement",
    "modal_desc1": "Vous utilisez actuellement une version de",
    "modal_desc2": "démonstration",
    "modal_desc3": ". Inscrivez-vous pour lancer de vraies recherches et débloquer la puissance de l'IA Seekra !",
    "modal_btn_register": "S'inscrire maintenant",
    "modal_btn_close": "Voir les faux résultats"
}

fr_data["auto_apply"] = {
    "title": "Pilote Automatique Auto-Apply",
    "desc": "Uploadez votre CV, vérifiez les critères détectés par l'IA, et laissez notre bot postuler à votre place chaque jour.",
    "bot_status": "Status du Bot",
    "active": "Actif & En veille",
    "paused": "En pause",
    "ai_title": "Intelligence Artificielle",
    "upload_title": "Importer ou Mettre à jour (PDF)",
    "upload_desc": "L'IA Gemini l'analysera instantanément.",
    "target_job": "Poste ciblé détecté",
    "target_placeholder": "Ex: Développeur Fullstack",
    "target_keywords": "Mots-clés extraits",
    "keywords_placeholder": "Ex: React, Node.js, Python...",
    "save_btn": "Sauvegarder les critères",
    "saving": "Chargement...",
    "history_title": "Journal des Candidatures Automatiques",
    "no_history_title": "Aucune candidature pour le moment",
    "no_history_desc": "Activez le bot et revenez demain. Vous verrez ici la liste des entreprises que nous avons contactées pour vous.",
    "sent": "Envoyée",
    "match_score": "Match Score",
    "view_offer": "Voir l'offre",
    "analyzing": "L'IA Gemini analyse votre CV en cours..."
}

fr_data["profile"] = {
    "menu": "MENU",
    "account": "Paramètres du Compte",
    "notifications": "Notifications",
    "security": "Sécurité",
    "billing": "Menu de Facturation",
    "signout": "Déconnexion"
}

with open(fr_path, 'w', encoding='utf-8') as f:
    json.dump(fr_data, f, ensure_ascii=False, indent=2)

# ENGLISH JSON
en_path = "frontend/locales/en.json"
with open(en_path, 'r', encoding='utf-8') as f:
    en_data = json.load(f)

en_data["about"] = {
    "title1": "About",
    "subtitle": "Artificial intelligence at the service of your career. Stop searching, start finding.",
    "context_title": "Project Context",
    "context_p1": "The job market has become a complex jungle. Candidates spend hours scrolling through dozens of sites, often to find offers that don't really match their expectations or are already filled.",
    "context_p2": "was born from a simple observation: job searching should be proactive and intelligent, not exhausting.",
    "context_p3": "By combining the power of ethical scraping and advanced recommendation algorithms, we've created a platform that doesn't just list offers, but",
    "context_p3_em": "understands",
    "context_p3_end": "your profile and connects you to the most relevant opportunities.",
    "mission_title": "Our Mission",
    "precision_title": "Precision",
    "precision_desc": "No more noise. Only offers that match your skills.",
    "speed_title": "Speed",
    "speed_desc": "Automate your search and save precious hours every week.",
    "privacy_title": "Privacy",
    "privacy_desc": "Your data belongs to you. No resale, no spam.",
    "founder": "Founder & Lead Dev",
    "status": "On a mission",
    "contact": "Contact Me"
}

en_data["dashboard"] = {
    "filters": "Filters",
    "clear_all": "Clear all",
    "skills_label_fr": "Your key skills",
    "skills_hint": "Separate your skills with commas.",
    "skills_placeholder": "python, sql, power bi...",
    "contract_type": "Contract Type",
    "date_posted": "Date Posted",
    "any_time": "Any time",
    "last_24h": "Last 24 hours",
    "last_7d": "Last 7 days",
    "last_30d": "Last 30 days",
    "job_alerts": "Job Alerts",
    "job_alerts_desc": "Get notified about new jobs matching these filters.",
    "create_alert": "Create Alert",
    "jobs_title": "{keyword} Jobs",
    "all_jobs": "All Jobs",
    "showing_results": "Showing {count} results",
    "search_placeholder": "Job title, keywords",
    "sort_by": "Sort by:",
    "sort_relevance": "Relevance",
    "sort_date": "Date",
    "sort_salary": "Salary (High to Low)",
    "ready_explore": "Ready to explore?",
    "ready_desc": "Use the search bar above to look for your ideal job opportunity in our system.",
    "search_now": "Search now",
    "apply_now": "Apply Now",
    "status_demo": "Connecting to demo...",
    "status_connecting": "Connecting to scrapers...",
    "status_error_scrape": "Error fetching jobs",
    "status_no_offer": "No offers found.",
    "status_analyzing": "Analyzing {count} offers",
    "status_error_rec": "Recommendation error",
    "status_error_general": "An error occurred.",
    "modal_title": "Create a free account",
    "modal_desc1": "You are currently using a",
    "modal_desc2": "demo",
    "modal_desc3": " version. Sign up to launch real searches and unlock the power of Seekra AI!",
    "modal_btn_register": "Sign up now",
    "modal_btn_close": "View mock results"
}

en_data["auto_apply"] = {
    "title": "Auto-Apply Autopilot",
    "desc": "Upload your resume, verify AI-detected criteria, and let our bot apply for you every day.",
    "bot_status": "Bot Status",
    "active": "Active & Ready",
    "paused": "Paused",
    "ai_title": "Artificial Intelligence",
    "upload_title": "Upload or Update (PDF)",
    "upload_desc": "Gemini AI will analyze it instantly.",
    "target_job": "Detected Target Role",
    "target_placeholder": "E.g. Fullstack Developer",
    "target_keywords": "Extracted Keywords",
    "keywords_placeholder": "E.g. React, Node.js, Python...",
    "save_btn": "Save Criteria",
    "saving": "Loading...",
    "history_title": "Automated Application Log",
    "no_history_title": "No applications yet",
    "no_history_desc": "Activate the bot and come back tomorrow. You will see here the list of companies we contacted for you.",
    "sent": "Sent",
    "match_score": "Match Score",
    "view_offer": "View Offer",
    "analyzing": "Gemini AI is analyzing your resume..."
}

en_data["profile"] = {
    "menu": "MENU",
    "account": "Account Settings",
    "notifications": "Notifications",
    "security": "Security",
    "billing": "Billing Panel",
    "signout": "Sign Out"
}

with open(en_path, 'w', encoding='utf-8') as f:
    json.dump(en_data, f, ensure_ascii=False, indent=2)

print("JSON files updated successfully!")
