'use client';

import AuthLayout from '@/components/auth/AuthLayout';
import InputGroup from '@/components/ui/InputGroup';
import SocialButton from '@/components/ui/SocialButton';
import Link from 'next/link';

export default function RegisterPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Register submit");
  };

  return (
    <AuthLayout mode="register">
      <form onSubmit={handleSubmit} className="space-y-5">

        <InputGroup
          label="Nom complet"
          placeholder="John Doe"
          icon={
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          }
        />

        <InputGroup
          label="Email"
          type="email"
          placeholder="Airspace@info.com"
          icon={
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          }
        />

        <InputGroup
          label="Password"
          type="password"
          placeholder="••••••••••••"
          icon={
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          }
        />

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg text-[15px] font-semibold text-white bg-[#0052FF] hover:bg-[#0040DD] focus:outline-none transition-colors"
          >
            Create Account
          </button>
        </div>
      </form>

      <div className="mt-6 mb-6">
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

      <div className="text-center text-xs text-slate-500 mb-6">
        Already have an account ? <Link href="/login" className="font-bold text-[#0052FF] hover:underline">Sign in</Link>
      </div>

      <div className="flex flex-col gap-3">
        <SocialButton provider="google" />
        <SocialButton provider="facebook" />
        <SocialButton provider="apple" />
      </div>
    </AuthLayout>
  );
}
