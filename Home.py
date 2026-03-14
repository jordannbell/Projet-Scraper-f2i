import streamlit as st

# Configuration de la page (Doit être la première commande)
st.set_page_config(
    page_title="Seekra - Welcome",
    page_icon="⚡",
    layout="centered",
    initial_sidebar_state="collapsed"
)

# Fonction pour ajouter du CSS personnalisé
def local_css():
    st.markdown("""
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        
        .stApp {
            background-color: #0f172a; /* Dark Slate Background */
            color: white;
            font-family: 'Inter', sans-serif;
        }
        
        /* Cacher la sidebar sur la home page */
        [data-testid="collapsedControl"] { display: none; }
        
        .hero-container {
            text-align: center;
            padding: 4rem 1rem;
            animation: fadeIn 1.5s ease;
        }
        
        .brand-title {
            font-size: 5rem;
            font-weight: 800;
            background: -webkit-linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 1rem;
        }
        
        .tagline {
            font-size: 1.5rem;
            color: #cbd5e1;
            margin-bottom: 3rem;
            font-weight: 400;
        }
        
        .cta-button {
            display: inline-block;
            background: white;
            color: #0f172a;
            padding: 1rem 2.5rem;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 700;
            text-decoration: none;
            transition: all 0.3s ease;
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
        }
        
        .cta-button:hover {
            transform: scale(1.05);
            box-shadow: 0 0 40px rgba(99, 102, 241, 0.8);
        }
        
        @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        
        /* Override Streamlit elements */
        .stButton>button {
            display: none;
        }
        header { visibility: hidden; }
        </style>
    """, unsafe_allow_html=True)

local_css()

# Contenu Principal
st.markdown("""
    <div class="hero-container">
        <div class="brand-title">Seekra</div>
        <p class="tagline">L'intelligence artificielle au service de votre carrière.<br>Ne cherchez plus, trouvez.</p>
        
        <br><br>
        
        <a href="/dashboard" target="_self" class="cta-button">
            DÉMARRER L'EXPÉRIENCE ➜
        </a>
    </div>
""", unsafe_allow_html=True)

# Footer discret
st.markdown("""
<div style="position:fixed; bottom:20px; width:100%; text-align:center; color:#475569; font-size:0.8rem;">
    Seekra © 2026 • Powered by J&L
</div>
""", unsafe_allow_html=True)
