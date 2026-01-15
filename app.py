import streamlit as st
import pandas as pd
import time
from scrapers.france_travail_scrapers import scrape_france_travail
from analysis.recommender import RecommendationSystem

# Configuration de la page
st.set_page_config(
    page_title="Job Intelligent Dashboard",
    page_icon=None,
    layout="wide"
)

# Styles CSS personnalisés pour un look moderne
st.markdown("""
    <style>
    .main {
        background-color: #f5f7f9;
    }
    .stButton>button {
        width: 100%;
        background-color: #0066cc;
        color: white;
        border-radius: 10px;
        height: 50px;
        font-weight: bold;
        border: none;
        transition: all 0.3s ease;
    }
    .stButton>button:hover {
        background-color: #0052a3;
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .job-card {
        background-color: white;
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        margin-bottom: 20px;
        border-left: 5px solid #0066cc;
        transition: transform 0.2s;
    }
    .job-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    .score-badge {
        background-color: #e6f3ff;
        color: #0066cc;
        padding: 5px 10px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 0.9em;
    }
    h1 {
        color: #1a1a1a;
        font-family: 'Helvetica Neue', sans-serif;
    }
    h3 {
        color: #333;
    }
    </style>
""", unsafe_allow_html=True)

# Titre Principal
st.title("PROJET JOB INTELLIGENT : DashBoard PowerBI")
st.markdown("---")

# Sidebar pour les filtres
with st.sidebar:
    st.header("Configuration")
    search_keyword = st.text_input("Mot-clé de recherche", value="Data")
    max_pages = st.slider("Nombre de pages à scraper", 1, 5, 2)
    
    st.header("Profil Candidat")
    skills_input = st.text_area(
        "Vos compétences (séparées par des virgules)", 
        value="python, sql, power bi, anglais, data analysis"
    )
    user_skills = [s.strip().lower() for s in skills_input.split(",")]

# Layout principal
col1, col2 = st.columns([1, 3])

with col1:
    st.info(f"Recherche actuelle : **{search_keyword}**")
    st.write("Cliquez ci-dessous pour lancer l'IA")
    
    if st.button("LANCER L'ANALYSE"):
        with st.spinner('Scraping des offres en cours...'):
            # 1. Scraping
            try:
                jobs = scrape_france_travail(search_keyword=search_keyword, max_pages=max_pages)
                st.session_state['jobs'] = jobs
                st.success(f"{len(jobs)} offres récupérées !")
            except Exception as e:
                st.error(f"Erreur lors du scraping : {e}")
                jobs = []

        if jobs:
            with st.spinner('Analyse sémantique et Matching...'):
                # 2. Recommandation
                rec_sys = RecommendationSystem()
                # On utilise les données en mémoire (jobs_data=jobs)
                recommendations = rec_sys.get_recommendations(user_skills, top_n=100, jobs_data=jobs)
                st.session_state['recommendations'] = recommendations
                time.sleep(1) # Petit effet visuel

# Affichage des résultats
if 'recommendations' in st.session_state and st.session_state['recommendations']:
    st.header(f"Top Recommandations pour vous ({len(st.session_state['recommendations'])})")
    
    for rec in st.session_state['recommendations']:
        score_color = "green" if rec['score'] > 50 else "orange"
        
        st.markdown(f"""
        <div class="job-card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3>{rec['titre']}</h3>
                <span class="score-badge">Match: {rec['score']}%</span>
            </div>
            <p style="color: #666; font-size: 1.1em;">Entreprise: {rec['entreprise']}</p>
            <p><strong>Compétences détectées :</strong> {', '.join(rec['skills_found'])}</p>
            <a href="{rec['url']}" target="_blank" style="text-decoration: none;">
                <button style="background-color: #0066cc; color: white; padding: 8px 16px; border: none; border-radius: 5px; cursor: pointer;">
                    Voir l'offre
                </button>
            </a>
        </div>
        """, unsafe_allow_html=True)

elif 'jobs' in st.session_state and st.session_state['jobs']:
    st.warning("Aucune recommandation pertinente trouvée avec vos compétences actuelles. Essayez d'élargir votre profil !")
    
    # Afficher quand même les offres brutes
    st.subheader("Toutes les offres récupérées :")
    df = pd.DataFrame(st.session_state['jobs'])
    st.dataframe(df[['titre', 'entreprise_lieu', 'date_publication', 'lien']])

else:
    with col2:
        st.markdown("""
        ### Bienvenue sur votre Assistant Job Intelligent
        
        Ce tableau de bord vous permet de :
        1. **Centraliser** les offres de France Travail
        2. **Analyser** automatiquement les compétences demandées
        3. **Filtrer** les offres selon votre profil grâce à l'IA
        
        *Configurez votre recherche à gauche et lancez l'analyse !*
        """)
        
        # Un peu de déco
        st.image("https://img.freepik.com/free-vector/job-hunt-concept-illustration_114360-458.jpg", width=400)
