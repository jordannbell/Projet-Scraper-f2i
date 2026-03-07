import re
from config.skills import DATA_SKILLS

class NLPEngine:
    """
    Moteur d'analyse sémantique simplifié pour l'extraction de compétences.
    """
    
    def __init__(self):
        # Aplatir la liste des compétences pour la recherche
        self.all_skills = {}
        for category, skills in DATA_SKILLS.items():
            for skill in skills:
                self.all_skills[skill] = category

    def clean_text(self, text: str) -> str:
        """
        Nettoie le texte : minuscule, suppression caractères spéciaux
        """
        if not text:
            return ""
        
        # Convertir en minuscules
        text = text.lower()
        
        # Remplacer la ponctuation par des espaces (sauf + et # pour C++ et C#)
        text = re.sub(r'[^a-z0-9+#\s]', ' ', text)
        
        return text

    def extract_skills(self, text: str) -> dict:
        """
        Analyse un texte et retourne les compétences trouvées par catégorie.
        """
        cleaned_text = self.clean_text(text)
        found_skills = {
            "LANGAGES": [],
            "FRAMEWORKS_LIBS": [],
            "CLOUD_DEVOPS": [],
            "DATABASES": [],
            "BI_VISUALIZATION": [],
            "CONCEPTS": []
        }
        
        # Liste de tous les mots uniques dans le texte pour recherche rapide
        text_words = set(cleaned_text.split())
        
        # Recherche des compétences (mots simples)
        for skill, category in self.all_skills.items():
            # Gestion des compétences à plusieurs mots (ex: "power bi")
            if " " in skill:
                if skill in cleaned_text:
                    if skill not in found_skills[category]:
                        found_skills[category].append(skill)
            # Gestion des compétences à un seul mot
            else:
                if skill in text_words:
                    if skill not in found_skills[category]:
                        found_skills[category].append(skill)
                        
        return found_skills

    def calculate_match_score(self, job_skills: list, user_skills: list) -> float:
        """
        Calcule un score de correspondance (0 à 100%) entre les compétences de l'offre et du candidat.
        Utilise l'indice de Jaccard.
        """
        if not job_skills or not user_skills:
            return 0.0
            
        set_job = set(job_skills)
        set_user = set(user_skills)
        
        intersection = set_job.intersection(set_user)
        union = set_job.union(set_user)
        
        if not union:
            return 0.0
            
        # Le score est pondéré : on valorise plus le fait d'avoir les compétences demandées
        # Score = (Compétences communes / Compétences de l'offre) * 100
        if len(set_job) == 0:
            return 0.0
            
        match_percentage = (len(intersection) / len(set_job)) * 100
        
        return round(match_percentage, 2)
