"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { memoryStore } from '@/lib/store/memoryStore';
import { getDeterministicRotation } from '@/lib/utils/hashRotation';
import { WashiTape } from '@/components/decorative/WashiTape';
import { ArrowLeft, Upload, MapPin, Calendar, Heart, Check, Camera } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function NewMemoryPage() {
  const router = useRouter();
  const currentUser = memoryStore.getCurrentUser();
  const couple = memoryStore.getCouple();

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [mood, setMood] = useState<'romantic' | 'cozy' | 'silly' | 'adventure' | 'magical'>('romantic');
  const [tapeStyle, setTapeStyle] = useState<'washi-pink' | 'washi-yellow' | 'washi-lavender' | 'washi-blue'>('washi-pink');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setImageUrl(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl) return;

    setSaving(true);
    const rotation = getDeterministicRotation(title || 'new-mem');

    setTimeout(() => {
      memoryStore.addMemory({
        couple_id: couple?.id || 'world-1',
        uploaded_by: currentUser?.id || 'user-self',
        uploader_name: currentUser?.display_name || 'Me',
        title: title.trim(),
        caption: caption.trim() || undefined,
        image_url: imageUrl,
        memory_date: memoryDate,
        location: location.trim() || undefined,
        mood,
        rotation_deg: rotation,
        tape_style: tapeStyle,
      });

      // Celebration sparkle
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#F69BB7', '#FFDFEA', '#FFF2BC', '#ECE4FF'],
        });
      } catch {
        // ignore
      }

      setSavedSuccess(true);
      setTimeout(() => {
        router.push('/memories');
      }, 800);
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Back link */}
      <Link
        href="/memories"
        className="inline-flex items-center gap-1.5 font-section text-xs font-semibold text-brand-warm-gray hover:text-brand-dark transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>back to scrapbook</span>
      </Link>

      <div className="border-b-2 border-brand-rose/20 pb-4">
        <h1 className="font-section text-3xl sm:text-5xl font-bold text-brand-dark">
          Add a Little Memory ♡
        </h1>
        <p className="font-body text-xs sm:text-sm text-brand-warm-gray mt-1">
          Pin a new snapshot with love notes into your couple diary
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form Column (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="paper-ruled rounded-3xl p-6 sm:p-8 border-2 border-brand-rose/25 shadow-xs space-y-4.5 bg-white/95">
            
            {/* Photo Choice */}
            <div>
              <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                Memory Photograph
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-dashed border-brand-rose/50 bg-white hover:bg-brand-soft-pink/30 text-brand-rose-deep font-button font-bold text-xs cursor-pointer transition-all">
                  <Upload className="w-4 h-4" />
                  <span>Upload from device</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
                <div className="flex-1">
                  <input
                    type="url"
                    placeholder="or paste image URL"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-brand-cream-subtle border border-brand-dark/15 rounded-2xl px-3 py-2 font-body text-xs text-brand-dark focus:ring-2 focus:ring-brand-rose/40"
                  />
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                Memory Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Baking strawberry cookies together"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-brand-cream-subtle border border-brand-dark/15 rounded-2xl px-4 py-2.5 font-section text-sm text-brand-dark focus:ring-2 focus:ring-brand-rose/40"
              />
            </div>

            {/* Date & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                  When did this happen?
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-brand-warm-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={memoryDate}
                    onChange={(e) => setMemoryDate(e.target.value)}
                    className="w-full bg-brand-cream-subtle border border-brand-dark/15 rounded-2xl pl-10 pr-3 py-2 font-body text-xs text-brand-dark focus:ring-2 focus:ring-brand-rose/40"
                  />
                </div>
              </div>

              <div>
                <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                  Location (optional)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-brand-warm-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Komorebi Café, Balcony"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-brand-cream-subtle border border-brand-dark/15 rounded-2xl pl-10 pr-3 py-2 font-body text-xs text-brand-dark focus:ring-2 focus:ring-brand-rose/40"
                  />
                </div>
              </div>
            </div>

            {/* Caption */}
            <div>
              <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                What do you want to remember about this moment?
              </label>
              <textarea
                rows={3}
                placeholder="The little details, the inside joke, how happy we were..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-brand-cream-subtle border border-brand-dark/15 rounded-2xl p-3 font-body text-xs sm:text-sm text-brand-dark focus:ring-2 focus:ring-brand-rose/40 resize-none"
              />
            </div>

            {/* Mood Picker */}
            <div>
              <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                Memory Mood
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'romantic', label: '♡ romantic' },
                  { id: 'cozy', label: '☕ cozy' },
                  { id: 'silly', label: '✨ silly' },
                  { id: 'adventure', label: '🌿 adventure' },
                  { id: 'magical', label: '💫 magical' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood(m.id as any)}
                    className={`px-3 py-1 rounded-full font-button text-xs font-bold transition-all cursor-pointer ${
                      mood === m.id
                        ? 'bg-brand-rose text-white shadow-2xs'
                        : 'bg-white text-brand-dark/80 border border-brand-rose/30'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Washi Tape Picker */}
            <div>
              <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                Washi Tape Pin
              </label>
              <div className="flex items-center gap-3">
                {[
                  { id: 'washi-pink', label: 'Blush Pink', color: 'bg-[#FFD1DE]' },
                  { id: 'washi-yellow', label: 'Butter Yellow', color: 'bg-[#FFF3B9]' },
                  { id: 'washi-lavender', label: 'Lavender', color: 'bg-[#EBE2FF]' },
                  { id: 'washi-blue', label: 'Baby Blue', color: 'bg-[#E1F2FF]' },
                ].map((tape) => (
                  <button
                    key={tape.id}
                    type="button"
                    onClick={() => setTapeStyle(tape.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-button text-xs font-bold border transition-all cursor-pointer ${
                      tapeStyle === tape.id
                        ? 'border-brand-dark bg-white shadow-xs'
                        : 'border-transparent bg-white/70 hover:bg-white'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${tape.color} border border-brand-dark/20`} />
                    <span className="hidden sm:inline">{tape.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving || savedSuccess}
                className="w-full py-3.5 rounded-full bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>memory saved ♡</span>
                  </>
                ) : saving ? (
                  <span>pinning to scrapbook...</span>
                ) : (
                  <>
                    <span>Pin to our scrapbook</span>
                    <Heart className="w-4 h-4 fill-white" />
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Live Polaroid Preview Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="font-section text-xs font-bold text-brand-warm-gray uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <span>Live Polaroid Preview ✦</span>
          </div>

          <div className="relative transform -rotate-1 transition-transform">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <WashiTape styleName={tapeStyle} className="w-28" angle={-2} />
            </div>

            <div className="polaroid-frame rounded-2xl w-[300px] sm:w-[320px] bg-white">
              <div className="aspect-[4/3] w-full overflow-hidden bg-brand-cream-subtle rounded-xl border border-brand-dark/5 flex items-center justify-center">
                {imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-brand-warm-gray">
                    <Camera className="w-8 h-8 text-brand-rose/60 mb-1.5" />
                    <span className="font-section text-xs">Your photo will preview here</span>
                  </div>
                )}
              </div>

              <div className="pt-3 pb-1 px-1">
                <h3 className="font-section text-2xl font-bold text-brand-dark leading-snug truncate">
                  {title || 'Your memory title here...'}
                </h3>
                {caption && (
                  <p className="font-body text-xs text-brand-warm-gray line-clamp-2 mt-1 leading-relaxed">
                    {caption}
                  </p>
                )}
                <div className="flex items-center justify-between font-body text-[11px] text-brand-warm-gray mt-2 pt-2 border-t border-brand-dark/5">
                  <span>{memoryDate}</span>
                  {location && (
                    <span className="flex items-center gap-1 truncate max-w-[120px]">
                      <MapPin className="w-3 h-3 text-brand-rose" />
                      <span className="truncate">{location}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
