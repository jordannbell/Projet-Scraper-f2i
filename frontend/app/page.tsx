'use client';

import DarkVeil from "@/components/DarkVeil";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black text-white">
      {/* Background Effect */}
      <div className="absolute inset-0 z-0">
        <DarkVeil
          hueShift={0}
          noiseIntensity={0.05}
          scanlineIntensity={0.1}
          speed={0.5}
          scanlineFrequency={0.1}
          warpAmount={0.2}
        />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center pointer-events-none">

        {/* Title and Text */}
        <h1 className="text-6xl md:text-8xl font-bold mb-6 text-white drop-shadow-lg tracking-tight">
          {t('home.title')}
        </h1>

        <p className="text-2xl md:text-4xl text-white max-w-4xl mb-12 font-medium leading-relaxed drop-shadow-md">
          {t('home.subtitle1')}
          <br />
          <span className="text-indigo-300">{t('home.subtitle2')}</span>
        </p>

        <div className="pointer-events-auto">
          <Link
            href="/dashboard"
            className="group relative inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-black transition-all duration-300 bg-white rounded-full hover:scale-105 hover:bg-slate-100 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)]"
            role="button"
          >
            {t('home.start_button')}
            <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        <div className="absolute bottom-8 text-white/50 text-sm">
          {t('home.footer')}
        </div>
      </div>
    </main>
  );
}
