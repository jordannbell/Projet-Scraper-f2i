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
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Créer un compte 🚀</h2>
        <p className="mt-2 text-sm text-slate-600">
          Rejoignez Seekra pour booster votre carrière.
        </p>
      </div>

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
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/30 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:scale-[1.02]"
          >
            Create Account
          </button>
        </div>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-slate-400 uppercase tracking-widest text-xs font-semibold">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {/* Small buttons for register to save space, or stack? mockup showed stack */}
          <SocialButton provider="google" className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 px-0" />
          <SocialButton provider="facebook" className="px-0" />
          <SocialButton provider="apple" className="px-0" />
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
