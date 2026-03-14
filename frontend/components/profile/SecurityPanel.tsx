'use client';

import { useState } from 'react';
import { ShieldCheck, Key } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';

export default function SecurityPanel() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ text: "Passwords don't match.", type: 'error' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ text: "Password must be at least 6 characters.", type: 'error' });
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            setMessage({ text: error.message, type: 'error' });
        } else {
            setMessage({ text: "Password updated successfully.", type: 'success' });
            setNewPassword('');
            setConfirmPassword('');
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h3 className="text-lg font-bold text-white mb-3">Security & Access</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 flex flex-col items-start">
                        <div className="bg-indigo-500/10 p-2.5 rounded-lg text-indigo-400 mb-4">
                            <Key className="w-5 h-5" />
                        </div>
                        <h4 className="font-semibold text-slate-200">Change Password</h4>
                        <p className="text-xs text-slate-400 mb-6">Update your account password</p>

                        <form onSubmit={handlePasswordChange} className="w-full flex flex-col gap-3 mt-auto">
                            <input
                                type="password"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                            {message && (
                                <p className={`text-sm ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {message.text}
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={loading || !newPassword || !confirmPassword}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 flex flex-col items-start hover:border-white/20 transition-colors">
                        <div className="bg-emerald-500/10 p-2.5 rounded-lg text-emerald-400 mb-4">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h4 className="font-semibold text-slate-200">Two-Factor Auth</h4>
                        <p className="text-xs text-slate-400 mb-6">Coming soon</p>
                        <button disabled className="text-slate-500 font-semibold text-sm mt-auto cursor-not-allowed">Manage 2FA (Coming Soon)</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
