import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface AuthLayoutProps {
    children: React.ReactNode;
    mode: 'login' | 'register';
}

export default function AuthLayout({ children, mode }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex bg-white font-sans text-slate-900">
            {/* Left Column: Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-[45%] xl:w-[40%] bg-white z-10 relative shadow-2xl lg:shadow-none">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    {/* Header / Logo */}
                    <div className="mb-10">
                        <Link href="/" className="inline-block">
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                                Seekra<span className="text-indigo-600">.</span>
                            </h1>
                        </Link>
                    </div>

                    {/* Content (Form) */}
                    {children}

                    {/* Footer */}
                    <div className="mt-8 text-center text-xs text-slate-400">
                        Seekra &copy; 2026 Airspace Corporation
                    </div>
                </div>
            </div>

            {/* Right Column: Illustration (Hidden on mobile) */}
            <div className="hidden lg:flex flex-1 relative bg-indigo-50 items-center justify-center p-12 overflow-hidden">
                {/* Decorative background blobs */}
                <div className="absolute top-0 right-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-200/50 blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-blue-200/50 blur-3xl"></div>
                </div>

                <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
                    {/* Illustration */}
                    <div className="relative w-80 h-80 mb-12 transform hover:scale-105 transition-transform duration-500">
                        {/* Fallback to text if image missing, but user should place 'mascot.png' in public/assets */}
                        <Image
                            src="/assets/mascot.png"
                            alt="Seekra Mascot"
                            width={400}
                            height={400}
                            className="object-contain drop-shadow-2xl"
                            priority
                        />
                    </div>

                    {/* Text */}
                    <div className="space-y-6">
                        <h2 className="text-4xl font-bold text-slate-900 tracking-tight text-balance">
                            Arrêtez de jongler entre <span className="text-indigo-600">10 sites d'emploi</span>.
                        </h2>
                        <p className="text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">
                            <span className="font-bold text-slate-800">Seekra</span> centralise pour vous toutes les opportunités disponibles sur le web.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
