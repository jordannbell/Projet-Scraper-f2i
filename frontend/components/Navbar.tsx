import Link from 'next/link';

export default function Navbar() {
    const navItems = [
        { label: 'Accueil', href: '/' },
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'À propos', href: '/about' },
    ];

    return (
        <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                            Seekra
                        </Link>
                    </div>

                    <div className="hidden sm:flex sm:space-x-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="text-slate-600 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden sm:flex items-center space-x-4">
                        <Link href="/login" className="text-slate-600 hover:text-indigo-600 font-medium text-sm">
                            Connexion
                        </Link>
                        <Link href="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                            Inscription
                        </Link>
                    </div>

                    {/* Mobile menu button (basics) */}
                    <div className="sm:hidden flex items-center">
                        {/* Simple mobile menu placeholder - for now just links are hidden on mobile to keep it clean */}
                        <Link href="/dashboard" className="text-indigo-600 font-medium">Menu</Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
