import ProfileCard from '@/components/ProfileCard';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl mb-4">
            À propos de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Seekra</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            L'intelligence artificielle au service de votre carrière. Ne cherchez plus, trouvez.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div className="prose prose-indigo text-slate-600">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Le Contexte du Projet</h2>
            <p className="mb-4">
              Le marché de l'emploi est devenu une jungle complexe. Les candidats passent des heures à scroller sur des dizaines de sites, souvent pour tomber sur des offres qui ne correspondent pas vraiment à leurs attentes ou qui sont déjà pourvues.
            </p>
            <p className="mb-4">
              <strong>Seekra</strong> est né d'un constat simple : la recherche d'emploi devrait être proactive et intelligente, pas épuisante.
            </p>
            <p>
              En combinant la puissance du scraping éthique et des algorithmes de recommandation avancés, nous avons créé une plateforme qui ne se contente pas de lister des offres, mais qui <em>comprend</em> votre profil et vous connecte aux opportunités les plus pertinentes.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
              <ProfileCard
                name="Jordan BELL"
                title="Fondateur & Lead Dev"
                handle="jordan_builds"
                status="En mission"
                contactText="Me Contacter"
                behindGlowColor="rgba(99, 102, 241, 0.6)"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-100 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Notre Mission</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-4">
              <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Précision</h3>
              <p className="text-sm text-slate-500">Fini le bruit. Uniquement des offres qui matchent vos compétences.</p>
            </div>
            <div className="p-4">
              <div className="bg-violet-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-violet-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Rapidité</h3>
              <p className="text-sm text-slate-500">Automatisez la recherche et gagnez des heures précieuses chaque semaine.</p>
            </div>
            <div className="p-4">
              <div className="bg-teal-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-teal-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Confidentialité</h3>
              <p className="text-sm text-slate-500">Vos données vous appartiennent. Pas de revente, pas de spam.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
