'use client';

import Link from 'next/link';
import { User, Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

export default function Navbar() {
    const { t, language, setLanguage } = useLanguage();

    const navItems = [
        { label: t('navbar.about'), href: '/about' },
        { label: t('navbar.start'), href: '/dashboard' },
    ];

    const toggleLanguage = () => {
        setLanguage(language === 'fr' ? 'en' : 'fr');
    };

    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsLoggedIn(!!session);
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setIsLoggedIn(!!session);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    return (
        <div className="fixed left-0 right-0 top-4 z-50 flex justify-center px-4 pointer-events-none">
            {/* pointer-events-auto for the navbar itself so it remains clickable */}
            <nav className="pointer-events-auto w-full max-w-4xl rounded-2xl border border-slate-500/25 bg-slate-950/75 shadow-2xl backdrop-blur-xl">
                <div className="px-6 h-14 flex items-center justify-between">
                    {/* Gauche: Logo */}
                    <Link href="/" className="text-xl font-bold text-white tracking-wide transition-colors hover:text-blue-300">
                        Seekra
                    </Link>

                    {/* Centre: Liens */}
                    <div className="hidden sm:flex items-center space-x-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
                            >
                                {item.label}
                            </Link>
                        ))}
                        {isLoggedIn && (
                            <Link href="/auto-apply" className="text-blue-300 hover:text-blue-200 text-sm font-bold flex items-center transition-colors">
                                Auto-Apply 🤖
                            </Link>
                        )}
                    </div>

                    {/* Droite: Actions */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center justify-center rounded-lg border border-slate-500/30 p-1.5 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-white"
                            aria-label="Changer de langue"
                        >
                            <Globe className="w-4 h-4 mr-1" />
                            {language.toUpperCase()}
                        </button>
                        <Link
                            href={isLoggedIn ? "/profile" : "/login"}
                            className="rounded-lg border border-slate-500/30 p-1.5 text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-white"
                            aria-label={isLoggedIn ? "Profil Utilisateur" : "Se Connecter"}
                        >
                            <User className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </nav>
        </div>
    );
}
