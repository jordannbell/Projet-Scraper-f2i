'use client';

import { useState } from 'react';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import AccountSettingsPanel from '@/components/profile/AccountSettingsPanel';
import BillingPanel from '@/components/profile/BillingPanel';
import SecurityPanel from '@/components/profile/SecurityPanel';
import NotificationsPanel from '@/components/profile/NotificationsPanel';

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState('account_settings');

    const renderPanel = () => {
        switch (activeTab) {
            case 'account_settings':
                return <AccountSettingsPanel />;
            case 'notifications':
                return <NotificationsPanel />;
            case 'security':
                return <SecurityPanel />;
            case 'billing':
                return <BillingPanel />;
            default:
                return <AccountSettingsPanel />;
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                    {renderPanel()}
                </div>
            </div>
        </div>
    );
}
