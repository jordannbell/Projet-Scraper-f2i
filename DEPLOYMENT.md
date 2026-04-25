# Guide de Déploiement Local - Projet Job Intelligent

Ce guide explique comment installer et exécuter le projet "Job Intelligent Dashboard" en local sur votre machine.

## 📋 Prérequis

Avant de commencer, vous devez avoir installé :
- **Python 3.8+** : [Télécharger Python](https://www.python.org/downloads/)
- **Git** (Optionnel, si vous clonez le repo)
- **Google Chrome** (nécessaire pour Selenium si utilisé, bien que le code actuel utilise `requests` + `BeautifulSoup`)

## 🚀 Installation

### 1. Ouvrir le terminal dans le dossier du projet
Assurez-vous d'être dans : `c:\Users\JordanBELL\Projet\projet_scraper`

### 2. Créer un environnement virtuel (Recommandé)
Cela permet d'isoler les dépendances du projet.

**Windows :**
```powershell
python -m venv .venv
.venv\Scripts\activate
```

**macOS / Linux :**
```bash
python3 -m venv .venv
source .venv/bin/activate
```
*(Vous verrez `(.venv)` apparaître au début de votre ligne de commande)*

### 3. Installer les dépendances
Installez les bibliothèques requises listées dans `requirements.txt`.
```bash
pip install -r requirements.txt
```

## ⚙️ Configuration (Base de Données)

Le projet est conçu pour fonctionner avec **Supabase** pour stocker les offres, mais il possède un mode "dégradé" qui fonctionne sans base de données pour la démo en direct.

**Pour configurer la base de données (Optionnel pour le test local) :**
1. Créez un fichier nommé `.env` à la racine du projet à partir de `.env.example` (s'il existe) ou créez-le vide.
2. Ajoutez vos clés Supabase si vous en avez :

```env
SUPABASE_URL="votre_url_supabase"
SUPABASE_KEY="votre_cle_publique_anon"
```

*Note : Si vous ne configurez pas le `.env`, le scraping fonctionnera et affichera les résultats dans l'interface, mais vous aurez des erreurs de connexion DB dans la console (sans impact bloquant).*

## ▶️ Lancer l'application

Il y a deux façons d'utiliser le projet :

### Option A : Interface Graphique (Dashboard PowerBI-like)
C'est l'interface utilisateur principale avec Streamlit.

```bash
streamlit run app.py
```
Cela ouvrira automatiquement votre navigateur sur `http://localhost:8501`.
- Vous pourrez entrer des mots-clés, lancer le scraping en direct, et voir les recommandations.

### Option B : Script en ligne de commande (CLI)
Pour tester le scraping ou l'analyse sans interface graphique.

```bash
python main.py
```
Le script va :
1. Scraper France Travail selon les paramètres dans `main.py`.
2. Simuler un profil candidat.
3. Afficher les recommandations dans la console.

## 🛠️ Dépannage courant

- **Erreur `ModuleNotFoundError`** : Vérifiez que vous avez bien activé l'environnement virtuel (`.venv`) et installé les dépendances.
- **Erreur Chromedriver / Selenium** : Le scraper utilise `webdriver-manager` qui devrait installer automatiquement le bon driver Chrome. Assurez-vous d'avoir Google Chrome installé.
- **Accès refusé / Erreur 403** : Si France Travail bloque les requêtes trop fréquentes, le script attendra un peu. Réessayez plus tard ou augmentez les délais dans le code.

---
*Projet développé pour l'analyse intelligente d'offres d'emploi.*
