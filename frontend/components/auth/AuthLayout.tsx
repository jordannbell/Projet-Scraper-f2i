import React from 'react';
import Image from 'next/image';

interface AuthLayoutProps {
    children: React.ReactNode;
    mode: 'login' | 'register';
}

export default function AuthLayout({ children, mode }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex bg-white font-sans text-slate-900">
            {/* Left Column: Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-[50%] xl:w-[50%] bg-white z-10 relative">
                <div className="mx-auto w-full max-w-lg lg:w-[450px]">

                    {/* Content (Form) */}
                    {children}

                    {/* Footer */}
                    <div className="mt-8 text-center text-[10px] text-slate-400">
                        &copy; Copyright 2026 Airspace Corporation
                    </div>
                </div>
            </div>

            {/* Right Column: Illustration (Hidden on mobile) */}
            <div className="hidden lg:flex flex-1 relative bg-white items-center justify-start py-12 pr-12 pl-0 overflow-hidden">
                <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">

                    {/* Text ABOVE image to match mockup strictly */}
                    <div className="space-y-2 lg:space-y-4 mb-4 lg:mb-12 px-4 mt-24 lg:mt-40">
                        <h2 className="text-3xl lg:text-4xl xl:text-[2.5rem] font-medium text-black tracking-tight leading-tight">
                            Arrêtez de jongler entre <span className="text-[#000000] font-medium">10 sites d'emploi</span>.
                        </h2>
                        <p className="text-lg lg:text-xl text-black max-w-lg mx-auto leading-relaxed">
                            <span className="font-bold">Seekra</span> centralise pour vous toutes les opportunités disponibles sur le web
                        </p>
                    </div>

                    {/* Illustration */}
                    <div className="relative w-full max-w-[500px] xl:max-w-[700px] aspect-square">
                        <Image
                            src="/assets/mascot.png"
                            alt="Seekra Mascot"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
