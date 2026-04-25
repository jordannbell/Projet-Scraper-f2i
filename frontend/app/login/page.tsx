'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import AuthLayout from '@/components/auth/AuthLayout';
import InputGroup from '@/components/ui/InputGroup';
import SocialButton from '@/components/ui/SocialButton';
import StatusMessage from '@/components/ui/StatusMessage';
import { supabase } from '@/utils/supabase/client';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (signInError) throw signInError;
            router.push('/dashboard');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Login failed';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout mode="login">
            <form onSubmit={handleSubmit} className="space-y-3">
                <InputGroup
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    icon={
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    }
                />

                <InputGroup
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    icon={
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    }
                />

                {error && <StatusMessage type="error">{error}</StatusMessage>}

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full flex justify-center px-4 py-2.5 text-[15px] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </div>
            </form>

            <div className="mt-4 mb-4">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-slate-950 px-2 text-slate-400 font-medium">
                            OR
                        </span>
                    </div>
                </div>
            </div>

            <div className="mb-4 text-center text-xs text-slate-400">
                Don&apos;t have an account? <Link href="/register" className="font-bold text-blue-300 hover:text-blue-200 hover:underline">Sign up</Link>
            </div>

            <div className="flex flex-col gap-2.5">
                <SocialButton provider="google" />
                <SocialButton provider="linkedin" />
            </div>
        </AuthLayout>
    );
}
