"use client";

import React, { useEffect, useState } from 'react';
import { memoryStore } from '@/lib/store/memoryStore';
import { LoveNote } from '@/lib/types/database';
import { formatRomanticDate } from '@/lib/utils/date';
import { WashiTape } from '@/components/decorative/WashiTape';
import { Sticker } from '@/components/decorative/Sticker';
import { Plus, Mail, Trash2, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LoveNotesPage() {
  const [notes, setNotes] = useState<LoveNote[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const currentUser = memoryStore.getCurrentUser();

  // Form State
  const [content, setContent] = useState('');
  const [paperStyle, setPaperStyle] = useState<LoveNote['paper_style']>('pink-blush');
  const [sticker, setSticker] = useState<LoveNote['sticker']>('heart');

  const loadNotes = () => {
    setNotes(memoryStore.getLoveNotes());
  };

  useEffect(() => {
    loadNotes();
    const unsubscribe = memoryStore.subscribe(() => {
      loadNotes();
    });
    return () => unsubscribe();
  }, []);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    memoryStore.addLoveNote({
      couple_id: memoryStore.getCouple()?.id || 'world-1',
      author_id: currentUser?.id || 'user-self',
      author_name: currentUser?.display_name || 'Me',
      content: content.trim(),
      paper_style: paperStyle,
      sticker: sticker,
      is_pinned: false,
    });

    try {
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#FFDFEA', '#F69BB7', '#FFF2BC'],
      });
    } catch {
      // ignore
    }

    setContent('');
    setShowCreateModal(false);
    loadNotes();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Remove this love note?")) {
      memoryStore.deleteLoveNote(id);
      loadNotes();
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-brand-rose/20 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-section text-3xl sm:text-5xl font-bold text-brand-dark tracking-tight">
              Little Love Notes
            </h1>
            <span className="text-2xl text-brand-rose">💌</span>
          </div>
          <p className="font-body text-xs sm:text-sm text-brand-warm-gray mt-1">
            Private stationery and post-it thoughts tucked between the pages for your person
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-xs sm:text-sm shadow-xs transition-all hover:scale-102 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ write a note</span>
        </button>
      </div>

      {/* Love Notes Cork / Stationery Board */}
      {notes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-4">
          {notes.map((note, index) => {
            const isPink = note.paper_style === 'pink-blush';
            const isYellow = note.paper_style === 'cream-ruled';
            const isLavender = note.paper_style === 'lavender-grid';
            const isKraft = note.paper_style === 'kraft-vintage';

            let cardClass = 'paper-sticky-pink text-[#543343]';
            if (isYellow) cardClass = 'paper-ruled text-[#4A3C2B]';
            if (isLavender) cardClass = 'paper-grid text-[#3F3750]';
            if (isKraft) cardClass = 'paper-kraft text-[#423329]';

            const rotations = [-1.5, 2, -2.5, 1.8, -1.2, 2.2];
            const rotation = rotations[index % rotations.length];

            return (
              <div
                key={note.id}
                className="relative group transition-transform duration-300 hover:rotate-0"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                {/* Washi Tape Pin at Top */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                  <WashiTape
                    styleName={index % 2 === 0 ? 'washi-pink' : 'washi-yellow'}
                    className="w-24"
                    angle={rotation > 0 ? -2 : 2}
                  />
                </div>

                <div className={`rounded-3xl p-6 relative shadow-md ${cardClass}`}>
                  <div className="flex items-center justify-between mb-4 font-section">
                    <span className="text-xs font-bold opacity-90">
                      ♡ {note.author_name}
                    </span>
                    <Sticker type={note.sticker || 'heart'} />
                  </div>

                  <p className="font-section text-xl leading-snug font-bold mb-4">
                    &ldquo;{note.content}&rdquo;
                  </p>

                  <div className="flex items-center justify-between font-body text-[11px] opacity-70 pt-3 border-t border-current/15">
                    <span>{formatRomanticDate(note.created_at)} ˚₊‧</span>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-600 transition-opacity p-1 cursor-pointer"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty Mailbox State */
        <div className="paper-ruled rounded-3xl p-10 sm:p-14 text-center max-w-lg mx-auto my-12 border-2 border-brand-rose/25 shadow-xs bg-white/95">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-soft-pink flex items-center justify-center border border-brand-rose/30 mb-4">
            <Mail className="w-7 h-7 text-brand-rose" />
          </div>
          <h3 className="font-section text-2xl sm:text-3xl font-bold text-brand-dark mb-1">
            Your little mailbox is empty 💌
          </h3>
          <p className="font-body text-xs sm:text-sm text-brand-warm-gray max-w-sm mx-auto mb-6 leading-relaxed">
            Write a sweet surprise note for your person. They will see it right on their home screen!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Write the first love note</span>
          </button>
        </div>
      )}

      {/* Create Love Note Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="paper-sheet rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-brand-rose/30 shadow-xl relative animate-in fade-in zoom-in-95 bg-white">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-brand-soft-pink text-brand-warm-gray"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <h3 className="font-section text-2xl sm:text-3xl font-bold text-brand-dark">
                Write a little love note 💌
              </h3>
              <p className="font-body text-xs text-brand-warm-gray mt-1">
                Tuck a sweet thought into your couple memory box
              </p>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                  Your handwritten note
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="You are my favorite place in the whole universe..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-brand-cream-subtle border border-brand-dark/15 rounded-2xl p-3 font-body text-sm text-brand-dark focus:ring-2 focus:ring-brand-rose/40 resize-none"
                />
              </div>

              <div>
                <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                  Stationery Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'pink-blush', label: '🌸 Pink Blush', color: 'bg-[#FFE6EE]' },
                    { id: 'cream-ruled', label: '📜 Cream Ruled', color: 'bg-[#FFFDF9]' },
                    { id: 'lavender-grid', label: '💜 Lavender Grid', color: 'bg-[#EFE8FF]' },
                    { id: 'kraft-vintage', label: '📦 Vintage Kraft', color: 'bg-[#F3E5D4]' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setPaperStyle(s.id as any)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-2xl font-button text-xs font-bold transition-all cursor-pointer ${
                        paperStyle === s.id
                          ? 'border-2 border-brand-rose-deep shadow-2xs font-bold'
                          : 'border border-brand-dark/15'
                      } ${s.color}`}
                    >
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-section text-xs font-semibold text-brand-dark mb-1.5">
                  Seal Sticker
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'heart', emoji: '💖' },
                    { id: 'sparkle', emoji: '✨' },
                    { id: 'star', emoji: '⭐️' },
                    { id: 'flower', emoji: '🌸' },
                    { id: 'kiss', emoji: '💋' },
                  ].map((stk) => (
                    <button
                      key={stk.id}
                      type="button"
                      onClick={() => setSticker(stk.id as any)}
                      className={`p-2 rounded-2xl text-xl transition-all cursor-pointer ${
                        sticker === stk.id
                          ? 'bg-brand-soft-pink scale-110 shadow-2xs border border-brand-rose/40'
                          : 'bg-brand-cream-subtle hover:bg-brand-soft-pink/50'
                      }`}
                    >
                      {stk.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-xs shadow-xs transition-all mt-3 cursor-pointer"
              >
                Seal & pin note ♡
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
