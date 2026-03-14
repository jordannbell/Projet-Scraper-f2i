import streamlit as st
import pandas as pd
import time
from scrapers.france_travail_scrapers import scrape_france_travail
from analysis.recommender import RecommendationSystem

# --------------------------------------------------------------------------
# 1. CONFIGURATION DE LA PAGE
# --------------------------------------------------------------------------
st.set_page_config(
    page_title="Seekra - Intelligence Emploi",
    page_icon=None,
    layout="wide",
    initial_sidebar_state="expanded"
)

# --------------------------------------------------------------------------
# 2. DESIGN SYSTEM (CSS)
# --------------------------------------------------------------------------
st.markdown("""
    <style>
    /* Import Police Inter */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    /* Variables Globales */
    :root {
        --primary: #6366f1; /* Indigo */
        --primary-hover: #4f46e5;
        --secondary: #0f172a; /* Slate Dark */
        --background: #f8fafc;
        --surface: #ffffff;
        --text: #334155;
        --text-light: #64748b;
        --accent: #14b8a6; /* Teal */
    }

    /* Reset & Base */
    .stApp {
        background-color: var(--background);
        font-family: 'Inter', sans-serif;
        color: var(--text);
    }
    
    h1, h2, h3 {
        color: var(--secondary);
        font-weight: 700;
        letter-spacing: -0.025em;
    }

    /* Boutons Principaux */
    .stButton > button {
        background: linear-gradient(135deg, var(--primary) 0%, #4338ca 100%);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 1rem;
        box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
        transition: all 0.2s ease;
        width: 100%;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
    }

    /* Cards des offres */
    .job-card {
        background: var(--surface);
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
        transition: all 0.2s ease;
    }
    
    .job-card:hover {
        border-color: var(--primary);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        transform: translateY(-2px);
    }

    .job-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
    }

    .job-title {
        font-size: 1.25rem;
        color: var(--secondary);
        margin: 0;
        font-weight: 700;
    }

    .match-badge {
        background-color: #ecfdf5;
        color: var(--accent);
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 700;
        border: 1px solid #ccfbf1;
    }
    
    .company-name {
        color: var(--text-light);
        font-size: 0.95rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .skills-tag {
        background-color: #f1f5f9;
        color: var(--text);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        margin-right: 0.5rem;
        display: inline-block;
        margin-bottom: 0.25rem;
        font-weight: 500;
    }

    .btn-link {
        display: inline-block;
        margin-top: 1rem;
        color: var(--primary);
        font-weight: 600;
        text-decoration: none;
        font-size: 0.9rem;
    }
    
    .btn-link:hover {
        text-decoration: underline;
    }

    /* Sidebar Customization */
    [data-testid="stSidebar"] {
        background-color: white;
        border-right: 1px solid #e2e8f0;
    }
    
    /* Hero Section */
    .hero-container {
        padding: 2rem 0;
        border-bottom: 1px solid #e2e8f0;
        margin-bottom: 2rem;
    }
    .hero-title {
        font-size: 3rem;
        background: -webkit-linear-gradient(135deg, var(--primary), #ec4899);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.5rem;
    }
    .hero-subtitle {
        font-size: 1.2rem;
        color: var(--text-light);
    }
    </style>
""", unsafe_allow_html=True)

# --------------------------------------------------------------------------
# 3. SIDEBAR (FILTRES)
# --------------------------------------------------------------------------
with st.sidebar:
    st.markdown("### Configuration")
    
    # Inputs stylisés
    search_keyword = st.text_input("Votre Cible (Poste)", value="Data Analyst")
    max_pages = st.slider("Volume de recherche (Pages)", 1, 5, 2)
    
    st.markdown("---")
    st.markdown("### Votre Profil")
    
    skills_input = st.text_area(
        "Vos atouts clés (Compétences)", 
        value="python, sql, power bi, anglais, data visualization",
        height=100,
        help="Séparez vos compétences par des virgules."
    )
    user_skills = [s.strip().lower() for s in skills_input.split(",")]
    
    st.markdown("---")
    st.caption("Seekra v1.0 • Propulsé par J&L")

# --------------------------------------------------------------------------
# 4. PAGE PRINCIPALE
# --------------------------------------------------------------------------

# Hero Section
st.markdown("""
<div class="hero-container">
    <h1 class="hero-title">Seekra</h1>
    <p class="hero-subtitle">Ne cherchez plus, trouvez. La plateforme intelligente qui connecte vos compétences aux meilleures opportunités.</p>
</div>
""", unsafe_allow_html=True)

col1, col2 = st.columns([1, 2], gap="large")

with col1:
    st.markdown("### Lancer la recherche")
    st.markdown(f"Vous ciblez les postes de **{search_keyword}** sur le marché.")
    
    if st.button("DÉCOUVRIR LES OPPORTUNITÉS"):
        with st.status("Analyse du marché en cours...", expanded=True) as status:
            # 1. Scraping
            st.write("Connexion aux sources d'emplois...")
            try:
                jobs = scrape_france_travail(search_keyword=search_keyword, max_pages=max_pages)
                st.session_state['jobs'] = jobs
                st.write(f"{len(jobs)} offres identifiées.")
            except Exception as e:
                st.error(f"Erreur technique : {e}")
                jobs = []
            
            if jobs:
                # 2. Recommandation
                st.write("Algorithme de matching IA...")
                rec_sys = RecommendationSystem()
                # Correction du bug précédent : jobs_data=jobs
                recommendations = rec_sys.get_recommendations(user_skills, top_n=100, jobs_data=jobs)
                st.session_state['recommendations'] = recommendations
                
                status.update(label="Analyse terminée !", state="complete", expanded=False)
                time.sleep(0.5)

# --------------------------------------------------------------------------
# 5. RÉSULTATS
# --------------------------------------------------------------------------

with col2:
    if 'recommendations' in st.session_state and st.session_state['recommendations']:
        count = len(st.session_state['recommendations'])
        st.markdown(f"### {count} Opportunités à fort potentiel")
        
        for rec in st.session_state['recommendations']:
            # Logique d'affichage du score
            score = rec['score']
            skills_html = "".join([f'<span class="skills-tag">{s}</span>' for s in rec['skills_found'][:5]])
            
            st.markdown(f"""
            <div class="job-card">
                <div class="job-header">
                    <div>
                        <h3 class="job-title">{rec['titre']}</h3>
                        <div class="company-name">{rec['entreprise']}</div>
                    </div>
                    <span class="match-badge">{score}% Match</span>
                </div>
                <div style="margin-bottom: 1rem;">
                    {skills_html}
                </div>
                <div style="display: flex; justify-content: flex-end;">
                    <a href="{rec['url']}" target="_blank" class="btn-link">
                        Voir l'offre complète →
                    </a>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
    elif 'jobs' in st.session_state and st.session_state['jobs']:
        st.info("Aucune offre ne correspond parfaitement à vos compétences actuelles. Essayez d'élargir votre recherche ou d'ajouter des compétences.")
        
        with st.expander("Voir toutes les offres brutes"):
            df = pd.DataFrame(st.session_state['jobs'])
            st.dataframe(df[['titre', 'entreprise_lieu', 'date_publication', 'lien']])
            
    else:
        # État initial (Placeholder élégant)
        st.markdown("""
        <div style="background-color: white; padding: 2rem; border-radius: 12px; text-align: center; border: 1px dashed #cbd5e1;">
            <h3 style="color: #94a3b8;">En attente d'action</h3>
            <p style="color: #64748b;">Configurez votre profil à gauche et lancez l'analyse pour voir apparaître ici les meilleures opportunités du marché.</p>
        </div>
        """, unsafe_allow_html=True)
