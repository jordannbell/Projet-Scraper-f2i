'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

interface AuthLayoutProps {
    children: React.ReactNode;
    mode: 'login' | 'register';
}

export default function AuthLayout({ children, mode }: AuthLayoutProps) {
    const { t } = useLanguage();

    return (
        <div className="app-shell h-screen w-full flex font-sans text-white overflow-hidden">
            {/* Left Column: Form */}
            <div className="z-10 relative flex w-full flex-1 flex-col justify-center bg-transparent px-4 py-4 sm:px-6 lg:w-[50%] lg:flex-none lg:px-12 xl:w-[50%] xl:px-20">
                <div className="mx-auto mt-12 w-full max-w-lg rounded-2xl border border-slate-600/25 bg-slate-950/70 p-6 shadow-2xl lg:w-[460px] xl:mt-24">

                    {/* Content (Form) */}
                    <div className="flex-1 overflow-y-auto no-scrollbar pb-4" data-auth-mode={mode}>
                        {children}
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pb-2 text-center text-[10px] text-slate-400">
                        {t('authLayout.footer')}
                    </div>
                </div>
            </div>

            {/* Right Column: Illustration (Hidden on mobile) */}
            <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-transparent py-6 pl-0 pr-8 lg:flex">
                <div className="relative z-10 w-full max-w-2xl flex flex-col items-center justify-center gap-6 h-full text-center py-4">

                    {/* Text ABOVE image to match mockup strictly */}
                    <div className="space-y-4 px-4 flex-shrink-0 mt-24 xl:mt-32">
                        <h2 className="text-3xl lg:text-[2.2rem] xl:text-[2.5rem] font-medium text-white tracking-tight leading-tight">
                            {t('authLayout.title1')} <span className="text-white font-medium">{t('authLayout.title2')}</span>.
                        </h2>
                        <p className="text-[1.05rem] lg:text-lg text-slate-300 max-w-md mx-auto leading-relaxed mt-2">
                            <span className="font-bold">{t('authLayout.subtitle1')}</span> {t('authLayout.subtitle2')}
                        </p>
                    </div>

                    {/* Illustration */}
                    <div className="relative w-full max-w-[350px] xl:max-w-[450px] aspect-square flex-shrink-1 min-h-0 mt-4">
                        <Image
                            src="/assets/6.png"
                            alt="Seekra Mascot"
                            fill
                            className="object-contain object-bottom"
                            priority
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
