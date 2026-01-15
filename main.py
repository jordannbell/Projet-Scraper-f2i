import os
import sys
from scrapers.france_travail_scrapers import scrape_france_travail

def main():
    print("[INFO] Démarrage du projet Job Intelligent")
    print("[INFO] Cible : France Travail uniquement")
    
    # Vérifier si le fichier .env existe
    if not os.path.exists('.env'):
        print("[ERREUR] Fichier .env introuvable.")
       
        return

    # Lancer le scraping
    # Vous pouvez ajuster les paramètres ici
    jobs = scrape_france_travail(search_keyword="data", max_pages=2)

    # --- PARTIE INTELLIGENTE ---
    from analysis.recommender import RecommendationSystem
    
    print("\n" + "="*60)
    print("SYSTEME DE RECOMMANDATION INTELLIGENT")
    print("="*60)
    
    # Définition d'un profil candidat fictif (Vous pourrez le changer)
    # On élargit les compétences pour le test
    MON_PROFIL = ["data", "excel", "analyse", "gestion", "python"]
    print(f"[PROFIL CANDIDAT] Compétences : {', '.join(MON_PROFIL)}")
    
    rec_sys = RecommendationSystem()
    
    # 1. Lancer l'analyse (Optionnel si fait en temps réel, mais bon pour la démo)
    # rec_sys.run_analysis_pipeline()
    
    # 2. Obtenir les recommandations
    # On passe 'jobs' (les données qu'on vient de scraper) en fallback si la DB ne marche pas
    recommendations = rec_sys.get_recommendations(MON_PROFIL, top_n=3, jobs_data=jobs)
    
    if recommendations:
        print(f"\n[RESULTAT] Top {len(recommendations)} offres recommandées pour vous :")
        for i, rec in enumerate(recommendations, 1):
            print(f"\n{i}. {rec['titre']} ({rec['entreprise']})")
            print(f"   [SCORE] Score de matching : {rec['score']}%")
            print(f"   [COMPETENCES] Compétences de l'offre : {', '.join(rec['skills_found'])}")
            print(f"   [LIEN] Lien : {rec['url']}")
    else:
        print("\n[INFO] Aucune recommandation pertinente trouvée pour ce profil.")

if __name__ == "__main__":
    main()
