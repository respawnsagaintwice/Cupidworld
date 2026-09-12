"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { memoryStore } from '@/lib/store/memoryStore';
import { DuduBubuIcon } from '@/components/decorative/DuduBubuCharacters';
import { WashiTape } from '@/components/decorative/WashiTape';
import { Lock, Mail, User, ArrowRight, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState('');
  const [isSupabaseMode, setIsSupabaseMode] = useState<boolean | null>(null);

  useEffect(() => {
    const client = createClient();
    setIsSupabaseMode(!!client);
  }, []);

  const validateForm = (): boolean => {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage("Please enter your display name (at least 2 characters).");
      return false;
    }
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
      setErrorMessage("Please enter a password.");
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
        const callbackUrl = typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback${redirectParam ? `?next=${encodeURIComponent(redirectParam)}` : ''}`
          : undefined;

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: name.trim(),
            },
            emailRedirectTo: callbackUrl,
          },
        });

        if (error) {
          setErrorMessage(error.message || "Could not register account.");
          setLoading(false);
          return;
        }

        // Supabase returns an obfuscated user with empty identities when email already exists
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setErrorMessage("An account with this email already exists. Please log in.");
          setLoading(false);
          return;
        }

        if (!data.user) {
          setErrorMessage("Could not register account. Please try again.");
          setLoading(false);
          return;
        }

        setLoading(false);

        // When Confirm Email is enabled, data.user exists but data.session is null.
        // User MUST NOT be authenticated, local cookies MUST NOT be set, and no redirect into app.
        if (data.user && !data.session) {
          setConfirmedEmail(email.trim());
          setConfirmationSent(true);
          return;
        }

        // Only when an immediate active session exists (e.g. email confirmation disabled):
        if (data.session) {
          if (redirectParam) {
            router.push(redirectParam);
          } else {
            router.push('/onboarding/create');
          }
          return;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Auth error occurred.";
        setErrorMessage(msg);
        setLoading(false);
        return;
      }
    } else {
      // Genuine offline / local fallback mode
      try {
        const result = await memoryStore.registerLocalUser(
          email.trim(),
          password,
          name.trim()
        );
        if (!result.success) {
          setErrorMessage(result.error || "Could not register account.");
          setLoading(false);
          return;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Could not register account.";
        setErrorMessage(msg);
        setLoading(false);
        return;
      }

      setLoading(false);

      // Direct user to target route preserving invite code redirect
      if (redirectParam) {
        router.push(redirectParam);
      } else {
        router.push('/onboarding/create');
      }
    }
  };

  const loginLink = redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login';

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      
      <div className="relative w-full max-w-md">
        
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <WashiTape styleName="washi-lavender" className="w-28" angle={2} />
        </div>

        <div className="paper-ruled rounded-3xl p-8 sm:p-10 shadow-lg border-2 border-brand-rose/25 relative bg-white/95">
          
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 group mb-3">
              <DuduBubuIcon className="scale-110" />
              <span className="font-section text-2xl font-bold text-brand-dark">
                us <span className="text-brand-rose">♡</span>
              </span>
            </Link>
            <h1 className="font-hero text-2xl sm:text-3xl text-brand-dark">
              {confirmationSent ? "Check your email ♡" : "Begin your story ♡"}
            </h1>
            <p className="font-body text-xs text-brand-warm-gray mt-1">
              {confirmationSent
                ? "Your verification link is on its way"
                : "Create your private account to start or join a world"}
            </p>
          </div>

          {/* Offline development mode notice when Supabase is not configured */}
          {isSupabaseMode === false && !confirmationSent && (
            <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-body text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold font-section text-amber-950">Offline Development Mode:</span> Supabase is not configured. Accounts are saved in local browser storage only.
              </div>
            </div>
          )}

          {/* CONFIRMATION SENT VIEW */}
          {confirmationSent ? (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-brand-soft-pink/50 border-2 border-brand-rose/40 flex items-center justify-center text-brand-rose">
                <Mail className="w-8 h-8 animate-bounce" />
              </div>

              <div className="p-4 rounded-2xl bg-[#FFF5F8] border border-brand-rose/30 text-brand-dark font-body text-xs space-y-2 text-left">
                <div className="flex items-center gap-1.5 font-bold font-section text-sm text-brand-rose-deep">
                  <CheckCircle2 className="w-4 h-4 text-brand-rose" />
                  <span>Check your email 💌</span>
                </div>
                <p className="leading-relaxed text-brand-dark/90">
                  We&apos;ve sent a verification link to <span className="font-bold text-brand-dark">{confirmedEmail}</span>.
                </p>
                <p className="leading-relaxed text-brand-warm-gray">
                  Please confirm your email before entering Our Little World. Once clicked, you can log in below to enter your shared world.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  href={loginLink}
                  className="w-full py-3.5 rounded-full bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Go to Log In →</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setConfirmationSent(false);
                    setErrorMessage('');
                  }}
                  className="text-xs font-section text-brand-warm-gray hover:text-brand-dark underline cursor-pointer"
                >
                  Use a different email address
                </button>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-body text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                    Your name / nickname
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-brand-warm-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Yuki"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-brand-cream-subtle border border-brand-dark/15 rounded-2xl px-10 py-2.5 font-body text-sm text-brand-dark placeholder:text-brand-muted focus:outline-hidden focus:ring-2 focus:ring-brand-rose/40 focus:border-brand-rose transition-all"
                    />
                  </div>
                </div>

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
                  <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                    Secret password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-brand-warm-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="•••••••• (min. 6 characters)"
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
                  <span>{loading ? 'Creating your account...' : 'Create Account ♡'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-8 pt-5 border-t border-brand-dark/10 text-center">
                <p className="font-body text-xs text-brand-warm-gray">
                  Already have an account?{' '}
                  <Link href={loginLink} className="font-section text-brand-rose-deep font-bold hover:underline">
                    Log in →
                  </Link>
                </p>
              </div>
            </>
          )}

        </div>

      </div>

    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-cream flex items-center justify-center font-section text-sm text-brand-warm-gray">Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}
