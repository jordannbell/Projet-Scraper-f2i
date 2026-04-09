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
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
            {/* pointer-events-auto for the navbar itself so it remains clickable */}
            <nav className="pointer-events-auto w-full max-w-2xl bg-black/30 backdrop-blur-lg border border-white/10 rounded-full shadow-2xl">
                <div className="px-6 h-14 flex items-center justify-between">
                    {/* Gauche: Logo */}
                    <Link href="/" className="text-xl font-bold text-white tracking-wide hover:text-indigo-300 transition-colors">
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
                            <Link href="/auto-apply" className="text-amber-400 hover:text-amber-300 text-sm font-bold flex items-center transition-colors drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                                Auto-Apply 🤖
                            </Link>
                        )}
                    </div>

                    {/* Droite: Actions */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={toggleLanguage}
                            className="text-slate-300 hover:text-white transition-colors p-1.5 rounded-md border border-white/20 hover:bg-white/10 flex items-center justify-center font-bold text-xs"
                            aria-label="Changer de langue"
                        >
                            <Globe className="w-4 h-4 mr-1" />
                            {language.toUpperCase()}
                        </button>
                        <Link
                            href={isLoggedIn ? "/profile" : "/login"}
                            className="text-slate-300 hover:text-white transition-colors p-1.5 rounded-md border border-white/20 hover:bg-white/10"
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
