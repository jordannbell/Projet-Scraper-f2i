'use client';

import { CheckCircle2 } from 'lucide-react';

export default function BillingPanel() {
    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-white mb-2">Billing & Subscription</h2>

            <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-3xl font-extrabold text-white">Pro Plan</h3>
                            <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full text-xs font-bold text-white shadow-lg">ACTIVE</span>
                        </div>
                        <p className="text-slate-400 max-w-md text-sm">You are currently on the Pro plan. You have access to all advanced scraping features and premium recommendations.</p>
                    </div>
                    <div className="text-left md:text-right">
                        <p className="text-4xl font-extrabold text-white mb-1">$29<span className="text-lg text-slate-400 font-medium">/mo</span></p>
                        <p className="text-xs text-slate-500">Next billing date: April 15, 2026</p>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="space-y-3">
                        {['Unlimited job searches', 'Premium recommendations API', 'Export results to CSV', 'Priority email support'].map((feature, i) => (
                            <li key={i} className="flex items-center text-sm text-slate-300">
                                <CheckCircle2 className="w-5 h-5 text-indigo-400 mr-3 flex-shrink-0" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                    <div className="flex items-end justify-start md:justify-end gap-3 mt-6 md:mt-0">
                        <button className="px-6 py-2.5 rounded-lg font-semibold text-sm border border-white/10 text-white hover:bg-white/5 transition-colors">
                            Cancel Plan
                        </button>
                        <button className="px-6 py-2.5 rounded-lg font-semibold text-sm bg-white text-slate-900 hover:bg-slate-200 transition-colors shadow-lg">
                            Upgrade to Enterprise
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-white mb-3 mt-4">Invoices</h3>
                <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
                    {/* Invoice List */}
                    <div className="flex items-center justify-between p-5 border-b border-white/5 hover:bg-white/5 transition-colors">
                        <div>
                            <p className="font-semibold text-sm text-slate-200">March 15, 2026</p>
                            <p className="text-xs text-slate-500">Pro Plan - Monthly</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-slate-300">$29.00</span>
                            <button className="text-indigo-400 text-sm font-semibold hover:text-indigo-300">Download</button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors">
                        <div>
                            <p className="font-semibold text-sm text-slate-200">February 15, 2026</p>
                            <p className="text-xs text-slate-500">Pro Plan - Monthly</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-slate-300">$29.00</span>
                            <button className="text-indigo-400 text-sm font-semibold hover:text-indigo-300">Download</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
