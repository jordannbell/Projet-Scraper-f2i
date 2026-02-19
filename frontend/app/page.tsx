'use client';

import DarkVeil from "@/components/DarkVeil";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-slate-900 text-white">
      {/* Background Effect */}
      <div className="absolute inset-0 z-0">
        <DarkVeil
          hueShift={20}
          noiseIntensity={0.2}
          scanlineIntensity={0.1}
          speed={0.3}
        />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
        <h1 className="text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-sm">
          Seekra
        </h1>

        <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mb-12 font-light">
          L&apos;intelligence artificielle au service de votre carrière.
          <br />
          <span className="text-indigo-300 font-medium">Ne cherchez plus, trouvez.</span>
        </p>

        <Link
          href="/dashboard"
          className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-slate-900 transition-all duration-200 bg-white font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 hover:scale-105 hover:shadow-[0_0_40px_rgba(99,102,241,0.6)]"
          role="button"
        >
          DÉMARRER L&apos;EXPÉRIENCE
          <svg className="w-5 h-5 ml-2 -mr-1 transition-transform group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Link>

        <div className="absolute bottom-8 text-slate-500 text-sm">
          Seekra © 2026 • Powered by AI
        </div>
      </div>
    </main>
  );
}
