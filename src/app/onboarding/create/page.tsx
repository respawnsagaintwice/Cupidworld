"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { memoryStore } from '@/lib/store/memoryStore';
import { worldService } from '@/lib/services/worldService';
import { WashiTape } from '@/components/decorative/WashiTape';
import { DuduBubuIcon } from '@/components/decorative/DuduBubuCharacters';
import { Heart, Copy, Check, Sparkles, ArrowRight, Calendar, Users, Link as LinkIcon } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CreateCouplePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);
  const [worldName, setWorldName] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      if (supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            router.replace('/login?redirect=/onboarding/create');
            return;
          }
        } catch (err) {
          console.warn("Auth check error in create page:", err);
          router.replace('/login?redirect=/onboarding/create');
          return;
        }
      } else {
        const existing = memoryStore.getCurrentUser();
        if (!existing) {
          router.replace('/login?redirect=/onboarding/create');
          return;
        }
      }

      setCheckingAuth(false);
    }

    checkAuth();
  }, [router]);

  const handleFinishSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!anniversaryDate) {
      setError('Please select your relationship start date.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await worldService.createWorld({
        worldName: worldName.trim() || undefined,
        anniversaryDate: anniversaryDate,
      });

      setInviteCode(result.inviteCode);

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

      setSubmitting(false);
      setStep(2);
    } catch (err: unknown) {
      setSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Failed to create your world.';
      setError(msg);
    }
  };

  const getInviteUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/join?code=${inviteCode}`;
    }
    return `/join?code=${inviteCode}`;
  };

  const handleCopyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const url = getInviteUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center font-section text-sm text-brand-warm-gray">
        Opening your world... ♡
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      
      <div className="relative w-full max-w-lg">
        
        {/* Washi tape at top */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <WashiTape styleName="washi-pink" className="w-32" angle={-1} />
        </div>

        {/* Paper Container */}
        <div className="paper-ruled rounded-3xl p-8 sm:p-10 shadow-lg border-2 border-brand-rose/25 relative bg-white/95">
          
          {step === 1 ? (
            <div>
              <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-2 group mb-3">
                  <DuduBubuIcon className="scale-110" />
                  <span className="font-section text-2xl font-bold text-brand-dark">
                    us <span className="text-brand-rose">♡</span>
                  </span>
                </Link>
                <h1 className="font-hero text-3xl sm:text-4xl text-brand-dark">
                  Create your little world ♡
                </h1>
                <p className="font-body text-xs text-brand-warm-gray mt-1">
                  You are creating a private sanctuary for you and your person (1 / 2 members)
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-body text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleFinishSetup} className="space-y-4.5">
                <div>
                  <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                    World Name (optional)
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-brand-warm-gray absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={worldName}
                      onChange={(e) => setWorldName(e.target.value)}
                      placeholder="e.g. Our Cozy Corner"
                      className="w-full bg-brand-cream-subtle border border-brand-dark/15 rounded-2xl pl-9 pr-3 py-2.5 font-section text-sm text-brand-dark focus:ring-2 focus:ring-brand-rose/40 focus:border-brand-rose"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                    Relationship start / Anniversary date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-brand-warm-gray absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      value={anniversaryDate}
                      onChange={(e) => setAnniversaryDate(e.target.value)}
                      className="w-full bg-brand-cream-subtle border border-brand-dark/15 rounded-2xl pl-9 pr-3 py-2.5 font-body text-sm text-brand-dark focus:ring-2 focus:ring-brand-rose/40 focus:border-brand-rose"
                    />
                  </div>
                  <p className="font-body text-[11px] text-brand-warm-gray mt-1">
                    Used to calculate your live relationship counter on your home page ♡
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-full bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  {submitting ? (
                    <span>Building your sanctuary...</span>
                  ) : (
                    <>
                      <span>Create World ♡</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-brand-dark/10 text-center">
                <Link href="/join" className="font-section text-xs font-semibold text-brand-dark/80 hover:text-brand-rose-deep">
                  Have an invite code from your partner? Join their world instead →
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-soft-pink flex items-center justify-center border border-brand-rose/40 mb-3 shadow-2xs">
                <Sparkles className="w-7 h-7 text-brand-rose-deep" />
              </div>

              {/* Required Exact Copy */}
              <h1 className="font-hero text-2xl sm:text-3xl text-brand-dark">
                Your little world is ready ♡
              </h1>
              <p className="font-section text-base font-semibold text-brand-rose-deep mt-1">
                Now invite your person.
              </p>
              <p className="font-body text-xs text-brand-warm-gray mt-1 max-w-sm mx-auto">
                Share this exclusive invite code with them so they can create an account and join:
              </p>

              {/* Invite Card Box */}
              <div className="my-6 p-5 bg-brand-cream-subtle rounded-3xl border-2 border-brand-rose/30 shadow-2xs text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-section text-[11px] font-bold text-brand-warm-gray uppercase tracking-wider">
                    Partner Invitation Code
                  </span>
                  <span className="font-button text-[11px] text-brand-rose-deep font-bold bg-brand-soft-pink px-2.5 py-0.5 rounded-full border border-brand-rose/30">
                    1 / 2 members
                  </span>
                </div>
                
                {/* WORLD-XXXXXX Code */}
                <div className="font-mono text-2xl font-bold text-brand-dark tracking-wider bg-white px-4 py-3 rounded-2xl border border-brand-dark/10 mb-4 text-center select-all">
                  {inviteCode}
                </div>

                {/* EXACT REQUIRED BUTTONS: Copy Code & Copy Invite Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="py-3 px-4 rounded-2xl bg-white hover:bg-brand-soft-pink/50 text-brand-dark font-button font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-brand-rose/30 cursor-pointer shadow-2xs"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">Code Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-brand-rose-deep" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="py-3 px-4 rounded-2xl bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4 text-white" />
                        <span>Copy Invite Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/home')}
                  className="w-full py-3.5 rounded-full bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Enter Our World</span>
                  <Heart className="w-4 h-4 fill-white" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
