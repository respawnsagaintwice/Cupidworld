"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { memoryStore } from '@/lib/store/memoryStore';
import { Couple, Memory, ImportantDate, LoveNote, Profile } from '@/lib/types/database';
import { getDaysTogether, getTimeOfDayGreeting, formatRomanticDate } from '@/lib/utils/date';
import { PolaroidCard } from '@/components/decorative/PolaroidCard';
import { PaperCard } from '@/components/decorative/PaperCard';
import { WashiTape } from '@/components/decorative/WashiTape';
import { DuduBubuIcon } from '@/components/decorative/DuduBubuCharacters';
import { Heart, Calendar, ArrowRight, Plus, Copy, Check, Link as LinkIcon } from 'lucide-react';

export default function CoupleHomePage() {
  const router = useRouter();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [latestMemory, setLatestMemory] = useState<Memory | null>(null);
  const [upcomingDate, setUpcomingDate] = useState<ImportantDate | null>(null);
  const [pinnedNote, setPinnedNote] = useState<LoveNote | null>(null);
  const [daysTogether, setDaysTogether] = useState<number>(0);
  const [greeting, setGreeting] = useState<string>("Good evening ♡");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    function refreshHomeState() {
      const c = memoryStore.getCouple();
      if (!c) {
        router.push('/onboarding/create');
        return;
      }

      const u = memoryStore.getCurrentUser();
      const p = memoryStore.getPartner();
      const memories = memoryStore.getMemories();
      const dates = memoryStore.getImportantDates();
      const notes = memoryStore.getLoveNotes();

      setCouple(c);
      setCurrentUser(u);
      setPartner(p);

      const timeGreeting = getTimeOfDayGreeting();
      const userName = u?.display_name ? `, ${u.display_name}` : '';
      setGreeting(`${timeGreeting.replace('love', '').replace('♡', '').trim()}${userName} ♡`);

      if (c?.anniversary_date) {
        setDaysTogether(getDaysTogether(c.anniversary_date));
      }

      setLatestMemory(memories.length > 0 ? memories[0] : null);
      setUpcomingDate(dates.length > 0 ? dates[0] : null);

      const pinned = notes.find((n) => n.is_pinned) || notes[0];
      setPinnedNote(pinned || null);
    }

    refreshHomeState();

    const unsubscribe = memoryStore.subscribe(() => {
      refreshHomeState();
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  const handleCopyCode = () => {
    if (!couple?.invite_code) return;
    navigator.clipboard.writeText(couple.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!couple?.invite_code) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/join?code=${couple.invite_code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!couple) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-section text-xl text-brand-warm-gray">
        opening our little world... ♡
      </div>
    );
  }

  const isSingleMember = !partner;

  return (
    <div className="space-y-8 sm:space-y-10">
      
      {/* 1. Header Banner with Watercolor Landscape Background */}
      <section className="relative rounded-3xl sm:rounded-[36px] overflow-hidden border-2 border-brand-rose/30 shadow-xs bg-[#FFF6F0]">
        
        {/* Soft Watercolor Background */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cute_home_bg.jpg"
            alt="Cute Background"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFF9F4]/95 via-[#FFF9F4]/85 to-[#FFF9F4]/60" />
        </div>

        {/* Content over background */}
        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            {/* World Name Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-button font-bold text-brand-rose-deep bg-white/90 px-3.5 py-1 rounded-full border border-brand-rose/30 shadow-2xs">
                <DuduBubuIcon className="scale-75 -ml-1" />
                <span>{couple.name}</span>
              </div>
            </div>
            
            {/* Greeting */}
            <h1 className="font-hero text-3xl sm:text-5xl text-brand-dark tracking-tight leading-tight">
              {greeting}
            </h1>
            
            {/* Conditional Subtitle: 1 Person vs 2 Persons */}
            <div className="font-section text-sm sm:text-base text-brand-warm-gray font-medium flex items-center gap-2">
              {partner ? (
                /* 2/2 member state: Yuki ♡ Bubu • together always */
                <div className="flex items-center gap-1.5 text-sm sm:text-base font-medium">
                  <span className="font-bold text-brand-dark">{currentUser?.display_name || 'You'}</span>
                  <span className="text-brand-rose font-bold">♡</span>
                  <span className="font-bold text-brand-dark">{partner.display_name}</span>
                  <span className="text-xs text-brand-muted ml-1">• together always</span>
                </div>
              ) : (
                /* 1/2 member state: Creator only, Waiting for your person to join ♡ */
                <div className="flex items-center gap-2">
                  <span className="font-bold text-brand-dark">{currentUser?.display_name || 'You'}</span>
                  <span className="text-xs text-brand-rose-deep font-semibold px-2.5 py-0.5 rounded-full bg-brand-soft-pink border border-brand-rose/30">
                    Waiting for your person to join ♡
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Days Together Counter Badge */}
          <div className="self-start md:self-auto paper-sheet rounded-3xl px-6 py-4 border-2 border-brand-rose/30 shadow-xs flex items-center gap-4 bg-white/95 backdrop-blur-xs">
            <div className="w-12 h-12 rounded-2xl bg-brand-soft-pink flex items-center justify-center text-brand-rose shrink-0 border border-brand-rose/30">
              <Heart className="w-6 h-6 fill-brand-rose animate-pulse" />
            </div>
            <div>
              <span className="font-section text-xs text-brand-warm-gray uppercase tracking-wider font-semibold block">
                Together for
              </span>
              <span className="font-hero text-2xl sm:text-3xl text-brand-dark leading-none">
                {daysTogether} <span className="text-brand-rose text-lg">days ♡</span>
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* CUTE INVITATION SECTION (Visible ONLY while 1/2 members, disappears when partner joins) */}
      {isSingleMember && couple.invite_code && (
        <section className="p-5 sm:p-6 rounded-3xl bg-[#FFF0F4] border-2 border-dashed border-brand-rose/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-brand-rose-deep border border-brand-rose/30 shadow-2xs shrink-0 mt-0.5 sm:mt-0">
              <Heart className="w-6 h-6 fill-brand-rose text-brand-rose animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-hero text-base sm:text-lg text-brand-dark">
                  Waiting for your person ♡
                </h3>
                <span className="text-[11px] font-bold font-button text-brand-rose-deep bg-brand-soft-pink px-2.5 py-0.5 rounded-full border border-brand-rose/30">
                  1 / 2 members
                </span>
              </div>
              <p className="font-body text-xs text-brand-warm-gray leading-relaxed max-w-md">
                Share this invite with them to join your private sanctuary.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            {/* Display Code */}
            <span className="font-mono text-sm font-bold px-4 py-2 bg-white rounded-xl border border-brand-rose/30 text-brand-dark tracking-wider text-center select-all shadow-2xs">
              {couple.invite_code}
            </span>

            {/* Copy Code Button */}
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-brand-soft-pink/50 text-brand-dark font-button text-xs font-bold border border-brand-rose/30 shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Code Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-brand-rose-deep" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            {/* Copy Invite Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl bg-brand-rose hover:bg-brand-rose-deep text-white font-button text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-3.5 h-3.5 text-white" />
                  <span>Copy Invite Link</span>
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {/* 2. Scrapbook Grid Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Featured Latest Memory Polaroid (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-section text-2xl sm:text-3xl font-bold text-brand-dark">
                Latest Memory
              </h2>
              <span className="text-lg text-brand-rose">♡</span>
            </div>
            <Link
              href="/memories"
              className="font-button text-xs sm:text-sm font-bold text-brand-rose-deep hover:underline flex items-center gap-1"
            >
              <span>all memories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {latestMemory ? (
            <div className="pt-2 flex justify-center sm:justify-start">
              <PolaroidCard memory={latestMemory} className="w-full max-w-[420px]" />
            </div>
          ) : (
            <PaperCard variant="sheet" className="text-center py-10">
              <p className="font-section text-2xl font-bold text-brand-dark">Your little scrapbook is empty ♡</p>
              <p className="font-body text-xs text-brand-warm-gray mt-1 mb-4">Go make your first memory together.</p>
              <Link
                href="/memories/new"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-brand-rose text-white font-button font-bold text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add a memory</span>
              </Link>
            </PaperCard>
          )}

          {/* "On This Day" Nostalgic Milestone Card */}
          <div className="relative pt-4">
            <div className="paper-ruled rounded-3xl p-5 sm:p-6 border-2 border-brand-rose/25 relative overflow-hidden shadow-xs bg-white/95">
              <div className="absolute top-2 right-4 pointer-events-none">
                <WashiTape styleName="washi-yellow" className="w-20" angle={2} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🌸</span>
                <h3 className="font-section text-2xl font-bold text-brand-dark">
                  On this day ♡
                </h3>
              </div>
              {latestMemory ? (
                <>
                  <p className="font-body text-sm text-brand-dark/90 leading-relaxed">
                    <span className="font-bold text-brand-rose-deep">{latestMemory.title}</span>
                    {latestMemory.caption ? ` — “${latestMemory.caption}”` : ''}
                  </p>
                  <div className="mt-3 flex items-center justify-between font-body text-xs text-brand-warm-gray">
                    <span>{formatRomanticDate(latestMemory.memory_date)} ✦</span>
                    <Link href="/memories" className="font-button font-bold text-brand-rose-deep hover:underline">
                      view in scrapbook →
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-body text-sm text-brand-dark/90 leading-relaxed">
                    Every big journey starts with little moments. Add a photo or write a note today so future you can look back on this day.
                  </p>
                  <div className="mt-3 flex items-center justify-between font-body text-xs text-brand-warm-gray">
                    <span>A clean new page ✦</span>
                    <Link href="/memories/new" className="font-button font-bold text-brand-rose-deep hover:underline">
                      + pin first memory →
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Date, Love Note (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Upcoming Date Card */}
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-section text-2xl sm:text-3xl font-bold text-brand-dark">
                  Next little thing...
                </h2>
                <span className="text-lg text-brand-rose">♡</span>
              </div>
              <Link
                href="/calendar"
                className="font-button text-xs sm:text-sm font-bold text-brand-rose-deep hover:underline flex items-center gap-1"
              >
                <span>calendar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {upcomingDate ? (
              <div className="paper-sheet rounded-3xl p-5 sm:p-6 border-2 border-brand-rose/30 shadow-xs relative bg-white/95">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-soft-pink flex items-center justify-center text-2xl shadow-2xs border border-brand-rose/30">
                      {upcomingDate.type === 'anniversary' && '💗'}
                      {upcomingDate.type === 'birthday' && '🎂'}
                      {upcomingDate.type === 'trip' && '✈️'}
                      {upcomingDate.type === 'special' && '✨'}
                      {!['anniversary', 'birthday', 'trip', 'special'].includes(upcomingDate.type) && '💌'}
                    </div>
                    <div>
                      <span className="font-section text-xs text-brand-rose-deep font-semibold uppercase tracking-wider block">
                        {upcomingDate.type}
                      </span>
                      <h4 className="font-hero text-lg text-brand-dark">
                        {upcomingDate.title}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-brand-rose/20 flex items-center justify-between font-body text-xs text-brand-warm-gray">
                  <span>{formatRomanticDate(upcomingDate.date)}</span>
                  <Link href="/calendar" className="font-button font-bold text-brand-rose-deep hover:underline">
                    view calendar →
                  </Link>
                </div>
              </div>
            ) : (
              <PaperCard variant="sheet" className="p-6 text-center">
                <Calendar className="w-8 h-8 mx-auto text-brand-rose-deep/60 mb-2" />
                <p className="font-section text-base font-bold text-brand-dark">No upcoming dates yet</p>
                <p className="font-body text-xs text-brand-warm-gray mt-1 mb-3">Mark your next date night or trip!</p>
                <Link
                  href="/calendar"
                  className="font-button text-xs font-bold text-brand-rose-deep hover:underline"
                >
                  + add an important date →
                </Link>
              </PaperCard>
            )}
          </div>

          {/* Pinned Love Note */}
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-section text-2xl sm:text-3xl font-bold text-brand-dark">
                  From the Mailbox
                </h2>
                <span className="text-lg text-brand-rose">♡</span>
              </div>
              <Link
                href="/notes"
                className="font-button text-xs sm:text-sm font-bold text-brand-rose-deep hover:underline flex items-center gap-1"
              >
                <span>all notes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {pinnedNote ? (
              <div className="paper-ruled rounded-3xl p-6 border-2 border-brand-rose/25 shadow-xs relative bg-white/95">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-section text-xs font-bold text-brand-rose-deep">
                    {pinnedNote.author_name} wrote:
                  </span>
                  <span className="text-base">💌</span>
                </div>
                <p className="font-body text-sm text-brand-dark/90 leading-relaxed italic">
                  &ldquo;{pinnedNote.content}&rdquo;
                </p>
                <div className="mt-4 pt-3 border-t border-brand-dark/10 flex items-center justify-between font-body text-[11px] text-brand-warm-gray">
                  <span>{new Date(pinnedNote.created_at).toLocaleDateString()}</span>
                  <Link href="/notes" className="font-button font-bold text-brand-rose-deep hover:underline">
                    write back →
                  </Link>
                </div>
              </div>
            ) : (
              <PaperCard variant="ruled" className="p-6 text-center">
                <p className="font-section text-base font-bold text-brand-dark">The mailbox is quiet ♡</p>
                <p className="font-body text-xs text-brand-warm-gray mt-1 mb-3">Leave a sweet thought on stationery paper.</p>
                <Link
                  href="/notes"
                  className="font-button text-xs font-bold text-brand-rose-deep hover:underline"
                >
                  + write a love note →
                </Link>
              </PaperCard>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
