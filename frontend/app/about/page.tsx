"use client";

import ProfileCard from '@/components/ProfileCard';
import { useLanguage } from '@/context/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl mb-4 tracking-tight">
            {t('about.title1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052FF] to-violet-500">Seekra</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            {t('about.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div className="prose prose-invert text-slate-300">
            <h2 className="text-2xl font-bold text-white mb-4">{t('about.context_title')}</h2>
            <p className="mb-4">
              {t('about.context_p1')}
            </p>
            <p className="mb-4">
              <strong>Seekra</strong> {t('about.context_p2')}
            </p>
            <p>
              {t('about.context_p3')} <em className="text-white font-medium">{t('about.context_p3_em')}</em> {t('about.context_p3_end')}
            </p>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-[#0052FF] rounded-full blur-3xl opacity-20 animate-pulse"></div>
              <ProfileCard
                name="Jordan BELL"
                title={t('about.founder')}
                handle="jordan_builds"
                status={t('about.status')}
                contactText={t('about.contact')}
                behindGlowColor="rgba(0, 82, 255, 0.4)"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#111111] rounded-2xl p-8 shadow-xl border border-white/5 text-center">
          <h2 className="text-2xl font-bold text-white mb-6">{t('about.mission_title')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-4 border border-white/5 rounded-xl bg-[#161616] hover:bg-[#1a1a1a] transition-colors">
              <div className="bg-[#0052FF]/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#0052FF]">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2"></path></svg>
              </div>
              <h3 className="font-bold text-white mb-2">{t('about.precision_title')}</h3>
              <p className="text-sm text-slate-400">{t('about.precision_desc')}</p>
            </div>
            <div className="p-4 border border-white/5 rounded-xl bg-[#161616] hover:bg-[#1a1a1a] transition-colors">
              <div className="bg-violet-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-violet-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h3 className="font-bold text-white mb-2">{t('about.speed_title')}</h3>
              <p className="text-sm text-slate-400">{t('about.speed_desc')}</p>
            </div>
            <div className="p-4 border border-white/5 rounded-xl bg-[#161616] hover:bg-[#1a1a1a] transition-colors">
              <div className="bg-emerald-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <h3 className="font-bold text-white mb-2">{t('about.privacy_title')}</h3>
              <p className="text-sm text-slate-400">{t('about.privacy_desc')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
