'use client';

import { User, Bell, Shield, CreditCard, LogOut } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface ProfileSidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export default function ProfileSidebar({ activeTab, setActiveTab }: ProfileSidebarProps) {
    const router = useRouter();

    const menuItems = [
        { id: 'account_settings', label: 'Account Settings', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'billing', label: 'Billing', icon: CreditCard },
    ];

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="px-4 py-2 mb-2">
                <span className="text-xs font-bold text-slate-500 tracking-wider">MENU</span>
            </div>

            <nav className="flex flex-col gap-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;

                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-indigo-600/20 text-indigo-400'
                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                }`}
                        >
                            <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            <div className="my-4 border-t border-white/10" />

            <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
            </button>
        </div>
    );
}
