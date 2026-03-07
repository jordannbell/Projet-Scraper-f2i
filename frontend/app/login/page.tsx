'use client';

import AuthLayout from '@/components/auth/AuthLayout';
import InputGroup from '@/components/ui/InputGroup';
import SocialButton from '@/components/ui/SocialButton';
import Link from 'next/link';

export default function LoginPage() {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Logic later
        console.log("Login submit");
    };

    return (
        <AuthLayout mode="login">
            <form onSubmit={handleSubmit} className="space-y-3">
                <InputGroup
                    label="Email"
                    type="email"
                    placeholder="Airspace@info.com"
                    icon={
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    }
                />

                <div className="space-y-1">
                    <InputGroup
                        label="Password"
                        type="password"
                        placeholder="••••••••••••"
                        icon={
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        }
                    />
                </div>

                <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-300 font-medium select-none">
                            Remember me
                        </label>
                    </div>

                    <div className="text-sm">
                        <a href="#" className="font-medium text-slate-400 hover:text-indigo-600 transition-colors">
                            Forgot password?
                        </a>
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-[15px] font-semibold text-white bg-[#0052FF] hover:bg-[#0040DD] focus:outline-none transition-colors"
                    >
                        Sign In
                    </button>
                </div>
            </form>

            <div className="mt-4 mb-4">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-[#0a0a0a] px-2 text-slate-400 font-medium">
                            OR
                        </span>
                    </div>
                </div>
            </div>

            <div className="text-center text-xs text-slate-500 mb-4">
                Don't have an account ? <Link href="/register" className="font-bold text-[#0052FF] hover:underline">Sign up</Link>
            </div>

            <div className="flex flex-col gap-2.5">
                <SocialButton provider="google" />
                <SocialButton provider="facebook" />
                <SocialButton provider="apple" />
            </div>
        </AuthLayout>
    );
}
