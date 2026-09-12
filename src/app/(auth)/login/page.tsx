"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { memoryStore } from '@/lib/store/memoryStore';
import { DuduBubuIcon } from '@/components/decorative/DuduBubuCharacters';
import { WashiTape } from '@/components/decorative/WashiTape';
import { Heart, Lock, Mail, AlertCircle } from 'lucide-react';
import { Couple } from '@/lib/types/database';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateForm = (): boolean => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address (e.g. name@domain.com).");
      return false;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return false;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) return;
    setLoading(true);

    const supabase = createClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error || !data?.user) {
          setErrorMessage(error?.message || "Invalid email or password.");
          setLoading(false);
          return;
        }

        const user = data.user;
        const displayName = user.user_metadata?.display_name || email.trim().split('@')[0];
        memoryStore.setCurrentUser({
          id: user.id,
          display_name: displayName,
          nickname: `${displayName} ♡`,
          created_at: user.created_at,
        });

        // Check if user belongs to a world
        const { data: membership } = await supabase
          .from('couple_members')
          .select('couple_id, role, couples(*)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (membership && membership.couples) {
          memoryStore.setCouple(membership.couples as unknown as Couple);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Could not connect to authentication server.";
        setErrorMessage(msg);
        setLoading(false);
        return;
      }
    } else {
      // Genuine offline / local fallback mode: strict password verification
      try {
        const result = await memoryStore.authenticateLocalUser(email.trim(), password);
        if (!result.success || !result.user) {
          setErrorMessage(result.error || "Invalid email or password.");
          setLoading(false);
          return;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Authentication error.";
        setErrorMessage(msg);
        setLoading(false);
        return;
      }
    }

    setLoading(false);

    // Determine target route: prioritize explicit redirect parameter
    if (redirectParam) {
      router.push(redirectParam);
    } else {
      const couple = memoryStore.getCouple();
      if (couple) {
        router.push('/home');
      } else {
        router.push('/onboarding/create');
      }
    }
  };

  const signupLink = redirectParam ? `/signup?redirect=${encodeURIComponent(redirectParam)}` : '/signup';
  const joinLink = redirectParam && redirectParam.startsWith('/join') ? redirectParam : '/join';

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      
      {/* Background cute paw watermark */}
      <div className="absolute top-8 right-8 opacity-20 pointer-events-none hidden sm:block w-36 h-36 rounded-3xl overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/dudububu/dudu_bubu_paws.png" alt="Paws" className="w-full h-full object-cover" />
      </div>

      <div className="relative w-full max-w-md">
        
        {/* Top washi tape */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <WashiTape styleName="washi-pink" className="w-28" angle={-1.5} />
        </div>

        {/* Paper Notebook Card */}
        <div className="paper-ruled rounded-3xl p-8 sm:p-10 shadow-lg border-2 border-brand-rose/25 relative bg-white/95">
          
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 group mb-3">
              <DuduBubuIcon className="scale-110" />
              <span className="font-section text-2xl font-bold text-brand-dark">
                us <span className="text-brand-rose">♡</span>
              </span>
            </Link>
            <h1 className="font-hero text-2xl sm:text-3xl text-brand-dark">
              Welcome back, love ♡
            </h1>
            <p className="font-body text-xs text-brand-warm-gray mt-1">
              Log in to access your private couple world
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-body text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-brand-warm-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-brand-cream-subtle border border-brand-dark/15 rounded-2xl px-10 py-2.5 font-body text-sm text-brand-dark placeholder:text-brand-muted focus:outline-hidden focus:ring-2 focus:ring-brand-rose/40 focus:border-brand-rose transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-section text-xs font-semibold text-brand-dark">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-brand-warm-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-brand-cream-subtle border border-brand-dark/15 rounded-2xl px-10 py-2.5 font-body text-sm text-brand-dark placeholder:text-brand-muted focus:outline-hidden focus:ring-2 focus:ring-brand-rose/40 focus:border-brand-rose transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-sm shadow-xs transition-all hover:scale-101 active:scale-99 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{loading ? 'Opening journal...' : 'Log In ♡'}</span>
              <Heart className="w-4 h-4 fill-white" />
            </button>
          </form>

          <div className="mt-8 pt-5 border-t border-brand-dark/10 text-center space-y-2">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-body text-brand-warm-gray">
              <span>Don&apos;t have an account yet?</span>
              <Link href={signupLink} className="font-section text-brand-rose-deep font-bold hover:underline">
                Create Account ♡
              </Link>
            </div>
            
            <div>
              <Link href={joinLink} className="font-section text-xs text-brand-dark/80 hover:text-brand-rose-deep font-semibold">
                Have an invite code? Join here
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-cream flex items-center justify-center font-section text-sm text-brand-warm-gray">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
