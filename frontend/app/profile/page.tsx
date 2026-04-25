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
        <div className="app-shell min-h-screen px-4 pb-12 pt-24 font-sans text-white sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full flex-shrink-0 md:w-64">
                    <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>

                {/* Main Content Area */}
                <div className="premium-card flex-1 p-4 sm:p-6">
                    {renderPanel()}
                </div>
            </div>
        </div>
    );
}
