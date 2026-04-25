'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import AuthLayout from '@/components/auth/AuthLayout';
import InputGroup from '@/components/ui/InputGroup';
import SocialButton from '@/components/ui/SocialButton';
import StatusMessage from '@/components/ui/StatusMessage';
import { supabase } from '@/utils/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName,
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (signUpError) throw signUpError;
      setMessage('Account created. Check your email to confirm your account.');
      router.push('/login');
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : 'Registration failed';
      setError(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="register">
      <form onSubmit={handleSubmit} className="space-y-5">
        <InputGroup
          label="Full name"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          required
          icon={
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          }
        />

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
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
          icon={
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          }
        />

        {error && <StatusMessage type="error">{error}</StatusMessage>}
        {message && <StatusMessage type="success">{message}</StatusMessage>}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex justify-center px-4 py-3.5 text-[15px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </div>
      </form>

      <div className="mt-6 mb-6">
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

      <div className="mb-6 text-center text-xs text-slate-400">
        Already have an account? <Link href="/login" className="font-bold text-blue-300 hover:text-blue-200 hover:underline">Sign in</Link>
      </div>

      <div className="flex flex-col gap-3">
        <SocialButton provider="google" />
        <SocialButton provider="linkedin" />
      </div>
    </AuthLayout>
  );
}
