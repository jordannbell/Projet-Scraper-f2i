'use client';

import { useState } from 'react';

export default function NotificationsPanel() {
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [pushNotifs, setPushNotifs] = useState(false);
    const [marketingNotifs, setMarketingNotifs] = useState(true);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center">Notification Settings</h3>
                <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between p-5 border-b border-white/5">
                        <div className="text-left">
                            <h4 className="font-semibold text-slate-200">Email Notifications</h4>
                            <p className="text-xs text-slate-400">Weekly digest and activity summaries</p>
                        </div>
                        <button
                            onClick={() => setEmailNotifs(!emailNotifs)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${emailNotifs ? 'bg-indigo-500' : 'bg-slate-700'}`}
                        >
                            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${emailNotifs ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    {/* Push Notifications */}
                    <div className="flex items-center justify-between p-5 border-b border-white/5">
                        <div className="text-left">
                            <h4 className="font-semibold text-slate-200">Push Notifications</h4>
                            <p className="text-xs text-slate-400">Real-time alerts for system events</p>
                        </div>
                        <button
                            onClick={() => setPushNotifs(!pushNotifs)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${pushNotifs ? 'bg-indigo-500' : 'bg-slate-700'}`}
                        >
                            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${pushNotifs ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    {/* Marketing */}
                    <div className="flex items-center justify-between p-5">
                        <div className="text-left">
                            <h4 className="font-semibold text-slate-200">Marketing Communications</h4>
                            <p className="text-xs text-slate-400">Product updates and special offers</p>
                        </div>
                        <button
                            onClick={() => setMarketingNotifs(!marketingNotifs)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${marketingNotifs ? 'bg-indigo-500' : 'bg-slate-700'}`}
                        >
                            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${marketingNotifs ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
