"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { memoryStore } from '@/lib/store/memoryStore';
import { Profile } from '@/lib/types/database';
import { worldService, InviteValidationResult } from '@/lib/services/worldService';
import { DuduBubuIcon } from '@/components/decorative/DuduBubuCharacters';
import { WashiTape } from '@/components/decorative/WashiTape';
import { Heart, KeyRound, ArrowRight, UserPlus, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeParam = searchParams.get('code') || '';

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [codeOrLink, setCodeOrLink] = useState(codeParam);
  const [partnerName, setPartnerName] = useState('');
  const [validationResult, setValidationResult] = useState<InviteValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Clean code extractor (handles code, ?code=..., or full URL)
  const extractCode = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return '';
    if (trimmed.includes('code=')) {
      const match = trimmed.match(/code=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) return match[1].toUpperCase();
    }
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      return parts[parts.length - 1].toUpperCase();
    }
    return trimmed.toUpperCase();
  };

  // Check auth on mount
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      if (supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setIsAuthenticated(true);
            const local = memoryStore.getCurrentUser();
            const displayName = user.user_metadata?.display_name || local?.display_name || user.email?.split('@')[0] || 'My Love';
            const profile: Profile = {
              id: user.id,
              display_name: displayName,
              nickname: `${displayName} ♡`,
              created_at: user.created_at,
            };
            setCurrentUser(profile);
            setPartnerName(displayName);
            memoryStore.setCurrentUser(profile);
            return;
          } else {
            // When Supabase is configured, lack of Supabase session means unauthenticated
            setIsAuthenticated(false);
            setCurrentUser(null);
            return;
          }
        } catch (err) {
          console.warn("Auth check error in join page:", err);
          setIsAuthenticated(false);
          setCurrentUser(null);
          return;
        }
      }

      // 2. Offline / local fallback mode ONLY when Supabase is not configured
      const local = memoryStore.getCurrentUser();
      if (local) {
        setIsAuthenticated(true);
        setCurrentUser(local);
        setPartnerName(local.display_name || '');
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    }

    checkAuth();
  }, []);

  // Validate invite when code is entered/changed by an authenticated user
  useEffect(() => {
    let isMounted = true;
    const cleanCode = extractCode(codeOrLink);

    async function runValidation() {
      if (!cleanCode || cleanCode.length < 3 || isAuthenticated !== true) {
        if (isMounted) {
          setValidationResult(null);
        }
        return;
      }

      if (isMounted) {
        setValidating(true);
        setErrorMessage('');
      }

      const result = await worldService.validateInvite(cleanCode);
      if (!isMounted) return;
      setValidating(false);
      setValidationResult(result);
      if (!result.valid) {
        setErrorMessage(result.message);
      } else {
        setErrorMessage('');
      }
    }

    runValidation();

    return () => {
      isMounted = false;
    };
  }, [codeOrLink, isAuthenticated]);

  const cleanCurrentCode = extractCode(codeOrLink);
  const redirectTarget = `/join${cleanCurrentCode ? `?code=${encodeURIComponent(cleanCurrentCode)}` : ''}`;
  const signupUrl = `/signup?redirect=${encodeURIComponent(redirectTarget)}`;
  const loginUrl = `/login?redirect=${encodeURIComponent(redirectTarget)}`;

  // Handle explicit confirmation to join
  const handleConfirmJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!cleanCurrentCode) {
      setErrorMessage("Please enter an invite code.");
      return;
    }

    setJoining(true);

    const result = await worldService.joinWorld(cleanCurrentCode, partnerName.trim() || undefined);

    if (!result.success) {
      setJoining(false);
      setErrorMessage(result.error || "Failed to join world.");
      return;
    }

    try {
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F67599', '#FFDFEA', '#FFF2BC', '#ECE4FF'],
      });
    } catch {
      // ignore
    }

    setJoining(false);
    router.push('/home');
  };

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      
      <div className="relative w-full max-w-md">
        
        {/* Top washi tape */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <WashiTape styleName="washi-pink" className="w-28" angle={-1.5} />
        </div>

        {/* Paper Container */}
        <div className="paper-ruled rounded-3xl p-8 sm:p-10 shadow-lg border-2 border-brand-rose/25 relative bg-white/95">
          
          {/* Header */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 group mb-3">
              <DuduBubuIcon className="scale-110" />
              <span className="font-section text-2xl font-bold text-brand-dark">
                us <span className="text-brand-rose">♡</span>
              </span>
            </Link>
            <h1 className="font-hero text-2xl sm:text-3xl text-brand-dark">
              Join World ♡
            </h1>
            <p className="font-body text-xs text-brand-warm-gray mt-1">
              Enter your partner&apos;s exclusive code to enter your private sanctuary
            </p>
          </div>

          {/* STATE 1: Checking authentication */}
          {isAuthenticated === null && (
            <div className="py-8 text-center font-section text-sm text-brand-warm-gray">
              Verifying sanctuary doors... ♡
            </div>
          )}

          {/* STATE 2: NOT Authenticated — Strict Requirement: Cannot view private world data or join */}
          {isAuthenticated === false && (
            <div className="space-y-5">
              <div className="p-5 rounded-3xl bg-[#FFF4F7] border-2 border-dashed border-brand-rose/40 text-brand-dark font-body text-xs space-y-2">
                <p className="font-hero text-sm text-brand-dark">
                  First, come in as yourself ♡
                </p>
                <p className="text-brand-dark/85 leading-relaxed">
                  Create an account or log in before joining your person&apos;s world.
                </p>
              </div>

              {/* EXACTLY TWO AUTHENTICATION CHOICES */}
              <div className="space-y-3 pt-1">
                <Link
                  href={signupUrl}
                  className="w-full py-3.5 rounded-full bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account ♡</span>
                </Link>

                <Link
                  href={loginUrl}
                  className="w-full py-3.5 rounded-full bg-white hover:bg-brand-soft-pink/40 text-brand-dark font-button font-bold text-sm border-2 border-brand-rose/30 shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-brand-dark/70" />
                  <span>Log In</span>
                </Link>
              </div>

              <div className="pt-3 border-t border-brand-dark/10 text-center">
                <Link href="/" className="font-section text-xs font-semibold text-brand-dark/70 hover:text-brand-rose-deep">
                  ← Return to home
                </Link>
              </div>
            </div>
          )}

          {/* STATE 3: Authenticated — Enter code & explicitly confirm joining */}
          {isAuthenticated === true && (
            <form onSubmit={handleConfirmJoin} className="space-y-4">
              
              {/* Authenticated user greeting badge */}
              <div className="p-3 rounded-2xl bg-brand-soft-pink/40 border border-brand-rose/30 flex items-center justify-between text-xs font-section">
                <span className="text-brand-dark/80">Logged in as:</span>
                <span className="font-bold text-brand-rose-deep">{currentUser?.display_name || 'You'} ♡</span>
              </div>

              {/* Error Message banner with exact requirements */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-body text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Valid Invitation Preview Card */}
              {validationResult?.valid && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-body text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold font-section text-sm text-emerald-950">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Invitation Verified!</span>
                  </div>
                  <p className="leading-relaxed">
                    You have been invited by{' '}
                    <span className="font-bold text-emerald-900">{validationResult.creator_name}</span> to join{' '}
                    <span className="font-bold text-emerald-900">{validationResult.world_name}</span>.
                  </p>
                </div>
              )}

              {/* Input for Code */}
              <div>
                <label className="block font-section text-xs font-bold text-brand-dark mb-1.5">
                  Partner&apos;s World Code or Invite Link
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-brand-warm-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. WORLD-A1B2C3 or paste invite link"
                    value={codeOrLink}
                    onChange={(e) => {
                      setCodeOrLink(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    className="w-full bg-brand-cream-subtle border border-brand-dark/15 rounded-2xl pl-10 pr-4 py-2.5 font-section text-sm text-brand-dark uppercase tracking-wide focus:outline-hidden focus:ring-2 focus:ring-brand-rose/40 placeholder:normal-case placeholder:font-body placeholder:tracking-normal"
                  />
                </div>
              </div>

              {/* Nickname confirmation */}
              <div>
                <label className="block font-section text-xs font-bold text-brand-dark mb-1.5">
                  Your display name in this world
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bubu"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full bg-brand-cream-subtle border border-brand-dark/15 rounded-2xl px-4 py-2.5 font-section text-sm text-brand-dark focus:outline-hidden focus:ring-2 focus:ring-brand-rose/40"
                />
              </div>

              {/* Explicit Confirmation Button: Join Our World ♡ */}
              <button
                type="submit"
                disabled={joining || validating || (validationResult !== null && !validationResult.valid)}
                className="w-full py-3.5 rounded-full bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? (
                  <span>Unlocking sanctuary gates...</span>
                ) : validating ? (
                  <span>Checking world keys...</span>
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-white" />
                    <span>Join Our World ♡</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-6 pt-4 border-t border-brand-dark/10 text-center">
                <Link href="/onboarding/create" className="font-section text-xs font-bold text-brand-dark/80 hover:text-brand-rose-deep">
                  Want to create a new world instead? →
                </Link>
              </div>

            </form>
          )}

        </div>

      </div>

    </div>
  );
}

export default function DirectJoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-cream flex items-center justify-center font-section text-sm text-brand-warm-gray">Opening...</div>}>
      <JoinContent />
    </Suspense>
  );
}
