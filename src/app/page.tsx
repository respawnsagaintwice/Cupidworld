"use client";

import React from 'react';
import Link from 'next/link';
import { DuduBubuIcon } from '@/components/decorative/DuduBubuCharacters';
import { Camera, Calendar as CalendarIcon, Mail, BookHeart, Heart, Sparkles, LogIn } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark flex flex-col relative overflow-x-hidden selection:bg-brand-soft-pink selection:text-brand-dark">
      
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 bg-brand-cream/90 backdrop-blur-md border-b border-brand-rose/20 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Brand: us ♡ */}
          <Link href="/" className="flex items-center gap-2.5 group select-none">
            <DuduBubuIcon className="scale-110 group-hover:scale-120 transition-transform" />
            <span className="font-section font-bold text-2xl text-brand-dark tracking-tight">
              us <span className="text-brand-rose">♡</span>
            </span>
          </Link>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-brand-soft-pink/40 text-brand-dark font-button font-bold text-xs sm:text-sm border border-brand-rose/30 shadow-2xs transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-brand-dark/70" />
              <span>Log In</span>
            </Link>

            <Link
              href="/onboarding/create"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-xs sm:text-sm shadow-2xs transition-all hover:scale-102"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create World ♡</span>
            </Link>
          </div>

        </div>
      </header>

      {/* Main Hero Banner with Cute Whimsical Watercolor Landscape */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16">
        
        {/* Hero Card */}
        <div className="relative rounded-3xl sm:rounded-[40px] overflow-hidden border-2 sm:border-3 border-brand-rose/30 shadow-md bg-[#FFF5F0] min-h-[460px] sm:min-h-[520px] flex flex-col justify-between">
          
          {/* Cute Soft Watercolor Background Image */}
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cute_home_bg.jpg"
              alt="Our Little World Cute Background"
              className="w-full h-full object-cover object-center sm:object-right opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#FFF8F3] via-[#FFF8F3]/85 to-[#FFF8F3]/30 sm:w-3/5" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 p-6 sm:p-14 max-w-xl">
            
            {/* Pre-title badge */}
            <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-section font-semibold tracking-wider uppercase text-brand-dark/70 mb-3 bg-white/75 backdrop-blur-xs px-3.5 py-1 rounded-full border border-brand-rose/30">
              <Sparkles className="w-3.5 h-3.5 text-brand-rose" />
              <span>A PRIVATE PLACE FOR TWO</span>
              <span className="text-brand-rose text-base">♡</span>
            </div>

            {/* Mochiy Pop One Main Hero Heading */}
            <h1 className="font-hero text-4xl sm:text-6xl text-brand-dark tracking-tight leading-[1.15] mb-3 drop-shadow-2xs">
              our little world <span className="text-brand-rose">♡</span>
            </h1>

            {/* Subtitle in Nunito */}
            <p className="font-body text-base sm:text-lg text-brand-dark/85 font-medium leading-relaxed mb-8">
              Your private little corner of the internet. Keep your favorite moments, tiny love notes, and important days together — forever in your private couple diary.
            </p>

            {/* PRIMARY ACTIONS: Create New World & Join World */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-4 mb-4">
              <Link
                href="/onboarding/create"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#F67599] hover:bg-[#E85B82] text-white font-button font-bold text-base shadow-md transition-all hover:scale-103 active:scale-97 cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                <span>✨ Create New World</span>
              </Link>

              <Link
                href="/join"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/95 hover:bg-white text-brand-dark font-button font-bold text-base border-2 border-brand-rose/35 shadow-xs hover:shadow-sm transition-all hover:scale-103 active:scale-97 cursor-pointer"
              >
                <Heart className="w-5 h-5 text-brand-rose fill-brand-rose/20" />
                <span>💌 Join World</span>
              </Link>
            </div>

            {/* Smaller Log In action */}
            <div className="pt-2">
              <span className="font-body text-xs text-brand-warm-gray">
                Already have a shared sanctuary?{' '}
                <Link
                  href="/login"
                  className="font-section text-xs font-bold text-brand-rose-deep hover:underline inline-flex items-center gap-1"
                >
                  <span>Log In</span>
                  <span>→</span>
                </Link>
              </span>
            </div>

          </div>

          <div className="relative z-10 p-4" />
        </div>

        {/* Feature Cards (Scrapbook components) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8 sm:mt-12">
          
          {/* Card 1: Our Memories */}
          <Link
            href="/memories"
            className="paper-sheet rounded-3xl p-6 border-2 border-brand-rose/25 hover:border-brand-rose/60 hover:-translate-y-1 transition-all group bg-white/95 text-center"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#FFE4ED] text-brand-rose-deep flex items-center justify-center group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="font-section text-xl font-bold text-brand-dark mb-1">
              Our Memories
            </h3>
            <p className="font-body text-xs text-brand-warm-gray leading-relaxed">
              Polaroid photos with handwritten captions, washi tape, and sticky notes.
            </p>
          </Link>

          {/* Card 2: Our Calendar */}
          <Link
            href="/calendar"
            className="paper-sheet rounded-3xl p-6 border-2 border-brand-rose/25 hover:border-brand-rose/60 hover:-translate-y-1 transition-all group bg-white/95 text-center"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#FFE8DF] text-[#D8624E] flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <h3 className="font-section text-xl font-bold text-brand-dark mb-1">
              Our Calendar
            </h3>
            <p className="font-body text-xs text-brand-warm-gray leading-relaxed">
              Bedroom wall calendar marking anniversaries, birthdays, and upcoming trips.
            </p>
          </Link>

          {/* Card 3: Love Notes */}
          <Link
            href="/notes"
            className="paper-sheet rounded-3xl p-6 border-2 border-brand-rose/25 hover:border-brand-rose/60 hover:-translate-y-1 transition-all group bg-white/95 text-center"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#F0E6FF] text-[#8659D1] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-section text-xl font-bold text-brand-dark mb-1">
              Love Notes
            </h3>
            <p className="font-body text-xs text-brand-warm-gray leading-relaxed">
              Private stationery mailbox with blush paper, stickers, and sweet thoughts.
            </p>
          </Link>

          {/* Card 4: Our Story */}
          <Link
            href="/story"
            className="paper-sheet rounded-3xl p-6 border-2 border-brand-rose/25 hover:border-brand-rose/60 hover:-translate-y-1 transition-all group bg-white/95 text-center"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#FFF2BC] text-[#AF8B2C] flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookHeart className="w-6 h-6" />
            </div>
            <h3 className="font-section text-xl font-bold text-brand-dark mb-1">
              Our Story
            </h3>
            <p className="font-body text-xs text-brand-warm-gray leading-relaxed">
              Chronological ribbon timeline of every milestone from day one to forever.
            </p>
          </Link>

        </div>

      </main>

      {/* Romantic Clean Footer */}
      <footer className="border-t border-brand-rose/25 bg-[#FFDFEA]/40 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="font-body text-xs sm:text-sm text-brand-dark font-medium flex items-center justify-center gap-1">
            <span>Here&apos;s to a million more cute days</span>
            <span className="text-brand-rose text-base">♡</span>
          </p>

          <div className="flex items-center gap-2 font-section text-xs font-bold text-brand-dark">
            <DuduBubuIcon className="scale-90" />
            <span>You + Me Always —</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
