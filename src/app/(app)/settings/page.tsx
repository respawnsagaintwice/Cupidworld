"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { memoryStore } from '@/lib/store/memoryStore';
import { Couple, Profile } from '@/lib/types/database';
import { DuduBubuIcon } from '@/components/decorative/DuduBubuCharacters';
import { User, Users, Copy, Check, LogOut, Save, RotateCcw, KeyRound } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);

  const [worldName, setWorldName] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [userName, setUserName] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    function refreshSettings(keepInputs = false) {
      const c = memoryStore.getCouple();
      const u = memoryStore.getCurrentUser();
      const p = memoryStore.getPartner();

      if (!c) {
        router.push('/onboarding/create');
        return;
      }

      setCouple(c);
      setCurrentUser(u);
      setPartner(p);

      if (!keepInputs) {
        setWorldName(c.name || '');
        setAnniversaryDate(c.anniversary_date || '');
        if (u) setUserName(u.display_name || '');
      }
    }

    refreshSettings(false);

    const unsubscribe = memoryStore.subscribe(() => {
      refreshSettings(true);
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couple || !currentUser) return;

    memoryStore.setCouple({
      ...couple,
      name: worldName.trim(),
      anniversary_date: anniversaryDate,
    });

    memoryStore.setCurrentUser({
      ...currentUser,
      display_name: userName.trim(),
      nickname: `${userName.trim()} ♡`,
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCopyInvite = () => {
    if (typeof window !== 'undefined' && couple?.invite_code) {
      const url = `${window.location.origin}/join?code=${couple.invite_code}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Sign out error", err);
      }
    }
    memoryStore.clearSession();
    router.push('/login');
  };

  const handleStartNewWorld = () => {
    if (window.confirm("Are you sure you want to reset this world and start completely fresh? This will clear local cached couple data.")) {
      memoryStore.resetAll();
      router.push('/onboarding/create');
    }
  };

  if (!couple) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="border-b-2 border-brand-rose/20 pb-6">
        <h1 className="font-section text-3xl sm:text-5xl font-bold text-brand-dark tracking-tight">
          World Settings
        </h1>
        <p className="font-body text-xs sm:text-sm text-brand-warm-gray mt-1">
          Customize your names, anniversary date, and partner invitation
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Couple World Info Card */}
        <div className="paper-ruled rounded-3xl p-6 sm:p-8 border-2 border-brand-rose/25 shadow-xs relative bg-white/95">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-brand-rose" />
            <h2 className="font-section text-2xl font-bold text-brand-dark">
              Our Couple Sanctuary
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                World Name
              </label>
              <input
                type="text"
                required
                value={worldName}
                onChange={(e) => setWorldName(e.target.value)}
                className="w-full bg-white border border-brand-dark/15 rounded-2xl px-4 py-2.5 font-section text-sm text-brand-dark focus:ring-2 focus:ring-brand-rose/40"
              />
            </div>

            <div>
              <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                Relationship Start / Anniversary Date
              </label>
              <input
                type="date"
                required
                value={anniversaryDate}
                onChange={(e) => setAnniversaryDate(e.target.value)}
                className="w-full bg-white border border-brand-dark/15 rounded-2xl px-4 py-2.5 font-body text-xs text-brand-dark focus:ring-2 focus:ring-brand-rose/40"
              />
              <p className="font-body text-[11px] text-brand-warm-gray mt-1">
                Controls the live relationship counter on your home page.
              </p>
            </div>
          </div>
        </div>

        {/* Partners Info Card */}
        <div className="paper-sheet rounded-3xl p-6 sm:p-8 border-2 border-brand-rose/25 shadow-xs bg-white/95">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-brand-rose" />
              <h2 className="font-section text-2xl font-bold text-brand-dark">
                The Two People in this World
              </h2>
            </div>
            <DuduBubuIcon />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                Your Display Nickname
              </label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-brand-cream-subtle border border-brand-dark/15 rounded-2xl px-4 py-2.5 font-section text-sm text-brand-dark focus:ring-2 focus:ring-brand-rose/40"
              />
            </div>

            {/* REQUIREMENT 12: PARTNER INVITATION CODE PERMANENT LOCATION */}
            <div className="p-5 rounded-2xl bg-brand-soft-pink/35 border border-brand-rose/30 mt-6 space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-brand-rose-deep" />
                <h3 className="font-section text-sm font-bold text-brand-dark uppercase tracking-wider">
                  Partner Invitation Code
                </h3>
              </div>

              {partner ? (
                /* 2/2 members state */
                <div className="p-4 rounded-xl bg-white/90 border border-brand-rose/25 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-hero text-base text-brand-dark">
                    <span>{currentUser?.display_name || 'You'}</span>
                    <span className="text-brand-rose">♡</span>
                    <span>{partner.display_name}</span>
                  </div>
                  <span className="font-button text-xs font-bold text-brand-rose-deep bg-brand-soft-pink px-3 py-1 rounded-full border border-brand-rose/30">
                    2 / 2 members
                  </span>
                </div>
              ) : (
                /* 1/2 member state */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-hero text-sm text-brand-dark">
                      Awaiting your person ♡
                    </span>
                    <span className="font-button text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
                      1 / 2 members
                    </span>
                  </div>

                  {couple.invite_code && (
                    <div className="flex flex-col sm:flex-row items-center gap-2.5">
                      <span className="w-full sm:w-auto font-mono text-lg font-bold px-4 py-2 bg-white rounded-xl border border-brand-rose/30 text-brand-dark tracking-wider text-center select-all">
                        {couple.invite_code}
                      </span>

                      <button
                        type="button"
                        onClick={handleCopyInvite}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-rose hover:bg-brand-rose-deep text-white font-button text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Invite</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons: Save, Reset World, Logout */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 rounded-full bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Changes saved ♡</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save settings</span>
              </>
            )}
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleStartNewWorld}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 font-button font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Clear current data and create a brand new couple world"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>Reset & Start New World</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-button font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock diary & log out</span>
            </button>
          </div>
        </div>

      </form>

    </div>
  );
}
